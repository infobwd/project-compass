#!/usr/bin/env node
// Fail closed: review only public app source/HTML/asset files. Private modules never copied here.
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
const root=resolve(process.cwd());
const inputs=['src','public','index.html','vite.config.ts'];
const forbidden=[
 [/\binfobwd\//i,'Real repository owner path'],
 [/\b[A-Z]:\\(?:[^\s"'\x60]+\\)+/i,'Absolute Windows workspace path'],
 [/\b[a-z0-9.-]+\.esdc\.app\b/i,'Internal host'],
 [/\b(?:ghp_|github_pat_|gho_)[a-z0-9_]{12,}/i,'GitHub credential'],
 [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,'Private key'],
 [/PRIVATE_PROJECT_REGISTRY|selected\.snapshot\.enc\.json|projects\.selection\.json/i,'Private registry/snapshot file'],
 [/BWD_COMPASS_PRIVATE_DIR|offline-projection\.mjs|private-local\.mjs|decryptSnapshot|PRIVATE_LOCAL_PROJECTION/i,'Private runtime reference'],
 [/document\.cookie|localStorage|sessionStorage/i,'Client-side private storage']
];
let inspected=0;
function checkFile(file){
 const text=readFileSync(file,'utf8');
 for(const [pattern,label] of forbidden)if(pattern.test(text))throw Error('FAIL: '+label+' in '+relative(root,file));
 inspected++;
}
function walk(dir){
 for(const entry of readdirSync(dir,{withFileTypes:true})){
   const file=join(dir,entry.name);
   if(entry.isSymbolicLink())throw Error('FAIL: symlink in public tree');
   if(entry.isDirectory())walk(file);
   else if(/\.(?:css|html|js|jsx|ts|tsx|json|svg|txt)$/.test(entry.name))checkFile(file);
 }
}
try{
 for(const input of inputs){
  const path=join(root,input);
  if(!existsSync(path)){if(input==='public')continue;throw Error('Missing public source '+input);}
  if(input.endsWith('.html')||input.endsWith('.ts'))checkFile(path);else walk(path);
 }
 if(inspected<4)throw Error('Too few source files inspected');
 console.log('PASS: public-only source scan, '+inspected+' files, no listed private data references.');
}catch(e){console.error(String(e));process.exitCode=1;}
