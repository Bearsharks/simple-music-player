import fs from "node:fs";
import { chromium, expect } from "@playwright/test";
import { installMediaSimulation } from "./media-simulation.mjs";

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
});
const base =
  process.env.TEST_URL || "http://127.0.0.1:4173/simple-music-player/";
const target = new URL(base).pathname === "/" ? "root" : "pages";
const widths = process.env.TEST_WIDTHS?.split(",").map(Number) || [
  320, 390, 768, 1024, 1199, 1200, 1440,
];
const failures = [];
const fontRecord = [];
fs.mkdirSync("test-results", { recursive: true });
const mixedName = "새벽의 파형 · Midnight City 02";
async function fits(page, label) {
  expect(
    await page.evaluate(() => ({
      document: document.documentElement.scrollWidth > innerWidth,
      main:
        document.querySelector(".studio-main").scrollWidth >
        document.querySelector(".studio-main").clientWidth,
    })),
    label,
  ).toEqual({ document: false, main: false });
}
async function renderedFonts(page, selector) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    expect(nodeId, `rendered-font target ${selector}`).toBeGreaterThan(0);
    return (await cdp.send("CSS.getPlatformFontsForNode", { nodeId })).fonts;
  } finally {
    await cdp.detach();
  }
}
try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
    });
    const page = await context.newPage();
    const errors = [];
    const failedFonts = [];
    const responses = [];
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });
    try {
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (
          ["error", "warning"].includes(message.type()) &&
          /font|Content Security Policy|CSP|OTS parsing/i.test(message.text())
        )
          errors.push(message.text());
      });
      page.on("requestfailed", (request) => {
        if (request.resourceType() === "font") failedFonts.push(request.url());
      });
      page.on("response", (response) => {
        if (response.request().resourceType() === "font")
          responses.push({ url: response.url(), status: response.status() });
      });
      await installMediaSimulation(page);
      await page.goto(base);
      await expect(
        page.getByRole("button", { name: "새 재생목록", exact: true }),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await page.evaluate(async () => {
        const request = indexedDB.open("simple-music-player-local-v1", 1);
        const db = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        await new Promise((resolve, reject) => {
          const tx = db.transaction("playlists", "readwrite");
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
          tx.objectStore("playlists").put({
            info: {
              id: "font-mixed",
              name: "새벽의 파형 · Midnight City 02",
              description:
                "차분한 새벽을 위한 음악 · A quiet mix for long nights 0123456789",
              createdAt: 1,
              itemCount: 2,
              thumbnails: [],
            },
            items: ["abcdefghijk", "lmnopqrstuv"].map((videoID, i) => ({
              videoID,
              name: `밤의 산책 ${i + 1} · A Very Long Mixed Korean English Song Title`,
              owner: "한글 아티스트 · English Artist 2026",
              query: "",
              thumbnail: "",
            })),
          });
        });
        db.close();
      });
      await page.reload();
      await expect(
        page.getByRole("button", { name: `${mixedName} 열기`, exact: true }),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const libraryFonts = await renderedFonts(page, ".page-heading h1");
      expect(
        libraryFonts.some(
          (font) =>
            font.isCustomFont &&
            /Pretendard/i.test(font.familyName) &&
            font.glyphCount > 0,
        ),
      ).toBe(true);
      await fits(page, `library ${width}`);
      await page.screenshot({
        path: `test-results/font-${target}-library-${width}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: `${mixedName} 열기`, exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: mixedName, exact: true }),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const actualFonts = await renderedFonts(page, ".studio-main h1");
      expect(
        actualFonts.some(
          (font) =>
            font.isCustomFont &&
            /Geist/i.test(font.familyName) &&
            font.glyphCount > 0,
        ),
      ).toBe(true);
      expect(
        actualFonts.some(
          (font) =>
            font.isCustomFont &&
            /Pretendard/i.test(font.familyName) &&
            font.glyphCount > 0,
        ),
      ).toBe(true);
      await fits(page, `mixed detail ${width}`);
      await page.screenshot({
        path: `test-results/font-${target}-detail-${width}.png`,
        fullPage: true,
      });
      await page.getByRole("button", { name: "곡 추가", exact: true }).click();
      const task = page.getByRole("dialog", { name: "곡 추가", exact: true });
      await expect(task.getByLabel("영상 URL")).toBeFocused();
      await task
        .getByLabel("곡 이름 (선택)")
        .fill("새벽 산책 · Midnight Walk 03");
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await expect(
        task.getByRole("button", { name: "추가", exact: true }),
      ).toHaveCSS("min-height", "44px");
      expect(
        await task.evaluate((node) => node.scrollWidth <= node.clientWidth),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/font-${target}-form-${width}.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await expect(task).toHaveCount(0);
      await page
        .getByRole("navigation", { name: "현재 위치" })
        .getByRole("link", { name: "라이브러리", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "내 라이브러리", exact: true }),
      ).toBeVisible();
      // Explicit text-size approximation, not a claim of real OS/browser text zoom.
      if ([390, 1440].includes(width)) {
        await page.evaluate(() => {
          const sizes = [
            ...document.querySelectorAll(
              "body,button,input,select,textarea,p,h1,h2,h3,strong,small,span,label,li",
            ),
          ].map((node) => [node, parseFloat(getComputedStyle(node).fontSize)]);
          document.documentElement.style.fontSize = "32px";
          sizes.forEach(([node, size]) => {
            node.style.fontSize = `${size * 2}px`;
          });
        });
        await fits(page, `200% font approximation ${width}`);
        const sortValue = page.locator(
          '[data-slot="select-trigger"] [data-slot="select-value"]',
        );
        expect(
          await sortValue.evaluate(
            (node) => node.scrollWidth <= node.clientWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: `test-results/font-${target}-text200-${width}.png`,
          fullPage: true,
        });
      }
      const metrics = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .filter((entry) => /\.woff2(?:$|\?)/.test(entry.name))
          .map((entry) => ({
            url: entry.name,
            bytes: entry.encodedBodySize,
            transferBytes: entry.transferSize,
            ms: entry.duration,
          })),
      );
      expect(responses.length).toBeGreaterThanOrEqual(2);
      expect(
        responses.every(
          (item) =>
            item.status === 200 &&
            new URL(item.url).origin === new URL(base).origin,
        ),
      ).toBe(true);
      expect(new Set(responses.map((item) => item.url)).size).toBeLessThan(93);
      expect(failedFonts).toEqual([]);
      expect(errors).toEqual([]);
      fontRecord.push({
        target,
        width,
        libraryFonts,
        mixedFonts: actualFonts,
        responses,
        metrics,
      });
      await context.tracing.stop();
      console.log(
        JSON.stringify({
          suite: "typography",
          target,
          width,
          customFonts: actualFonts.map((font) => font.familyName),
        }),
      );
    } catch (error) {
      failures.push({ width, error: String(error) });
      const prefix = `test-results/font-${target}-failure-${width}`;
      await Promise.allSettled([
        page.screenshot({ path: `${prefix}.png`, fullPage: true }),
        page.content().then((html) => fs.writeFileSync(`${prefix}.html`, html)),
        context.tracing.stop({ path: `${prefix}.zip` }),
      ]);
      console.error(`typography ${width}:`, error);
    } finally {
      await context.close();
    }
  }
  // Block all fonts in a fresh context: readable system fallback and creation remain available.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await installMediaSimulation(page);
    await page.route("**/*.woff2", (route) => route.abort("failed"));
    await page.goto(base);
    const create = page.getByRole("button", {
      name: "새 재생목록",
      exact: true,
    });
    await expect(create).toBeVisible();
    await fits(page, "blocked-font fallback");
    await create.click();
    await expect(page.getByLabel("YouTube 재생목록 URL (선택)")).toBeFocused();
    await page
      .getByRole("textbox", { name: "이름", exact: true })
      .fill("Fallback 상태의 새 목록");
    await expect(
      page.getByRole("button", { name: "만들기", exact: true }),
    ).toBeEnabled();
    await page.screenshot({
      path: `test-results/font-${target}-blocked-fallback.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  } catch (error) {
    failures.push({ mode: "blocked-font fallback", error: String(error) });
    await Promise.allSettled([
      page.screenshot({
        path: `test-results/font-${target}-fallback-failure.png`,
        fullPage: true,
      }),
      page
        .content()
        .then((html) =>
          fs.writeFileSync(
            `test-results/font-${target}-fallback-failure.html`,
            html,
          ),
        ),
    ]);
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(
  `test-results/font-${target}-evidence.json`,
  JSON.stringify({ fontRecord, failures }, null, 2),
);
if (failures.length) process.exitCode = 1;
