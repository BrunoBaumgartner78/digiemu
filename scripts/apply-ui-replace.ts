// scripts/apply-ui-replace.ts
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

type Rule = {
  from: string;
  to_de?: string;
  to_en?: string;
  to?: string;
};

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "config", "ui-replace.yml");

// Where to apply replacements
const INCLUDE_DIRS = [path.join(ROOT, "src")];

// Hard excludes (avoid breaking tech, migrations, CI scripts)
const EXCLUDE_PARTS = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.next${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}out${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}prisma${path.sep}`,
  `${path.sep}migrations${path.sep}`,
  `${path.sep}scripts${path.sep}`,
  `${path.sep}.github${path.sep}`,
];

// Only touch these file types
const ALLOWED_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".scss",
]);

function shouldExclude(filePath: string) {
  return EXCLUDE_PARTS.some((p) => filePath.includes(p));
}

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldExclude(full)) continue;
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyRules(content: string, rules: Rule[]) {
  let changed = false;
  let next = content;

  for (const r of rules) {
    const to = r.to ?? r.to_de ?? r.to_en; // prefer explicit to, else fallback
    if (!r.from || !to) continue;

    // Replace all occurrences (case-sensitive) – keep it predictable
    const re = new RegExp(escapeRegExp(r.from), "g");
    const replaced = next.replace(re, to);

    if (replaced !== next) {
      next = replaced;
      changed = true;
    }
  }

  return { changed, next };
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ Missing:", CONFIG_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  const cfg = yaml.parse(raw) as any;
  const rules: Rule[] = cfg?.ui_replace?.rules ?? [];

  if (!Array.isArray(rules) || rules.length === 0) {
    console.error("❌ No rules found in config/ui-replace.yml");
    process.exit(1);
  }

  const files = INCLUDE_DIRS.flatMap((d) => walk(d)).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ALLOWED_EXT.has(ext);
  });

  let touched = 0;
  let totalRepl = 0;

  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    const { changed, next } = applyRules(before, rules);

    if (changed) {
      // Count rough replacement hits (optional)
      let hits = 0;
      for (const r of rules) {
        const to = r.to ?? r.to_de ?? r.to_en;
        if (!to) continue;
        const m = before.match(new RegExp(escapeRegExp(r.from), "g"));
        if (m) hits += m.length;
      }
      totalRepl += hits;

      fs.writeFileSync(file, next, "utf8");
      touched++;
      console.log("✏️  updated:", path.relative(ROOT, file));
    }
  }

  console.log(`✅ done. files changed: ${touched}, approx replacements: ${totalRepl}`);
  console.log("👉 Review with git diff. If something looks off: git checkout -- <file>");
}

main();
