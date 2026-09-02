import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", ".next-build-check/**", "node_modules/**", "drizzle/**", ".visual/**", ".tmp-ui-test/**"]),
]);
