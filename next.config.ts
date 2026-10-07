import type { NextConfig } from "next";

/**
 * Nota: create-next-app 16.4 activa `cacheComponents` y `partialPrefetching`
 * por defecto. Se desactivan porque las rutas de servidor usan la
 * configuración clásica `export const dynamic = "force-dynamic"` (incompatible
 * con Cache Components) y toda la app es interactiva (client components).
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
