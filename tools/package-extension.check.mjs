import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32, inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { createExtensionArchive, runtimeFiles } from "./package-extension.mjs";

test("extension-only ZIP is reproducible and contains exact runtime bytes under one installable folder", () => {
  const zip = createExtensionArchive();
  assert.deepEqual(zip, createExtensionArchive());
  let offset = 0;
  const names = [];
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const size = zip.readUInt32LE(offset + 18);
    const name = zip.toString("utf8", offset + 30, offset + 30 + nameLength);
    const start = offset + 30 + nameLength + extraLength;
    const content = inflateRawSync(zip.subarray(start, start + size));
    assert.equal(crc32(content), zip.readUInt32LE(offset + 14));
    assert.equal(content.length, zip.readUInt32LE(offset + 22));
    const file = name.replace(/^loopy-extension\//, "");
    assert.ok(runtimeFiles.includes(file));
    assert.deepEqual(content, readFileSync(new URL(`../extension/${file}`, import.meta.url)));
    assert.doesNotMatch(content.toString(), /localhost|127\.0\.0\.1|\[::1\]/);
    if (file === "manifest.json") assert.equal(JSON.parse(content).manifest_version, 3);
    names.push(name);
    offset = start + size;
  }
  assert.deepEqual(names, runtimeFiles.map(file => `loopy-extension/${file}`));
  assert.equal(zip.readUInt32LE(offset), 0x02014b50);
  assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054b50);
  assert.equal(zip.readUInt32LE(zip.length - 6), offset);
});

test("development ZIP uses its fixed local app address without changing the source/release configuration", () => {
  const local = "http://127.0.0.1:4187/simple-music-player/";
  const zip = createExtensionArchive(undefined, local);
  let offset = 0, config = "";
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const nameLength = zip.readUInt16LE(offset + 26);
    const size = zip.readUInt32LE(offset + 18);
    const name = zip.toString("utf8", offset + 30, offset + 30 + nameLength);
    const start = offset + 30 + nameLength + zip.readUInt16LE(offset + 28);
    if (name === "loopy-extension/config.js") config = inflateRawSync(zip.subarray(start, start + size)).toString();
    offset = start + size;
  }
  assert.ok(config.includes(`export const APP_URL = ${JSON.stringify(local)};`));
  assert.ok(config.includes('export const LOCAL_ORIGINS = ["http://127.0.0.1:4187"'));
  assert.ok(readFileSync(new URL("../extension/config.js", import.meta.url), "utf8").includes("https://loopy.bearsharks.dev/"));
});
