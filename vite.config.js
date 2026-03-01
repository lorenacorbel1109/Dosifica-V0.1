import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.js'],
  },
});
