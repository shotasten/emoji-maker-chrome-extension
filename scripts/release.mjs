#!/usr/bin/env node
/**
 * npm run release
 *
 * 1. localhost:3000 のスクリーンショットを screenshots/ に保存
 * 2. 拡張機能を Chrome Web Store 提出用 ZIP に固める → release/
 *
 * 事前に絵文字メーカー (http://localhost:3000) を起動しておくこと。
 */

import { chromium } from "playwright";
import { createWriteStream, mkdirSync, readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const archiver = createRequire(import.meta.url)("archiver");

const ROOT = dirname(fileURLToPath(import.meta.url)) + "/..";
const APP_URL = "http://localhost:3000";

// manifest から version を取得
const { version } = JSON.parse(readFileSync(`${ROOT}/manifest.json`, "utf8"));

// ── 1. スクリーンショット ────────────────────────────────────────────
console.log("📸 スクリーンショットを撮影しています...");
mkdirSync(`${ROOT}/screenshots`, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

await page.goto(APP_URL, { waitUntil: "networkidle" }).catch(() => {
  console.error(`\n❌ ${APP_URL} に接続できません。先に絵文字メーカーを起動してください。`);
  process.exit(1);
});
await page.waitForTimeout(1000);
await page.screenshot({ path: `${ROOT}/screenshots/01_overview.png` });
console.log("  ✓ 01_overview.png");

// 拡張インストール済みをシミュレート
await page.evaluate(() => {
  window.addEventListener("message", (e) => {
    if (e.data?.type === "GET_WORKSPACES" && e.data?.source === "emoji-maker-page") {
      window.dispatchEvent(new MessageEvent("message", {
        data: {
          source: "emoji-maker-ext",
          type: "WORKSPACES",
          requestId: e.data.requestId,
          workspaces: [{ id: "T123456", name: "My Workspace", domain: "myworkspace" }],
        },
      }));
    }
  });
  window.dispatchEvent(new MessageEvent("message", {
    data: { source: "emoji-maker-ext", type: "READY" },
  }));
});
await page.waitForTimeout(300);

await page.getByText("Slack に登録").click();
await page.waitForSelector("select", { timeout: 3000 }).catch(() => {});
await page.waitForTimeout(300);
await page.screenshot({ path: `${ROOT}/screenshots/02_slack_panel.png` });
console.log("  ✓ 02_slack_panel.png");

await browser.close();

// ── 2. ZIP 作成 ──────────────────────────────────────────────────────
console.log("\n📦 ZIP を作成しています...");
mkdirSync(`${ROOT}/release`, { recursive: true });

const zipName = `emoji-maker-extension-v${version}.zip`;
const zipPath = `${ROOT}/release/${zipName}`;

await new Promise((resolve, reject) => {
  const output = createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  output.on("close", resolve);
  archive.on("error", reject);
  archive.pipe(output);

  // 含めるファイル/ディレクトリ（screenshots・scripts・node_modules等は除外）
  archive.file(`${ROOT}/manifest.json`, { name: "manifest.json" });
  archive.directory(`${ROOT}/background/`, "background");
  archive.directory(`${ROOT}/content/`, "content");
  archive.directory(`${ROOT}/icons/`, "icons");

  archive.finalize();
});

console.log(`  ✓ release/${zipName}`);
console.log("\n✅ 完了！");
console.log(`   スクリーンショット → screenshots/`);
console.log(`   提出用 ZIP        → release/${zipName}`);
