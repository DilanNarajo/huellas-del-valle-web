import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // components/ui/timeline.tsx es el componente del usuario copiado tal cual:
    // usa `any` a propósito (props inyectadas por cloneElement). Se relaja la
    // regla SOLO para ese archivo en lugar de modificar su código.
    files: ["components/ui/timeline.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "apps-script/**"]),
]);

export default eslintConfig;
