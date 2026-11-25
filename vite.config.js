export default {
  base: './', esbuild: { jsx: 'automatic' },
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
}
