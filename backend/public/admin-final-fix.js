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
    }, 3500);
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

  const installStyles = () => {
    if ($('adminFinalFixStyles')) return;
    const style = document.createElement('style');
    style.id = 'adminFinalFixStyles';
    style.textContent = `
      .admin-direct-message-box {
        margin: 18px 0 22px;
        padding: 20px;
        border-radius: 22px;
        border: 1px solid #bfdbfe;
        background: linear-gradient(135deg, #ffffff, #eff6ff);
        box-shadow: 0 16px 40px rgba(15, 23, 42, .08);
      }
      .admin-direct-message-box h3 { margin: 0 0 6px; font-size: 20px; color: #0f172a; }
      .admin-direct-message-box p { margin: 0 0 14px; color: #64748b; font-weight: 600; }
      .admin-direct-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .admin-direct-message-box textarea { margin-top: 12px; min-height: 110px !important; border-radius: 16px !important; }
      .admin-direct-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
      .admin-direct-actions button { min-width: 150px; }
      .message-reply-box textarea { color: #111827 !important; }
      .message-reply-box textarea::placeholder { color: #94a3b8 !important; }
      #bookingsTable td { vertical-align: middle !important; }
      .booking-date-box, .payment-box, .booking-guest-card {
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        border-radius: 14px;
        padding: 10px;
      }
      .booking-action-stack, .room-action-stack { display: flex; gap: 8px; flex-wrap: wrap; }
      .booking-action-stack button, .room-action-stack button { min-width: 92px; }
      .payment-proof-btn { margin-top: 8px !important; }
      .room-title-card { display: grid; gap: 4px; }
      .room-name-strong, .contact-name-strong { font-weight: 900; color: #0f172a; display: block; }
      .room-meta, .booking-meta { color: #64748b; font-size: 13px; display: block; }
      @media(max-width: 850px) {
        .admin-direct-grid { grid-template-columns: 1fr; }
        .admin-direct-actions { flex-direction: column; }
      }
    `;
    document.head.appendChild(style);
  };

  const addDirectMessageBox = () => {
    const contactSection = $('contactSection');
    if (!contactSection || $('adminDirectMessageBox')) return;

    const toolbar = contactSection.querySelector('.admin-message-toolbar') || contactSection.querySelector('.toolbar');
    if (!toolbar) return;

    const box = document.createElement('div');
    box.id = 'adminDirectMessageBox';
    box.className = 'admin-direct-message-box';
    box.innerHTML = `
      <h3>✉️ Send New Message</h3>
      <p>Send a fresh message to any customer email. This is different from replying to an existing message.</p>
      <div class="admin-direct-grid">
        <div><label>Customer Name</label><input id="directMsgName" placeholder="Customer name"></div>
        <div><label>Customer Email</label><input id="directMsgEmail" type="email" placeholder="customer@email.com"></div>
        <div><label>Subject</label><input id="directMsgSubject" placeholder="Message subject"></div>
      </div>
      <textarea id="directMsgBody" placeholder="Type the message you want to send..."></textarea>
      <div class="admin-direct-actions">
        <button type="button" class="secondary" id="clearDirectMsgBtn">Clear</button>
        <button type="button" class="success" id="sendDirectMsgBtn">Send New Message</button>
      </div>
    `;

    toolbar.insertAdjacentElement('beforebegin', box);

    $('clearDirectMsgBtn').onclick = () => {
      $('directMsgName').value = '';
      $('directMsgEmail').value = '';
      $('directMsgSubject').value = '';
      $('directMsgBody').value = '';
    };

    $('sendDirectMsgBtn').onclick = async () => {
      const payload = {
        name: $('directMsgName').value.trim(),
        email: $('directMsgEmail').value.trim(),
        subject: $('directMsgSubject').value.trim(),
        message: $('directMsgBody').value.trim()
      };

      if (!payload.email || !payload.message) {
        showAlert('Customer email and message are required.', 'error');
        return;
      }

      const btn = $('sendDirectMsgBtn');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        await api('/contact/admin/send', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showAlert('Message sent/saved successfully.');
        $('clearDirectMsgBtn').click();
        if (typeof window.loadContacts === 'function') await window.loadContacts();
        else $('refreshContactsBtn')?.click();
      } catch (error) {
        showAlert(error.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send New Message';
      }
    };
  };

  const strengthenEditRoom = () => {
    if (window.__finalEditRoomPatched) return;
    const originalEditRoom = window.editRoom;
    if (typeof originalEditRoom !== 'function') return;

    window.__finalEditRoomPatched = true;
    window.editRoom = function finalEditRoom(id) {
      originalEditRoom(id);
      setTimeout(() => {
        if (typeof window.showAdminTab === 'function') window.showAdminTab('add-room');
        const card = $('roomEditorCard');
        if (card) {
          card.classList.remove('admin-tab-hidden');
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        const title = $('roomFormTitle');
        if (title && !title.textContent.toLowerCase().includes('edit')) title.textContent = `Edit Room #${id}`;
      }, 150);
    };
  };

  const fixUploadedImageField = () => {
    const upload = $('roomImageUpload');
    const images = $('roomImages');
    const preview = $('imagePreview');
    if (!upload || !images || !preview || upload.dataset.finalImageFix === 'true') return;

    upload.dataset.finalImageFix = 'true';
    upload.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 750000) {
        showAlert('Image too large. Use below 750KB or paste a URL.', 'error');
        upload.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        images.value = reader.result;
        preview.innerHTML = `<img class="thumb" src="${reader.result}">`;
      };
      reader.readAsDataURL(file);
    }, true);
  };

  const run = () => {
    installStyles();
    addDirectMessageBox();
    strengthenEditRoom();
    fixUploadedImageField();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  setInterval(run, 800);
})();
