/**
 * GitHub 配置文件模板
 * 
 * 使用说明：
 * 1. 复制此文件为 config.js
 * 2. 按照下面的说明配置你的 GitHub token
 * 
 * 如何获取 GitHub Personal Access Token：
 * 
 * 步骤 1：访问 GitHub Settings
 *   - 登录 GitHub
 *   - 点击右上角头像 -> Settings
 *   - 左侧菜单找到 "Developer settings"
 * 
 * 步骤 2：生成新 Token
 *   - 点击 "Personal access tokens" -> "Tokens (classic)"
 *   - 点击 "Generate new token (classic)"
 *   - 输入 Note（例如：Personal Website）
 *   - 设置过期时间（建议选择 No expiration 或长期有效）
 * 
 * 步骤 3：选择权限
 *   - 勾选以下权限：
 *     ✓ read:user (读取用户信息)
 *   - 注意：只需要这一个权限即可查看所有提交（包括私有仓库）
 * 
 * 步骤 4：生成并复制 Token
 *   - 点击 "Generate token"
 *   - 立即复制生成的 token（只会显示一次！）
 *   - 将 token 粘贴到下方配置中
 * 
 * 安全提示：
 * - 请勿将包含真实 token 的 config.js 提交到 Git
 * - config.js 已被添加到 .gitignore 中
 * - 如果 token 泄露，请立即在 GitHub 上撤销该 token
 */

const GITHUB_CONFIG = {
    // 将 'your_github_token_here' 替换为你的 GitHub Personal Access Token
    // 格式类似：ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // 如果留空或设为 null，将使用模拟数据
    token: 'your_github_token_here',
    
    // 你的 GitHub 用户名
    username: 'Yuan-Zzzz',
    
    // 是否包含私有仓库的提交（需要有效的 token）
    includePrivate: true
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GITHUB_CONFIG;
}
