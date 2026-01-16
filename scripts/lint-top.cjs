const fs = require("fs");

const path = process.argv[2] || "reports/lint-wave2.txt";
if (!fs.existsSync(path)) {
  console.error("Missing report:", path);
  process.exit(1);
}

const text = fs.readFileSync(path, "utf8");
const lines = text.split(/\r?\n/);

// Extract: "path:line:col  warning  message  rule"
const hits = [];
let currentFile = null;

for (const line of lines) {
  // File header lines like: C:\path\file.ts
  if (/^[A-Z]:\\/.test(line) && (line.trim().endsWith('.ts') || line.trim().endsWith('.tsx') || line.trim().endsWith('.js') || line.trim().endsWith('.mjs') || line.trim().endsWith('.cjs'))) {
    currentFile = line.trim();
    continue;
  }
  const m = line.match(/^\s*(\d+):(\d+)\s+warning\s+(.+?)\s{2,}([^\s]+)$/);
  if (m && currentFile) {
    hits.push({
      file: currentFile,
      line: Number(m[1]),
      col: Number(m[2]),
      msg: m[3],
      rule: m[4],
    });
  }
}

const byRule = new Map();
for (const h of hits) byRule.set(h.rule, (byRule.get(h.rule) || 0) + 1);

const topRules = [...byRule.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
console.log("Top rules:");
for (const [rule, count] of topRules) console.log(`${count}\t${rule}`);

console.log("\nSample hits (first 30):");
hits.slice(0,30).forEach(h => {
  console.log(`${h.file}:${h.line}:${h.col}\t${h.rule}\t${h.msg}`);
});
