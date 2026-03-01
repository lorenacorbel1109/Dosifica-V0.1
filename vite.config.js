import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.js'],
  },
});
