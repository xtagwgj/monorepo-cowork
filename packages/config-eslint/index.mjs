/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs,vue}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    rules: {
      "no-console": "warn"
    }
  }
];
