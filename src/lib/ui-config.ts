import "server-only";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

type UiConfig = {
  badges?: {
    payoutStatus?: Record<
      string,
      {
        label: string;
        class: string;
      }
    >;
  };
};

let cache: UiConfig | null = null;

export function getUiConfig(): UiConfig {
  if (cache) return cache;

  const file = path.join(process.cwd(), "src/config/ui.yml");
  const raw = fs.readFileSync(file, "utf8");
  cache = yaml.parse(raw) as UiConfig;

  return cache;
}
