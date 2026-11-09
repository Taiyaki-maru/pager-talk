let currentInput = "";
const MAX_DIGITS = 16;

const getTargetId = () => {
  if (typeof TARGET_ID !== 'undefined' && TARGET_ID) return TARGET_ID;
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1];
};

function getDisplayEl() { return document.getElementById('display'); }
function getMessagesBox() { return document.getElementById('messages-box'); }

// テンキー押下
window.appendNum = function(num) {
  if (currentInput.length < MAX_DIGITS) {
    currentInput += num;
    updateDisplay();
  }
};

// クリア
window.clearNum = function() {
  currentInput = "";
  updateDisplay();
};

function updateDisplay() {
  const displayEl = getDisplayEl();
  if (!displayEl) return;
  if (currentInput.length === 0) {
    displayEl.textContent = "16桁以内の数字を入力";
    displayEl.style.color = "#888888";
  } else {
    displayEl.textContent = currentInput;
    displayEl.style.color = "#222222";
  }
}

// メッセージ履歴取得
async function fetchMessages() {
  const messagesBox = getMessagesBox();
  if (!messagesBox) return;
  const targetId = getTargetId();

  try {
    const res = await fetch(`/api/messages/${targetId}`);
    if (!res.ok) return;
    const messages = await res.json();
    
    // 相手の名前取得（取得できない場合のフォールバック表示付き）
    const nameEl = document.getElementById('target-name');
    const talksRes = await fetch('/api/talks');
    if (talksRes.ok) {
      const talks = await talksRes.json();
      const currentTalk = talks.find(t => t.user.id === parseInt(targetId, 10));
      if (currentTalk && nameEl) {
        nameEl.textContent = currentTalk.user.displayName;
      } else if (nameEl && nameEl.textContent === '読込中...') {
        nameEl.textContent = `ユーザーID:${targetId}`;
      }
    }

    const currentScrollBottom = messagesBox.scrollHeight - messagesBox.scrollTop === messagesBox.clientHeight;

    messagesBox.innerHTML = messages.length === 0 
      ? '<div class="text-center text-muted py-3">メッセージ履歴はありません</div>'
      : messages.map(m => {
          const isSelf = m.senderId !== parseInt(targetId, 10);
          return `
            <div class="d-flex mb-2">
              <div class="msg-bubble p-2 ${isSelf ? 'msg-self' : 'msg-target'}">
                ${m.numberText}
              </div>
            </div>
          `;
        }).join('');

    if (currentScrollBottom || messagesBox.scrollTop === 0) {
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }
  } catch (err) {
    console.error(err);
  }
}

// メッセージ送信
window.sendMessage = async function() {
  const targetId = getTargetId();
  if (!currentInput || !/^[0-9]{1,16}$/.test(currentInput)) {
    alert("1〜16桁の半角数字を入力してください。");
    return;
  }

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: targetId, numberText: currentInput })
    });

    if (res.ok) {
      currentInput = "";
      updateDisplay();
      await fetchMessages();
      const messagesBox = getMessagesBox();
      if (messagesBox) messagesBox.scrollTop = messagesBox.scrollHeight;
    } else {
      const data = await res.json();
      alert(data.error || "送信に失敗しました。");
    }
  } catch (err) {
    console.error(err);
  }
};

// 辞書選択モーダル
async function fetchModalDictionary() {
  try {
    const res = await fetch('/api/dictionary');
    if (!res.ok) return;
    const dicts = await res.json();
    const listEl = document.getElementById('modal-dict-list');
    if (!listEl) return;

    listEl.innerHTML = dicts.map(d => `
      <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onclick="selectDictCode('${d.code}')">
        <span class="fw-bold">${d.code}</span>
        <span class="small text-muted">${d.label}</span>
      </button>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

// 辞書選択
window.selectDictCode = function(code) {
  if ((currentInput + code).length <= MAX_DIGITS) {
    currentInput += code;
    updateDisplay();
    const modalEl = document.getElementById('dictModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      if (modal) modal.hide();
    }
  } else {
    alert("16桁を超えてしまいます。");
  }
};

function initChat() {
  updateDisplay();
  fetchMessages();
  fetchModalDictionary();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChat);
} else {
  initChat();
}

setInterval(fetchMessages, 3000);