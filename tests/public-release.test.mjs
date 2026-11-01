import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=name=>readFileSync(resolve(root,name),'utf8');
test('public demo is explicitly fictional and has no private snapshot references',()=>{
 const app=read('src/App.tsx'),demo=read('src/demo.ts'),html=read('index.html');
 assert.match(app,/DEMO MODE/);
 assert.match(demo,/Synthetic sample portfolio/);
 assert.match(html,/Synthetic BWD Project Compass UI prototype/);
 assert.doesNotMatch(app+demo+html,/infobwd\/|D:\\|\.esdc\.app|selected\.snapshot|github_pat_|PRIVATE_LOCAL_PROJECTION/i);
 assert.doesNotMatch(app,/fetch\(|XMLHttpRequest|WebSocket\(/);
});
test('GitHub Pages project base path and no sourcemaps',()=>{
 const vite=read('vite.config.ts');
 assert.match(vite,/base:'\/project-compass\/'/);
 assert.match(vite,/sourcemap:false/);
 const html=read('index.html');
 assert.match(html,/viewport/);
 assert.match(html,/noindex,nofollow/);
});
test('public release has no private read-only runtime, encrypted fixtures or credentials',()=>{
 const paths=readdirSync(resolve(root,'tools'));
 assert.deepEqual(paths.sort(),['check-public-dist.mjs','check-public-source.mjs']);
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.private,true);
 assert.ok(pkg.scripts['check:public-source']);
 assert.ok(pkg.scripts['check:public-dist']);
 assert.ok(!pkg.scripts.deploy);
 assert.ok(!pkg.scripts['private:sync']);
});
