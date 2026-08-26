import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const port = process.env.PORT || 3000;
export default defineConfig({
  plugins: [react()],
  server: {
    port: port,
    proxy: {
      '/api': {
        target: 'https://smsavmsserver.onrender.com',
        changeOrigin: true,
      },
    },
  },
});
