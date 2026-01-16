import fs from 'fs';
import path from 'path';

const report = 'reports/v2.8.1-broken-e-target-hits.txt';
if(!fs.existsSync(report)){
  console.log('no report file');
  process.exit(0);
}
const files = fs.readFileSync(report,'utf8').split(/\r?\n/).filter(Boolean);
let patched = 0;
for(const p of files){
  try{
    const s = fs.readFileSync(p,'utf8');
    const s2 = s.replace(/([^_])\be\.target\b/g,'$1_e.target');
    if(s2 !== s){
      fs.writeFileSync(p,s2,'utf8');
      console.log('patched',p);
      patched++;
    }
  }catch(e){
    console.error('err',p,e.message);
  }
}
console.log('patched count',patched);
