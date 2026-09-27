import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
  // The automatic runtime, as Next compiles it, so a test can render a
  // component without the component importing React for its JSX.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
