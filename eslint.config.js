module.exports = [
  {
    name: 'loading-babel-eslint-parser-through-custom-plugin',
    plugins: {
      'custom-plugin': require('./custom-eslint-plugin'),
    },
  },

  // example using the custom loaded parser
  {
    languageOptions: {
      // directly requiring the parser
      // parser: require('babel-eslint'),

      // or: through the loaded plugin
      parser: 'custom-plugin/eslint-esnext',
    },
  },
  {
    files: 'packages/*/src/**/*.js',
    plugins: {
      unicorn: require('eslint-plugin-unicorn'),
    },
    rules: {
      'unicorn/no-process-exit': ['error'],
      'unicorn/consistent-function-scoping': 'error',
      semi: 'error',
    },
  },
  {
    files: '**/__tests__/**/*.{js,jsx}',
    plugins: {
      react: require('eslint-plugin-react'),
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'global-require': 'error',
    },
  },
];
