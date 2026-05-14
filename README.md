# 絵文字メーカー Chrome 拡張機能

[絵文字メーカー](https://emoji-maker.shotaste.com) で作った絵文字を、Slack ワークスペースに直接登録できる Chrome 拡張機能です。

## 使い方

1. この拡張機能をインストール
2. ブラウザで Slack にログイン
3. [絵文字メーカー](https://emoji-maker.shotaste.com) で絵文字を生成
4. 「登録する」ボタンを押してワークスペースと絵文字名を入力
5. 登録完了！

## ローカルで Chrome に追加する方法

### 1. リポジトリをクローン

```bash
git clone git@github.com:shotasten/emoji-maker-chrome-extension.git
```

### 2. Chrome の拡張機能ページを開く

Chrome のアドレスバーに以下を入力して開きます。

```
chrome://extensions
```

### 3. デベロッパーモードをオンにする

右上の「デベロッパーモード」トグルをオンにします。

### 4. 拡張機能を読み込む

「パッケージ化されていない拡張機能を読み込む」をクリックし、クローンしたフォルダ（`emoji-maker-chrome-extension`）を選択します。

### 5. 完了

ツールバーに絵文字メーカーのアイコンが表示されれば完了です。

---

> **注意:** Slack のトークン取得に非公式 API を使用しています。Slack の仕様変更により動作しなくなる可能性があります。
