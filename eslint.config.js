// eslint.config.js

import vueEslintParser from "vue-eslint-parser";
import typescriptParser from "@typescript-eslint/parser";

export default [
  {
    // 프로젝트의 루트 디렉토리 설정
    files: ["**/*.ts", "**/*.js", "**/*.vue"],
    ignores: ["node_modules/**/*"],
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: typescriptParser,
        sourceType: "module",
      },
      globals: {
        browser: true,
        node: true,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptParser,
      vue: vueEslintParser,
    },
    extends: [
      "eslint:recommended",
      "plugin:nuxt/recommended",
      "plugin:vue/recommended",
      "plugin:prettier/recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "@nuxtjs/eslint-config-typescript",
    ],
    rules: {
      // 사용자 정의 규칙 설정
      "import/extensions": "off",
      "import/no-unresolved": "off",
      "import/no-extraneous-dependencies": "off",
      "import/prefer-default-export": "off",
      "vue/multi-word-component-names": "off",
      "no-shadow": 0,
      "@typescript-eslint/no-shadow": "error",
      "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-debug": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-unused-vars": "off",
      // Prettier 코드 스타일 설정
      "prettier/prettier": [
        "error",
        {
          singleQuote: true,
          semi: false,
          useTabs: false,
          tabWidth: 2,
          trailingComma: "none",
          printWidth: 80,
          bracketSpacing: true,
          arrowParens: "always",
          endOfLine: "auto",
        },
      ],
      "global-require": 0,
    },
  },
];
