import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use happy-dom environment (lighter than jsdom, works with React Native)
    environment: 'happy-dom',

    // Enable globals (no need to import describe/test/expect)
    globals: true,

    // Test file patterns
    include: ['**/__tests__/**/*.test.{ts,tsx}'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        '__tests__/**',
        '.expo/**',
        'coverage/**',
        '*.config.{ts,js}',
        'app.config.{ts,js}',
        'metro.config.js',
        'babel.config.js',
      ],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
