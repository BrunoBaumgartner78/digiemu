import "server-only";
import fs from "fs";
import path from "path";
import { parse } from "yaml";

const seoPath = path.join(process.cwd(), "src/lib/seo/seo.yml");
const seoConfig = parse(fs.readFileSync(seoPath, "utf8")) as any;

function getBaseUrl() {
  const raw = (seoConfig?.site?.baseUrl || "").trim();
  // Fallback, damit build nicht crasht
  return raw || "https://bellu.ch";
}

function withBaseUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base = getBaseUrl().replace(/\/$/, "");
  const rel = url.startsWith("/") ? url : `/${url}`;
  return `${base}${rel}`;
}

function normalizeIcons(icons: any) {
  if (!icons) return undefined;

  // YAML: icons.favicon[] -> Next: icons.icon[]
  const icon = icons.icon || icons.favicon || undefined;

  return {
    icon,
    apple: icons.apple,
    other: icons.other,
  };
}

export function buildPageMetadata(pathname: string, overrides: any = {}) {
  const route = seoConfig?.routes?.[pathname] || {};
  const baseUrl = getBaseUrl();

  const ogImagesRaw = route?.openGraph?.images || seoConfig?.openGraph?.images || [];
  const ogImages = ogImagesRaw.map((img: any) => ({
    ...img,
    url: withBaseUrl(img.url),
  }));

  const twitterImagesRaw = route?.twitter?.images || seoConfig?.twitter?.images || [];
  const twitterImages = twitterImagesRaw.map((img: any) => {
    // erlaubt string ODER object
    if (typeof img === "string") return withBaseUrl(img);
    if (img?.url) return { ...img, url: withBaseUrl(img.url) };
    return img;
  });

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

    icons: normalizeIcons(seoConfig?.icons),

    ...overrides,
  };
}

export const siteMetadata = buildPageMetadata("/");
