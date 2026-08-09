import type { MetadataRoute } from "next";
import { siteConfig } from "@/platform/config";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: `${basePath}/zh/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#fffdf7",
    theme_color: siteConfig.themeColor,
    lang: "zh-CN",
    orientation: "any",
    icons: [
      { src: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
  };
}
