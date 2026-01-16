// scripts/lint.cjs
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(" ")}\n  cwd=${root}\n`);
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  return res.status ?? 1;
}

// Stable on Windows: run ESLint directly (next lint CLI parsing is unreliable here)
const code = run("npx", ["eslint", ".", "--ext", ".js,.jsx,.ts,.tsx"]);
process.exit(code);
