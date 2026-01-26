#!/usr/bin/env node
import fs from "fs";
import path from "path";
import postcss from "postcss";

function processFile(file) {
  const css = fs.readFileSync(file, 'utf8');
  const root = postcss.parse(css, { from: file });
  let changed = false;

  root.walkAtRules('media', (atRule) => {
    const params = atRule.params || '';
    const isDark = /prefers-color-scheme\s*:\s*dark/i.test(params);
    const isLight = /prefers-color-scheme\s*:\s*light/i.test(params);
    if (!isDark && !isLight) return;

    const prefix = isDark
      ? ['html[data-theme="dark"]', 'html.dark']
      : ['html[data-theme="light"]', 'html.light'];

    atRule.walkRules((rule) => {
      // skip keyframes or other nested at-rules
      if (rule.parent && rule.parent.type === 'atrule') {
        // build prefixed selector list
        const selectors = rule.selector.split(',').map(s => s.trim());
        const prefixed = prefix
          .map(p => selectors.map(sel => `${p} ${sel}`).join(', '))
          .join(', ');
        const newRule = postcss.rule({ selector: prefixed, raws: rule.raws });
        rule.walkDecls((d) => newRule.append(d.clone()));
        root.insertAfter(atRule, newRule);
        changed = true;
      }
    });

    // remove the original atRule
    atRule.remove();
  });

  if (changed) {
    fs.writeFileSync(file, root.toString());
    console.log('Converted:', file);
  }
}

function walk(dir, files=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const res = path.resolve(dir, e.name);
    if (e.isDirectory()) walk(res, files);
    else if (e.isFile() && (res.endsWith('.css') || res.endsWith('.scss'))) files.push(res);
  }
  return files;
}

const files = walk(path.resolve(process.cwd(), 'src'));
files.forEach(processFile);
console.log('Done');
