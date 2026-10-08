import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
const require=createRequire(import.meta.url);
const matter=require('gray-matter');
const parse=text=>{const m=matter(text);return {data:structuredClone(m.data),content:m.content};};
class TFile{constructor(path){this.path=path;this.basename=path.split('/').at(-1).slice(0,-3);this.extension='md';}}
function fixture(){
 const file=new TFile('60 - Output/note.md');let text='---\nshare: true\ntitle: 测试笔记\n---\n\n正文';let version=0;const calls=[];let fail=false;
 const api=async options=>{
  if(options.url.endsWith('/assets'))return {status:200,json:{success:true,data:{url:'/api/obsidian/assets/image.png'}}};
  const b=JSON.parse(options.body);calls.push(b);
  if(fail)return {status:409,json:{success:false,error:'网站已修改'}};
  version++;
  return {status:b.id?200:201,json:{success:true,data:{id:'111111111111111111111111',slug:'fixed-url',version:String(version),date:b.date}}};
 };
 const exports={};const context={module:{exports},require:n=>n==='obsidian'?{
  Plugin:class{},PluginSettingTab:class{},Setting:class{},Notice:class{},Modal:class{},TFile,requestUrl:api,parseYaml:s=>matter('---\n'+s+'\n---').data,
  getFrontMatterInfo:s=>{const m=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(s);return {exists:!!m,frontmatter:m?.[1]||'',contentStart:m?.[0].length||0};}
 }:n==='./core'?require('../obsidian-plugin/core.js'):require(n),crypto:webcrypto,setTimeout,clearTimeout,URL};
 vm.runInNewContext(fs.readFileSync(new URL('../obsidian-plugin/main.js',import.meta.url),'utf8'),context);
 const plugin=new context.module.exports();plugin.settings={url:'https://www.yuanzzzz.com',token:'test',folder:'60 - Output',states:{}};
 plugin.status={setText(){}};plugin.writing=new Set();plugin.queue=Promise.resolve();plugin.alive=true;plugin.register=()=>{};plugin.saveData=async()=>{};
 plugin.app={vault:{read:async()=>text,getMarkdownFiles:()=>[file]},metadataCache:{getFileCache:()=>({frontmatter:parse(text).data})},fileManager:{processFrontMatter:async(f,fn)=>{const m=parse(text);fn(m.data);text=matter.stringify(m.content,m.data);}}};
 return {plugin,file,calls,setBody:s=>{const m=parse(text);text=matter.stringify(s,m.data);},setShare:v=>{const m=parse(text);m.data.share=v;text=matter.stringify(m.content,m.data);},fail:()=>fail=true,text:()=>text};
}
test('actual plugin publishes once, updates in place, retracts without deleting and survives rename',async()=>{
 const f=fixture();await f.plugin.sync(f.file,true);assert.equal(f.calls.length,1);assert.equal(f.calls[0].operation,'publish');
 assert.match(f.text(),/website_id/);await f.plugin.sync(f.file,true);assert.equal(f.calls.length,1);
 f.setBody('修改后的正文');await f.plugin.sync(f.file,true);assert.equal(f.calls[1].id,'111111111111111111111111');assert.equal(f.calls[1].version,'1');assert.equal(f.calls[1].slug,'fixed-url');
 f.file.path='60 - Output/renamed.md';await f.plugin.sync(f.file,true);assert.equal(f.calls.length,2);
 f.setShare(false);await f.plugin.sync(f.file,true);assert.equal(f.calls[2].operation,'unpublish');assert.equal(f.calls[2].id,f.calls[1].id);
 await f.plugin.sync(f.file,true);assert.equal(f.calls.length,3);
});
test('conflict preserves local text and saved revision',async()=>{
 const f=fixture();await f.plugin.sync(f.file,true);f.setBody('本地修改');const before=f.text();f.fail();
 await assert.rejects(()=>f.plugin.sync(f.file,true),/网站已修改/);
 assert.equal(f.text(),before);assert.equal(Object.values(f.plugin.settings.states)[0].version,'1');
});
test('binding does not publish or overwrite body',async()=>{
 const f=fixture();await f.plugin.bind(f.file,{id:'111111111111111111111111',version:'baseline',published:true});
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].operation,'bind');assert.match(f.text(),/正文/);
 await f.plugin.sync(f.file,true);assert.equal(f.calls[1].operation,'publish');assert.equal(f.calls[1].id,'111111111111111111111111');
});
test('private and out-of-scope notes never transmit',async()=>{
 const f=fixture();f.setShare(false);await f.plugin.sync(f.file,false);assert.equal(f.calls.length,0);
 f.file.path='Private/note.md';await f.plugin.sync(f.file,false);assert.equal(f.calls.length,0);
});
