import fs from 'node:fs';
import path from 'node:path';
it('does not reintroduce retired icon-font dependencies or UI references',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 expect(pkg.dependencies['material-icons']).toBeUndefined();
 const files=fs.readdirSync('src',{recursive:true}).map(String).filter(f=>/\.(tsx?|s?css)$/.test(f)&&!f.includes('__test__'));
 for(const file of files) expect(fs.readFileSync(path.join('src',file),'utf8'),file).not.toMatch(/material-icons|Material Icons|OptionSelectorOpenState|OptionSelectorKind/);
});
