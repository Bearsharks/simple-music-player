import fs from "node:fs";
import { chromium, expect } from "@playwright/test";
import { installMediaSimulation } from "./media-simulation.mjs";

// UI/lifecycle simulation only. This does not verify real YouTube audio or iOS volume policy.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
});
const base =
  process.env.TEST_URL || "http://127.0.0.1:4173/simple-music-player/";
fs.mkdirSync("test-results", { recursive: true });
const failures = [];
const pausePastLeave = (page) => page.waitForTimeout(220);
try {
  for (const width of [320, 390, 768, 1024, 1199, 1200, 1440]) {
    const touch = width <= 390;
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      hasTouch: touch,
    });
    const page = await context.newPage();
    const errors = [];
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });
    try {
      page.on("pageerror", (error) => errors.push(error.message));
      await installMediaSimulation(page);
      await page.goto(base);
      const create = page.getByRole("button", {
        name: "새 재생목록",
        exact: true,
      });
      await expect(create).toHaveCount(1);
      await expect(
        page.getByRole("button", { name: "YouTube 가져오기", exact: true }),
      ).toHaveCount(0);
      await create.click();
      await page
        .getByRole("button", { name: "유튜브에서 가져오기", exact: true })
        .click();
      await expect(page.getByLabel("공개 재생목록 URL")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
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
              id: "overlays",
              name: "후속 UI 검증",
              description: "",
              createdAt: 1,
              itemCount: 2,
              thumbnails: [],
            },
            items: ["abcdefghijk", "lmnopqrstuv"].map((videoID, index) => ({
              videoID,
              name: `검증 곡 ${index + 1}`,
              owner: "",
              query: "",
              thumbnail: "",
            })),
          });
        });
        db.close();
      });
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "내 라이브러리", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "후속 UI 검증 열기", exact: true }),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await expect(
        page.getByRole("button", { name: "YouTube 가져오기", exact: true }),
      ).toHaveCount(0);
      await page.screenshot({
        path: `test-results/followup-library-${width}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "후속 UI 검증 열기", exact: true })
        .click();
      const main = await page.locator(".studio-main").boundingBox();
      await page
        .getByRole("button", { name: "전체 재생", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => window.__simulatedPlayer.loads.length))
        .toBe(1);
      const panel = page.locator("dialog.now-panel");
      if (!(await panel.isVisible()))
        await page
          .getByRole("button", { name: "재생 대기열", exact: true })
          .click();
      await expect(panel).toBeVisible();
      await page.evaluate(() => {
        window.__retainedMediaHost = document.querySelector(
          "[data-simulated-player]",
        );
      });
      const assertMediaStable = async () => {
        expect(
          await page.evaluate(
            () =>
              window.__retainedMediaHost ===
              document.querySelector("[data-simulated-player]"),
          ),
        ).toBe(true);
        expect(
          await page.evaluate(() => ({
            instances: window.__simulatedPlayer.instances,
            destroys: window.__simulatedPlayer.destroys,
            loads: window.__simulatedPlayer.loads,
          })),
        ).toEqual({ instances: 1, destroys: 0, loads: ["abcdefghijk"] });
      };
      const assertPanelTone = async (modal) => {
        await expect
          .poll(() => panel.evaluate((node) => node.matches(":modal")))
          .toBe(modal);
        expect(
          await panel.evaluate((node) => ({
            wrapper: getComputedStyle(node.parentElement).backgroundColor,
            backdrop: getComputedStyle(node, "::backdrop").backgroundColor,
            blur: getComputedStyle(node, "::backdrop").backdropFilter,
            native: node.parentElement.dataset.nativeDialog,
          })),
        ).toEqual({
          wrapper: "rgba(0, 0, 0, 0)",
          backdrop: "rgba(0, 0, 0, 0.24)",
          blur: "none",
          native: "true",
        });
        if (!modal) {
          await expect(page.locator("#root")).not.toHaveAttribute("inert");
          expect(
            await page.evaluate(() => document.body.style.overflow),
          ).not.toBe("hidden");
        }
      };
      await assertPanelTone(width < 1200);
      if (width >= 1200)
        expect(await page.locator(".studio-main").boundingBox()).toEqual(main);
      await page.screenshot({
        path: `test-results/followup-rnb-${width}.png`,
        fullPage: true,
      });
      await panel.getByRole("tab", { name: "대기열 (2)", exact: true }).click();
      await panel
        .getByRole("button", { name: "대기열을 재생목록에 저장", exact: true })
        .click();
      const task = page.getByRole("dialog", {
        name: "재생목록에 추가",
        exact: true,
      });
      await expect(task).toBeVisible();
      expect(
        await task.evaluate((node) => ({
          backdrop: getComputedStyle(node, "::backdrop").backgroundColor,
          blur: getComputedStyle(node, "::backdrop").backdropFilter,
          wrapper: getComputedStyle(node.parentElement).backgroundColor,
        })),
      ).toEqual({
        backdrop: "rgba(0, 0, 0, 0.667)",
        blur: "blur(4px)",
        wrapper: "rgba(0, 0, 0, 0.6)",
      });
      await page.screenshot({
        path: `test-results/followup-rnb-task-${width}.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await expect(task).toHaveCount(0);
      await assertPanelTone(width < 1200);
      await panel.getByRole("tab", { name: "현재 곡", exact: true }).click();
      const trigger = panel.getByRole("button", {
        name: "음량 조절",
        exact: true,
      });
      const slider = panel.getByRole("slider", { name: "음량", exact: true });
      const popup = panel.locator(".volume-popover");
      if (touch) {
        await trigger.tap();
        await expect(slider).toBeVisible();
        await trigger.tap();
        await pausePastLeave(page);
        await expect(slider).toHaveCount(0);
      } else {
        const currentTab = panel.getByRole("tab", {
          name: "현재 곡",
          exact: true,
        });
        await currentTab.focus();
        await trigger.hover();
        await expect(slider).toBeVisible();
        await expect(currentTab).toBeFocused();
        await slider.hover();
        await pausePastLeave(page);
        await expect(slider).toBeVisible();
        // Begin on the range and release outside its surface. No force clicks.
        const bounds = await slider.boundingBox();
        await page.mouse.move(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(bounds.x - 20, bounds.y - 30);
        await pausePastLeave(page);
        await expect(slider).toBeVisible();
        await page.mouse.up();
        // Internal keyboard focus also keeps it open after an outside release.
        await expect(slider).toBeVisible();
        await page.keyboard.press("Escape");
        await pausePastLeave(page);
        await expect(slider).toHaveCount(0);
      }
      await trigger.focus();
      await page.keyboard.press("ArrowUp");
      await expect(slider).toBeFocused();
      await expect(popup).toHaveText("");
      await expect(popup.locator("button")).toHaveCount(0);
      await expect(popup).toHaveCSS("width", "176px");
      await expect(slider).toHaveCSS("height", "44px");
      await page.keyboard.press("End");
      await expect(slider).toHaveValue("100");
      await expect(slider).toHaveCSS("--volume", "100%");
      await page.keyboard.press("Home");
      await expect(slider).toHaveValue("0");
      await expect(slider).toHaveCSS("--volume", "0%");
      await page.keyboard.press("ArrowRight");
      await expect(slider).toHaveValue("1");
      await expect(slider).toHaveCSS("--volume", "1%");
      expect(
        await page.evaluate(() => ({
          volume: window.__simulatedPlayer.volume,
          muted: window.__simulatedPlayer.muted,
        })),
      ).toEqual({ volume: 1, muted: false });
      await page.screenshot({
        path: `test-results/followup-volume-${width}.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await pausePastLeave(page);
      await expect(slider).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(panel).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(slider).toBeFocused();
      await page.keyboard.press("Escape");
      await assertMediaStable();
      if (width === 1199) {
        await page.setViewportSize({ width: 1200, height: 960 });
        await assertPanelTone(false);
        await assertMediaStable();
        await page.screenshot({
          path: "test-results/followup-rnb-1199-to-1200.png",
          fullPage: true,
        });
        await page.setViewportSize({ width: 1199, height: 960 });
        await assertPanelTone(true);
        await assertMediaStable();
      }
      await panel
        .getByRole("button", { name: "대기열 닫기", exact: true })
        .click();
      await expect(panel).not.toBeVisible();
      await expect(page.locator("#root")).not.toHaveAttribute("inert");
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
        "hidden",
      );
      {
        const footerTrigger = page
          .locator("footer")
          .getByRole("button", { name: "음량 조절", exact: true });
        await expect(
          page.locator("footer input[aria-label='음량']"),
        ).toHaveCount(0);
        await page
          .getByRole("button", { name: "전체 재생", exact: true })
          .focus();
        if (touch) await footerTrigger.tap();
        else await footerTrigger.hover();
        const footerSlider = page.getByRole("slider", {
          name: "음량",
          exact: true,
        });
        await expect(footerSlider).toBeVisible();
        expect(
          await footerSlider.evaluate((node) => node.closest("dialog")),
        ).toBeNull();
        if (!touch) await footerSlider.hover();
        await pausePastLeave(page);
        await expect(footerSlider).toBeVisible();
        await page.screenshot({
          path: `test-results/followup-dock-volume-${width}.png`,
          fullPage: true,
        });
        if (touch) await footerTrigger.tap();
        else await page.mouse.move(0, 0);
        await expect(footerSlider).toHaveCount(0);
        await footerTrigger.focus();
        // Explicitly re-open after a touch dismissal; Tab then enters the range.
        if (touch) await page.keyboard.press("ArrowUp");
        else await page.keyboard.press("Tab");
        await expect(footerSlider).toBeFocused();
        await page.keyboard.press("Escape");
        await pausePastLeave(page);
        await expect(footerSlider).toHaveCount(0);
        await expect(footerTrigger).toBeFocused();
      }
      await assertMediaStable();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const control of await page
        .locator("footer .dock-right button")
        .all()) {
        const bounds = await control.boundingBox();
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }
      expect(errors).toEqual([]);
      await context.tracing.stop();
      console.log(
        JSON.stringify({
          suite: "player-overlays",
          width,
          touch,
          media: "simulated-only",
        }),
      );
    } catch (error) {
      failures.push({ width, error: String(error) });
      const prefix = `test-results/followup-failure-${width}`;
      await Promise.allSettled([
        page.screenshot({ path: `${prefix}.png`, fullPage: true }),
        page.content().then((html) => fs.writeFileSync(`${prefix}.html`, html)),
        context.tracing.stop({ path: `${prefix}.zip` }),
      ]);
      console.error(`player-overlays ${width}:`, error);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  fs.writeFileSync(
    "test-results/followup-failures.json",
    JSON.stringify(failures, null, 2),
  );
  process.exitCode = 1;
}
