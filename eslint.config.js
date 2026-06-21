import eslintReact from "@eslint-react/eslint-plugin";
import eslintJs from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["**/*.ts", "**/*.tsx"],

  // Ignore auto-generated clients that are not type-checked by the main tsconfig
  ignores: ["src/clients/frankfurter/client/**"],

  // Extend recommended rule sets from:
  // 1. ESLint JS's recommended rules
  // 2. TypeScript ESLint recommended rules
  // 3. ESLint React's recommended-typescript rules
  extends: [
    eslintJs.configs.recommended,
    tseslint.configs.recommended,
    eslintReact.configs["recommended-typescript"],
  ],

  // Configure language/parsing options
  languageOptions: {
    // Use TypeScript ESLint parser for TypeScript files
    parser: tseslint.parser,
    parserOptions: {
      // Enable project service for better TypeScript integration
      projectService: {
        allowDefaultProject: [
          "capacitor.config.ts",
          "cypress.config.ts",
          "jest.setup.ts",
          "jest.config.ts",
          "data/update.ts",
        ],
      },
      tsconfigRootDir: import.meta.dirname,
    },
  },

  // Custom rule overrides (modify rule levels or disable rules)
  rules: {
    "@eslint-react/no-missing-key": "warn",
  },
});
