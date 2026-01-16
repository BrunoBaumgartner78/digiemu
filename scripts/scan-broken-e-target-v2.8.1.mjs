import fs from 'fs';
import path from 'path';

const root = process.cwd();
const exts = new Set(['.ts','.tsx']);
const hits = [];

function walk(dir){
  for(const name of fs.readdirSync(dir,{withFileTypes:true})){
    const p = path.join(dir,name.name);
    if(name.isDirectory()){
      if(name.name === 'node_modules' || name.name === '.git') continue;
      walk(p);
    } else if(name.isFile() && exts.has(path.extname(name.name))){
      try{
        const txt = fs.readFileSync(p,'utf8');
        const re = /on(?:Change|Input)\s*=\s*\{\(\s*_e\s*\)\s*=>[\s\S]*?\be\.target\b/;
        if(re.test(txt)) hits.push(p);
      }catch(e){}
    }
  }
}

if(fs.existsSync(path.join(root,'src'))){
  walk(path.join(root,'src'));
}

fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/v2.8.1-broken-e-target-hits.txt', hits.sort().join('\n') + (hits.length? '\n':''),'utf8');
console.log('hits:', hits.length);
