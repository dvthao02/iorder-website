import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

// Lint cho website công khai (apps/web/src). Các package TS khác đã có tsc kiểm tra riêng.
export default [
  {
    ignores: ['**/dist/**', 'apps/admin/**', 'apps/api/**', 'packages/**', 'node_modules/**', '*.config.*'],
  },
  {
    files: ['apps/web/src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // catch {} rỗng là pattern cố ý (bỏ qua lỗi không quan trọng)
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Cảnh báo biến/import thừa — bắt rác sớm. Bỏ qua biến viết HOA (hằng) và arg _
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
]
