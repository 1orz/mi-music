import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // 允许外部设备访问
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // 保持 /api 路径不变，直接转发到后端
        // 支持WebSocket代理（如果需要）
        ws: true,
        // 配置CORS
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 可以在这里添加自定义请求头
            console.log('Proxying request:', req.method, req.url);
          });
        }
      }
    }
  },
  define: {
    'process.env': {}
  }
})