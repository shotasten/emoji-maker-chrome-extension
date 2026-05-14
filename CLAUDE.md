# Chrome Web Store リリース手順

## 事前準備

1. 絵文字メーカー（`../emoji-maker`）を起動しておく
   ```bash
   cd ../emoji-maker && npm run dev
   ```

2. 依存パッケージをインストール（初回のみ）
   ```bash
   npm install
   npx playwright install chromium
   ```

## リリース

```bash
npm run release
```

以下が生成される：

| ファイル | 用途 |
|----------|------|
| `screenshots/01_overview.png` | Chrome Web Store 掲載ページにアップロード |
| `screenshots/02_slack_panel.png` | Chrome Web Store 掲載ページにアップロード |
| `release/emoji-maker-extension-vX.X.X.zip` | Chrome Web Store ダッシュボードにアップロード |

## バージョンを上げる場合

`manifest.json` の `version` を更新してから `npm run release` を実行する。
