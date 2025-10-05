/// <reference types="vite/client" />
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
};