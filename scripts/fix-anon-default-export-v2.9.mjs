import fs from "fs";
import path from "path";

const exts = new Set([".ts",".tsx",".js",".jsx"]);
function walk(d){
  let out=[];
  for(const ent of fs.readdirSync(d,{withFileTypes:true})){
    const p=path.join(d, ent.name);
    if(ent.isDirectory()) out.push(...walk(p));
    else if(ent.isFile() && exts.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

function pascalFromFile(f){
  const base = path.basename(f).replace(/\.(ts|tsx|js|jsx)$/,"");
  const cleaned = base.replace(/[^a-zA-Z0-9]+/g," ").trim().split(/\s+/).map(w=>w? w[0].toUpperCase()+w.slice(1):"").join("");
  return cleaned || "DefaultExport";
}

// match: export default { ... } (single object literal) with optional semicolon at EOF
const re = /export\s+default\s+\{\s*([\s\S]*?)\s*\}\s*;?\s*$/m;

let changed=[];
for(const root of ["src"]) {
  if(!fs.existsSync(root)) continue;
  for(const f of walk(root)){
    let s = fs.readFileSync(f,"utf8");
    if(!s.includes("export default")) continue;
    const m = s.match(re);
    if(!m) continue;
    const name = pascalFromFile(f) + "Default";
    const replacement = `const ${name} = {\n${m[1]}\n};\n\nexport default ${name};\n`;
    const next = s.replace(re, replacement);
    if(next !== s){
      fs.writeFileSync(f, next, "utf8");
      changed.push(f);
    }
  }
}

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/v2.9-anon-default-changed.txt", changed.join("\n") + (changed.length? "\n":""), "utf8");
console.log("v2.9 anon-default changed files:", changed.length);
