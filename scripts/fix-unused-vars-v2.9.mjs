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

// conservative renames (only exact single identifiers in common patterns)
const rules = [
  { re: /catch\s*\(\s*e\s*\)/g, rep: 'catch (_e)' },
  { re: /catch\s*\(\s*err\s*\)/g, rep: 'catch (_err)' },

  { re: /\(\s*e\s*\)\s*=>/g, rep: '(_e) =>' },
  { re: /\(\s*err\s*\)\s*=>/g, rep: '(_err) =>' },

  { re: /\(\s*req\s*:\s*Request\s*\)/g, rep: '(_req: Request)' },
  { re: /\(\s*res\s*:\s*Response\s*\)/g, rep: '(_res: Response)' },
  { re: /\(\s*req\s*:\s*any\s*\)/g, rep: '(_req: any)' },
  { re: /\(\s*res\s*:\s*any\s*\)/g, rep: '(_res: any)' },
];

let changed=[];
for(const root of ["src"]){
  if(!fs.existsSync(root)) continue;
  for(const f of walk(root)){
    let s = fs.readFileSync(f,"utf8");
    let next = s;
    for(const r of rules) next = next.replace(r.re, r.rep);
    if(next !== s){
      fs.writeFileSync(f, next, "utf8");
      changed.push(f);
    }
  }
}

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/v2.9-unused-rename-changed.txt", changed.join("\n") + (changed.length? "\n":""), "utf8");
console.log("v2.9 unused-rename changed files:", changed.length);
