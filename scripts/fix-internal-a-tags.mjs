#!/usr/bin/env node
// scripts/fix-internal-a-tags.mjs
// Targeted conversion: <a href="/..."> -> <Link href="/...">
// Conservative: only converts hrefs that start with "/" and are NOT external/hash/mailto/tel,
// and skips target=_blank / download.
import fs from "node:fs";
import path from "node:path";

const exts = new Set([".ts",".tsx",".js",".jsx"]);
const roots = ["src"];
const targetNeedle = process.env.TARGET_NEEDLE || "/dashboard/products";

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && exts.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

function hasLinkImport(src) {
  return /from\s+["']next\/link["']/.test(src);
}

function addLinkImport(src) {
  if (hasLinkImport(src)) return src;
  // insert after "use client" if present
  const useClient = /^\s*["']use client["'];\s*$/m;
  if (useClient.test(src)) {
    return src.replace(useClient, (m) => `${m}\n\nimport Link from "next/link";`);
  }
  // else insert at top before first import
  return `import Link from "next/link";\n` + src;
}

function skippable(openTag, href) {
  const h = String(href).trim();
  if (!h.startsWith('/')) return true;
  if (h.startsWith('//')) return true;
  if (h.startsWith('#')) return true;
  if (/^(https?:|mailto:|tel:)/i.test(h)) return true;
  if (/\btarget\s*=\s*["']_blank["']/i.test(openTag)) return true;
  if (/\bdownload\b/i.test(openTag)) return true;
  return false;
}

// Multiline-safe anchor matcher
const A = /<a\b([\s\S]*?)\bhref\s*=\s*(['"])([\s\S]*?)\2([\s\S]*?)>([\s\S]*?)<\/a>/gi;

function convert(src) {
  let changed = false;
  const out = src.replace(A, (full, pre, q, href, post, inner) => {
    const open = `<a${pre}href=${q}${href}${q}${post}>`;
    if (!href.includes(targetNeedle)) return full;
    if (skippable(open, href)) return full;

    const attrsRaw = `${pre}${post}`.replace(/\s+/g, ' ').trim();
    const linkOpen = attrsRaw.length
      ? `<Link ${attrsRaw} href="${href.trim()}">`
      : `<Link href="${href.trim()}">`;

    changed = true;
    return `${linkOpen}${inner}</Link>`;
  });

  if (!changed) return { out: src, changed: false };
  return { out: addLinkImport(out), changed: true };
}

(function main(){
  if (!fs.existsSync('reports')) fs.mkdirSync('reports', { recursive: true });
  const files = roots.flatMap((r) => (fs.existsSync(r) ? walk(r) : []));
  const changedFiles = [];

  for (const f of files) {
    try {
      const src = fs.readFileSync(f, 'utf8');
      if (!src.includes(targetNeedle)) continue;
      const { out, changed } = convert(src);
      if (changed) {
        fs.writeFileSync(f, out, 'utf8');
        changedFiles.push(f);
      }
    } catch (_err) {
      console.error('err reading', f, _err.message || _err);
    }
  }

  fs.writeFileSync('reports/changed-files-v2.2.txt', changedFiles.join('\n') + '\n', 'utf8');
  console.log('Target needle:', targetNeedle);
  console.log('Changed files:', changedFiles.length);
  for (const f of changedFiles) console.log(' -', f);
})();
