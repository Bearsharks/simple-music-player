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
      await assertFits("library");
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
      await expect(page.getByLabel("추가할 영상 URL")).toHaveCount(0);
      await assertFits("detail");
      await page.screenshot({
        path: `test-results/app-detail-${viewport.width}.png`,
        fullPage: true,
      });
      if ([390, 1440].includes(viewport.width)) {
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
        const menu = page.getByRole("group", { name: "선택 메뉴" });
        await expect(menu).toBeVisible();
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
        // Nested native top layers: menu → destination picker → creation → import.
        await page
          .getByRole("button", { name: "검증용 곡 01 더보기", exact: true })
          .last()
          .click();
        await page
          .getByRole("button", { name: "재생목록에 추가", exact: true })
          .click();
        await page
          .getByRole("button", { name: "새 재생목록 선택", exact: true })
          .click();
        await page.getByRole("button", { name: "추가", exact: true }).click();
        await expect(page.getByLabel("제목", { exact: true })).toBeFocused();
        await page
          .getByRole("button", { name: "유튜브에서 가져오기", exact: true })
          .click();
        await expect(page.getByLabel("공개 재생목록 URL")).toBeFocused();
        for (const width of [1199, 1200, 1199]) {
          await page.setViewportSize({ width, height: viewport.height });
          await expect(page.getByLabel("공개 재생목록 URL")).toBeVisible();
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
                  'dialog[aria-label="재생목록 URL 가져오기"]',
                ),
              ),
            ),
          ).toBe(true);
        }
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("dialog", { name: "재생목록 URL 가져오기" }),
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
          .getByRole("button", { name: "새 재생목록 선택", exact: true })
          .click();
        await page.getByRole("button", { name: "추가", exact: true }).click();
        await page.getByLabel("제목", { exact: true }).fill("보존한 대기열");
        await page.getByRole("button", { name: "만들기", exact: true }).click();
        await expect(
          page.getByRole("dialog", { name: "새 재생목록", exact: true }),
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
        const dragTo = await savedTracks.getByRole("button", {name:"검증용 곡 01 순서 드래그",exact:true}).boundingBox();
        await page.mouse.move(dragFrom.x + dragFrom.width/2, dragFrom.y + dragFrom.height/2);
        await page.mouse.down();
        await page.mouse.move(dragTo.x + dragTo.width/2, dragTo.y + dragTo.height/2, {steps:12});
        await page.mouse.up();
        await expect(savedTracks.locator("[data-track-focus]").first()).toHaveAttribute("aria-label", "검증용 곡 02 재생");
        await keyboardMove(savedHandle, "ArrowDown");
        await expect(savedTracks.locator("[data-track-focus]").first()).toHaveAttribute("aria-label", "검증용 곡 01 재생");
        await savedTracks
          .getByRole("button", { name: "검증용 곡 02 더보기", exact: true })
          .click();
        await page
          .getByRole("button", { name: "재생목록에서 삭제", exact: true })
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
        await page
          .getByRole("button", { name: "대기열에서 삭제", exact: true })
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
          .getByRole("button", { name: "대기열 끝에 추가", exact: true })
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
          .getByRole("group", { name: "선택 메뉴", exact: true })
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
        await page
          .getByRole("button", { name: "대기열에서 삭제", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "실행 취소", exact: true }),
        ).toBeVisible();
        // Switching the new-selection dialog to import deliberately navigates
        // on success, but only a narrow modal queue must close for the detail.
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
          .getByRole("button", { name: "새 재생목록 선택", exact: true })
          .click();
        const picker = page.getByRole("dialog", {
          name: "재생목록에 추가",
          exact: true,
        });
        const pickerSubmit = picker.getByRole("button", {
          name: "추가",
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
        await pickerSubmit.click(); // A normal hit-tested click while Undo remains active.
        const creation = page.getByRole("dialog", {
          name: "새 재생목록",
          exact: true,
        });
        await expect(
          creation.getByRole("button", { name: "실행 취소", exact: true }),
        ).toBeVisible();
        await page.getByLabel("제목", { exact: true }).fill("유지할 작업 입력");
        const titleBox = await page
          .getByLabel("제목", { exact: true })
          .boundingBox();
        await page.mouse.move(
          titleBox.x + 20,
          titleBox.y + titleBox.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(2, 2, { steps: 10 });
        await page.mouse.up();
        await expect(creation).toBeVisible();
        await expect(page.getByLabel("제목", { exact: true })).toHaveValue(
          "유지할 작업 입력",
        );

        await creation
          .getByRole("button", { name: "실행 취소", exact: true })
          .click();
        await expect(page.getByLabel("제목", { exact: true })).toHaveValue(
          "유지할 작업 입력",
        );
        await expect(queuePanel.locator('[role="tab"]').last()).toHaveText(
          "대기열 (40)",
        );
        await expect(
          page.getByRole("button", { name: "실행 취소", exact: true }),
        ).toHaveCount(0);
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
          .getByRole("button", { name: "미리보기", exact: true })
          .click();
        await page
          .getByRole("button", { name: "로컬에 저장", exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: "가져온 검수 목록", exact: true }),
        ).toBeFocused();
        await expect(page.getByLabel("추가할 영상 URL")).toHaveCount(0);
        expect(
          await page.evaluate(
            () => window.player === window.__beforeImportPlayer,
          ),
        ).toBe(true);
        if (viewport.width >= 1200) {
          await expect(
            page.getByRole("button", { name: "대기열 닫기", exact: true }),
          ).toBeVisible();
          await page
            .getByRole("button", { name: "대기열 닫기", exact: true })
            .click();
        } else {
          await expect(
            page.getByRole("button", { name: "대기열 닫기", exact: true }),
          ).toHaveCount(0);
        }
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
        await expect(page.locator(".playlist-card")).toHaveCount(32);
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
        await assertFits("200% text approximation");
        await page.screenshot({
          path: "test-results/app-text-200-1440.png",
          fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await assertFits("200% text narrow approximation");
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
