const {Plugin,PluginSettingTab,Setting,Notice,Modal,TFile,requestUrl,getFrontMatterInfo,parseYaml}=require('obsidian');
const {inFolder,publication,fingerprint,replaceAsync,transformMarkdown}=(()=>{
/* Pure helpers shared by the plugin and its regression tests. */
function inFolder(path, folder) {
  const base = folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  return path.startsWith(base + '/') && path.endsWith('.md');
}
function makeSlug(title, key) {
  return title.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 140) || `note-${key.slice(0,8)}`;
}
function list(value) { return Array.isArray(value) ? value.map(String) : typeof value === 'string' ? [value] : []; }
function publication(frontmatter, body, basename, key, state) {
  const title = String(frontmatter.title || basename).trim();
  const date = frontmatter.date ? new Date(frontmatter.date) : new Date(state.date || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error('date 日期无效');
  return { operation: frontmatter.share === true ? 'publish' : 'unpublish', key,
    title, slug: String(frontmatter.slug || state.slug || makeSlug(title,key)),
    excerpt: String(frontmatter.excerpt || body.replace(/[#*`\[\]]/g,'').trim().slice(0,160) || title),
    tags: list(frontmatter.tags), categories: list(frontmatter.categories),
    date: date.toISOString(), raw: body, content: body };
}
function fingerprint(payload) {
  if (payload.operation === 'unpublish') return 'unpublish';
  return JSON.stringify([payload.title,payload.slug,payload.excerpt,payload.tags,payload.categories,payload.date,payload.raw,payload.content]);
}
async function replaceAsync(text, regex, convert) {
  const matches = [...text.matchAll(regex)]; let output=''; let offset=0;
  for (const match of matches) { output += text.slice(offset,match.index) + await convert(match); offset=match.index+match[0].length; }
  return output+text.slice(offset);
}
// Do not rewrite examples inside fenced or inline code blocks.
async function transformMarkdown(body, convert) {
  const parts=body.split(/(^[ \t]*`{3,}[^\n]*\n[\s\S]*?^[ \t]*`{3,}[^\n]*(?:\n|$)|^[ \t]*~{3,}[^\n]*\n[\s\S]*?^[ \t]*~{3,}[^\n]*(?:\n|$)|`+[^`\n]*`+)/gm);
  for(let i=0;i<parts.length;i+=2) parts[i]=await convert(parts[i]);
  return parts.join('');
}
return {inFolder,makeSlug,publication,fingerprint,replaceAsync,transformMarkdown};

})();
const DEFAULTS={url:'https://www.yuanzzzz.com',folder:'60 - Output',token:'',automatic:true,states:{}};

class BindModal extends Modal {
  constructor(plugin,file,articles) { super(plugin.app); this.plugin=plugin;this.file=file;this.articles=articles; }
  onOpen() {
    this.contentEl.createEl('h2',{text:'绑定已有网站文章'});
    this.contentEl.createEl('p',{text:'绑定保留文章 ID、网址和评论，不修改正文。之后发布笔记会更新该文章；请先核对两边内容。'});
    const fm=this.plugin.readNoteMetadata(this.file);
    let selected=this.articles.find(a=>a.title===(fm.title||this.file.basename))?.id || this.articles[0]?.id;
    if(!selected) {this.contentEl.createEl('p',{text:'网站暂时没有文章。'});return;}
    new Setting(this.contentEl).setName('网站文章').addDropdown(d=>{
      for(const a of this.articles)d.addOption(a.id,`${a.title} — /articles/${a.slug}${a.key?'（已绑定）':''}`);
      d.setValue(selected).onChange(v=>selected=v);
    });
    new Setting(this.contentEl).addButton(b=>b.setButtonText('确认绑定').setCta().onClick(async()=>{
      b.setDisabled(true);
      try{await this.plugin.bind(this.file,this.articles.find(a=>a.id===selected));this.close();}
      catch(e){new Notice(e.message,10000);b.setDisabled(false);}
    }));
  }
  onClose(){this.contentEl.empty();}
}
class Settings extends PluginSettingTab {
  constructor(app,plugin){super(app,plugin);this.plugin=plugin;}
  display(){
    const {containerEl:c}=this;c.empty();c.createEl('h2',{text:'元的网站同步'});
    c.createEl('p',{text:'仅同步指定目录；只有 share 复选框为 true 的笔记会发布。启用时不会批量发布旧笔记。'});
    new Setting(c).setName('网站地址').addText(t=>t.setValue(this.plugin.settings.url).onChange(async v=>{this.plugin.settings.url=v.trim().replace(/\/$/,'');await this.plugin.save();}));
    new Setting(c).setName('同步目录').addText(t=>t.setValue(this.plugin.settings.folder).onChange(async v=>{this.plugin.settings.folder=v.trim();await this.plugin.save();}));
    new Setting(c).setName('同步凭证').setDesc('仅用于此网站；请勿将插件 data.json 上传到公开仓库。').addText(t=>{t.inputEl.type='password';t.setValue(this.plugin.settings.token).onChange(async v=>{this.plugin.settings.token=v.trim();await this.plugin.save();});});
    new Setting(c).setName('自动发布').setDesc('修改后等待 3 秒同步；取消 share 后转为网站草稿。').addToggle(t=>t.setValue(this.plugin.settings.automatic).onChange(async v=>{this.plugin.settings.automatic=v;await this.plugin.save();}));
    new Setting(c).setName('检查连接').addButton(b=>b.setButtonText('检查').onClick(async()=>{try{const a=await this.plugin.api('/articles');new Notice(`连接成功：${a.length} 篇网站文章`);}catch(e){new Notice(e.message,10000);}}));
  }
}
module.exports=class WebsiteSync extends Plugin {
  async onload(){
    this.settings={...DEFAULTS,...await this.loadData()};this.settings.states||={};
    this.timers=new Map();this.writing=new Set();this.queue=Promise.resolve();this.alive=true;
    this.addSettingTab(new Settings(this.app,this));
    this.status=this.addStatusBarItem();this.status.setText('网站同步：就绪');
    this.addCommand({id:'publish-current',name:'发布／更新当前笔记（取消 share 则撤回）',editorCallback:(_editor,view)=>this.enqueue(view.file,true)});
    this.addCommand({id:'bind-current',name:'绑定当前笔记到已有网站文章',editorCallback:async(_editor,view)=>{try{if(!this.eligible(view.file))throw new Error('当前笔记不在同步目录');new BindModal(this,view.file,await this.api('/articles')).open();}catch(e){new Notice(e.message,10000);}}});
    this.addCommand({id:'sync-shared',name:'同步目录中全部 share 笔记及已绑定笔记',callback:()=>{
      for(const f of this.app.vault.getMarkdownFiles())if(this.eligible(f)){const fm=this.readNoteMetadata(f);if(fm.share===true||fm.website_id)this.enqueue(f,true);}
    }});
    this.registerEvent(this.app.vault.on('modify',f=>{
      if(!this.settings.automatic||!this.eligible(f)||this.writing.has(f.path))return;
      clearTimeout(this.timers.get(f.path));
      const timer=setTimeout(()=>{this.timers.delete(f.path);this.enqueue(f,false);},3000);
      this.timers.set(f.path,timer);
    }));
    this.registerEvent(this.app.vault.on('rename',(f,old)=>{clearTimeout(this.timers.get(old));this.timers.delete(old);}));
    this.registerEvent(this.app.vault.on('delete',f=>{
      clearTimeout(this.timers.get(f.path));this.timers.delete(f.path);
      if(this.eligible(f))new Notice('笔记已删除；网站文章未删除。需要撤回时请在网站后台转为草稿。');
    }));
    // Resume only previously synced notes after reopening; never bulk-publish unbound notes.
    this.app.workspace.onLayoutReady(()=>{
      if(this.settings.automatic&&this.settings.token)for(const f of this.app.vault.getMarkdownFiles()){
        if(this.eligible(f)&&this.readNoteMetadata(f).website_id)this.enqueue(f,false);
      }
    });
  }
  onunload(){this.alive=false;for(const t of this.timers.values())clearTimeout(t);}
  eligible(f){return f instanceof TFile&&inFolder(f.path,this.settings.folder);}
  readNoteMetadata(f){return this.app.metadataCache.getFileCache(f)?.frontmatter||{};}
  async save(){await this.saveData(this.settings);}
  enqueue(file,manual){
    if(!file)return;
    this.queue=this.queue.then(async()=>{
      if(!this.alive)return;
      try{await this.sync(file,manual);}catch(e){this.status.setText('网站同步：失败');new Notice(`网站同步：${e.message}`,12000);}
    });
  }
  async api(endpoint,payload,binary){
    let url;try{url=new URL(this.settings.url);}catch{throw new Error('请设置正确的网站地址');}
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error('网站地址必须为 HTTPS，且不能带凭证或查询参数');
    if(!this.settings.token)throw new Error('请先在插件设置中填写同步凭证');
    const response=await requestUrl({url:url.origin+'/api/obsidian'+endpoint,
      method:payload!==undefined||binary?'POST':'GET',throw:false,
      headers:{Authorization:`Bearer ${this.settings.token}`,'Content-Type':binary?'application/octet-stream':'application/json'},
      ...(binary?{body:binary}:payload!==undefined?{body:JSON.stringify(payload)}:{})});
    let data;try{data=response.json;}catch{throw new Error(`网站返回非 JSON 响应（${response.status}）`);}
    if(response.status>=400||!data.success)throw new Error(data.error||`请求失败 ${response.status}`);
    return data.data;
  }
  async patchMetadata(file,values){
    this.writing.add(file.path);
    try{await this.app.fileManager.processFrontMatter(file,fm=>Object.assign(fm,values));}
    finally{const timer=setTimeout(()=>this.writing.delete(file.path),1000);this.register(()=>clearTimeout(timer));}
  }
  async identity(file,fm){
    const key=fm.website_sync_id||crypto.randomUUID();
    if(!/^[a-f0-9-]{36}$/.test(key))throw new Error('website_sync_id 无效');
    const duplicate=this.app.vault.getMarkdownFiles().find(f=>f.path!==file.path&&this.readNoteMetadata(f).website_sync_id===key);
    if(duplicate)throw new Error(`笔记标识重复：${duplicate.path}，请清除副本的 website_* 属性`);
    if(!fm.website_sync_id)await this.patchMetadata(file,{website_sync_id:key});
    return key;
  }
  async bind(file,article){
    // Serialize binding with automatic writes so stale revisions cannot race.
    const action=this.queue.then(async()=>{
      const key=await this.identity(file,this.readNoteMetadata(file));
      const r=await this.api('/articles',{operation:'bind',key,id:article.id,version:article.version});
      this.settings.states[key]={id:r.id,version:r.version,slug:r.slug,date:r.date};await this.save();
      await this.patchMetadata(file,{website_id:r.id,website_sync_id:key,slug:r.slug,share:article.published});
      new Notice('已绑定，正文未修改。核对后执行“发布／更新当前笔记”或编辑并保存。',10000);
    });
    this.queue=action.catch(()=>{});return action;
  }
  async upload(file,target){
    const resolved=this.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(target),file.path);
    if(!(resolved instanceof TFile)||resolved.extension==='md')throw new Error(`找不到图片：${target}`);
    const image=await this.app.vault.readBinary(resolved);
    if(image.byteLength>10000000)throw new Error(`图片超过 10MB：${target}`);
    const r=await this.api('/assets',undefined,image);return new URL(r.url,this.settings.url).href;
  }
  async render(file,body){
    const cache=new Map();
    const image=async target=>{if(!cache.has(target))cache.set(target,this.upload(file,target));return cache.get(target);};
    return transformMarkdown(body,async part=>{
      part=await replaceAsync(part,/!\[\[([^\]\n]+)\]\]/g,async m=>{
        const [target,alias]=m[1].split('|');const url=await image(target);
        return `![${(alias||target).replace(/[\[\]]/g,'')}](${url})`;
      });
      part=await replaceAsync(part,/!\[([^\]\n]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g,async m=>{
        if(/^https?:\/\//i.test(m[2]))return m[0];
        return `![${m[1]}](${await image(m[2].replace(/^<|>$/g,''))})`;
      });
      return replaceAsync(part,/(?<!!)\[\[([^\]\n]+)\]\]/g,async m=>{
        const [link,alias]=m[1].split('|');const [target,anchor]=link.split('#');
        if(!target)return `[${alias||anchor}](#${encodeURIComponent(anchor||'')})`;
        const note=this.app.metadataCache.getFirstLinkpathDest(target,file.path);
        const fm=note?this.readNoteMetadata(note):{};
        if(!fm.website_id||!fm.slug||fm.share!==true)throw new Error(`链接笔记尚未发布：${target}。不会自动发布关联的私人笔记。`);
        return `[${alias||target}](${this.settings.url}/articles/${encodeURIComponent(fm.slug)}${anchor?'#'+encodeURIComponent(anchor):''})`;
      });
    });
  }
  async sync(file,manual){
    if(!this.eligible(file)) {if(manual)throw new Error('当前笔记不在同步目录');return;}
    let source=await this.app.vault.read(file);let info=getFrontMatterInfo(source);
    const fm=info.exists?(parseYaml(info.frontmatter)||{}):{};
    if(fm.share!==true&&!fm.website_id){if(manual)new Notice('请先勾选 share 属性');return;}
    this.status.setText('网站同步：同步中…');
    const key=await this.identity(file,fm);const state=this.settings.states[key]||{};
    if(!fm.website_sync_id){source=await this.app.vault.read(file);info=getFrontMatterInfo(source);}
    state.date ||= new Date().toISOString();
    this.settings.states[key]=state;await this.save();
    if(fm.website_id&&state.id!==fm.website_id)throw new Error('此笔记尚未在本插件绑定，请执行绑定命令');
    const payload=publication(fm,source.slice(info.contentStart),file.basename,key,state);
    const original=fingerprint(payload);
    // Avoid re-uploading unchanged local assets or repeating successful writes.
    if(state.original===original){this.status.setText('网站同步：已同步');if(manual)new Notice('没有待发布的修改');return;}
    if(payload.operation==='publish')payload.content=await this.render(file,payload.content);
    if(state.id){payload.id=state.id;payload.version=state.version;payload.slug=state.slug;}
    // Keep an in-flight older edit from overwriting a newer local edit.
    const current=await this.app.vault.read(file);const currentInfo=getFrontMatterInfo(current);
    const currentFm=currentInfo.exists?(parseYaml(currentInfo.frontmatter)||{}):{};
    if(fingerprint(publication(currentFm,current.slice(currentInfo.contentStart),file.basename,key,state))!==original){this.enqueue(file,false);return;}
    const result=await this.api('/articles',payload);
    this.settings.states[key]={id:result.id,version:result.version,slug:result.slug,date:payload.date,original:fingerprint({...payload,slug:result.slug,content:payload.raw})};await this.save();
    await this.patchMetadata(file,{website_id:result.id,website_sync_id:key,slug:result.slug,date:payload.date});
    this.status.setText(payload.operation==='publish'?'网站同步：已发布':'网站同步：已撤回');
    new Notice(payload.operation==='publish'?`已发布：${payload.title}`:'已转为网站草稿，文章和评论均保留');
  }
};
