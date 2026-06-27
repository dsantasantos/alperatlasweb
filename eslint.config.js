import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'tests/**', 'src/pages/moviment/CadastralMoviment.tsx'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        document:    'readonly',
        setTimeout:  'readonly',
        URL:         'readonly',
        URLSearchParams: 'readonly',
        fetch:       'readonly',
        console:     'readonly',
        Promise:     'readonly',
        FormData:    'readonly',
        Blob:        'readonly',
        btoa:        'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
