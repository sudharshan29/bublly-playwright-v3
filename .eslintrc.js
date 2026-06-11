module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='openFirstConversation']",
        message:  "Use gotoConversation(id). 'openFirstConversation()' causes parallel race conditions.",
      },
      {
        selector: "CallExpression[callee.property.name='first'][callee.object.type='CallExpression']",
        message:  "Never use .first() in tests — always navigate to a conversation by its ID via gotoConversation(id).",
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'reports/'],
};
