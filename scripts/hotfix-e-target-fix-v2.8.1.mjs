import fs from 'fs';
const p = 'src/app/(app)/admin/products/AdminProductStatusToggle.tsx';
try{
  let s = fs.readFileSync(p,'utf8');
  let s2 = s.replace(/const\s+nextStatus\s*=\s*e\.target\.value/g,'const nextStatus = _e.target.value')
            .replace(/([^_])\be\.target\b/g,'$1_e.target');
  if(s2 !== s){
    fs.writeFileSync(p,s2,'utf8');
    console.log('patched',p);
  } else {
    console.log('no changes',p);
  }
}catch(e){
  console.error('error',e.message);
  process.exit(2);
}
