# 博客游客评论 + GitHub 登录 — 设计规格

**日期：** 2026-09-02  
**状态：** 待审阅  
**范围：** 文章详情页游客评论，GitHub OAuth 登录

---

## 1. 背景与目标

个人博客 Yuan-Zzzz.com 目前仅有后台管理员登录（`admin-token` JWT），文章页无互动能力。本功能为**博客游客**提供 GitHub 登录与一级评论能力，评论登录后即时公开，管理员可在后台删除任意评论。

### 已确认需求

| 维度 | 决策 |
|------|------|
| 用户群体 | 博客游客（非 admin） |
| 登录方式 | 仅 GitHub OAuth |
| 评论结构 | 一级平铺列表，无楼中楼 |
| 发布策略 | 登录后立刻公开，无审核队列 |
| 挂载范围 | 仅文章详情页 `/articles/[slug]` |
| 权限 | 用户可删自己的评论；admin 可删任意评论 |
| UI | 沿用 Win95 设计系统组件 |

### 非目标（本期不做）

- Google / 邮箱注册登录
- 楼中楼 / @ 回复
- 评论编辑
- 评论审核队列
- 游戏页评论
- 邮件 / Webhook 通知
- Markdown 评论（纯文本 only）

---

## 2. 方案选择

在三种常见做法中选定 **自建评论系统 + GitHub OAuth**：

1. **第三方挂件（Giscus / Utterances）** — 上线快，但 UI 不可控、数据不在 MongoDB，放弃。
2. **自建 + GitHub OAuth** — **选用**。贴合 Win95 UI、数据自持、与现有 admin 体系并存。
3. **Auth.js + 自建评论** — OAuth 成熟但引入第二套 session 体系，与现有 `jose` JWT 重复，暂不采用。

---

## 3. 架构概览

```
┌─────────────────────────────────────────────────────────┐
│  文章详情页 (Server Component)                           │
│  └── CommentSection (Client Component)                  │
│       ├── 未登录 → 「Sign in with GitHub」按钮           │
│       ├── 已登录 → Textarea + 提交                       │
│       └── 评论列表（头像、昵称、时间、删除）              │
└─────────────────────────────────────────────────────────┘
         │ fetch                    │ redirect
         ▼                          ▼
┌──────────────────┐    ┌──────────────────────────────┐
│ Comment API      │    │ GitHub OAuth API               │
│ GET/POST/DELETE  │    │ /api/auth/github               │
│                  │    │ /api/auth/github/callback      │
│                  │    │ /api/auth/logout               │
└────────┬─────────┘    └──────────────┬───────────────┘
         │                             │
         ▼                             ▼
┌─────────────────────────────────────────────────────────┐
│  MongoDB: User, Comment                                  │
└─────────────────────────────────────────────────────────┘

认证隔离：
  admin-token  → 现有 /admin/* + 管理 API（不变）
  user-token   → 游客会话（新增）
```

---

## 4. 数据模型

### 4.1 User（游客）

新建 `models/User.ts`：

```typescript
{
  githubId: string;      // GitHub user id，唯一索引
  username: string;      // GitHub login
  displayName: string;   // GitHub name 或 login
  avatarUrl: string;     // GitHub avatar_url
  createdAt: Date;
  updatedAt: Date;
}
```

- `githubId` 设 `unique: true, index: true`
- 首次 OAuth 回调时 upsert；后续登录更新 `displayName`、`avatarUrl`

### 4.2 Comment

新建 `models/Comment.ts`：

```typescript
{
  articleSlug: string;   // 关联 Article.slug，索引
  userId: ObjectId;      // ref User，索引
  content: string;       // 纯文本，trim 后 1–2000 字符
  createdAt: Date;
  updatedAt: Date;
}
```

- 复合索引：`{ articleSlug: 1, createdAt: 1 }`（按文章查列表、时间正序）
- **硬删除**：DELETE 时从库中移除记录（本期无软删除）

### 4.3 与 Article 关系

- Comment 通过 `articleSlug` 字符串关联，不使用 MongoDB `ref` 到 Article `_id`
- 与现有 slug 查询模式一致；文章删除时评论可保留或级联删除（本期：文章删除时一并删评论，在 Article DELETE API 中处理）

---

## 5. 认证设计

### 5.1 Cookie 隔离

| Cookie | Payload | 用途 |
|--------|---------|------|
| `admin-token` | `{ username, role: "admin" }` | 现有，不变 |
| `user-token` | `{ userId, githubId, role: "user" }` | 新增游客会话 |

- 复用 `lib/auth.ts` 的 `createToken` / `verifyToken`
- `middleware.ts` 继续只匹配 `/admin/*`，不拦截游客 OAuth

### 5.2 GitHub OAuth 流程

1. `GET /api/auth/github?returnTo=/articles/foo`
   - 生成随机 `state`，存入 `httpOnly` 短期 cookie（`oauth-state`，5 分钟）
   - 302 跳转 GitHub authorize URL

2. `GET /api/auth/github/callback?code=...&state=...`
   - 校验 `state` 与 cookie 一致（防 CSRF）
   - 用 `code` 换 access token（仅需 user 基本信息 scope：`read:user`）
   - 调 GitHub API 取 `id, login, name, avatar_url`
   - upsert User，签发 `user-token`（7 天，与 admin 一致）
   - 清除 `oauth-state`，302 回 `returnTo`（默认 `/`）

3. `POST /api/auth/logout`（游客）
   - 清除 `user-token` cookie
   - 不影响 `admin-token`

### 5.3 辅助 API

`GET /api/auth/me`
- 读 `user-token`，返回 `{ success, data: { id, username, displayName, avatarUrl } | null }`
- 供 `CommentSection` 客户端判断登录态

### 5.4 环境变量

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
# 可选，默认从 request 推导
GITHUB_CALLBACK_URL=http://localhost:1111/api/auth/github/callback
```

GitHub OAuth App 需配置 Homepage URL 与 Authorization callback URL。

---

## 6. API 规格

统一响应格式：`{ success: boolean, data?: T, error?: string }`

### 6.1 GET `/api/articles/[slug]/comments`

- **权限：** 公开
- **逻辑：** 校验文章存在且 `published: true`；查 Comment 按 `createdAt` 升序；populate 用户信息
- **响应 data：**

```typescript
Array<{
  _id: string;
  content: string;
  createdAt: string;
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
}>
```

### 6.2 POST `/api/articles/[slug]/comments`

- **权限：** 需有效 `user-token`
- **Body：** `{ content: string }`
- **校验：**
  - 文章存在且已发布
  - `content` trim 后长度 1–2000
  - 限流：同一 `userId` 60 秒内最多 3 条（超限返回 429）
- **响应：** 201 + 新评论（含 user）

### 6.3 DELETE `/api/comments/[id]`

- **权限：**
  - 评论作者（`user-token.userId` 匹配）可删
  - 或 `admin-token` 持有者可删
- **响应：** `{ success: true }` 或 403/404

### 6.4 鉴权辅助

新建 `lib/user-auth.ts`：

```typescript
getUserFromRequest(request: NextRequest): Promise<UserPayload | null>
requireUser(request): Promise<UserPayload> // throws/returns 401 response
isAdmin(request): Promise<boolean>        // 复用 admin-token 校验
```

---

## 7. 前端设计

### 7.1 组件

| 组件 | 类型 | 职责 |
|------|------|------|
| `CommentSection` | Client | 评论区容器：拉列表、登录态、发表、删除 |
| `CommentList` | Client | 渲染评论列表 |
| `CommentForm` | Client | 已登录用户的输入框 + 提交 |
| `GitHubLoginButton` | Client | 跳转 `/api/auth/github?returnTo=...` |

全部使用 `Win95Window`、`Win95Button`、`Win95Textarea`。

### 7.2 文章页集成

修改 `app/(public)/articles/[slug]/page.tsx`：

- 在文章 `Win95Window` 下方新增第二个 `Win95Window`，title 如 `Comments.exe`
- 传入 `articleSlug={article.slug}` 给 `CommentSection`

### 7.3 交互

- 未登录：显示说明文字 + GitHub 登录按钮
- 已登录：显示头像、昵称、登出按钮、表单
- 评论列表：GitHub 头像（`<img>`）、昵称（链接 `https://github.com/{username}`）、相对/绝对时间、纯文本内容（`white-space: pre-wrap`）
- 自己的评论：显示「删除」按钮，确认后调 DELETE API
- 提交成功：清空输入框，刷新列表（或乐观追加）

### 7.4 XSS 防护

- 评论以纯文本渲染，不使用 `dangerouslySetInnerHTML`
- 不使用 Markdown 渲染器

---

## 8. 后台管理

### 8.1 评论管理页

新增 `app/admin/comments/page.tsx`：

- 表格列：文章 slug / 标题、评论人、内容摘要、时间、操作
- 「删除」按钮调用 `DELETE /api/comments/[id]`（带 admin cookie）
- 导航：在现有 admin 布局侧栏/菜单增加「评论」入口

### 8.2 文章删除级联（可选同期）

修改 `DELETE /api/articles/[slug]`：删除文章时 `Comment.deleteMany({ articleSlug: slug })`

---

## 9. 安全与限流

| 措施 | 说明 |
|------|------|
| OAuth state | 防 CSRF |
| httpOnly cookie | 防 XSS 窃取 token |
| sameSite=lax | 默认 |
| secure | production 启用 |
| 内容长度 | 1–2000 字符 |
| 发帖限流 | 每用户 60s 内最多 3 条 |
| 权限校验 | DELETE 必须验证 owner 或 admin |

限流实现：本期用 MongoDB 查询 `Comment.countDocuments({ userId, createdAt: { $gte: oneMinuteAgo } })`，无需 Redis。

---

## 10. 错误处理

| 场景 | HTTP | error 文案（示例） |
|------|------|-------------------|
| 未登录发帖 | 401 | Unauthorized |
| 文章不存在 | 404 | Article not found |
| 内容为空/过长 | 400 | Invalid content |
| 限流 | 429 | Too many comments |
| 删他人评论 | 403 | Forbidden |
| OAuth 失败 | 302 回 returnTo 或 400 | 前端可显示 query `?error=auth_failed` |

---

## 11. 测试计划

### 手动测试清单

1. 未登录访问文章页 → 看到登录按钮，无表单
2. GitHub 登录 → 回调后回到文章页，显示头像和表单
3. 发表评论 → 列表即时出现
4. 删除自己的评论 → 列表移除
5. Admin 登录后台 → 评论管理页可删任意评论
6. 未登录调 POST → 401
7. 连续发 4 条/分钟 → 第 4 条 429
8. 超长内容 → 400
9. 游客登出 → `user-token` 清除，admin 仍可用

### 自动化（可选，本期不强制）

项目当前无测试框架；若后续加，优先 API route 集成测试。

---

## 12. 文件清单（实施参考）

| 操作 | 路径 |
|------|------|
| 新建 | `models/User.ts` |
| 新建 | `models/Comment.ts` |
| 新建 | `lib/user-auth.ts` |
| 新建 | `lib/github-oauth.ts` |
| 新建 | `lib/rate-limit.ts` |
| 新建 | `app/api/auth/github/route.ts` |
| 新建 | `app/api/auth/github/callback/route.ts` |
| 新建 | `app/api/auth/logout/route.ts` |
| 新建 | `app/api/auth/me/route.ts` |
| 新建 | `app/api/articles/[slug]/comments/route.ts` |
| 新建 | `app/api/comments/[id]/route.ts` |
| 新建 | `components/public/CommentSection.tsx` |
| 新建 | `app/admin/comments/page.tsx` |
| 修改 | `app/(public)/articles/[slug]/page.tsx` |
| 修改 | admin 布局导航 |
| 修改 | `app/api/articles/[slug]/route.ts`（DELETE 级联，若有） |
| 文档 | `.env.example` 或 README 补充 GitHub OAuth 变量 |

---

## 13. 自检记录

- [x] 无 TBD / TODO 占位
- [x] 需求与架构一致（GitHub only、一级评论、即时公开、文章页 only、D 权限）
- [x] admin 与游客认证隔离明确
- [x] API 路径与现有 REST 风格一致
- [x] 范围适合单次实施计划，无需拆子项目
