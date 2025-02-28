import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: [
      "next/core-web-vitals",
      "next/typescript",
      "prettier",
      "plugin:@typescript-eslint/recommended",
      "plugin:jest/recommended",
    ],
    env: {
      node: true,
      es2021: true,
      browser: true,
      jest: true,
    },
    plugins: ["jest", "react"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      React: "readonly",
    },
    overrides: [
      {
        files: ["__tests__/**/*.spec.ts"],
        rules: {
          "playwrite/no-standalone-expect": "off",
        },
      },
    ],
  }),
];

export default eslintConfig;
