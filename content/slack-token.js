(function () {
  try {
    const raw = localStorage.getItem('localConfig_v2');
    if (!raw) return;

    const config = JSON.parse(raw);
    const teams = config.teams || {};

    const workspaces = Object.values(teams)
      .filter(team => team.token && team.token.startsWith('xoxc-'))
      .map(team => ({
        id: team.id,
        name: team.name,
        domain: team.domain,
        token: team.token
      }));

    if (workspaces.length > 0) {
      chrome.runtime.sendMessage({ type: 'SLACK_WORKSPACES', workspaces });
    }
  } catch (_) {}
})();
