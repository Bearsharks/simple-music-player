import fs from 'node:fs';
import path from 'node:path';
const files = fs.readdirSync('src', {recursive:true}).filter(f=>/\.(ts|tsx)$/.test(f));
const failures=[];
for (const file of files) {
 const text=fs.readFileSync(path.join('src',file),'utf8');
 for (const [,specifier] of text.matchAll(/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g)) {
  if (specifier === 'recoil' || specifier === 'react-beautiful-dnd') failures.push(`${file}: retired dependency ${specifier}`);
  if (file.startsWith('shared/') && /^(features|app)\//.test(specifier)) failures.push(`${file}: infrastructure depends on feature ${specifier}`);
  if (/^(app|features|shared|test)\//.test(specifier)) {
   const p=path.join('src',specifier);
   if (![p,p+'.ts',p+'.tsx',p+'/index.ts'].some(p=>fs.existsSync(p))) failures.push(`${file}: unresolved ${specifier}`);
  }
 }
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Feature boundaries/import paths: ${files.length} files checked`);
