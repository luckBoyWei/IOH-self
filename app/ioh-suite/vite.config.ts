// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
// ✅ 正确的命名导入（不是 default）
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './', // 👉 相对路径，离线打开 OK
  plugins: [
    react(),
    viteSingleFile(), // ✅ 调用插件函数
  ],
  build: {
    cssCodeSplit: false,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173,
    allowedHosts: ['.ngrok-free.app'], // ✅ 允许 ngrok 子域访问
  },
})
