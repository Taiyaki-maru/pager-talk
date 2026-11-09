async function fetchDictionary() {
  try {
    const res = await fetch('/api/dictionary');
    if (!res.ok) return;
    const dicts = await res.json();
    const listEl = document.getElementById('dictionary-list');

    if (dicts.length === 0) {
      listEl.innerHTML = '<div class="text-center text-muted py-3">登録された辞書がありません</div>';
      return;
    }

    listEl.innerHTML = dicts.map(d => `
      <div class="list-group-item py-3 d-flex justify-content-between align-items-center border-bottom">
        <div>
          <span class="fw-bold me-3" style="font-size: 1.1rem;">${d.code}</span>
          <span class="text-muted small">${d.label}</span>
        </div>
        <button class="btn btn-sm btn-pager-outline" onclick="deleteDictionary(${d.id})">[ 削除 ]</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function addDictionary() {
  const code = document.getElementById('new-code').value.trim();
  const label = document.getElementById('new-label').value.trim();

  if (!code || !/^[0-9]{1,16}$/.test(code)) {
    alert("数字コードは半角数字1〜16桁で入力してください。");
    return;
  }
  if (!label) {
    alert("意味を入力してください。");
    return;
  }

  try {
    const res = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, label })
    });

    if (res.ok) {
      document.getElementById('new-code').value = '';
      document.getElementById('new-label').value = '';
      const modalEl = document.getElementById('addDictModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      fetchDictionary();
    } else {
      const data = await res.json();
      alert(data.error || "追加に失敗しました。");
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteDictionary(id) {
  if (!confirm("この項目を削除してもよろしいですか？")) return;

  try {
    const res = await fetch(`/api/dictionary/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchDictionary();
    } else {
      alert("削除に失敗しました。");
    }
  } catch (err) {
    console.error(err);
  }
}

fetchDictionary();