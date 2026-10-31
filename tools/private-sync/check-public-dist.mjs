#!/usr/bin/env node
// Defense in depth for a *public* build; human privacy review remains mandatory.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const dist=resolve(process.cwd(),'dist');
const forbidden=[
  /ghp_[a-z0-9]{20,}/i,
  /github_pat_[a-z0-9_]{20,}/i,
  /gho_[a-z0-9]{20,}/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /PRIVATE_PROJECT_REGISTRY\.json/i,
  /latest\.snapshot\.enc\.json/i,
  /[A-Z]:\\[A-Za-z0-9_.-]+\\/i,
  /[a-z0-9.-]+\.esdc\.app/i,
  /(?:api\.github\.com\/repos\/|github\.com\/)[a-z0-9_.-]+\/[a-z0-9_.-]+/i,
];
function scan(dir) {
  let count=0;
  for(const entry of readdirSync(dir,{withFileTypes:true})) {
    const file=join(dir,entry.name);
    if(entry.isDirectory()) { count+=scan(file);continue; }
    if(entry.name.endsWith('.map'))throw new Error('Public sourcemap found: '+entry.name);
    if(!/\.(?:html|json|js|css|txt|webmanifest|svg)$/.test(entry.name))continue;
    const source=readFileSync(file,'utf8');
    for(const pattern of forbidden)if(pattern.test(source))throw new Error('Possible sensitive data in '+entry.name);
    count++;
  }
  return count;
}
if(!existsSync(dist)){console.error('FAIL: dist missing; run npm run build first');process.exitCode=1;}
else try{
  const count=scan(dist);if(count===0)throw new Error('No text assets checked');
  console.log('PASS: public dist scan, '+count+' text assets, no sourcemaps or listed sensitive patterns.');
}catch(e){console.error('FAIL: '+e.message);process.exitCode=1;}
