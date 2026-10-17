import fs from "node:fs";
import { chromium, expect } from "@playwright/test";
import { installMediaSimulation } from "./media-simulation.mjs";

// YouTube is deliberately simulated. These assertions prove app state/persistence,
// keyboard behavior and CSP, never actual media, autoplay or external embeds.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
});
try {
  for (const viewport of [
    { width: 1440, height: 960 },
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    const context = page.context();
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });
    try {
      page.on("pageerror", (error) => errors.push(error.message));
      await installMediaSimulation(page);
      await page.addInitScript(() => {
        window.__interactionTrace = [];
        for (const type of ["pointerdown", "click", "focusin", "focusout"]) {
          document.addEventListener(
            type,
            (event) => {
              const target = event.target;
              window.__interactionTrace.push({
                type,
                target:
                  target instanceof Element
                    ? `${target.tagName} ${target.getAttribute("aria-label") || target.textContent?.trim().slice(0, 80) || ""}`
                    : "",
                popupCount: document.querySelectorAll(
                  '[role="menu"][aria-label="선택 메뉴"]',
                ).length,
                dialogs: document.querySelectorAll('[role="dialog"]').length,
              });
              if (window.__interactionTrace.length > 80)
                window.__interactionTrace.shift();
            },
            true,
          );
        }
      });
      await page.goto(
        process.env.TEST_URL || "http://127.0.0.1:4173/simple-music-player/",
      );
      const createButton = page.getByRole("button", {
        name: "새 재생목록",
        exact: true,
      });
      await createButton.waitFor();
      fs.mkdirSync("test-results", { recursive: true });
      await page.screenshot({
        path: `test-results/empty-${viewport.width}.png`,
        fullPage: true,
      });

      // Real creation UI, including focus trap/Escape, not direct seeded metadata.
      await createButton.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByLabel("YouTube 재생목록 URL (선택)"),
      ).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "취소", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        page.getByLabel("YouTube 재생목록 URL (선택)"),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(createButton).toBeFocused();
      const create = async (name, failOnce = false) => {
        await createButton.click();
        await page
          .getByRole("textbox", { name: "이름", exact: true })
          .fill(name);
        if (failOnce)
          await page.evaluate(() => {
            window.__failNextWrite = true;
          });
        if (failOnce)
          await page
            .getByRole("button", { name: "만들기", exact: true })
            .click();
        else
          await page
            .getByRole("textbox", { name: "이름", exact: true })
            .press("Enter");
        if (failOnce) {
          await expect(page.getByRole("alert")).toContainText(
            "검증용 저장 실패",
          );
          await expect(
            page.getByRole("textbox", { name: "이름", exact: true }),
          ).toHaveValue(name);
          await page.screenshot({
            path: `test-results/save-error-${viewport.width}.png`,
            fullPage: true,
          });
          await page
            .getByRole("button", { name: "만들기", exact: true })
            .click();
        }
        await expect(
          page.getByRole("dialog", { name: "새 재생목록", exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("heading", { name, exact: true }),
        ).toBeVisible();
        await expect(page.getByLabel("영상 URL")).toBeFocused();
        await page
          .getByRole("dialog", { name: "곡 추가", exact: true })
          .getByRole("button", { name: "취소", exact: true })
          .click();
        await expect(page.locator(".studio-content")).toContainText("0곡");
        const emptyPlay = page.getByRole("button", {
          name: "전체 재생",
          exact: true,
        });
        await expect(emptyPlay).toBeDisabled();
        // Disabled shadcn Button intentionally has pointer-events:none. Move
        // the real pointer over its box without requiring it to receive events.
        await expect(emptyPlay).toHaveCSS("pointer-events", "none");
        const emptyPlayBox = await emptyPlay.boundingBox();
        expect(emptyPlayBox).not.toBeNull();
        await page.mouse.move(
          emptyPlayBox.x + emptyPlayBox.width / 2,
          emptyPlayBox.y + emptyPlayBox.height / 2,
        );
        await expect(emptyPlay).toBeDisabled();
        await expect(emptyPlay).toHaveCSS(
          "background-image",
          "linear-gradient(100deg, rgb(168, 85, 255) 0%, rgb(91, 158, 246) 100%)",
        );
        expect(
          await emptyPlay.evaluate((node) => getComputedStyle(node).opacity),
        ).toBe("0.42");
        await page.screenshot({
          path: `test-results/signature-disabled-${viewport.width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("navigation", { name: "현재 위치", exact: true })
          .getByRole("link", { name: "라이브러리", exact: true })
          .click();
        await page
          .getByRole("button", { name: `${name} 열기`, exact: true })
          .waitFor();
      };
      await create("빈 목록");
      await create("브라우저 검증 목록", true);
      await expect(page.locator(".cover-open").first()).toHaveAttribute(
        "aria-label",
        "브라우저 검증 목록 열기",
      );
      await expect(
        page.getByRole("button", { name: "빈 목록 재생", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "빈 목록 곡 추가", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".studio-content")).not.toContainText("NaN");
      await page
        .getByRole("button", { name: "브라우저 검증 목록 열기", exact: true })
        .click();
      await expect(page.locator(".studio-content")).toContainText("0곡");
      for (const [id, name] of [
        ["abcdefghijk", "저장 검증 곡"],
        ["lmnopqrstuv", "두 번째 곡"],
        ["zzzzzzzzzzz", "세 번째 곡"],
      ]) {
        await page
          .getByRole("button", { name: "곡 추가", exact: true })
          .click();
        await page.getByLabel("영상 URL").fill(`https://youtu.be/${id}`);
        await page.getByLabel("곡 이름 (선택)").fill(name);
        await page.getByRole("button", { name: "추가", exact: true }).click();
        await page
          .locator(".studio-content")
          .getByText(name, { exact: true })
          .waitFor();
      }
      await page.reload();
      await expect(page.locator(".studio-content")).toContainText("3곡");
      await page
        .getByRole("button", { name: "전체 재생", exact: false })
        .click();
      await expect
        .poll(() => page.evaluate(() => window.__simulatedPlayer.loads.length))
        .toBe(1);
      await page.evaluate(() => window.player.seekTo(42));
      await expect(page.locator(".dock-track-text")).toContainText(
        "저장 검증 곡",
      );
      await page.screenshot({
        path: `test-results/simulated-playing-${viewport.width}.png`,
        fullPage: true,
      });
      const closeQueue = page.getByRole("button", {
        name: "대기열 닫기",
        exact: true,
      });
      if (await closeQueue.isVisible()) await closeQueue.click();
      await page
        .getByRole("navigation", { name: "현재 위치", exact: true })
        .getByRole("link", { name: "라이브러리", exact: true })
        .click();
      await expect(page.locator(".cover-open").first()).toHaveAttribute(
        "aria-label",
        "브라우저 검증 목록 열기",
      );
      await expect(
        page.getByRole("button", { name: "빈 목록 재생", exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "빈 목록 곡 추가", exact: true })
        .click();
      await expect(page.getByLabel("영상 URL")).toBeFocused();
      await page
        .getByRole("dialog", { name: "곡 추가", exact: true })
        .getByRole("button", { name: "취소", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "전체 재생", exact: false }),
      ).toBeDisabled();
      await expect(page.locator(".dock-track-text")).toContainText(
        "저장 검증 곡",
      );
      expect(await page.evaluate(() => window.__simulatedPlayer)).toMatchObject(
        { loads: ["abcdefghijk"], time: 42, state: 1 },
      );
      await page
        .getByRole("navigation", { name: "현재 위치", exact: true })
        .getByRole("link", { name: "라이브러리", exact: true })
        .click();
      await page.screenshot({
        path: `test-results/library-${viewport.width}.png`,
        fullPage: true,
      });

      // Delete cancellation and successful routing cannot clear the independent queue.
      await page
        .getByRole("button", { name: "빈 목록 열기", exact: true })
        .click();
      await page.getByRole("button", { name: "더보기", exact: true }).click();
      await page
        .getByRole("menuitem", { name: "재생목록 삭제", exact: true })
        .click();
      await page.getByRole("button", { name: "취소", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "빈 목록", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "더보기", exact: true }).click();
      await page
        .getByRole("menuitem", { name: "재생목록 삭제", exact: true })
        .click();
      await page.getByRole("button", { name: "삭제", exact: true }).click();
      await page
        .getByRole("button", { name: "브라우저 검증 목록 열기", exact: true })
        .waitFor();
      await expect(
        page.getByRole("button", { name: "빈 목록 열기", exact: true }),
      ).toHaveCount(0);
      expect(await page.evaluate(() => window.__simulatedPlayer)).toMatchObject(
        { loads: ["abcdefghijk"], time: 42, state: 1 },
      );

      const csp = await page
        .locator('meta[http-equiv="Content-Security-Policy"]')
        .getAttribute("content");
      if (
        !csp?.includes("object-src 'none'") ||
        csp.includes("script-src 'self' 'unsafe-inline'")
      )
        throw new Error("Missing script policy");
      const blocked = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 2000);
            document.addEventListener(
              "securitypolicyviolation",
              function listener(event) {
                if (event.violatedDirective.startsWith("script-src")) {
                  clearTimeout(timeout);
                  document.removeEventListener(
                    "securitypolicyviolation",
                    listener,
                  );
                  resolve(true);
                }
              },
            );
            const script = document.createElement("script");
            script.textContent = "window.__smpInjected = true";
            document.head.append(script);
          }),
      );
      if (
        !blocked ||
        (await page.evaluate(() => window.__smpInjected === true))
      )
        throw new Error("Inline script not blocked");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      console.log(
        JSON.stringify({ viewport, errors, overflow, media: "simulated-only" }),
      );
      if (errors.length || overflow)
        throw new Error("Browser runtime errors or horizontal overflow");
      await context.tracing.stop();
    } catch (error) {
      const prefix = `test-results/failure-${viewport.width}`;
      fs.mkdirSync("test-results", { recursive: true });
      await Promise.allSettled([
        page.screenshot({ path: `${prefix}.png`, fullPage: true }),
        page.content().then((html) => fs.writeFileSync(`${prefix}.html`, html)),
        page
          .locator("body")
          .ariaSnapshot()
          .then((snapshot) => fs.writeFileSync(`${prefix}-aria.txt`, snapshot)),
        page
          .evaluate(() => ({
            interactions: window.__interactionTrace,
            player: window.__simulatedPlayer,
            activeElement: document.activeElement?.outerHTML,
          }))
          .then((state) =>
            fs.writeFileSync(
              `${prefix}-state.json`,
              JSON.stringify({ viewport, errors, ...state }, null, 2),
            ),
          ),
      ]);
      await context.tracing
        .stop({ path: `${prefix}-trace.zip` })
        .catch(() => {});
      throw error;
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
