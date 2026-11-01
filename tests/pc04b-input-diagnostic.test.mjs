import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readTerminalLine,validateDiagnosticSample,validateProjectIndex} from '../tools/private-plan/action-entry.mjs';

class MockTTY extends EventEmitter{
 constructor(){super();this.isTTY=true;this.raw=false;this.paused=false;}
 setRawMode(x){this.raw=x;}
 setEncoding(encoding){assert.equal(encoding,'utf8');}
 resume(){this.paused=false;}
 pause(){this.paused=true;}
 type(s){this.emit('data',s);}
}
function output(){
 const chunks=[];return {chunks,write:s=>chunks.push(s)};
}
test('PC04B diagnostic accepts fake TEST with case/whitespace flexibility; never accepts absent input',()=>{
 for(const v of ['TEST','test',' Test ','TeSt']){
  assert.equal(validateDiagnosticSample(v),true);
  assert.equal(validateDiagnosticSample(v,{masked:true}),true);
 }
 assert.throws(()=>validateDiagnosticSample('',{masked:true}),/PC04B_INPUT_CHECK_MASKED_EMPTY/);
 assert.throws(()=>validateDiagnosticSample('  ',{masked:false}),/PC04B_INPUT_CHECK_VISIBLE_EMPTY/);
 assert.throws(()=>validateDiagnosticSample('incorrect',{masked:true}),/PC04B_INPUT_CHECK_MASKED_MISMATCH/);
 assert.throws(()=>validateDiagnosticSample('incorrect'),/PC04B_INPUT_CHECK_VISIBLE_MISMATCH/);
});
test('PC04B diagnostic fake visible then fake masked then index can reuse same raw terminal',async()=>{
 const tty=new MockTTY(),out=output();
 const visible=readTerminalLine('Step 1/3: ',{input:tty,output:out});
 tty.type('TEST\r');assert.equal(validateDiagnosticSample(await visible),true);
 const masked=readTerminalLine('Step 2/3: ',{secret:true,input:tty,output:out});
 tty.type('test\r');assert.equal(validateDiagnosticSample(await masked,{masked:true}),true);
 const index=readTerminalLine('Step 3/3: ',{input:tty,output:out});
 tty.type('1\r');assert.equal(validateProjectIndex(await index,11),1);
 assert.equal(tty.raw,false);
 const transcript=out.chunks.join('');
 assert.match(transcript,/Step 1\/3: TEST/);
 assert.match(transcript,/Step 3\/3: 1/);
 // The lower-case masked keystrokes are never echoed to a terminal transcript.
 assert.doesNotMatch(transcript,/test/);
});
test('PC04B diagnostic blank input is distinguished from terminal failure without file changes',async()=>{
 const tty=new MockTTY(),out=output();
 const masked=readTerminalLine('Hidden test: ',{secret:true,input:tty,output:out});
 tty.type('\r');
 const entry=await masked;
 assert.throws(()=>validateDiagnosticSample(entry,{masked:true}),/MASKED_EMPTY/);
 assert.equal(tty.raw,false);
});
test('PC04B --input-check is a synthetic-only branch before private folder and snapshot load',()=>{
 const source=readFileSync(fileURLToPath(new URL('../tools/private-plan/action-entry.mjs',import.meta.url)),'utf8');
 const diag=source.indexOf("args[0]==='--input-check'");
 assert.ok(diag>0);
 assert.ok(diag<source.indexOf('const dir=privateDir(env)'));
 assert.ok(diag<source.indexOf('loadPrivateProjection(passphrase'));
 assert.match(source,/SAFE INPUT TEST ONLY/);
 assert.match(source,/privateDataAccessed:false/);
 assert.match(source,/writes:false/);
 assert.doesNotMatch(source,/console\.log\(secret\)|console\.log\(passphrase\)/);
});
