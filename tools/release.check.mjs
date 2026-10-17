import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,mkdirSync,rmSync,symlinkSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {sealRelease,verifyRelease,assertPublishTarget,verifySite,ORIGIN} from "./release.mjs";
const metadata={sourceCommit:"a".repeat(40),extensionVersion:"0.3.0",nodeVersion:"24.22.0",lockHash:"b".repeat(64)};
function fixture(run){const dir=mkdtempSync(join(tmpdir(),"release-check-"));try{
  mkdirSync(join(dir,"downloads"));writeFileSync(join(dir,"downloads/loopy-extension.zip"),"zip");
  writeFileSync(join(dir,"index.html"),'<script src="/assets/app.js"></script>');
  writeFileSync(join(dir,"CNAME"),"loopy.bearsharks.dev\n");writeFileSync(join(dir,".nojekyll"),"");
  return run(dir);
}finally{rmSync(dir,{recursive:true,force:true});}}
test("sealing is deterministic and verifies the complete file set",()=>fixture(dir=>{
  const first=sealRelease(dir,metadata);const bytes=readFileSync(join(dir,"release.json"));
  assert.deepEqual(sealRelease(dir,metadata),first);assert.deepEqual(readFileSync(join(dir,"release.json")),bytes);
  assert.deepEqual(verifyRelease(dir),first);
  writeFileSync(join(dir,"index.html"),"changed");assert.throws(()=>verifyRelease(dir),/differ/);
}));
test("rejects extra files, symlinks, subpath builds and the wrong domain",()=>fixture(dir=>{
  sealRelease(dir,metadata);writeFileSync(join(dir,"unexpected"),"extra");assert.throws(()=>verifyRelease(dir),/differ/);rmSync(join(dir,"unexpected"));
  symlinkSync(join(dir,"index.html"),join(dir,"link"));assert.throws(()=>verifyRelease(dir),/Symlinks/);rmSync(join(dir,"link"));
  writeFileSync(join(dir,"index.html"),'<script src="/simple-music-player/assets/app.js"></script>');assert.throws(()=>sealRelease(dir,metadata),/domain root/);
  writeFileSync(join(dir,"CNAME"),"other.example");assert.throws(()=>sealRelease(dir,metadata),/domain/);
}));
test("requires current main and refuses version reuse with different source",()=>{
  assert.doesNotThrow(()=>assertPublishTarget(metadata,metadata.sourceCommit,null));
  assert.doesNotThrow(()=>assertPublishTarget(metadata,metadata.sourceCommit,metadata.sourceCommit));
  assert.throws(()=>assertPublishTarget(metadata,"c".repeat(40),null),/main/);
  assert.throws(()=>assertPublishTarget(metadata,metadata.sourceCommit,"c".repeat(40)),/another commit/);
});
test("verifies every published asset and rejects changed remote bytes",async()=>{
  let manifest,files;
  fixture(dir=>{manifest=sealRelease(dir,metadata);files=Object.fromEntries(Object.keys(manifest.files).map(path=>[path,readFileSync(join(dir,path))]));});
  const fetcher=async url=>{
    const parsed=new URL(url);assert.equal(parsed.origin,ORIGIN);
    return parsed.pathname==="/release.json"?new Response(JSON.stringify(manifest)):new Response(files[parsed.pathname.slice(1)]);
  };
  await verifySite(manifest,fetcher);files["index.html"]=Buffer.from("wrong");await assert.rejects(()=>verifySite(manifest,fetcher),/index.html/);
});
