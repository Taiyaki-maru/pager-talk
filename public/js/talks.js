async function fetchTalks() {
  try {
    const res = await fetch('/api/talks');
    if (!res.ok) return;
    const talks = await res.json();
    const listEl = document.getElementById('talks-list');
    
    listEl.innerHTML = talks.map(t => `
      <a href="/chat/${t.user.id}" class="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center border-bottom">
        <div>
          <span class="fw-bold me-2">${t.user.displayName}</span>
          ${t.hasUnread ? '<span class="unread-badge">●</span>' : ''}
          <div class="small text-muted mt-1">${t.latestMessage ? t.latestMessage : 'メッセージなし'}</div>
        </div>
        <span class="small">[ 開く ]</span>
      </a>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

fetchTalks();
setInterval(fetchTalks, 3000); // 3秒ごとにショートポーリング