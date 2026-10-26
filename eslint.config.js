import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Larangan keamanan (security.rules.md, login.component.md): tidak ada HTML mentah,
      // dan token tidak pernah ke storage browser. Sesi hanya lewat cookie HttpOnly dari backend.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML dilarang. Render sebagai teks atau komponen React.',
        },
        {
          selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]",
          message: 'Jangan menulis innerHTML atau outerHTML. Gunakan textContent atau komponen React.',
        },
        {
          selector: "CallExpression[callee.property.name=/^(insertAdjacentHTML|write)$/]",
          message: 'Jangan menyisipkan HTML mentah ke dokumen.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Token dan data sesi tidak boleh disimpan di storage browser.' },
        { name: 'sessionStorage', message: 'Token dan data sesi tidak boleh disimpan di storage browser.' },
      ],
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['*.config.{ts,js}', 'e2e/**', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: { '@typescript-eslint/unbound-method': 'off' },
  },
)
