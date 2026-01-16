#!/usr/bin/env node
// scripts/scan-window-location-v2.4.mjs
import fs from 'node:fs';
import path from 'node:path';
const exts = new Set(['.ts','.tsx','.js','.jsx']);
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()) out.push(...walk(p)); else if(e.isFile() && exts.has(path.extname(e.name))) out.push(p);}return out}
const roots=['src/app','src/components','src/hooks'].filter(p=>fs.existsSync(p));
const files=roots.flatMap(w=>walk(w));
const needle1='window.location';
const needle2='/dashboard/products';
const hits=[];
for(const f of files){try{const s=fs.readFileSync(f,'utf8'); if(!s.includes(needle1) || !s.includes(needle2)) continue; const lines=s.split(/\r?\n/); for(let i=0;i<lines.length;i++){const ln=lines[i]; if(ln.includes('window.location') && ln.includes('/dashboard/products')) hits.push(`${f}:${i+1}: ${ln.trim()}`); }}catch{/*ignore*/}}
if(!fs.existsSync('reports')) fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/v2.4-window-location-hits.txt', hits.join('\n')+'\n','utf8');
console.log('hits:', hits.length);
