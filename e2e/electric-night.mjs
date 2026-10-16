import fs from "node:fs";
import { chromium, expect } from "@playwright/test";
import { installMediaSimulation } from "./media-simulation.mjs";
// These fixtures exist only for dense layout and interaction checks. UI creation
// and persistence are covered separately by smoke.mjs, not by this seeded suite.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
});
const base =
  process.env.TEST_URL || "http://127.0.0.1:4173/simple-music-player/";
fs.mkdirSync("test-results", { recursive: true });
const failures = [];
const signatureImages = {
  default:
    "linear-gradient(100deg, rgb(168, 85, 255) 0%, rgb(91, 158, 246) 100%)",
  hover:
    "linear-gradient(100deg, rgb(184, 117, 255) 0%, rgb(124, 180, 250) 100%)",
  pressed:
    "linear-gradient(100deg, rgb(165, 83, 250) 0%, rgb(85, 147, 232) 100%)",
};
try {
  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 960 },
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
        window.__dialogAudit = [];
        for (const type of ["keydown", "cancel", "close"])
          document.addEventListener(
            type,
            (event) => {
              if (type === "keydown" && event.key !== "Escape") return;
              window.__dialogAudit.push({
                type,
                target:
                  event.target.getAttribute?.("aria-label") ||
                  event.target.tagName,
                open: [...document.querySelectorAll("dialog[open]")].map(
                  (node) => node.getAttribute("aria-label"),
                ),
              });
            },
            true,
          );
      });
      await page.goto(base);
      await page
        .getByRole("button", { name: "새 재생목록", exact: true })
        .waitFor();
      await page.evaluate(async () => {
        const request = indexedDB.open("simple-music-player-local-v1", 1);
        const db = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const names = [
          "새벽의 파형",
          "집중하는 오후",
          "도시의 야경",
          "주말의 리듬",
          "차분한 순간",
          "기분 좋은 산책",
          "늦은 밤의 작업실",
          "아직 비어 있는 목록",
        ];
        await new Promise((resolve, reject) => {
          const tx = db.transaction("playlists", "readwrite");
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
          names.forEach((name, index) => {
            const items =
              index === 7
                ? []
                : Array.from({ length: index === 0 ? 20 : 4 }, (_, track) => ({
                    videoID: `v${String(index).padStart(2, "0")}${String(track).padStart(8, "0")}`,
                    name: `검증용 곡 ${String(track + 1).padStart(2, "0")}`,
                    owner: "레이아웃 테스트",
                    query: "",
                    thumbnail: "",
                  }));
            tx.objectStore("playlists").put({
              info: {
                id: `visual-${index}`,
                name,
                description: "브라우저 검수용 저장 목록입니다.",
                createdAt: 10000 - index,
                ...(index === 0
                  ? {
                      sourcePlaylistUrl:
                        "https://www.youtube.com/playlist?list=PLlegacy123",
                    }
                  : {}),
                itemCount: items.length,
                thumbnails: [],
              },
              items,
            });
          });
        });
        db.close();
      });
      await page.reload();
      await page
        .getByRole("button", { name: "새벽의 파형 열기", exact: true })
        .waitFor();
      const sortTrigger = page.getByRole("combobox", { name: "재생목록 정렬" });
      await sortTrigger.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("listbox")).toBeVisible();
      await page.keyboard.press("End");
      await expect(
        page.getByRole("option", { name: "이름순", exact: true }),
      ).toBeFocused();
      await page.screenshot({
        path: `test-results/app-sort-open-${viewport.width}.png`,
        fullPage: true,
      });
      const optionStyle = await page
        .getByRole("option", { name: "이름순", exact: true })
        .evaluate((node) => ({
          border: getComputedStyle(node).borderTopWidth,
          radius: getComputedStyle(node).borderTopLeftRadius,
          height: node.getBoundingClientRect().height,
        }));
      expect(optionStyle.border).toBe("0px");
      expect(optionStyle.radius).toBe("6px");
      expect(optionStyle.height).toBeGreaterThanOrEqual(44);
      await page.keyboard.press("Enter");
      await expect(sortTrigger).toHaveText("이름순");
      await expect(sortTrigger).toBeFocused();
      await sortTrigger.click();
      await page
        .getByRole("option", { name: "최근 추가순", exact: true })
        .click();
      const inputStyle = await page
        .getByRole("textbox", { name: "라이브러리 검색" })
        .evaluate((node) => ({
          height: node.getBoundingClientRect().height,
          background: getComputedStyle(node).backgroundColor,
          border: getComputedStyle(node).borderTopColor,
        }));
      expect(inputStyle.height).toBeGreaterThanOrEqual(44);
      expect(inputStyle.background).toBe("rgb(11, 11, 20)");
      expect(inputStyle.border).toBe("rgb(107, 107, 128)");
      const primaryStyle = await page
        .getByRole("button", { name: "새 재생목록", exact: true })
        .evaluate((node) => ({
          background: getComputedStyle(node).backgroundColor,
          color: getComputedStyle(node).color,
          image: getComputedStyle(node).backgroundImage,
        }));
      expect(primaryStyle.color).toBe("rgb(11, 11, 20)");
      expect(primaryStyle.image).toBe(signatureImages.default);
      const captureBrandStates = async (control, name) => {
        await page.mouse.move(0, 0);
        await expect(control).toHaveCSS(
          "background-image",
          signatureImages.default,
        );
        await page.screenshot({
          path: `test-results/app-brand-${name}-default-${viewport.width}.png`,
          fullPage: true,
        });
        await control.hover();
        await expect(control).toHaveCSS(
          "background-image",
          signatureImages.hover,
        );
        await page.screenshot({
          path: `test-results/app-brand-${name}-hover-${viewport.width}.png`,
          fullPage: true,
        });
        await page.mouse.down();
        try {
          await expect(control).toHaveCSS(
            "background-image",
            signatureImages.pressed,
          );
          await page.screenshot({
            path: `test-results/app-brand-${name}-pressed-${viewport.width}.png`,
            fullPage: true,
          });
        } finally {
          // Release away from the CTA so a state capture never creates or plays.
          await page.mouse.move(0, 0);
          await page.mouse.up();
        }
        await expect(control).toHaveCSS(
          "background-image",
          signatureImages.default,
        );
      };
      if ([390, 1440].includes(viewport.width)) {
        await captureBrandStates(
          page.getByRole("button", { name: "새 재생목록", exact: true }),
          "new-playlist",
        );
        await expect(page.getByRole("dialog")).toHaveCount(0);
      }
      const librarySeed = await page
        .locator(".playlist-card")
        .first()
        .locator("[data-cover-seed]")
        .getAttribute("data-cover-seed");
      const assertFits = async (label) => {
        const value = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth > innerWidth,
          main:
            document.querySelector(".studio-main").scrollWidth >
            document.querySelector(".studio-main").clientWidth,
        }));
        expect(value, `${label} ${viewport.width}`).toEqual({
          document: false,
          main: false,
        });
      };
      const breadcrumb = page.getByRole("navigation", { name: "현재 위치" });
      await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
        "라이브러리",
      );
      await expect(breadcrumb.getByRole("link")).toHaveCount(0);
      if ([390, 1440].includes(viewport.width)) {
        const libraryMenu = page.getByRole("button", {
          name: "라이브러리 더보기",
          exact: true,
        });
        expect((await libraryMenu.boundingBox()).height).toBeGreaterThanOrEqual(
          44,
        );
        await libraryMenu.click();
        const downloadPromise = page.waitForEvent("download");
        await page
          .getByRole("menuitem", { name: "목록 내보내기", exact: true })
          .click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe("loopy-playlists.json");
        const exported = JSON.parse(
          fs.readFileSync(await download.path(), "utf8"),
        );
        expect(exported.playlists).toHaveLength(8);
        await libraryMenu.click();
        const chooserPromise = page.waitForEvent("filechooser");
        await page
          .getByRole("menuitem", { name: "백업 가져오기", exact: true })
          .click();
        const chooser = await chooserPromise;
        await expect(page.getByRole("menu")).toHaveCount(0);
        await chooser.setFiles({
          name: "invalid.json",
          mimeType: "application/json",
          buffer: Buffer.from("invalid"),
        });
        await expect(page.getByRole("alert")).toBeVisible();
        await page
          .getByRole("button", { name: "오류 알림 닫기", exact: true })
          .click();
        await libraryMenu.click();
        const nextChooser = page.waitForEvent("filechooser");
        await page
          .getByRole("menuitem", { name: "백업 가져오기", exact: true })
          .click();
        await (
          await nextChooser
        ).setFiles({
          name: "backup.json",
          mimeType: "application/json",
          buffer: Buffer.from(
            JSON.stringify({
              format: "smp-playlists",
              version: 1,
              playlists: [],
            }),
          ),
        });
        const backupDialog = page.getByRole("dialog", {
          name: "백업 가져오기",
          exact: true,
        });
        await expect(backupDialog).toBeVisible();
        await backupDialog
          .getByRole("button", { name: "취소", exact: true })
          .click();
        await expect(libraryMenu).toBeFocused();
        await expect(page.locator(".playlist-card")).toHaveCount(8);
      }
      await assertFits("library");
      if (viewport.width === 320) {
        const title = await page
          .getByRole("heading", { name: "내 라이브러리", exact: true })
          .boundingBox();
        const actions = await page.locator(".heading-actions").boundingBox();
        expect(title.height).toBeLessThan(40);
        expect(actions.y).toBeGreaterThanOrEqual(title.y + title.height);
      }
      if (viewport.width === 390) {
        const title = await page
          .getByRole("heading", { name: "내 라이브러리", exact: true })
          .boundingBox();
        const actions = await page.locator(".heading-actions").boundingBox();
        expect(actions.y).toBeLessThan(title.y + title.height);
      }
      if (viewport.width <= 760) {
        expect(
          await page
            .locator(".breadcrumb")
            .evaluate((node) => getComputedStyle(node).gap),
        ).toBe("16px");
        const search = await page
          .getByRole("textbox", { name: "라이브러리 검색" })
          .boundingBox();
        const sort = await sortTrigger.boundingBox();
        expect(Math.abs(search.y - sort.y)).toBeLessThan(2);
      }
      if (viewport.width === 390) {
        expect(
          (await page.locator(".cover-open").first().boundingBox()).y,
        ).toBeLessThanOrEqual(240);
        const fourth = await page.locator(".card-title").nth(3).boundingBox();
        const dock = await page.locator(".listening-dock").boundingBox();
        expect(fourth.y + fourth.height).toBeLessThan(dock.y);
      }
      await page.screenshot({
        path: `test-results/app-library-${viewport.width}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "새벽의 파형 열기", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "새벽의 파형", exact: true })
        .waitFor();
      expect(
        await page
          .locator(".studio-content [data-cover-seed]")
          .first()
          .getAttribute("data-cover-seed"),
      ).toBe(librarySeed);
      await expect(
        breadcrumb.getByRole("link", { name: "라이브러리" }),
      ).toBeVisible();
      await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
        "새벽의 파형",
      );
      await expect(page.getByLabel("영상 URL")).toHaveCount(0);
      await assertFits("detail");
      const wholePlay = page.getByRole("button", {
        name: "전체 재생",
        exact: true,
      });
      const signature = await wholePlay.evaluate((node) => ({
        image: getComputedStyle(node).backgroundImage,
        color: getComputedStyle(node).color,
      }));
      expect(signature.image).toBe(signatureImages.default);
      expect(signature.image).not.toContain("rgb(255, 77, 141)");
      expect(signature.color).toBe("rgb(11, 11, 20)");
      expect(signature.image).toBe(primaryStyle.image);
      if (viewport.width >= 1200) {
        const bars = await page.locator(".logo-bars i").evaluateAll((nodes) =>
          nodes.map((node) => ({
            image: getComputedStyle(node).backgroundImage,
            size: getComputedStyle(node).backgroundSize,
            x: getComputedStyle(node).backgroundPositionX,
            y: getComputedStyle(node).backgroundPositionY,
          })),
        );
        expect(
          bars.every(
            (bar) =>
              bar.image ===
                "linear-gradient(110deg, rgb(168, 85, 255) 0%, rgb(108, 112, 239) 55%, rgb(76, 201, 255) 100%)" &&
              bar.size === "25px 28px",
          ),
        ).toBe(true);
        expect(bars[0].image).not.toBe(signature.image);
        expect(bars.map((bar) => bar.x)).toEqual([
          "0px",
          "-7px",
          "-14px",
          "-21px",
        ]);
        expect(bars.map((bar) => bar.y)).toEqual([
          "-5px",
          "0px",
          "-2.5px",
          "-8px",
        ]);
        await page.locator(".studio-logo").screenshot({
          path: `test-results/app-logo-restored-${viewport.width}.png`,
        });
      }
      await page.screenshot({
        path: `test-results/app-detail-${viewport.width}.png`,
        fullPage: true,
      });
      if ([390, 1440].includes(viewport.width)) {
        await captureBrandStates(wholePlay, "whole-playlist");
        await page.keyboard.press("Tab");
        await wholePlay.focus();
        await expect(wholePlay).toBeFocused();
        await expect
          .poll(() =>
            wholePlay.evaluate((node) => node.matches(":focus-visible")),
          )
          .toBe(true);
        // The upstream Button transitions outline color for 150ms. Assert the
        // final specified focus treatment, not an intermediate sampled RGB.
        await expect(wholePlay).toHaveCSS("outline-color", "rgb(76, 201, 255)");
        await expect(wholePlay).toHaveCSS("outline-width", "2px");
        await expect(wholePlay).toHaveCSS("outline-offset", "4px");
        await page.screenshot({
          path: `test-results/app-signature-focus-${viewport.width}.png`,
          fullPage: true,
        });
      }
      if ([390, 1440].includes(viewport.width)) {
        const mainBeforeQueue = await page
          .locator(".studio-main")
          .boundingBox();
        await page
          .locator("main")
          .getByRole("button", { name: "더보기", exact: true })
          .click();
        await expect(
          page.getByRole("menuitem", {
            name: "처음 가져온 목록으로 복원",
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("menuitem", {
            name: "YouTube 최신 목록 가져오기",
            exact: true,
          }),
        ).toBeVisible();
        await page
          .getByRole("menuitem", { name: "재생목록 수정", exact: true })
          .click();
        await page.screenshot({
          path: `test-results/app-edit-form-${viewport.width}.png`,
          fullPage: true,
        });
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("dialog", { name: "재생목록 수정", exact: true }),
        ).toHaveCount(0);
        await page
          .getByRole("button", { name: "전체 재생", exact: true })
          .click();
        await expect
          .poll(() =>
            page.evaluate(() => window.__simulatedPlayer.loads.length),
          )
          .toBe(1);
        if (
          !(await page
            .getByRole("button", { name: "대기열 닫기", exact: true })
            .isVisible())
        )
          await page
            .getByRole("button", { name: "재생 대기열", exact: true })
            .click();
        await page
          .getByRole("tab", { name: "대기열 (20)", exact: true })
          .waitFor();
        if (viewport.width >= 1200) {
          expect(await page.locator(".studio-main").boundingBox()).toEqual(
            mainBeforeQueue,
          );
          expect(await page.locator("#root").getAttribute("inert")).toBeNull();
        }

        await page.evaluate(() => {
          window.__originalPlayer = window.player;
          window.__originalHost = document.querySelector(
            "[data-simulated-player]",
          );
        });
        await page.screenshot({
          path: `test-results/app-queue-${viewport.width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "검증용 곡 01 더보기", exact: true })
          .last()
          .click();
        const menu = page.getByRole("menu", { name: "선택 메뉴" });
        await expect(menu).toBeVisible();
        await page.keyboard.press("End");
        await expect(
          page.getByRole("menuitem", { name: "대기열에서 삭제", exact: true }),
        ).toBeFocused();
        await page.keyboard.press("Home");
        await expect(
          page.getByRole("menuitem", {
            name: "다음 음악으로 재생",
            exact: true,
          }),
        ).toBeFocused();
        expect(
          await menu.evaluate((node) =>
            Boolean(node.closest("dialog.now-panel")),
          ),
        ).toBe(true);
        await page.keyboard.press("Escape");
        await expect(menu).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "대기열 닫기", exact: true }),
        ).toBeVisible();
        // Nested native top layers: menu → one-screen destination editor.
        await page
          .getByRole("button", { name: "검증용 곡 01 더보기", exact: true })
          .last()
          .click();
        await page
          .getByRole("menuitem", { name: "재생목록에 추가", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "수정하고 추가", exact: true }),
        ).toBeDisabled();
        await page
          .getByRole("button", { name: "새벽의 파형 선택", exact: true })
          .click();
        await expect(page.getByLabel("이름", { exact: true })).toHaveValue(
          "새벽의 파형",
        );
        await page.getByLabel("설명 (선택)").fill("아직 저장하지 않은 설명");
        await page.screenshot({
          path: `test-results/app-picker-existing-${viewport.width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "새 재생목록 만들기", exact: true })
          .click();
        await expect(page.getByLabel("이름", { exact: true })).toBeFocused();
        await page.screenshot({
          path: `test-results/app-picker-new-${viewport.width}.png`,
          fullPage: true,
        });
        const labelStyle = await page
          .locator('label[data-slot="label"]')
          .first()
          .evaluate((node) => ({
            border: getComputedStyle(node).borderTopWidth,
            height: node.getBoundingClientRect().height,
          }));
        expect(labelStyle.border).toBe("0px");
        expect(labelStyle.height).toBeLessThan(40);
        for (const width of [1199, 1200, 1199]) {
          await page.setViewportSize({ width, height: viewport.height });
          await expect(page.getByLabel("이름", { exact: true })).toBeVisible();
          // Background responsive changes must not recreate the task's native
          // close watcher. Its parent keeps its mode until the task is closed.
          expect(
            await page.locator("dialog.now-panel").getAttribute("aria-modal"),
          ).toBe(viewport.width < 1200 ? "true" : null);
          expect(
            await page.evaluate(() => ({
              inert: document.querySelector("#root").hasAttribute("inert"),
              overflow: document.body.style.overflow,
            })),
          ).toEqual({ inert: true, overflow: "hidden" });
          await page.keyboard.press("Tab");
          expect(
            await page.evaluate(() =>
              Boolean(
                document.activeElement.closest(
                  'dialog[aria-label="재생목록에 추가"]',
                ),
              ),
            ),
          ).toBe(true);
        }
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("dialog", { name: "재생목록에 추가" }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "대기열 닫기", exact: true }),
        ).toBeVisible();
        await expect(page.locator("dialog.now-panel")).toHaveAttribute(
          "aria-modal",
          "true",
        );
        expect(
          await page.evaluate(() => ({
            open: document.querySelectorAll("dialog[open]").length,
            inert: document.querySelector("#root").hasAttribute("inert"),
            overflow: document.body.style.overflow,
          })),
        ).toEqual({ open: 1, inert: true, overflow: "hidden" });
        await page.setViewportSize(viewport);
        // Closing and reopening changes no simulated official-player instance or DOM.
        await page
          .getByRole("button", { name: "대기열 닫기", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "재생 대기열", exact: true }),
        ).toBeFocused();
        expect(
          await page.evaluate(() => ({
            same: window.player === window.__originalPlayer,
            node:
              document.querySelector("[data-simulated-player]") ===
              window.__originalHost,
            inert: document.querySelector("#root").hasAttribute("inert"),
            overflow: document.body.style.overflow,
          })),
        ).toEqual({ same: true, node: true, inert: false, overflow: "" });
        // Saving the queue is a side task, not navigation to a new URL form.
        await page
          .getByRole("button", { name: "재생 대기열", exact: true })
          .click();
        const routeBeforeSave = page.url();
        const saveQueue = page.getByRole("button", {
          name: "대기열을 재생목록에 저장",
          exact: true,
        });
        await saveQueue.click();
        await page
          .getByRole("button", { name: "새 재생목록 만들기", exact: true })
          .click();
        await page.getByLabel("이름", { exact: true }).fill("보존한 대기열");
        await page
          .getByRole("button", { name: "만들고 추가", exact: true })
          .click();
        await expect(
          page.getByRole("dialog", { name: "재생목록에 추가", exact: true }),
        ).toHaveCount(0);
        expect(page.url()).toBe(routeBeforeSave);
        await expect(saveQueue).toBeFocused();
        await expect(
          page.getByRole("tab", { name: "대기열 (20)", exact: true }),
        ).toBeVisible();
        if (viewport.width < 1200)
          await page
            .getByRole("button", { name: "대기열 닫기", exact: true })
            .click();
        await page
          .locator("main")
          .getByRole("button", { name: "곡 추가", exact: true })
          .click();
        await expect(page.getByLabel("영상 URL")).toBeFocused();
        await page
          .getByLabel("영상 URL")
          .fill("https://evil.example/watch?v=abcdefghijk");
        await page.getByRole("button", { name: "추가", exact: true }).click();
        await expect(page.getByRole("alert")).toBeVisible();
        await page.screenshot({
          path: `test-results/app-add-overlay-error-${viewport.width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("dialog", { name: "곡 추가", exact: true })
          .getByRole("button", { name: "취소", exact: true })
          .click();
        await expect(
          page
            .locator("main")
            .getByRole("button", { name: "곡 추가", exact: true }),
        ).toBeFocused();
        expect(
          await page.evaluate(
            () =>
              window.player === window.__originalPlayer &&
              document.querySelector("[data-simulated-player]") ===
                window.__originalHost,
          ),
        ).toBe(true);
        if (viewport.width >= 1200)
          await page
            .getByRole("button", { name: "대기열 닫기", exact: true })
            .click();
        // Saved editing while a desktop queue is open must not alter current playback.
        const savedTracks = page.getByRole("region", {
          name: "저장한 곡",
          exact: true,
        });
        const savedHandle = savedTracks.getByRole("button", {
          name: "검증용 곡 02 순서 드래그",
          exact: true,
        });
        const keyboardMove = async (handle, direction) => {
          await handle.focus();
          await page.keyboard.press("Space");
          await page.keyboard.press(direction);
          await page.waitForTimeout(300);
          await page.keyboard.press("Space");
        };
        await page.evaluate(() => {
          window.__failNextWrite = true;
        });
        await keyboardMove(savedHandle, "ArrowUp");
        await expect(page.getByRole("alert")).toContainText("검증용 저장 실패");
        await expect(
          savedTracks.locator("[data-track-focus]").first(),
        ).toHaveAttribute("aria-label", "검증용 곡 01 재생");
        await keyboardMove(savedHandle, "ArrowUp");
        await expect(
          savedTracks.locator("[data-track-focus]").first(),
        ).toHaveAttribute("aria-label", "검증용 곡 02 재생");
        await keyboardMove(savedHandle, "ArrowDown");
        await expect(
          savedTracks.locator("[data-track-focus]").first(),
        ).toHaveAttribute("aria-label", "검증용 곡 01 재생");
        await expect(page.getByRole("alert")).toHaveCount(0);
        // Pointer drag has no edit-mode gate and persists immediately.
        const dragFrom = await savedHandle.boundingBox();
        const dragTo = await savedTracks
          .getByRole("button", {
            name: "검증용 곡 01 순서 드래그",
            exact: true,
          })
          .boundingBox();
        await page.mouse.move(
          dragFrom.x + dragFrom.width / 2,
          dragFrom.y + dragFrom.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(
          dragTo.x + dragTo.width / 2,
          dragTo.y + dragTo.height / 2,
          { steps: 12 },
        );
        await page.mouse.up();
        await expect(
          savedTracks.locator("[data-track-focus]").first(),
        ).toHaveAttribute("aria-label", "검증용 곡 02 재생");
        await keyboardMove(savedHandle, "ArrowDown");
        await expect(
          savedTracks.locator("[data-track-focus]").first(),
        ).toHaveAttribute("aria-label", "검증용 곡 01 재생");
        await savedTracks
          .getByRole("button", { name: "검증용 곡 02 더보기", exact: true })
          .click();
        await page
          .getByRole("menuitem", { name: "재생목록에서 삭제", exact: true })
          .click();
        await expect(
          savedTracks.locator(
            '[data-track-focus][aria-label="검증용 곡 03 재생"]',
          ),
        ).toBeFocused();
        await page
          .getByRole("button", { name: "실행 취소", exact: true })
          .click();
        await expect(
          savedTracks.getByRole("button", {
            name: "검증용 곡 02 더보기",
            exact: true,
          }),
        ).toBeVisible();
        expect(
          await page.evaluate(() => window.__simulatedPlayer.loads),
        ).toEqual(["v0000000000"]);
        if (
          !(await page
            .getByRole("button", { name: "대기열 닫기", exact: true })
            .isVisible())
        )
          await page
            .getByRole("button", { name: "재생 대기열", exact: true })
            .click();
        const queuePanel = page.locator("dialog.now-panel");
        await queuePanel
          .getByRole("button", { name: "검증용 곡 02 더보기", exact: true })
          .click();
        await page.screenshot({
          path: `test-results/app-queue-menu-${viewport.width}.png`,
          fullPage: true,
        });
        const menuItemStyle = await page
          .getByRole("menuitem", { name: "대기열에서 삭제", exact: true })
          .evaluate((node) => ({
            border: getComputedStyle(node).borderTopWidth,
            radius: getComputedStyle(node).borderTopLeftRadius,
            height: node.getBoundingClientRect().height,
          }));
        expect(menuItemStyle.border).toBe("0px");
        expect(menuItemStyle.radius).toBe("6px");
        expect(menuItemStyle.height).toBeGreaterThanOrEqual(44);
        await page
          .getByRole("menuitem", { name: "대기열에서 삭제", exact: true })
          .click();
        await expect(
          queuePanel.locator(
            '[data-track-focus][aria-label="검증용 곡 03 재생"]',
          ),
        ).toBeFocused();
        await page
          .getByRole("button", { name: "실행 취소", exact: true })
          .click();
        await expect(
          queuePanel.getByRole("button", {
            name: "검증용 곡 02 더보기",
            exact: true,
          }),
        ).toBeVisible();
        // Escape belongs to an active drag, before the native player sheet.
        const cancelHandle = queuePanel.getByRole("button", {
          name: "검증용 곡 02 순서 드래그",
          exact: true,
        });
        const beforeCancel = await queuePanel
          .locator("[data-track-key]")
          .evaluateAll((nodes) => nodes.map((node) => node.dataset.trackKey));
        await cancelHandle.focus();
        await page.keyboard.press("Space");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("button", { name: "대기열 닫기", exact: true }),
        ).toBeVisible();
        await expect(cancelHandle).toBeFocused();
        await expect
          .poll(() =>
            cancelHandle.evaluate(
              (node) =>
                getComputedStyle(node.closest("[data-rfd-draggable-id]"))
                  .position,
            ),
          )
          .not.toBe("fixed");
        expect(
          await queuePanel
            .locator("[data-track-key]")
            .evaluateAll((nodes) => nodes.map((node) => node.dataset.trackKey)),
        ).toEqual(beforeCancel);
        await keyboardMove(
          page
            .getByRole("button", {
              name: "검증용 곡 02 순서 드래그",
              exact: true,
            })
            .last(),
          "ArrowUp",
        );
        expect(
          await page.evaluate(() => window.__simulatedPlayer.loads),
        ).toEqual(["v0000000000"]);
        await page.getByRole("tab", { name: "현재 곡", exact: true }).click();
        await page.keyboard.press("End");
        await expect(
          page.getByRole("tab", { name: "대기열 (20)", exact: true }),
        ).toBeFocused();
        await page.keyboard.press("Home");
        await expect(
          page.getByRole("tab", { name: "현재 곡", exact: true }),
        ).toBeFocused();
        const volumeTrigger = queuePanel.getByRole("button", {
          name: "음량 조절",
          exact: true,
        });
        await volumeTrigger.focus();
        await page.keyboard.press("ArrowUp");
        const volume = queuePanel.getByRole("slider", {
          name: "음량",
          exact: true,
        });
        await expect(volume).toBeFocused();
        await page.keyboard.press("Home");
        await page.keyboard.press("ArrowRight");
        await expect(volume).toHaveValue("1");
        expect(await page.evaluate(() => window.__simulatedPlayer.volume)).toBe(
          1,
        );
        await expect(
          queuePanel.getByRole("button", { name: "음소거", exact: true }),
        ).toHaveCount(0);
        await expect(queuePanel.locator(".volume-popover")).toHaveText("");
        await page.screenshot({
          path: `test-results/app-volume-popover-${viewport.width}.png`,
          fullPage: true,
        });
        const transportRows = await queuePanel
          .locator(".transport > button")
          .evaluateAll((nodes) =>
            nodes.map((node) =>
              Math.round(
                node.getBoundingClientRect().top +
                  node.getBoundingClientRect().height / 2,
              ),
            ),
          );
        expect(new Set(transportRows).size).toBe(1);
        await page.keyboard.press("Escape");
        await expect(volume).toHaveCount(0);
        await expect(volumeTrigger).toBeFocused();
        await expect(
          page.getByRole("button", { name: "대기열 닫기", exact: true }),
        ).toBeVisible();
        expect(
          await page.evaluate(() => window.player === window.__originalPlayer),
        ).toBe(true);
        await page.evaluate(() => window.__simulateMediaError());
        await expect(page.getByRole("alert")).toContainText(
          "이 곡을 재생할 수 없어요",
        );
        await expect(
          queuePanel.getByRole("button", { name: "재생", exact: true }),
        ).toBeDisabled();
        await expect(
          queuePanel.getByRole("button", { name: "일시 정지", exact: true }),
        ).toHaveCount(0);
        await page.screenshot({
          path: `test-results/app-error-${viewport.width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "다시 시도", exact: true })
          .click();
        await expect
          .poll(() =>
            page.evaluate(() => window.__simulatedPlayer.loads.length),
          )
          .toBe(2);
        expect(
          await page.evaluate(() => ({
            instances: window.__simulatedPlayer.instances,
            destroys: window.__simulatedPlayer.destroys,
            replaced: window.player !== window.__originalPlayer,
          })),
        ).toEqual({ instances: 2, destroys: 1, replaced: true });
        await expect(
          queuePanel.getByRole("button", { name: "일시 정지", exact: true }),
        ).toBeEnabled();
        await expect(page.getByRole("alert")).toHaveCount(0);
        await page
          .getByRole("button", { name: "대기열 닫기", exact: true })
          .click();
        // Whole-list append keeps the current song and extends only the queue.
        await page
          .locator("main")
          .getByRole("button", { name: "더보기", exact: true })
          .click();
        await page
          .getByRole("menuitem", { name: "대기열 끝에 추가", exact: true })
          .click();
        await page
          .getByRole("button", { name: "재생 대기열", exact: true })
          .click();
        await expect(
          page.getByRole("tab", { name: "대기열 (40)", exact: true }),
        ).toBeVisible();
        expect(
          await page.evaluate(() => window.__simulatedPlayer.loads),
        ).toEqual(["v0000000000", "v0000000000"]);
        // Leave a real, unconsumed Undo active while opening nested forms.
        // It must occupy normal modal flow, not cover the picker submit button.
        await queuePanel
          .getByRole("button", { name: "검증용 곡 20 더보기", exact: true })
          .last()
          .click();
        const lastMenu = await page
          .getByRole("menu", { name: "선택 메뉴", exact: true })
          .boundingBox();
        const panelBounds = await queuePanel.boundingBox();
        expect(lastMenu.y + lastMenu.height).toBeLessThanOrEqual(
          panelBounds.y + panelBounds.height - 8,
        );
        if (viewport.width >= 1200) {
          const dockBounds = await page
            .locator(".listening-dock")
            .boundingBox();
          expect(lastMenu.y + lastMenu.height).toBeLessThanOrEqual(
            dockBounds.y,
          );
        }
        await page.screenshot({
          path: `test-results/app-queue-bottom-menu-${viewport.width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("menuitem", { name: "대기열에서 삭제", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "실행 취소", exact: true }),
        ).toBeVisible();
        // Undo remains reachable beside the one-screen editor; standalone import is tested next.
        await page.evaluate(() => {
          window.__beforeImportPlayer = window.player;
        });
        await page
          .getByRole("button", {
            name: "대기열을 재생목록에 저장",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", { name: "새 재생목록 만들기", exact: true })
          .click();
        const picker = page.getByRole("dialog", {
          name: "재생목록에 추가",
          exact: true,
        });
        const pickerSubmit = picker.getByRole("button", {
          name: "만들고 추가",
          exact: true,
        });
        const liveUndo = picker.getByRole("button", {
          name: "실행 취소",
          exact: true,
        });
        await expect(liveUndo).toBeVisible();
        expect(
          await liveUndo.evaluate(
            (node) => getComputedStyle(node.parentElement).position,
          ),
        ).toBe("static");
        const submitRect = await pickerSubmit.boundingBox();
        const undoRect = await liveUndo.boundingBox();
        expect(submitRect.y + submitRect.height).toBeLessThanOrEqual(
          undoRect.y,
        );
        await pickerSubmit.focus();
        await page.keyboard.press("Tab");
        await expect(liveUndo).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(pickerSubmit).toBeFocused();
        await page.getByLabel("이름", { exact: true }).fill("유지할 작업 입력");
        const titleBox = await page
          .getByLabel("이름", { exact: true })
          .boundingBox();
        await page.mouse.move(
          titleBox.x + 20,
          titleBox.y + titleBox.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(2, 2, { steps: 10 });
        await page.mouse.up();
        await expect(picker).toBeVisible();
        await expect(page.getByLabel("이름", { exact: true })).toHaveValue(
          "유지할 작업 입력",
        );

        await picker
          .getByRole("button", { name: "실행 취소", exact: true })
          .click();
        await expect(page.getByLabel("이름", { exact: true })).toHaveValue(
          "유지할 작업 입력",
        );
        await expect(queuePanel.locator('[role="tab"]').last()).toHaveText(
          "대기열 (40)",
        );
        await expect(
          page.getByRole("button", { name: "실행 취소", exact: true }),
        ).toHaveCount(0);
        await pickerSubmit.click(); // Normal hit-tested click after a real Undo, no overlay dismissal workaround.
        await expect(picker).toHaveCount(0);
        await page
          .getByRole("button", { name: "대기열 닫기", exact: true })
          .click();
        await page
          .getByRole("navigation", { name: "현재 위치" })
          .getByRole("link", { name: "라이브러리" })
          .click();
        await page
          .getByRole("button", { name: "새 재생목록", exact: true })
          .click();
        await page.screenshot({
          path: `test-results/app-create-form-${viewport.width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "유튜브에서 가져오기", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "실행 취소", exact: true }),
        ).toHaveCount(0);
        await page
          .getByLabel("공개 재생목록 URL")
          .fill("https://youtube.com/playlist?list=PLtest123");
        await page.getByLabel("목록 이름").fill("가져온 검수 목록");
        await page
          .getByRole("button", { name: "재생목록 추가", exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: "가져온 검수 목록", exact: true }),
        ).toBeFocused();
        await expect(page.getByLabel("영상 URL")).toHaveCount(0);
        expect(
          await page.evaluate(
            () => window.player === window.__beforeImportPlayer,
          ),
        ).toBe(true);
        await expect(
          page.getByRole("button", { name: "대기열 닫기", exact: true }),
        ).toHaveCount(0);
        // The simulated preview supplies deterministic IDs; these assertions
        // prove local persistence/confirmation, never live YouTube completeness.
        const importedID = page.url().split("/playlist/")[1];
        const readImported = () =>
          page.evaluate(async (id) => {
            const request = indexedDB.open("simple-music-player-local-v1", 1);
            const db = await new Promise((resolve, reject) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            const row = await new Promise((resolve, reject) => {
              const tx = db.transaction("playlists", "readonly");
              const read = tx.objectStore("playlists").get(id);
              read.onsuccess = () => resolve(read.result);
              read.onerror = () => reject(read.error);
            });
            db.close();
            return row;
          }, importedID);
        const savedSongData = (row) =>
          row.items.map(({ key, ...item }) => item);
        const initialRecord = await readImported();
        expect(initialRecord.initialSnapshot.version).toBe(1);
        expect(initialRecord.initialSnapshot.capturedAt).toBeGreaterThan(0);
        expect(
          initialRecord.initialSnapshot.items.map((item) => item.videoID),
        ).toEqual(["abcdefghijk", "lmnopqrstuv"]);
        expect(initialRecord.info.initialSnapshot).toBeUndefined();
        const sourceMenu = async (name) => {
          await page
            .locator("main")
            .getByRole("button", { name: "더보기", exact: true })
            .click();
          await page.getByRole("menuitem", { name, exact: true }).click();
        };
        await sourceMenu("재생목록 수정");
        await page.getByLabel("제목", { exact: true }).fill("내가 수정한 이름");
        await page
          .getByLabel("설명", { exact: true })
          .fill("원본 복원 후에도 보존할 설명");
        await page
          .getByRole("button", { name: "변경 저장", exact: true })
          .click();
        await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
          "내가 수정한 이름",
        );
        await page
          .locator("main")
          .getByRole("button", { name: "곡 추가", exact: true })
          .click();
        await page.getByLabel("영상 URL").fill("https://youtu.be/qwertyuiopa");
        await page.getByLabel("곡 이름 (선택)").fill("로컬 추가");
        await page.getByRole("button", { name: "추가", exact: true }).click();
        await expect(
          page.getByRole("dialog", { name: "곡 추가", exact: true }),
        ).toHaveCount(0);
        expect((await readImported()).items).toHaveLength(3);
        const instancesBeforeRestore = await page.evaluate(
          () => window.__simulatedPlayer.instances,
        );
        await sourceMenu("처음 가져온 목록으로 복원");
        await expect(
          page.getByRole("heading", {
            name: "처음 가져온 2곡으로 복원할까요?",
            exact: true,
          }),
        ).toBeVisible();
        expect((await readImported()).items).toHaveLength(3);
        await expect(
          page.getByRole("heading", {
            name: "처음 가져온 2곡으로 복원할까요?",
            exact: true,
          }),
        ).toHaveCSS("word-break", "keep-all");
        await page.screenshot({
          path: `test-results/app-source-restore-${viewport.width}.png`,
          fullPage: true,
        });
        await page.getByRole("button", { name: "복원", exact: true }).click();
        await expect(
          page.getByRole("dialog", {
            name: "처음 가져온 목록으로 복원",
            exact: true,
          }),
        ).toHaveCount(0);
        expect(
          await page.evaluate(() => window.__simulatedPlayer.instances),
        ).toBe(instancesBeforeRestore);
        expect(savedSongData(await readImported())).toEqual(
          initialRecord.initialSnapshot.items,
        );
        await page.evaluate(() => {
          window.__simulatedPlaylistIDs = ["lmnopqrstuv", "zyxwvutsrqp"];
        });
        await sourceMenu("YouTube 최신 목록 가져오기");
        const replaceLatest = page.getByRole("button", {
          name: "최신 목록으로 교체",
          exact: true,
        });
        await expect(replaceLatest).toBeEnabled();
        expect(savedSongData(await readImported())).toEqual(
          initialRecord.initialSnapshot.items,
        );
        await page.screenshot({
          path: `test-results/app-source-latest-${viewport.width}.png`,
          fullPage: true,
        });
        await replaceLatest.click();
        await expect(
          page.getByRole("dialog", {
            name: "YouTube 최신 목록 가져오기",
            exact: true,
          }),
        ).toHaveCount(0);
        const refreshed = await readImported();
        expect(refreshed.items.map((item) => item.videoID)).toEqual([
          "lmnopqrstuv",
          "zyxwvutsrqp",
        ]);
        expect(refreshed.initialSnapshot).toEqual(
          initialRecord.initialSnapshot,
        );
        expect(refreshed.info).toMatchObject({
          name: "내가 수정한 이름",
          description: "원본 복원 후에도 보존할 설명",
        });
        await sourceMenu("처음 가져온 목록으로 복원");
        await page.getByRole("button", { name: "복원", exact: true }).click();
        await expect(
          page.getByRole("dialog", {
            name: "처음 가져온 목록으로 복원",
            exact: true,
          }),
        ).toHaveCount(0);
        expect(savedSongData(await readImported())).toEqual(
          initialRecord.initialSnapshot.items,
        );
        expect(
          await page.evaluate(
            () => window.player === window.__beforeImportPlayer,
          ),
        ).toBe(true);
        await expect(
          page.locator('dialog.now-panel [role="tab"]').last(),
        ).toHaveText("대기열 (40)");
      }
      if (viewport.width === 1440) {
        await page.evaluate(async () => {
          const request = indexedDB.open("simple-music-player-local-v1", 1);
          const db = await new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result);
          });
          await new Promise((resolve, reject) => {
            const tx = db.transaction("playlists", "readwrite");
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
            for (let index = 8; index < 30; index++)
              tx.objectStore("playlists").put({
                info: {
                  id: `stress-${index}`,
                  name: `긴 제목 검수 ${index} — 음악과 함께하는 아주 긴 한국어 제목과 Long English Playlist Title`,
                  description: "레이아웃 검수용",
                  createdAt: 10000 - index,
                  itemCount: 0,
                  thumbnails: [],
                },
                items: [],
              });
          });
          db.close();
        });
        await page.goto(base);
        await expect(page.locator(".playlist-card")).toHaveCount(33);
        await page.locator(".card-title").last().scrollIntoViewIfNeeded();
        await assertFits("30+ lists");
        await page
          .getByRole("heading", { name: "내 라이브러리", exact: true })
          .scrollIntoViewIfNeeded();
        // Browser font enlargement approximation, not a claim of real-device text zoom coverage.
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
        const assertSortReadable = async () => {
          const value = page.locator(
            '[data-slot="select-trigger"] [data-slot="select-value"]',
          );
          expect(
            await value.evaluate(
              (node) => node.scrollWidth <= node.clientWidth,
            ),
          ).toBe(true);
          await expect(value).toHaveText("최근 추가순");
        };
        await assertFits("200% text approximation");
        await assertSortReadable();
        await page.screenshot({
          path: "test-results/app-text-200-1440.png",
          fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await assertFits("200% text narrow approximation");
        const enlargedHeading = await page
          .locator(".page-heading > div")
          .first()
          .boundingBox();
        const enlargedActions = await page
          .locator(".heading-actions")
          .boundingBox();
        expect(enlargedActions.y).toBeGreaterThanOrEqual(
          enlargedHeading.y + enlargedHeading.height,
        );
        for (const action of await page
          .locator(".heading-actions button")
          .all()) {
          const bounds = await action.boundingBox();
          expect(bounds.x).toBeGreaterThanOrEqual(16);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(374);
        }
        await assertSortReadable();
        await page.screenshot({
          path: "test-results/app-text-200-390.png",
          fullPage: true,
        });
        await page.setViewportSize(viewport);
      }
      await assertFits("final");
      expect(errors).toEqual([]);
      await context.tracing.stop();
      console.log(
        JSON.stringify({
          suite: "electric-night",
          viewport,
          errors,
          media: "simulated-only",
        }),
      );
    } catch (error) {
      const prefix = `test-results/electric-failure-${viewport.width}`;
      await Promise.allSettled([
        page.screenshot({ path: `${prefix}.png`, fullPage: true }),
        page
          .content()
          .then((value) => fs.writeFileSync(`${prefix}.html`, value)),
        page
          .evaluate(() => ({
            dialogEvents: window.__dialogAudit,
            activeElement: document.activeElement.outerHTML,
            mainOverflow: [...document.querySelectorAll(".studio-main *")]
              .filter((node) => {
                const bounds = node.getBoundingClientRect();
                return (
                  bounds.width &&
                  (bounds.right > innerWidth + 1 || bounds.left < -1)
                );
              })
              .slice(0, 20)
              .map((node) => ({
                tag: node.tagName,
                className: String(node.className),
                text: node.textContent?.slice(0, 80),
                rect: node.getBoundingClientRect().toJSON(),
              })),
          }))
          .then((value) =>
            fs.writeFileSync(
              `${prefix}-state.json`,
              JSON.stringify(value, null, 2),
            ),
          ),
        page
          .locator("body")
          .ariaSnapshot()
          .then((value) => fs.writeFileSync(`${prefix}-aria.txt`, value)),
      ]);
      await context.tracing
        .stop({ path: `${prefix}-trace.zip` })
        .catch(() => {});
      failures.push({ viewport, error: error.stack || String(error) });
      console.error(
        `Electric Night ${viewport.width}px failed: ${error.message}`,
      );
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  fs.writeFileSync(
    "test-results/electric-failures.json",
    JSON.stringify(failures, null, 2),
  );
  throw new AggregateError(
    failures.map(
      (failure) => new Error(`${failure.viewport.width}px: ${failure.error}`),
    ),
    `${failures.length} Electric Night viewport(s) failed`,
  );
}
