import { promises as fs } from 'fs';
import { join } from 'path';

const root = process.cwd();
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
let counter = 1;

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

function fixAnonExport(content, name) {
  // conservative: only handle `export default {` (object literal)
  if (!/export\s+default\s*\{/.test(content)) return null;
  const replaced = content.replace(/export\s+default\s*\{/g, `const ${name} = {`);
  // append default export at end if not already present
  const withExport = replaced + `\n\nexport default ${name};\n`;
  return withExport;
}

async function main() {
  const targetDirs = ['src', 'scripts'];
  for (const d of targetDirs) {
    try {
      const dirPath = join(root, d);
      const files = await walk(dirPath);
      for (const f of files) {
        let c = await fs.readFile(f, 'utf8');
        const name = `__anonDefault_${counter++}`;
        const updated = fixAnonExport(c, name);
        if (updated) {
          await fs.writeFile(f, updated, 'utf8');
          console.log('patched anon export in', f);
        }
      }
    } catch (err) {
      // ignore missing folders
    }
  }
}

main().catch(e => { console.error(e); process.exit(2); });
