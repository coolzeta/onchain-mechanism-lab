import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/modules/**/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            { "group": ["react", "react/*", "next", "next/*"], "message": "领域内核必须保持为纯 TypeScript。" },
            { "group": ["@/app/*", "@/platform/components/*"], "message": "领域内核不能依赖页面或展示层。" }
          ]
        }
      ]
    }
  },
  globalIgnores([".next/**", "out/**", "coverage/**", "next-env.d.ts"]),
]);
