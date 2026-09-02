# GitHub OAuth App 配置指南

GitHub **不支持**通过 API 自动创建 OAuth App，需要在网页上手动创建一次。

## 1. 创建 OAuth App

打开：[https://github.com/settings/applications/new](https://github.com/settings/applications/new)

填写：

| 字段 | 值 |
|------|-----|
| **Application name** | `Yuan Website Comments` |
| **Homepage URL** | `https://www.yuanzzzz.com` |
| **Authorization callback URL** | `https://www.yuanzzzz.com/api/auth/github/callback` |

本地开发可另建一个 OAuth App，callback 填：
`http://localhost:1111/api/auth/github/callback`

点击 **Register application**。

## 2. 获取凭据

创建后页面会显示 **Client ID**。点击 **Generate a new client secret** 生成 **Client Secret**（只显示一次，请立即保存）。

## 3. 写入环境变量

### 本地 `.env.local`

```bash
GITHUB_CLIENT_ID=你的_client_id
GITHUB_CLIENT_SECRET=你的_client_secret
GITHUB_CALLBACK_URL=http://localhost:1111/api/auth/github/callback
```

### 服务器 `/root/website/.env` 或 `.env.local`

```bash
GITHUB_CLIENT_ID=你的_client_id
GITHUB_CLIENT_SECRET=你的_client_secret
GITHUB_CALLBACK_URL=https://www.yuanzzzz.com/api/auth/github/callback
```

## 4. 重启服务

```bash
cd ~/website
npm run build
# pm2 restart website  或你的启动方式
```

## 5. 验证

1. 打开 `https://www.yuanzzzz.com/articles/某篇文章`
2. 点击 **Sign in with GitHub**
3. 授权后应回到文章页并可发表评论
