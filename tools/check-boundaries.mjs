import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function checkBoundaries(root=process.cwd()) {
  const source=path.join(root,'src');
  const files=fs.readdirSync(source,{recursive:true}).filter(file=>/\.(ts|tsx)$/.test(file));
  const failures=[];
  const inside=(file,directory)=>file===directory||file.startsWith(directory+path.sep);
  for(const file of files){
    const from=path.join(source,file),text=fs.readFileSync(from,'utf8');
    for(const [,specifier] of text.matchAll(/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g)){
      if(['recoil','react-beautiful-dnd'].includes(specifier))failures.push(`${file}: retired dependency ${specifier}`);
      const alias=/^(app|features|shared|test)\//.test(specifier);
      if(!alias&&!specifier.startsWith('.'))continue;
      const target=alias?path.resolve(source,specifier):path.resolve(path.dirname(from),specifier);
      const feature=inside(target,path.join(source,'features')),app=inside(target,path.join(source,'app'));
      if(inside(from,path.join(source,'shared'))&&(feature||app))failures.push(`${file}: infrastructure depends on feature/app ${specifier}`);
      if(inside(from,path.join(source,'features'))&&app)failures.push(`${file}: feature depends on application wiring ${specifier}`);
      if(![target,target+'.ts',target+'.tsx',target+'.d.ts',path.join(target,'index.ts'),path.join(target,'index.tsx')].some(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile()))failures.push(`${file}: unresolved ${specifier}`);
    }
  }
  return {files:files.length,failures};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=checkBoundaries();
  if(result.failures.length){console.error(result.failures.join('\n'));process.exitCode=1;}
  else console.log(`Feature boundaries/import paths: ${result.files} files checked`);
}
