module.exports = {
  env: {
    browser: true,
    amd: true,
    node: true
  },
  root: true,
  ignorePatterns: ['dist/'],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ]
}
