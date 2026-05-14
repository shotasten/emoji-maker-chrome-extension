let selectedImage = null;

async function getWorkspaces() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_WORKSPACES' }, response => {
      if (chrome.runtime.lastError) {
        chrome.storage.local.get(['workspaces'], ({ workspaces = [] }) => resolve(workspaces));
        return;
      }
      resolve(response?.workspaces ?? []);
    });
  });
}

function renderWorkspaces(workspaces) {
  const noWs = document.getElementById('no-workspace');
  const mainForm = document.getElementById('main-form');
  const select = document.getElementById('workspace-select');

  if (workspaces.length === 0) {
    noWs.classList.remove('hidden');
    return;
  }

  mainForm.classList.remove('hidden');
  select.innerHTML = '';
  workspaces.forEach(ws => {
    const opt = document.createElement('option');
    opt.value = ws.id;
    opt.textContent = ws.name || ws.domain;
    select.appendChild(opt);
  });
}

function setStatus(message, type) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.className = `status ${type}`;
}

function updateButton() {
  const name = document.getElementById('emoji-name').value.trim();
  document.getElementById('upload-btn').disabled = !name || !selectedImage;
}

function handleFile(file) {
  if (!file?.type.startsWith('image/')) return;

  if (file.size > 128 * 1024) {
    setStatus('画像は128KB以下にしてください', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    selectedImage = {
      base64: dataUrl.split(',')[1],
      mimeType: file.type
    };

    document.getElementById('preview').src = dataUrl;
    document.getElementById('preview').classList.remove('hidden');
    document.getElementById('drop-text').classList.add('hidden');
    updateButton();
  };
  reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', async () => {
  const workspaces = await getWorkspaces();
  renderWorkspaces(workspaces);

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const nameInput = document.getElementById('emoji-name');
  const uploadBtn = document.getElementById('upload-btn');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

  nameInput.addEventListener('input', () => {
    nameInput.value = nameInput.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    updateButton();
  });

  uploadBtn.addEventListener('click', () => {
    const workspaceId = document.getElementById('workspace-select').value;
    const name = nameInput.value.trim();
    if (!workspaceId || !name || !selectedImage) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'アップロード中...';
    document.getElementById('status').className = 'status hidden';

    chrome.runtime.sendMessage(
      {
        type: 'UPLOAD_EMOJI',
        workspaceId,
        name,
        imageBase64: selectedImage.base64,
        mimeType: selectedImage.mimeType
      },
      response => {
        uploadBtn.textContent = 'アップロード';
        updateButton();

        if (response?.ok) {
          setStatus('✓ アップロード完了！', 'success');
        } else {
          setStatus(response?.error || 'アップロードに失敗しました', 'error');
        }
      }
    );
  });
});
