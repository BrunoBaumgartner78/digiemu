// scripts/lint.cjs
const { spawnSync } = require("node:child_process");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, cwd: process.cwd() });
  return r.status ?? 1;
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

// 1) ESLint (authoritative locally)
const code = run("npx", ["eslint", ".", "--ext", ".js,.jsx,.ts,.tsx", "--cache"]);
process.exit(code);
