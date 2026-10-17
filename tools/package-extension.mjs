import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { crc32, deflateRawSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const runtimeFiles = Object.freeze([
  "app-bridge.js", "background.js", "config.js", "content.css", "content.js", "manifest.json",
  "popup.css", "popup.html", "popup.js", "protocol.js", "updates.js",
]);

/** Reproducible ZIP: explicit runtime allowlist, fixed DOS timestamp, no machine paths. */
export function createExtensionArchive(directory = join(root, "extension"), appUrl) {
  const localEntries = [], centralEntries = [];
  let offset = 0;
  for (const file of runtimeFiles) {
    const name = Buffer.from(`loopy-extension/${file}`, "utf8");
    let data = readFileSync(join(directory, file));
    if (appUrl && file === "config.js") data = Buffer.from(
      `export const APP_URL = ${JSON.stringify(appUrl)};\n`+
      `export const APP_PATTERNS = ["https://loopy.bearsharks.dev/*", "http://localhost/*", "http://127.0.0.1/*"];\n`+
      `export const LOCAL_ORIGINS = ["http://127.0.0.1:4187", "http://localhost:4187", "http://localhost:5173", "http://127.0.0.1:5173"];\n`);
    if (appUrl && file === "manifest.json") {
      const manifest = JSON.parse(data);
      manifest.host_permissions.push("http://localhost/*", "http://127.0.0.1/*");
      manifest.externally_connectable.matches.push("http://localhost/*", "http://127.0.0.1/*");
      manifest.content_scripts.find(script=>script.js.includes("app-bridge.js")).matches.push("http://localhost/*", "http://127.0.0.1/*");
      data = Buffer.from(JSON.stringify(manifest, null, 2)+"\n");
    }
    const compressed = deflateRawSync(data, { level: 9 });
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8
    local.writeUInt16LE(8, 8); // DEFLATE
    local.writeUInt16LE(33, 12); // 1980-01-01
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localEntries.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralEntries.push(central, name);
    offset += local.length + name.length + compressed.length;
  }
  const central = Buffer.concat(centralEntries);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(runtimeFiles.length, 8);
  end.writeUInt16LE(runtimeFiles.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localEntries, central, end]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const release = process.argv.includes("--release");
  const output = release ? join(root, "artifacts", "loopy-extension.zip") : join(root, "public", "downloads", "loopy-extension.zip");
  const zip = createExtensionArchive(undefined, release ? undefined : "http://127.0.0.1:4187/simple-music-player/");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, zip);
  if(release){const publicFile=join(root,"public","downloads","loopy-extension.zip");mkdirSync(dirname(publicFile),{recursive:true});writeFileSync(publicFile,zip);}
  console.log(`Extension ZIP: ${release ? "artifacts" : "public/downloads"}/loopy-extension.zip (${runtimeFiles.length} files, ${zip.length} bytes)`);
}
