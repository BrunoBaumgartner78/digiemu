import { promises as fs } from 'fs';
import { join } from 'path';

const root = process.cwd();
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      files.push(...await walk(p));
    } else if (exts.some(s => p.endsWith(s))) {
      files.push(p);
    }
  }
  return files;
}

function replaceAny(content) {
  let out = content;
  // : any -> : unknown
  out = out.replace(/:\s*any\b/g, ': unknown');
  // Record<string, any> -> Record<string, unknown>
  out = out.replace(/Record<\s*string\s*,\s*any\s*>/g, 'Record<string, unknown>');
  // as any -> as unknown
  out = out.replace(/\bas any\b/g, 'as unknown');
  return out;
}

async function main() {
  const targetDirs = ['src', 'scripts'];
  for (const d of targetDirs) {
    try {
      const dirPath = join(root, d);
      const files = await walk(dirPath);
      for (const f of files) {
        let c = await fs.readFile(f, 'utf8');
        const updated = replaceAny(c);
        if (updated !== c) {
          await fs.writeFile(f, updated, 'utf8');
          console.log('patched', f);
        }
      }
    } catch (err) {
      // ignore missing folders
    }
  }
}

main().catch(e => { console.error(e); process.exit(2); });
