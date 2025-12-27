import "server-only";
import fs from "fs";
import path from "path";
import { parse } from "yaml";

const seoPath = path.join(process.cwd(), "src/lib/seo/seo.yml");
const seoConfig = parse(fs.readFileSync(seoPath, "utf8")) as any;

function withBaseUrl(url: string) {
  // erlaubt /og-image.png und macht daraus absolute URL
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (seoConfig?.site?.baseUrl || "").replace(/\/$/, "");
  const rel = url.startsWith("/") ? url : `/${url}`;
  return `${base}${rel}`;
}

export function buildPageMetadata(pathname: string, overrides: any = {}) {
  const route = seoConfig?.routes?.[pathname] || {};
  const baseUrl = seoConfig?.site?.baseUrl || "";

  const ogImages = (route?.openGraph?.images || seoConfig?.openGraph?.images || []).map((img: any) => ({
    ...img,
    url: withBaseUrl(img.url),
  }));

  const twitterImages = (route?.twitter?.images || seoConfig?.twitter?.images || []).map((u: string) =>
    withBaseUrl(u)
  );

  return {
    metadataBase: new URL(baseUrl),
    title: route.title || seoConfig?.seo?.title?.default,
    description: route.description || seoConfig?.seo?.description?.default,
    keywords: seoConfig?.seo?.keywords,
    alternates: route.alternates || seoConfig?.seo?.alternates,
    robots: route.robots || seoConfig?.seo?.robots,

    openGraph: {
      ...seoConfig?.openGraph,
      ...route?.openGraph,
      url: route?.openGraph?.url || seoConfig?.openGraph?.url || baseUrl,
      images: ogImages,
    },

    twitter: {
      ...seoConfig?.twitter,
      ...route?.twitter,
      images: twitterImages,
    },

    icons: seoConfig?.icons,

    ...overrides,
  };
}

export const siteMetadata = buildPageMetadata("/");
