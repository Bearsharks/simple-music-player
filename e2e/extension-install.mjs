import fs from "node:fs";
import path from "node:path";
import { chromium, expect } from "@playwright/test";

const base = process.env.TEST_URL || "http://127.0.0.1:4187/simple-music-player/";
const output = process.env.IMPORT_REPORT_DIR || "test-results/extension-install";
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    const install = page.getByRole("button", { name: "확장 프로그램 다운로드", exact: true });
    await expect(install).toBeVisible();
    await expect(page.getByRole("button", { name: "담은 목록", exact: true })).toHaveCount(0);
    await install.click();
    const dialog = page.getByRole("dialog", { name: "확장 프로그램 설치" });
    await expect(dialog).toBeVisible();
    const downloadLink = dialog.getByRole("link", { name: "확장 프로그램 다운로드" });
    await expect(downloadLink).toHaveAttribute("href", new URL("downloads/loopy-extension.zip", base).pathname);
    const [download] = await Promise.all([page.waitForEvent("download"), downloadLink.click()]);
    expect(download.suggestedFilename()).toBe("loopy-extension.zip");
    await download.saveAs(path.join(output, `${width}-loopy-extension.zip`));
    await expect(dialog.getByRole("textbox", { name: "확장 관리 주소" })).toHaveValue("chrome://extensions");
    await page.screenshot({ path: path.join(output, `${width}-install.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Connection simulation only; real extension transport is exercised separately.
    await page.evaluate(() => {
      window.chrome = window.chrome || {};
      window.__connectionOK=true;window.__connectionCalls=0;
      window.chrome.runtime = { sendMessage(_id, message, callback) { window.__connectionCalls++;callback({ ok: window.__connectionOK, request: null }); } };
    });
    await dialog.getByRole("button", { name: "연결 확인", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(install).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "목록 편집" })).toHaveCount(0);
    if(width===1440){
      await page.evaluate(()=>{window.__connectionOK=false;window.dispatchEvent(new Event("focus"));document.dispatchEvent(new Event("visibilitychange"));});
      await page.waitForTimeout(6000);
      expect(await page.evaluate(()=>window.__connectionCalls)).toBe(1);await expect(install).toHaveCount(0);
      await expect(page.getByRole("button",{name:"연결 확인",exact:true})).toHaveCount(0);
    }
    expect(errors).toEqual([]);
    await page.close();
  }
  console.log("PASS: no-extension install guide, extension ZIP download, 1440/390/320 layout, explicit recheck and connected auto-hide (runtime simulated).");
} finally { await browser.close(); }
