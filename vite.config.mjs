import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: []
    },
    minify: true,
    sourcemap: true
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
      'react-markdown',
      'react-syntax-highlighter',
      'rehype-raw',
      'rehype-sanitize',
      'remark-gfm'
    ]
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json']
  }
})
