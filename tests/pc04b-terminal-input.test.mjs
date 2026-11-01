import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readTerminalLine,validateProjectIndex} from '../tools/private-plan/action-entry.mjs';

class FakeTerminal extends EventEmitter{
 constructor(){super();this.isTTY=true;this.isRaw=false;this.resumes=0;this.pauses=0;}
 setRawMode(value){this.isRaw=value;}
 setEncoding(value){assert.equal(value,'utf8');}
 resume(){this.resumes++;}
 pause(){this.pauses++;}
 send(value){this.emit('data',value);}
}
function output(){
 const writes=[];return {writes,write(s){writes.push(s);}};
}
test('PC04B-INPUT one terminal supports masked passphrase followed by visible project index',async()=>{
 const input=new FakeTerminal(),out=output();
 const first=readTerminalLine('Masked secret: ',{secret:true,input,output:out});
 assert.equal(input.isRaw,true);
 input.send('hiddenPassphrase\r');
 assert.equal(await first,'hiddenPassphrase');
 assert.equal(input.isRaw,false);
 assert.doesNotMatch(out.writes.join(''),/hiddenPassphrase/);
 const second=readTerminalLine('Project index: ',{input,output:out});
 input.send('11\r');
 assert.equal(await second,'11');
 assert.equal(validateProjectIndex('11',11),11);
 assert.equal(input.isRaw,false);
 assert.equal(input.resumes,2);
 assert.equal(input.pauses,2);
 assert.match(out.writes.join(''),/Project index: 11/);
});
test('PC04B-INPUT empty or out-of-range index is a stable public-safe diagnostic',()=>{
 for(const value of ['', '0', '12', '-1', 'alpha', '1.5'])
  assert.throws(()=>validateProjectIndex(value,11),/PC04B_INVALID_PROJECT_INDEX/);
 assert.equal(validateProjectIndex('1',11),1);
});
test('PC04B-INPUT supports Thai Unicode and backspace without printing the secret',async()=>{
 const input=new FakeTerminal(),out=output();
 const p=readTerminalLine('Secret: ',{secret:true,input,output:out,max:50});
 input.send('กข');input.send('\u007f');input.send('ค\r');
 assert.equal(await p,'กค');
 assert.doesNotMatch(out.writes.join(''),/ก|ข|ค/);
});
test('PC04B-INPUT Ctrl-C fails closed and raw mode is restored',async()=>{
 const input=new FakeTerminal(),out=output();
 const p=readTerminalLine('Index: ',{input,output:out});
 input.send('\u0003');
 await assert.rejects(p,/PC04B_INPUT_CANCELLED/);
 assert.equal(input.isRaw,false);
 assert.equal(input.pauses,1);
});
test('PC04B-INPUT missing tty or unexpected input close yields safe error codes',async()=>{
 const input=new FakeTerminal(),out=output();input.isTTY=false;
 await assert.rejects(readTerminalLine('Secret: ',{input,output:out}),/PC04B_TTY_REQUIRED/);
 input.isTTY=true;
 const p=readTerminalLine('Index: ',{input,output:out});
 input.emit('close');
 await assert.rejects(p,/PC04B_INPUT_CLOSED/);
});
test('PC04B-INPUT diagnostics mode precedes any private snapshot access and never writes',()=>{
 const source=readFileSync(fileURLToPath(new URL('../tools/private-plan/action-entry.mjs',import.meta.url)),'utf8');
 assert.ok(source.indexOf("args[0]==='--input-check'")<source.indexOf('loadPrivateProjection(passphrase'));
 assert.match(source,/privateDataAccessed:false/);
 assert.match(source,/writes:false/);
 assert.match(source,/Type CONFIRM to save encrypted revision/);
 assert.match(source,/status:'TODO'/);
 assert.doesNotMatch(source,/createInterface\(|node:readline|console\.log\(passphrase\)/);
});
