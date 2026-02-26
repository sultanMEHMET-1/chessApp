import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEV_SERVER_PORT = 5173; // Vite default.

export default defineConfig({
  plugins: [react()],
  server: {
    port: DEV_SERVER_PORT
  }
});
