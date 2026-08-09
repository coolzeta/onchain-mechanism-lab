import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const withMDX = createMDX({ extension: /\.mdx?$/ });
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const githubRepositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "onchain-mechanism-lab";
const basePath = process.env.GITHUB_PAGES === "true" ? `/${githubRepositoryName}` : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  output: "export",
  trailingSlash: true,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: { unoptimized: true },
};

export default withNextIntl(withMDX(nextConfig));
