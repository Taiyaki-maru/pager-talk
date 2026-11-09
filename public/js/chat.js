let currentInput = "";
const MAX_DIGITS = 16;

const displayEl = document.getElementById('display');
const messagesBox = document.getElementById('messages-box');

// テンキー押下 (最大16桁自動ブロック)
function appendNum(num) {
  if (currentInput.length < MAX_DIGITS) {
    currentInput += num;
    updateDisplay();
  }
}

// 消去ボタン
function clearNum() {
  currentInput = "";
  updateDisplay();
}

function updateDisplay() {
  if (currentInput.length === 0) {
    displayEl.textContent = "16桁以内の数字を入力";
    displayEl.style.color = "#888888";
  } else {
    displayEl.textContent = currentInput;
    displayEl.style.color = "#222222";
  }
}

// メッセージ取得・描画
async function fetchMessages() {
  try {
    const res = await fetch(`/api/messages/${TARGET_ID}`);
    if (!res.ok) return;
    const messages = await res.json();
    
    // 相手の名前表示用
    const talksRes = await fetch('/api/talks');
    if (talksRes.ok) {
      const talks = await talksRes.json();
      const currentTalk = talks.find(t => t.user.id === parseInt(TARGET_ID, 10));
      if (currentTalk) {
        document.getElementById('target-name').textContent = currentTalk.user.displayName;
      }
    }

    const currentScrollBottom = messagesBox.scrollHeight - messagesBox.scrollTop === messagesBox.clientHeight;

    messagesBox.innerHTML = messages.length === 0 
      ? '<div class="text-center text-muted py-3">メッセージ履歴はありません</div>'
      : messages.map(m => {
          const isSelf = m.senderId !== parseInt(TARGET_ID, 10);
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
async function sendMessage() {
  if (!currentInput || !/^[0-9]{1,16}$/.test(currentInput)) {
    alert("1〜16桁の半角数字を入力してください。");
    return;
  }

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: TARGET_ID, numberText: currentInput })
    });

    if (res.ok) {
      currentInput = "";
      updateDisplay();
      await fetchMessages();
      messagesBox.scrollTop = messagesBox.scrollHeight;
    } else {
      const data = await res.json();
      alert(data.error || "送信に失敗しました。");
    }
  } catch (err) {
    console.error(err);
  }
}

// 辞書取得＆モーダルセット
async function fetchModalDictionary() {
  try {
    const res = await fetch('/api/dictionary');
    if (!res.ok) return;
    const dicts = await res.json();
    const listEl = document.getElementById('modal-dict-list');

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

function selectDictCode(code) {
  if ((currentInput + code).length <= MAX_DIGITS) {
    currentInput += code;
    updateDisplay();
    const modalEl = document.getElementById('dictModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  } else {
    alert("16桁を超えてしまいます。");
  }
}

updateDisplay();
fetchMessages();
fetchModalDictionary();
setInterval(fetchMessages, 3000); // 3秒ごとにショートポーリング