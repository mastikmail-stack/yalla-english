const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ctx={window:null};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['js/data.js','js/learning.js','js/audio-catalog.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
fs.mkdirSync(path.join(root,'review/audio-sources'),{recursive:true});
fs.writeFileSync(path.join(root,'review/audio-sources/inventory.json'),JSON.stringify(ctx.YALLA_AUDIO_CATALOG,null,2));
console.log(ctx.YALLA_AUDIO_CATALOG.length+' audio items');
