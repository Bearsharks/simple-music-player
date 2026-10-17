import { readFileSync, writeFileSync, readdirSync, lstatSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createExtensionArchive } from "./package-extension.mjs";

export const REPOSITORY = "Bearsharks/loop-yt-player";
export const ORIGIN = "https://loopy.bearsharks.dev";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const run = (command,args,options={}) => execFileSync(command,args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"],...options}).trim();
const gh = args => run("gh",args);
const git = (...args) => run("git",args);
export function fileHashes(directory) {
  const result={};
  function visit(folder) {
    for(const name of readdirSync(folder).sort()) {
      if(name===".git")continue;
      const file=join(folder,name),stat=lstatSync(file),key=relative(directory,file).split("\\").join("/");
      if(stat.isSymbolicLink())throw Error(`Symlinks are not release files: ${key}`);
      if(stat.isDirectory())visit(file);
      else if(stat.isFile()&&key!=="release.json")result[key]=hash(readFileSync(file));
      else if(!stat.isFile())throw Error(`Unsupported release file: ${key}`);
    }
  }
  visit(directory);return result;
}
export function sealRelease(directory,{sourceCommit,extensionVersion,nodeVersion,lockHash}) {
  if(!/^[a-f0-9]{40}$/.test(sourceCommit)||!/^\d+\.\d+\.\d+$/.test(extensionVersion))throw Error("A full source SHA and numeric extension version are required");
  if(readFileSync(join(directory,"CNAME"),"utf8").trim()!==new URL(ORIGIN).hostname)throw Error("Unexpected production domain");
  const index=readFileSync(join(directory,"index.html"),"utf8");
  if(!index.includes('src="/assets/')||index.includes('/simple-music-player/assets/'))throw Error("Release must be built for the domain root");
  const files=fileHashes(directory);
  if(!files[".nojekyll"]||!files["downloads/loopy-extension.zip"])throw Error("Incomplete release");
  const manifest={format:1,sourceCommit,extensionVersion,nodeVersion,lockHash,domain:new URL(ORIGIN).hostname,files};
  writeFileSync(join(directory,"release.json"),JSON.stringify(manifest,null,2)+"\n");return manifest;
}
export function verifyRelease(directory) {
  const manifest=JSON.parse(readFileSync(join(directory,"release.json"),"utf8"));
  if(manifest.format!==1||manifest.domain!==new URL(ORIGIN).hostname||!manifest.files||
     !/^[a-f0-9]{40}$/.test(manifest.sourceCommit)||!/^\d+\.\d+\.\d+$/.test(manifest.extensionVersion))throw Error("Invalid release manifest");
  if(JSON.stringify(fileHashes(directory))!==JSON.stringify(manifest.files))throw Error("Release bytes differ from the sealed manifest");
  return manifest;
}
export function assertPublishTarget(manifest,mainSHA,existingRelease) {
  if(manifest.sourceCommit!==mainSHA)throw Error("Only the current main SHA can be published");
  if(existingRelease&&(!/^[a-f0-9]{40}$/.test(existingRelease.sourceCommit)||
     !/^[a-f0-9]{64}$/.test(existingRelease.zipHash)||existingRelease.zipHash!==manifest.files?.["downloads/loopy-extension.zip"]))
    throw Error("Published extension bytes differ; choose a new version");
}
function assertCheckout(sourceCommit) {
  if(git("rev-parse","HEAD")!==sourceCommit||git("status","--porcelain"))throw Error("Publishing requires a clean checkout of the recorded source SHA");
  const pinned=readFileSync(join(root,".node-version"),"utf8").trim();
  if(process.versions.node!==pinned)throw Error(`Use Node ${pinned}`);
}
function releaseInfo(tag) {
  const result=spawnSync("gh",["api",`repos/${REPOSITORY}/releases/tags/${tag}`],{encoding:"utf8"});
  let body;try{body=JSON.parse(result.stdout);}catch{throw Error("Cannot read GitHub release metadata");}
  if(result.status===0)return body;
  if(String(body.status)==="404")return null;
  throw Error("GitHub release lookup failed; publication stopped");
}
export async function verifySite(manifest,fetcher=(url)=>fetch(url,{signal:AbortSignal.timeout(15000)})) {
  const response=await fetcher(`${ORIGIN}/release.json?release=${manifest.sourceCommit}`);
  if(!response.ok)throw Error("Published release manifest unavailable");
  if(JSON.stringify(await response.json())!==JSON.stringify(manifest))throw Error("Published release manifest differs");
  const entries=Object.entries(manifest.files);let next=0;
  await Promise.all(Array.from({length:6},async()=>{
    while(next<entries.length){
      const [path,expected]=entries[next++];
      if(path.startsWith("/")||path.split("/").includes(".."))throw Error("Invalid asset path");
      const result=await fetcher(`${ORIGIN}/${path}?release=${manifest.sourceCommit}`);
      if(!result.ok||hash(Buffer.from(await result.arrayBuffer()))!==expected)throw Error(`Published bytes differ: ${path}`);
    }
  }));
}
async function publish(directory) {
  const manifest=verifyRelease(directory);assertCheckout(manifest.sourceCommit);
  if(manifest.files["downloads/loopy-extension.zip"]!==hash(createExtensionArchive()))throw Error("Extension is not the production archive for this source");
  if(hash(readFileSync(join(root,"package-lock.json")))!==manifest.lockHash)throw Error("Lockfile provenance differs");
  const mainSHA=gh(["api",`repos/${REPOSITORY}/commits/main`,"--jq",".sha"]);
  const tag=`v${manifest.extensionVersion}`,release=releaseInfo(tag);
  const releaseSHA=release?gh(["api",`repos/${REPOSITORY}/commits/${tag}`,"--jq",".sha"]):null;
  assertPublishTarget(manifest,mainSHA,null);
  const temp=mkdtempSync(join(tmpdir(),"loopy-release-"));
  try {
    const zip=join(directory,"downloads/loopy-extension.zip"),expected=manifest.files["downloads/loopy-extension.zip"];
    if(release){
      if(release.draft||release.prerelease||release.assets.filter(asset=>asset.name==="loopy-extension.zip").length!==1)throw Error("Existing release is not a complete public release");
      gh(["release","download",tag,"--repo",REPOSITORY,"--pattern","loopy-extension.zip","--dir",temp]);
      assertPublishTarget(manifest,mainSHA,{sourceCommit:releaseSHA,zipHash:hash(readFileSync(join(temp,"loopy-extension.zip")))});
      console.log(`Reusing extension ${tag} from ${releaseSHA}; ZIP SHA-256 ${expected}`);
    }
    // The existing Pages source/domain is a protected deployment contract.
    const pages=JSON.parse(gh(["api",`repos/${REPOSITORY}/pages`]));
    if(pages.cname!==new URL(ORIGIN).hostname||pages.source?.branch!=="gh-pages"||pages.source?.path!=="/")throw Error("Unexpected Pages configuration");
    git("fetch","origin","gh-pages");
    if(git("show","origin/gh-pages:CNAME").trim()!==manifest.domain)throw Error("Published CNAME differs");
    if(!release)gh(["release","create",tag,zip,"--repo",REPOSITORY,"--target",manifest.sourceCommit,"--title",`Loopy ${tag}`,"--notes",`Source: ${manifest.sourceCommit}\nExtension SHA-256: ${expected}\nProduction: ${ORIGIN}/`]);
    const worktree=join(temp,"pages");git("worktree","add","--detach",worktree,"origin/gh-pages");
    try {
      // Copy only the sealed artifact. No build command runs in the publishing step.
      run("rsync",["-a","--delete","--exclude=.git",`${resolve(directory)}/`,`${worktree}/`]);
      verifyRelease(worktree);
      run("git",["add","-A"],{cwd:worktree});
      if(run("git",["status","--porcelain"],{cwd:worktree})){
        run("git",["-c","user.name=github-actions[bot]","-c","user.email=41898282+github-actions[bot]@users.noreply.github.com","commit","-m",`deploy: ${manifest.sourceCommit}`],{cwd:worktree});
        run("git",["push","origin","HEAD:gh-pages"],{cwd:worktree});
      }
      const deploymentSHA=run("git",["rev-parse","HEAD"],{cwd:worktree});
      // Actions-token pushes do not implicitly start another Actions workflow.
      gh(["api","--method","POST",`repos/${REPOSITORY}/pages/builds`]);
      let lastError;
      for(let attempt=0;attempt<60;attempt++){
        const build=JSON.parse(gh(["api",`repos/${REPOSITORY}/pages/builds/latest`]));
        if(build.commit===deploymentSHA&&build.status==="errored")throw Error("Pages build failed");
        if(build.commit===deploymentSHA&&build.status==="built"){
          try {await verifySite(manifest);console.log(`Published ${manifest.sourceCommit} / ${tag} / ${deploymentSHA}`);return;}
          catch(error){lastError=error;}
        }
        await new Promise(resolve=>setTimeout(resolve,10000));
      }
      throw Error(`Pages build was not verified within 10 minutes${lastError?`: ${lastError.message}`:""}`);
    } finally {git("worktree","remove","--force",worktree);}
  } finally {rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const command=process.argv[2],directory=resolve(process.argv[3]||join(root,"dist"));
  if(command==="seal"){
    const sourceCommit=git("rev-parse","HEAD");assertCheckout(sourceCommit);
    const extensionVersion=JSON.parse(readFileSync(join(root,"extension/manifest.json"),"utf8")).version;
    if(hash(readFileSync(join(directory,"downloads/loopy-extension.zip")))!==hash(createExtensionArchive()))throw Error("Web download must contain the production extension for this source");
    sealRelease(directory,{sourceCommit,extensionVersion,nodeVersion:process.versions.node,lockHash:hash(readFileSync(join(root,"package-lock.json")))});
    console.log(`Sealed ${sourceCommit} / v${extensionVersion}`);
  }else if(command==="verify") {const manifest=verifyRelease(directory);console.log(`Verified ${manifest.sourceCommit}`);}
  else if(command==="verify-site")await verifySite(verifyRelease(directory));
  else if(command==="publish")await publish(directory);
  else throw Error("Usage: node tools/release.mjs seal|verify|verify-site|publish [directory]");
}
