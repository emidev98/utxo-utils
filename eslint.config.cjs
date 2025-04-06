const config = require("eslint/config");

return config.defineConfig([
  {
    files: ["**/*.ts"],
    ignores: ["node_modules"],
    plugins: ["eslint:recommended", "plugin:react/recommended"],
    rules: {},
  },
]);
