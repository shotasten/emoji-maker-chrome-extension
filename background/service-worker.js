chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://emoji-maker.shotaste.com' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_WORKSPACES') {
    getWorkspaces()
      .then(workspaces => sendResponse({ workspaces }))
      .catch(err => sendResponse({ workspaces: [], error: err.message }));
    return true;
  }

  if (message.type === 'UPLOAD_EMOJI') {
    uploadEmoji(message)
      .then(sendResponse)
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

async function getWorkspaces() {
  const res = await fetch('https://slack.com/signin', { credentials: 'include' });
  if (!res.ok) throw new Error('Slackにログインしてください');

  const html = await res.text();

  const match =
    html.match(/id="props_node"[^>]*data-props="([^"]*)"/) ||
    html.match(/data-props="([^"]*)"[^>]*id="props_node"/);

  if (!match) throw new Error('ワークスペース情報を取得できませんでした');

  const props = JSON.parse(
    match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
  );

  const teams = props.loggedInTeams || [];
  return teams
    .filter(t => !(t.isEnterprise || t.is_enterprise))
    .map(t => {
      const domain = t.domain || t.teamDomain || t.team_domain ||
        (t.url || t.teamUrl || '').match(/\/\/([^.]+)\.slack\.com/)?.[1] || '';
      return {
        id: t.id || t.teamId || t.team_id,
        name: t.name || t.teamName || t.team_name || domain,
        domain
      };
    })
    .filter(t => t.id && t.domain);
}

async function getToken(domain) {
  const res = await fetch(`https://${domain}.slack.com/customize/emoji`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('トークンの取得に失敗しました');

  const html = await res.text();
  const match = html.match(/api_token[\\'"]*\s*:\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error('トークンが見つかりませんでした');

  return match[1];
}

async function uploadEmoji({ workspaceId, name, imageBase64, mimeType }) {
  const workspaces = await getWorkspaces();
  const workspace = workspaces.find(ws => ws.id === workspaceId);
  if (!workspace) throw new Error('ワークスペースが見つかりません');

  const token = await getToken(workspace.domain);

  const bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });

  const form = new FormData();
  form.append('token', token);
  form.append('name', name);
  form.append('mode', 'data');
  form.append('image', blob, `${name}.png`);

  const res = await fetch(`https://${workspace.domain}.slack.com/api/emoji.add`, {
    method: 'POST',
    body: form,
    credentials: 'include'
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'アップロードに失敗しました');

  return { ok: true };
}
