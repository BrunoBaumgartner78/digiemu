/* scripts/lint.cjs
 * Fixes: "Invalid project directory ...\\digiemu\\lint" on Windows
 * by forcing Next lint to run with cwd = repo root.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

// Use npx to invoke the local next binary which avoids some Windows path parsing quirks
const isWin = process.platform === "win32";
const runner = isWin ? "npx.cmd" : "npx";
const args = ["--yes", "next", "lint"];
const res = spawnSync(runner, args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (res.status === 0) {
  process.exit(0);
}

console.error("next lint failed — falling back to eslint directly");

// Fallback: run eslint directly to provide consistent linting across platforms
const eslintArgs = ["--yes", "eslint", ".", "--ext", ".ts,.tsx,.js,.jsx"];
const res2 = spawnSync(runner, eslintArgs, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(res2.status ?? 1);
