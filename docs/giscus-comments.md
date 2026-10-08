# GitHub 评论与首页留言板

文章详情页与首页使用官方 `@giscus/react` 组件，评论、回复与表情存放在公开仓库
[Yuan-Zzzz/website-comments](https://github.com/Yuan-Zzzz/website-comments) 的 `Comments` 公告分类。
访客在评论区通过 GitHub 授权后参与讨论；网站管理员登录仍使用原有后台登录。

## 配置与部署

仓库默认配置已包含公开的仓库 ID 和分类 ID，无需 OAuth Client Secret。
评论仓库已开启 Discussions，安装的 giscus App 仅授权该仓库。
评论仓库根目录的 `giscus.json` 只允许 `https://www.yuanzzzz.com` 与
`https://yuanzzzz.com` 加载评论；本地开发可以验证失败提示，若需要实际加载评论，
应在该文件中临时增加明确的本地测试 origin，并在验证完成后移除。

可在 `.env.local` 中覆盖公开配置；这些变量由服务器读取，修改后重启应用：

```dotenv
GISCUS_REPO_ID=R_kgDOVAxc4A
GISCUS_CATEGORY_ID=DIC_kwDOVAxc4M4DHU3s
GISCUS_ENABLED=true
```

`GISCUS_ENABLED=false` 暂时关闭嵌入评论，显示准备中提示。无需数据库迁移。
先备份服务器源码、配置与 `.next`，再安装依赖、运行检查与构建，
沿用 `npm start`（1111 端口）和 PM2 `yuan-website` 上线。
构建成功前不要替换线上 `.next`；上线失败时恢复备份构建与源码。

## 页面关联与管理

- 文章使用 `article:<MongoDB _id>`，严格匹配；改标题或 slug 不会改变讨论关联。
- 首页使用 `guestbook`，与文章评论隔离。
- 首次评论或表情由 giscus 自动创建讨论，未创建讨论不是加载错误。
- 删除文章不会删除 GitHub 讨论；需要清理时由仓库维护者在 GitHub 手动管理。
- 后台 `/admin/comments` 提供 GitHub 管理入口；页面加载失败时可重试或访问对应讨论。
- 组件卸载时清理监听器与计时器，切换文章或重试时重新挂载，避免展示旧文章评论。

## 验证

```bash
npm test
npx eslint components/public/Comments.tsx lib/giscus.ts app/admin/comments/page.tsx
npx tsc --noEmit
npm run build
```

DOM 回归测试使用官方组件，验证固定关联键、语言和显示设置、消息来源验证、
失败提示、重试、页面切换、卸载，以及具体讨论链接。测试不请求第三方服务或发布评论。
上线后还需在真实浏览器验证 GitHub 授权、评论/回复/表情持久化与手机显示。

## 旧功能

2026-09-02 的自建 OAuth 和 MongoDB 评论代码已移除，包括用户登录接口、旧评论 API
以及前台评论组件。旧数据库的 `users` / `comments` 记录保留，不自动迁移到 Discussions，
也不会被本次改动删除。后台文章与游戏管理及管理员认证继续使用原有实现。
