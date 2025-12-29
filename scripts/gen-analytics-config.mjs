import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

const ymlPath = path.join(process.cwd(), "config", "analytics.yml");
const outPath = path.join(process.cwd(), "src", "lib", "analytics", "config.ts");

const raw = fs.readFileSync(ymlPath, "utf8");
const cfg = yaml.parse(raw);

const content = `// AUTO-GENERATED. Do not edit manually.
export const analyticsConfig = ${JSON.stringify(cfg, null, 2)} as const;
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, "utf8");

console.log("✅ generated:", outPath);
