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

function fixCatch(content) {
  return content.replace(/catch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g, (m, v) => {
    if (v.startsWith('_')) return m; // already prefixed
    return `catch (_${v})`;
  });
}

async function main() {
  const targetDirs = ['src', 'scripts'];
  for (const d of targetDirs) {
    try {
      const dirPath = join(root, d);
      const files = await walk(dirPath);
      for (const f of files) {
        let c = await fs.readFile(f, 'utf8');
        const updated = fixCatch(c);
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
