import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const seoPath = path.join(process.cwd(), 'src/lib/seo/seo.yml');
const seoConfig = yaml.parse(fs.readFileSync(seoPath, 'utf8'));

function buildPageMetadata(pathname: string, overrides?: any) {
  const route = seoConfig.routes?.[pathname] || {};
  return {
    title: route.title || seoConfig.seo.title.default,
    description: route.description || seoConfig.seo.description.default,
    keywords: seoConfig.seo.keywords,
    alternates: seoConfig.seo.alternates,
    robots: route.robots || seoConfig.seo.robots,
    openGraph: {
      ...seoConfig.openGraph,
      ...route.openGraph,
      images: seoConfig.openGraph.images,
    },
    twitter: {
      ...seoConfig.twitter,
      images: seoConfig.twitter.images,
    },
    icons: seoConfig.icons,
    metadataBase: new URL(seoConfig.site.baseUrl),
    ...overrides,
  };
}

export const siteMetadata = buildPageMetadata('/');
export { buildPageMetadata };
