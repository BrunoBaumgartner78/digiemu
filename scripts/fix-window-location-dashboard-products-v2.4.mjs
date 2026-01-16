#!/usr/bin/env node
// scripts/fix-window-location-dashboard-products-v2.4.mjs
// Replaces window.location.href = "/dashboard/products..." with router.push("...").
// Ensures `useRouter` import, router instance, and "use client" when needed.
import fs from "node:fs";
import path from "node:path";

const exts = new Set([".ts",".tsx",".js",".jsx"]);
const roots = ["src/app","src/components","src/hooks"].filter((p)=>fs.existsSync(p));

function walk(dir){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) out.push(...walk(p));
    else if(ent.isFile() && exts.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

const files = roots.flatMap(w=>walk(w));
const changedFiles = [];
const NEEDLE = "/dashboard/products";

function ensureUseClient(src){
  if(/^\s*['"]use client['"];\s*$/m.test(src)) return src;
  return `"use client";\n\n${src}`;
}

function ensureUseRouterImport(src){
  if(/from\s+['"]next\/navigation['"]/.test(src) && /\buseRouter\b/.test(src)) return src;
  const navImport = /import\s+\{([^}]+)\}\s+from\s+['"]next\/navigation['"];?/;
  if(navImport.test(src)){
    return src.replace(navImport,(m,inner)=>{
      const parts = inner.split(",").map(s=>s.trim()).filter(Boolean);
      if(!parts.includes("useRouter")) parts.push("useRouter");
      return `import { ${parts.join(", ")} } from "next/navigation";`;
    });
  }
  const lines=src.split(/\r?\n/);
  const useClientIdx = lines.findIndex(l=>/^\s*['"]use client['"];\s*$/.test(l));
  const insertAt = useClientIdx>=0? useClientIdx+1 : 0;
  lines.splice(insertAt,0,`import { useRouter } from "next/navigation";`);
  return lines.join("\n");
}

function ensureRouterInstance(src){
  if(/\bconst\s+router\s*=\s*useRouter\(\)\s*;/.test(src)) return src;
  const fnOpen = /(export\s+default\s+)?function\s+\w*\s*\([^)]*\)\s*\{/;
  if(fnOpen.test(src)){
    return src.replace(fnOpen,(m)=>`${m}\n  const router = useRouter();`);
  }
  const arrowOpen = /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/;
  if(arrowOpen.test(src)){
    return src.replace(arrowOpen,(m)=>`${m}\n  const router = useRouter();`);
  }
  return src;
}

function fixWindowLocation(src){
  if(!src.includes("window.location")) return { out: src, changed:false };
  if(!src.includes(NEEDLE)) return { out: src, changed:false };
  const re = /window\.location\.href\s*=\s*([^;]+);/g;
  let touched=false;
  const out1 = src.replace(re,(full,rhs)=>{
    const expr = String(rhs).trim();
    if(!expr.includes(NEEDLE)) return full;
    touched=true;
    return `router.push(${expr});`;
  });
  if(!touched) return { out: src, changed:false };
  let out = out1;
  out = ensureUseClient(out);
  out = ensureUseRouterImport(out);
  const outWithRouter = ensureRouterInstance(out);
  if(outWithRouter === out && !/\bconst\s+router\s*=\s*useRouter\(\)\s*;/.test(out)){
    return { out: src, changed:false };
  }
  out = outWithRouter;
  return { out, changed:true };
}

for(const f of files){
  try{
    const src = fs.readFileSync(f,'utf8');
    if(!src.includes('window.location') || !src.includes(NEEDLE)) continue;
    const { out, changed } = fixWindowLocation(src);
    if(!changed) continue;
    fs.writeFileSync(f,out,'utf8');
    changedFiles.push(f);
  }catch(e){console.error('err',f,e.message||e)}
}
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/v2.4-changed-files.txt', changedFiles.join('\n')+'\n','utf8');
console.log('Changed files:', changedFiles.length);
