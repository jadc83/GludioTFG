import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./resources/js/tests/setupTests.js'],
    // Only include test files by glob; exclude node_modules and e2e tests
    include: [
      'tests/**/*.test.{js,jsx,ts,tsx}',
      'tests/**/*.spec.{js,jsx,ts,tsx}'
    ],
    exclude: ['node_modules/**', 'tests/e2e/**']
  },
});
