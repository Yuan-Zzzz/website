import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      assetsInlineLimit: 0,
    },
    define: {
      // 将 GITHUB_TOKEN 暴露给客户端代码（如果存在）
      'import.meta.env.GITHUB_TOKEN': JSON.stringify(env.GITHUB_TOKEN || ''),
    },
  };
});
