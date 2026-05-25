(() => {
  const tokenKey = 'abobby_admin_token';
  const $ = (id) => document.getElementById(id);
  const getToken = () => localStorage.getItem(tokenKey);

  const showAlert = (message, type = 'success') => {
    const box = $('adminAlert');
    if (!box) return alert(message);
    box.textContent = message;
    box.className = `admin-alert ${type}`;
    setTimeout(() => {
      box.textContent = '';
      box.className = 'admin-alert';
    }, 4000);
  };

  const api = async (path, options = {}) => {
    const res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
    return data;
  };

  const injectStyles = () => {
    if ($('adminMessageComposerStyle')) return;
    const style = document.createElement('style');
    style.id = 'adminMessageComposerStyle';
    style.textContent = `
      .admin-compose-card {
        margin: 18px 0 22px;
        padding: 20px;
        border-radius: 24px;
        border: 1px solid #dbeafe;
        background: linear-gradient(135deg, #ffffff, #eff6ff);
        box-shadow: 0 18px 45px rgba(15,23,42,.07);
      }
      .admin-compose-head {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        align-items: center;
        margin-bottom: 14px;
      }
      .admin-compose-head h3 { margin: 0; color: #0f172a; font-size: 20px; }
      .admin-compose-head p { margin: 4px 0 0; color: #64748b; font-size: 14px; font-weight: 600; }
      .admin-compose-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .admin-compose-card textarea {
        margin-top: 12px;
        min-height: 115px !important;
        border-radius: 18px !important;
        resize: vertical;
      }
      .admin-compose-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }
      .admin-compose-actions button { min-width: 170px; }
      .message-reply-box textarea { color: transparent !important; caret-color: #111827 !important; }
      .message-reply-box textarea:focus, .message-reply-box textarea:not(:placeholder-shown) { color: #111827 !important; }
      @media(max-width: 850px) { .admin-compose-grid { grid-template-columns: 1fr; } .admin-compose-head { flex-direction: column; align-items: flex-start; } }
    `;
    document.head.appendChild(style);
  };

  const addComposer = () => {
    const contactSection = $('contactSection');
    if (!contactSection || $('adminMessageComposer')) return;

    const toolbar = contactSection.querySelector('.admin-message-toolbar') || contactSection.querySelector('.toolbar');
    if (!toolbar) return;

    const composer = document.createElement('div');
    composer.id = 'adminMessageComposer';
    composer.className = 'admin-compose-card';
    composer.innerHTML = `
      <div class="admin-compose-head">
        <div>
          <h3>✉️ Send New Message</h3>
          <p>Send a fresh email/message to any customer. This is separate from replying to existing inbox messages.</p>
        </div>
        <button type="button" class="secondary" id="clearAdminMessageBtn">Clear</button>
      </div>
      <div class="admin-compose-grid">
        <div>
          <label>Customer Name</label>
          <input id="adminMsgName" placeholder="Customer name">
        </div>
        <div>
          <label>Customer Email</label>
          <input id="adminMsgEmail" type="email" placeholder="customer@email.com">
        </div>
        <div>
          <label>Subject</label>
          <input id="adminMsgSubject" placeholder="Message subject">
        </div>
      </div>
      <div>
        <label style="margin-top:12px">Message</label>
        <textarea id="adminMsgBody" placeholder="Type the message you want to send to this customer..."></textarea>
      </div>
      <div class="admin-compose-actions">
        <button type="button" class="success" id="sendAdminMessageBtn">Send New Message</button>
      </div>
    `;

    toolbar.insertAdjacentElement('beforebegin', composer);

    $('clearAdminMessageBtn').onclick = () => {
      $('adminMsgName').value = '';
      $('adminMsgEmail').value = '';
      $('adminMsgSubject').value = '';
      $('adminMsgBody').value = '';
    };

    $('sendAdminMessageBtn').onclick = async () => {
      const payload = {
        name: $('adminMsgName').value.trim(),
        email: $('adminMsgEmail').value.trim(),
        subject: $('adminMsgSubject').value.trim(),
        message: $('adminMsgBody').value.trim()
      };

      if (!payload.email || !payload.message) {
        showAlert('Customer email and message are required.', 'error');
        return;
      }

      const btn = $('sendAdminMessageBtn');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      try {
        await api('/contact/admin/send', { method: 'POST', body: JSON.stringify(payload) });
        showAlert('Message sent/saved successfully.');
        $('clearAdminMessageBtn').click();
        if (window.loadContacts) await window.loadContacts();
        else $('refreshContactsBtn')?.click();
      } catch (error) {
        showAlert(error.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send New Message';
      }
    };
  };

  const patchEditRoom = () => {
    const oldEdit = window.editRoom;
    window.editRoom = function patchedEditRoom(id) {
      if (typeof oldEdit === 'function') oldEdit(id);
      setTimeout(() => {
        if (window.showAdminTab) window.showAdminTab('add-room');
        const form = $('roomEditorCard');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };
  };

  const run = () => {
    injectStyles();
    addComposer();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  setTimeout(patchEditRoom, 1200);
  setInterval(run, 1000);
})();
