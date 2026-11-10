/* Explicit allowlist: never publish backups, incident recordings or test data. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'), output=path.join(root,'site-dist');
fs.mkdirSync(output,{recursive:true});
for(const file of ['index.html','audio-review.html','audio-credits.html','version.json','manifest.json','sw.js']) fs.copyFileSync(path.join(root,file),path.join(output,file));
for(const folder of ['css','js','icons','audio']) fs.cpSync(path.join(root,folder),path.join(output,folder),{recursive:true});
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log('Built site-dist from the runtime allowlist.');
