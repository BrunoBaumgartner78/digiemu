#!/usr/bin/env node
// scripts/codemod-internal-a-to-link-v2.3.mjs
// Safe repo-wide conversion: internal <a href="/..."> -> <Link href="/...">
// Skips: target="_blank", download, external protocols, hash, protocol-relative (//)
import fs from "node:fs";
import path from "node:path";

const exts = new Set([".ts",".tsx",".js",".jsx"]);
const roots = ["src/app","src/components"].filter((p) => fs.existsSync(p));

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

  const useClientLine = /^\s*["']use client["'];\s*$/m;
  if (useClientLine.test(src)) {
    return src.replace(useClientLine, (m) => `${m}\n\nimport Link from "next/link";`);
  }

  const firstImport = /^\s*import\s/m;
  if (firstImport.test(src)) {
    return src.replace(firstImport, `import Link from "next/link";\n` + "import ");
  }
  return `import Link from "next/link";\n` + src;
}

function isSkippable(openTag, href) {
  const h = String(href).trim();
  if (!h.startsWith("/")) return true;
  if (h.startsWith("//")) return true;
  if (h.startsWith("#")) return true;
  if (/^(https?:|mailto:|tel:)/i.test(h)) return true;
  if (/\btarget\s*=\s*["']_blank["']/i.test(openTag)) return true;
  if (/\bdownload\b/i.test(openTag)) return true;
  return false;
}

const ANCHOR = /<a\b([\s\S]*?)\bhref\s*=\s*(\"|\')([\s\S]*?)\2([\s\S]*?)>([\s\S]*?)<\/a>/gi;

function convertFile(src) {
  let changed = false;

  const out = src.replace(ANCHOR, (full, pre, q, href, post, inner) => {
    const open = `<a${pre}href=${q}${href}${q}${post}>`;
    if (isSkippable(open, href)) return full;

    if (!href.trim().startsWith("/")) return full;
    if (href.trim().startsWith("//")) return full;

    const attrsRaw = `${pre}${post}`.replace(/\s+/g, " ").trim();

    const linkOpen = attrsRaw.length
      ? `<Link ${attrsRaw} href="${href.trim()}">`
      : `<Link href="${href.trim()}">`;

    changed = true;
    return `${linkOpen}${inner}</Link>`;
  });

  if (!changed) return { out: src, changed: false };
  return { out: addLinkImport(out), changed: true };
}

(function main() {
  const files = roots.flatMap(walk);
  const changedFiles = [];
  const beforeLines = [];
  const afterLines = [];

  const oneLineA = /<a\b[^>]*\bhref\s*=\s*(\"|\')\/(?!\/)[^"'\s#]+\1/i;

  for (const f of files) {
    const original = fs.readFileSync(f, "utf8");

    const lines = original.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (oneLineA.test(lines[i])) {
        beforeLines.push(`${f}:${i+1}: ${lines[i].trim()}`);
        if (beforeLines.length >= 400) break;
      }
    }

    const { out, changed } = convertFile(original);
    if (!changed) continue;

    fs.writeFileSync(f, out, "utf8");
    changedFiles.push(f);

    const outLines = out.split(/\r?\n/);
    for (let i = 0; i < outLines.length; i++) {
      if (outLines[i].includes("<Link") && outLines[i].includes('href="/')) {
        afterLines.push(`${f}:${i+1}: ${outLines[i].trim()}`);
        if (afterLines.length >= 400) break;
      }
    }
  }

  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync("reports/v2.3-changed-files.txt", changedFiles.join("\n") + "\n", "utf8");
  fs.writeFileSync("reports/v2.3-before-sample.txt", beforeLines.join("\n") + "\n", "utf8");
  fs.writeFileSync("reports/v2.3-after-sample.txt", afterLines.join("\n") + "\n", "utf8");

  console.log(`Scanned files: ${files.length}`);
  console.log(`Changed files: ${changedFiles.length}`);
})();
