import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const compilerAdvisories = {
  "react-hooks/immutability": "warn",
  "react-hooks/purity": "warn",
  "react-hooks/refs": "warn",
  "react-hooks/set-state-in-effect": "warn",
};

export default defineConfig([
  ...nextVitals.map((config) => config.plugins?.["react-hooks"]
    ? {
        ...config,
        // Keep React Compiler readiness findings visible. The compiler is not
        // enabled yet, so these advisories should not block production lint.
        rules: { ...config.rules, ...compilerAdvisories },
      }
    : config),
  globalIgnores([".next*/**", ".tmp*/**", "node_modules/**", "drizzle/**", ".visual/**"]),
]);
