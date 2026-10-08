# Obsidian 发布（第一阶段）

插件源文件位于 `obsidian-plugin/`，无需构建。将 manifest.json、main.js、core.js 放入库的 `.obsidian/plugins/yuan-website-sync/`，在第三方插件设置启用「Yuan Website Sync」。

## 使用

- 设置网站 `https://www.yuanzzzz.com`、目录 `60 - Output` 和专用同步凭证。
- 在文章属性添加复选框 `share`；勾选后保存，等待约 3 秒发布。
- 已有网站文章先执行命令「绑定当前笔记到已有网站文章」，核对后确认，再执行「发布／更新当前笔记」。绑定本身不修改正文。
- 标题取 title 或文件名，摘要取 excerpt 或正文前 160 字，支持 date、tags、categories。
- website_sync_id 为固定笔记标识，website_id 为 MongoDB 文章 ID；不要复制这些属性到另一篇笔记。
- 成功后自动写入 ID、固定 slug 和发布日期。改标题、改文件名不改变网站网址或 giscus 评论关联。
- 取消 share 会撤回为草稿；删除笔记不会删除网站文章。需要撤回时在网站后台操作。
- 启动时只检查已绑定笔记，不批量发布已有 share 笔记。需要批量同步时使用专门命令。
- 网站修改导致版本冲突时停止覆盖，核对两边内容后重新绑定并发布。本阶段不自动拉取网站正文。
- 自动发布只在 Obsidian 打开时运行；关闭期间的修改下次打开或手动同步时处理。

## 图片与链接

本地 PNG/JPEG/GIF/WebP 图片上传到网站持久目录（默认 uploads/obsidian），使用内容哈希去重。图片内容地址公开，不会自动删除；单张上限 10MB，同时受反向代理上传上限约束。
原笔记保留本地引用，网站展示用副本转换为 Markdown 图片链接。
支持 `![[图片.png]]`、标准 Markdown 图片、已发布且已绑定笔记的 `[[双链]]`。未发布的关联笔记不会被递归公开，发布会停止并提示。
不支持 SVG、PDF、音视频或 Excalidraw 嵌入；需要先转换为受支持图片或使用外链。Markdown 图片路径含空格时建议使用 Obsidian 图片引用。

## 服务端配置与维护

环境变量 OBSIDIAN_SYNC_TOKEN_HASH 为随机 32 字节以上同步凭证的 SHA-256 十六进制摘要；未设置时同步接口关闭。凭证仅授予文章同步、绑定、草稿撤回和图片上传权限，不提供文章删除或其他管理员操作。
可选 OBSIDIAN_ASSET_DIR 指定持久图片目录。备份数据库、图片目录及插件 data.json（含同步版本和明文凭证）；勿提交或公开 data.json，也不要让公开的笔记同步工具上传它。

GET /api/obsidian/articles 返回文章绑定列表；POST 接受 publish、bind、unpublish。更新同时校验 updatedAt 和同步修订号；obsidianKey 使用唯一稀疏索引，重复请求不会创建第二篇文章。
后台编辑会改变 updatedAt，因此插件的旧版本写入被拒绝。第一阶段保留原始正文 obsidianRaw（默认不出现在公开查询中），为第二阶段回同步预留。

## 检查

`npm test` 包含实际插件发布、重复同步、更新、撤回、改文件名、绑定和冲突的回归测试；`npx tsc --noEmit`、相关 ESLint 和生产构建检查网站接口。
