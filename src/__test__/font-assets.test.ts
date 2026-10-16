import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");
const root = "src/shared/assets/fonts";
const sources = JSON.parse(read(`${root}/SOURCES.json`)) as {
  geist: { version: string; fontSource: string };
  pretendard: { version: string; baseSource: string };
  files: { path: string; bytes: number; sha256: string }[];
};
it("ships unchanged pinned official WOFF2 assets and both distribution licenses", () => {
  expect(sources.geist.version).toBe("1.7.2");
  expect(sources.pretendard.version).toBe("1.3.9");
  expect(sources.geist.fontSource).toContain("/vercel/geist-font/v1.7.2/");
  expect(sources.pretendard.baseSource).toContain(
    "/orioncactus/pretendard/v1.3.9/",
  );
  expect(
    sources.files.filter((file) => file.path.endsWith(".woff2")),
  ).toHaveLength(93);
  for (const file of sources.files) {
    const bytes = readFileSync(resolve(process.cwd(), file.path));
    expect(bytes.byteLength, file.path).toBe(file.bytes);
    expect(createHash("sha256").update(bytes).digest("hex"), file.path).toBe(
      file.sha256,
    );
    if (file.path.endsWith(".woff2")) {
      expect(bytes.subarray(0, 4).toString()).toBe("wOF2");
      expect(bytes.readUInt32BE(8)).toBe(bytes.byteLength);
    }
  }
  for (const name of ["geist-v1.7.2.txt", "pretendard-v1.3.9.txt"]) {
    const license = read(`public/licenses/fonts/${name}`);
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(license).toContain("Copyright");
  }
});
it("preserves variable weights and all dynamic unicode subsets without external font requests", () => {
  const css = read(`${root}/pretendard/pretendardvariable-dynamic-subset.css`);
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((match) => match[1]);
  expect(urls).toHaveLength(92);
  expect(css.match(/font-weight:\s*45 920/g)).toHaveLength(92);
  expect(css.match(/font-display:\s*swap/g)).toHaveLength(92);
  expect(css.match(/unicode-range:/g)).toHaveLength(92);
  for (const url of urls) {
    expect(url).toMatch(
      /^\.\/woff2-dynamic-subset\/PretendardVariable\.subset\.\d+\.woff2$/,
    );
    expect(
      sources.files.some(
        (file) => file.path === `${root}/pretendard/${url.slice(2)}`,
      ),
    ).toBe(true);
  }
  const ownCSS = read("src/shared/ui/fonts.css");
  expect(ownCSS).toMatch(/font-family:\s*"Geist Sans"/);
  expect(ownCSS).toMatch(/font-weight:\s*100 900/);
  expect(ownCSS).toMatch(/font-display:\s*swap/);
  expect(ownCSS).not.toMatch(/local\(|url\(["']?https?:/);
  expect(read("src/shared/ui/electric-night.scss")).toMatch(
    /--font:\s*"Geist Sans", "Pretendard Variable", system-ui/,
  );
  expect(read("index.html")).toContain("font-src 'self';");
  expect(read("src/main.tsx")).toContain("./shared/ui/fonts.css");
  expect(read(".storybook/preview.js")).toContain("../src/shared/ui/fonts.css");
});
