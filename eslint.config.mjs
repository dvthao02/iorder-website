import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const unusedVarsOptions = { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }

// Lint cho toàn bộ workspace: frontend/web (JS thuần) + frontend/admin, backend/* (TypeScript).
// tsc (typecheck/build) đã bắt lỗi type; ESLint bắt thêm unused import/var, react-hooks rules, code smell.
export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      'node_modules/**',
      '.pnpm-store/**',
      '.agents/**',
      '.claude/**',
      '.codex/**',
      '.codex-qa/**',
      'backups/**',
      'storage/**',
      'test-results/**',
      'backend/api/storage/**',
      'backend/database/migrations/**',
      'frontend/web/public/**',
      '*.config.*',
    ],
  },
  {
    files: ['frontend/web/src/**/*.{js,jsx}'],
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
      'no-unused-vars': ['warn', unusedVarsOptions],
    },
  },
  // ── frontend/admin (React + TypeScript) ─────────────────────────────────────
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['frontend/admin/src/**/*.{ts,tsx}'],
  })),
  {
    files: ['frontend/admin/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': ['warn', unusedVarsOptions],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // ── frontend/admin: cấm dùng confirm()/window.confirm() — dùng toast.warning từ ./toast thay thế ──
  {
    files: ['frontend/admin/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'confirm',
          message: 'Không dùng window.confirm — hãy dùng toast.warning từ ./toast để thông báo không chặn luồng.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'confirm',
          message: 'Không dùng window.confirm — hãy dùng toast.warning từ ./toast để thông báo không chặn luồng.',
        },
      ],
    },
  },
  // ── backend/* (TypeScript, no React) ────────────────────────────────────────
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: [
      'backend/api/src/**/*.ts',
      'backend/contracts/src/**/*.ts',
      'backend/database/src/**/*.ts',
      'backend/database/scripts/**/*.ts',
    ],
  })),
  {
    files: [
      'backend/api/src/**/*.ts',
      'backend/contracts/src/**/*.ts',
      'backend/database/src/**/*.ts',
      'backend/database/scripts/**/*.ts',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': ['warn', unusedVarsOptions],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Tắt các rule ESLint xung đột với Prettier (formatting đã do Prettier lo) — luôn để cuối cùng.
  prettierConfig,
]
