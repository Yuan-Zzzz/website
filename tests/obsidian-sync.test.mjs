import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { parseSyncBody, syncAuthorized, syncVersion } from '../lib/obsidian-sync.ts';
const require=createRequire(import.meta.url);
const {inFolder,publication,fingerprint,transformMarkdown}=require('../obsidian-plugin/core.js');
const key='11111111-1111-4111-8111-111111111111';
const payload={operation:'publish',key,title:'测试',slug:'test',excerpt:'摘要',content:'内容',raw:'内容',date:'2026-10-08',tags:[],categories:[]};

test('sync token fails closed and requires correct bearer token',()=>{
 const hash=createHash('sha256').update('test-token').digest('hex');
 assert.equal(syncAuthorized('Bearer test-token',hash),true);
 for(const value of [null,'test-token','Bearer wrong'])assert.equal(syncAuthorized(value,hash),false);
 assert.equal(syncAuthorized('Bearer test-token','invalid'),false);
});
test('sync schema rejects invalid ids, operations, dates and uncontrolled fields',()=>{
 assert.equal(parseSyncBody(payload).article.title,'测试');
 for(const bad of [{key:'bad'},{id:'bad'},{operation:'delete'},{date:'bad'},{slug:'../test'},{tags:[1]}])assert.throws(()=>parseSyncBody({...payload,...bad}));
 assert.throws(()=>parseSyncBody({...payload,id:'111111111111111111111111'}));
 assert.equal(parseSyncBody({...payload,admin:true}).article.admin,undefined);
 assert.equal(parseSyncBody({operation:'unpublish',key,id:'111111111111111111111111',version:'v'}).article,undefined);
});
test('scope, share checkbox and stable publication fingerprint',()=>{
 assert.equal(inFolder('60 - Output/test.md','60 - Output'),true);
 assert.equal(inFolder('60 - Output private/test.md','60 - Output'),false);
 assert.equal(inFolder('Private/test.md','60 - Output'),false);
 const state={date:'2026-10-08',slug:'existing-url'};
 const a=publication({share:true},'body','标题',key,state);
 const b=publication({share:true,website_id:'id',website_sync_id:key},'body','标题',key,state);
 assert.equal(fingerprint(a),fingerprint(b));
 assert.equal(a.slug,'existing-url');
 assert.equal(publication({share:'true'},'body','标题',key,state).operation,'unpublish');
 assert.equal(publication({share:false},'body','标题',key,state).operation,'unpublish');
 assert.notEqual(syncVersion({updatedAt:'2026-10-08',obsidianRevision:1}),syncVersion({updatedAt:'2026-10-08',obsidianRevision:2}));
});
test('markdown conversion leaves fenced and inline examples intact',async()=>{
 const body='![[real.png]]\n```md\n![[example.png]]\n```\n`![[inline.png]]`';
 const converted=await transformMarkdown(body,async s=>s.replaceAll('![[real.png]]','![real](https://example.com/image.png)').replaceAll('![[example.png]]','bad').replaceAll('![[inline.png]]','bad'));
 assert.match(converted,/https:\/\/example.com/);assert.match(converted,/!\[\[example.png\]\]/);assert.match(converted,/!\[\[inline.png\]\]/);
});
