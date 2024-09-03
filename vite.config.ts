import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
  },
  server: {
    open: true,
  },
  resolve: {
    alias: {
      'three': 'three',
      '@tweenjs/tween.js': '@tweenjs/tween.js'
    }
  }
});
