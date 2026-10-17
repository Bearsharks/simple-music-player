import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {checkBoundaries} from './check-boundaries.mjs';
test('checks alias and relative layer boundaries while allowing app composition',()=>{
  const root=mkdtempSync(join(tmpdir(),'boundary-check-'));
  const write=(file,text)=>{mkdirSync(dirname(join(root,file)),{recursive:true});writeFileSync(join(root,file),text);};
  try{
    write('src/features/music/index.ts','export const music=1;');
    write('src/app/App.ts',"import {music} from 'features/music';");
    write('src/shared/valid.ts','export const valid=1;');
    assert.deepEqual(checkBoundaries(root).failures,[]);
    write('src/shared/bad.ts',"import {music} from '../features/music'; import {music as alias} from 'features/music';");
    write('src/features/music/bad.ts',"import '../../app/App'; import './missing';");
    const failures=checkBoundaries(root).failures;
    assert.equal(failures.filter(f=>f.includes('infrastructure depends')).length,2);
    assert.equal(failures.filter(f=>f.includes('application wiring')).length,1);
    assert.equal(failures.filter(f=>f.includes('unresolved')).length,1);
  }finally{rmSync(root,{recursive:true,force:true});}
});
