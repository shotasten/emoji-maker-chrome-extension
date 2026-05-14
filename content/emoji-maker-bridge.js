// emoji-maker.shotaste.com 上で動くブリッジ
// ページに拡張インストール済みを通知し、postMessage で Slack 連携を仲介する

document.documentElement.setAttribute('data-emoji-maker-ext', '1');

// ページの JS が読み込まれるタイミングに合わせて READY を送信
window.postMessage({ source: 'emoji-maker-ext', type: 'READY' }, '*');

window.addEventListener('message', (event) => {
  if (event.source !== window || event.data?.source !== 'emoji-maker-page') return;

  const { type, requestId } = event.data;

  if (type === 'GET_WORKSPACES') {
    chrome.runtime.sendMessage({ type: 'GET_WORKSPACES' }, (response) => {
      window.postMessage({
        source: 'emoji-maker-ext',
        type: 'WORKSPACES',
        requestId,
        workspaces: response?.workspaces ?? []
      }, '*');
    });
    return;
  }

  if (type === 'UPLOAD_EMOJI') {
    const { workspaceId, name, imageBase64, mimeType } = event.data;
    chrome.runtime.sendMessage(
      { type: 'UPLOAD_EMOJI', workspaceId, name, imageBase64, mimeType },
      (response) => {
        window.postMessage({
          source: 'emoji-maker-ext',
          type: 'UPLOAD_RESULT',
          requestId,
          ok: response?.ok ?? false,
          error: response?.error
        }, '*');
      }
    );
  }
});
