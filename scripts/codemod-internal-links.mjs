#!/usr/bin/env node
/**
 * scripts/codemod-internal-links.mjs
 *
 * Replaces internal <a href="/...">...</a> with <Link href="/...">...</Link>
 * in .ts/.tsx/.js/.jsx under src/app and src/components.
 *
 * SAFETY RULES (won't touch these):
 * - href starts with http:, https:, //, mailto:, tel:
 * - href starts with # (hash-only)
 * - <a ... target="_blank" ...> (or target='_blank')
 * - <a ... download ...>
 * - <a ... dangerouslySetInnerHTML ...> (leave it)
 *
 * Also tries to preserve existing props (className, aria-*, etc.).
 * If Link import is missing, it will insert: import Link from "next/link";
 *
 * NOTE: This is a regex-based codemod (not AST). It is intentionally conservative.
 */

import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src/app", "src/components"];
const EXT_RE = /\.(ts|tsx|js|jsx)$/i;

const reportDir = "reports";
const beforeReport = path.join(reportDir, "a-tags-before.txt");
const afterReport = path.join(reportDir, "a-tags-after.txt");
const changedReport = path.join(reportDir, "codemod-changed-files.txt");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && EXT_RE.test(ent.name)) out.push(p);
  }
  return out;
}

function ensureLinkImport(src) {
  const hasLinkImport =
    /from\s+["']next\/link["']/.test(src) || /require\(["']next\/link["']\)/.test(src);

  if (hasLinkImport) return src;

  // Insert after "use client"; if present, else after first import block, else at top.
  const useClientRe = /^\s*["']use client["'];\s*/m;
  if (useClientRe.test(src)) {
    return src.replace(useClientRe, (m) => `${m}\nimport Link from "next/link";\n`);
  }

  const firstImportRe = /^\s*import\s.+?;\s*$/m;
  const match = src.match(firstImportRe);
  if (match?.index != null) {
    const idx = match.index + match[0].length;
    return src.slice(0, idx) + `\nimport Link from "next/link";` + src.slice(idx);
  }

  return `import Link from "next/link";\n` + src;
}

function isSkippableHref(href) {
  const h = href.trim();
  if (!h) return true;
  if (h.startsWith("#")) return true;
  if (h.startsWith("http://") || h.startsWith("https://")) return true;
  if (h.startsWith("//")) return true;
  if (h.startsWith("mailto:") || h.startsWith("tel:")) return true;
  return false;
}

function hasUnsafeAnchorAttrs(openTag) {
  const t = openTag;
  if (/\btarget\s*=\s*["']_blank["']/i.test(t)) return true;
  if (/\bdownload\b/i.test(t)) return true;
  if (/\bdangerouslySetInnerHTML\b/i.test(t)) return true;
  return false;
}

// Very conservative: match <a ... href="..."> ... </a> where opening tag does NOT contain newline-heavy chaos.
// This will still catch multi-line tags because we use [\s\S]*? minimally.
const A_TAG_RE = /<a\b([\s\S]*?)\bhref\s*=\s*(['"])([\s\S]*?)\2([\s\S]*?)>([\s\S]*?)<\/a>/gi;

function collectATags(file, src) {
  const lines = src.split(/\r?\n/);
  const hits = [];
  let m;
  while ((m = A_TAG_RE.exec(src))) {
    // find approximate line by counting newlines up to match.index
    const prefix = src.slice(0, m.index);
    const line = prefix.split(/\r?\n/).length;
    const snippet = m[0].replace(/\s+/g, " ").slice(0, 220);
    hits.push(`${file}:${line}: ${snippet}`);
  }
  return hits;
}

function transformFile(file, src) {
  let changed = false;

  const out = src.replace(A_TAG_RE, (full, pre, quote, hrefRaw, post, inner) => {
    const openTag = `<a${pre}href=${quote}${hrefRaw}${quote}${post}>`;

    const href = String(hrefRaw).trim();

    // Skip external / unsafe anchors
    if (isSkippableHref(href)) return full;
    if (hasUnsafeAnchorAttrs(openTag)) return full;

    // Skip weird protocol-like things we didn't list explicitly
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) return full;

    // Only internal absolute paths starting with "/"
    if (!href.startsWith("/")) return full;

    // If someone linked to a file with an extension, it's *still* internal,
    // but often intended as download. We'll keep conservative: skip common files.
    if (/\.(pdf|zip|png|jpg|jpeg|webp|mp4|mp3|csv)$/i.test(href)) return full;

    // Build props for <Link ...>
    // Keep ALL attributes except href, and drop target/rel/download already skipped.
    const attrs = `${pre}${post}`.trim();

    // Remove leading/trailing whitespace and collapse internal spacing a bit
    const cleanedAttrs = attrs
      .replace(/\s+/g, " ")
      .replace(/\bclass\b=/g, "className=") // just in case
      .trim();

    const linkOpen = cleanedAttrs.length
      ? `<Link ${cleanedAttrs} href="${href}">`
      : `<Link href="${href}">`;

    changed = true;
    return `${linkOpen}${inner}</Link>`;
  });

  if (!changed) return { src, changed: false };

  const withImport = ensureLinkImport(out);
  return { src: withImport, changed: true };
}

function main() {
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const files = ROOTS.flatMap(walk);

  const beforeHits = [];
  const afterHits = [];
  const changedFiles = [];

  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");

    // before report
    beforeHits.push(...collectATags(file, src));

    const res = transformFile(file, src);
    if (res.changed) {
      fs.writeFileSync(file, res.src, "utf8");
      changedFiles.push(file);
    }

    // after report
    const afterSrc = res.changed ? res.src : src;
    afterHits.push(...collectATags(file, afterSrc));
  }

  fs.writeFileSync(beforeReport, beforeHits.join("\n") + "\n", "utf8");
  fs.writeFileSync(afterReport, afterHits.join("\n") + "\n", "utf8");
  fs.writeFileSync(changedReport, changedFiles.join("\n") + "\n", "utf8");

  console.log(`Scanned files: ${files.length}`);
  console.log(`Changed files: ${changedFiles.length}`);
  console.log(`Reports: ${beforeReport}, ${afterReport}, ${changedReport}`);
}

main();
