import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "build/**",
    ".react-router/**",
    "test-results/**",
    "playwright-report/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
