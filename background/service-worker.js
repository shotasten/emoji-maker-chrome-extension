chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SLACK_WORKSPACES') {
    chrome.storage.local.get(['workspaces'], ({ workspaces = [] }) => {
      const map = new Map(workspaces.map(ws => [ws.id, ws]));
      message.workspaces.forEach(ws => map.set(ws.id, ws));
      chrome.storage.local.set({ workspaces: [...map.values()] });
    });
    return;
  }

  if (message.type === 'GET_WORKSPACES') {
    chrome.storage.local.get(['workspaces'], ({ workspaces = [] }) => {
      sendResponse({ workspaces });
    });
    return true;
  }

  if (message.type === 'UPLOAD_EMOJI') {
    handleUpload(message)
      .then(sendResponse)
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

async function handleUpload({ workspaceId, name, imageBase64, mimeType }) {
  const { workspaces = [] } = await chrome.storage.local.get(['workspaces']);
  const workspace = workspaces.find(ws => ws.id === workspaceId);

  if (!workspace) {
    throw new Error('ワークスペースが見つかりません。Slackをブラウザで開いてください。');
  }

  const tabs = await chrome.tabs.query({ url: `https://${workspace.domain}.slack.com/*` });
  if (tabs.length === 0) {
    throw new Error(`${workspace.name} のタブが開いていません。Slackを開いてください。`);
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: async (token, emojiName, imageBase64, mimeType) => {
      const blob = await fetch(`data:${mimeType};base64,${imageBase64}`).then(r => r.blob());
      const form = new FormData();
      form.append('token', token);
      form.append('name', emojiName);
      form.append('mode', 'data');
      form.append('image', blob, `${emojiName}.png`);

      const res = await fetch('/api/emoji.add', {
        method: 'POST',
        body: form,
        credentials: 'include'
      });
      return res.json();
    },
    args: [workspace.token, name, imageBase64, mimeType]
  });

  if (!result.result?.ok) {
    throw new Error(result.result?.error || 'アップロードに失敗しました');
  }

  return { ok: true };
}
