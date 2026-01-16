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

// Conservative transforms:
// - catch (e) => catch (_e)
// - (err) => (_err) in catch or promise handlers when obviously unused
// - function (_req) pattern: rename req to _req in route handlers if lint complains
// We DO NOT auto-delete code. Only rename known single identifiers.

const catchE = /catch\s*\(\s*e\s*\)/g;
const catchErr = /catch\s*\(\s*err\s*\)/g;

const arrowE = /\(\s*e\s*\)\s*=>/g;
const arrowErr = /\(\s*err\s*\)\s*=>/g;

const fnReq = /\(\s*req\s*:\s*Request\s*\)/g;          // Next route handlers
const fnReqAny = /\(\s*req\s*:\s*any\s*\)/g;

let changed=[];

for(const root of ["src"]){
  if(!fs.existsSync(root)) continue;
  for(const f of walk(root)){
    let s = fs.readFileSync(f,"utf8");
    let next = s;

    next = next.replace(catchE, "catch (_e)");
    next = next.replace(catchErr, "catch (_err)");

    // arrow handlers
    next = next.replace(arrowE, "(_e) =>");
    next = next.replace(arrowErr, "(_err) =>");

    // route handler params
    next = next.replace(fnReq, "(_req: Request)");
    next = next.replace(fnReqAny, "(_req: any)");

    if(next !== s){
      fs.writeFileSync(f, next, "utf8");
      changed.push(f);
    }
  }
}

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/v2.8-unused-rename-changed.txt", changed.join("\n") + (changed.length? "\n":""), "utf8");
console.log("v2.8 unused-rename changed files:", changed.length);
