import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

const ymlPath = path.join(process.cwd(), "config", "branding.yml");
const outPath = path.join(process.cwd(), "src", "lib", "branding", "config.ts");

if (!fs.existsSync(ymlPath)) {
  console.error("❌ Missing file:", ymlPath);
  process.exit(1);
}

const raw = fs.readFileSync(ymlPath, "utf8");
const cfg = yaml.parse(raw);

const content = `/* eslint-disable */
// AUTO-GENERATED FILE — DO NOT EDIT MANUALLY.
// Source: config/branding.yml
// Run: npm run gen:branding

export const brandingConfig = ${JSON.stringify(cfg, null, 2)} as const;
export type BrandingConfig = typeof brandingConfig;
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, "utf8");

console.log("✅ generated:", outPath);
