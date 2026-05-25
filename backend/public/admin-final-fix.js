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
      body { background: #eef3f8 !important; }
      main { padding-top: 18px !important; }
      header { min-height: 74px !important; padding: 14px 28px !important; }
      .admin-tabs, .admin-tabbar, .admin-tabs-shell, .admin-tab-shell {
        margin-top: 8px !important;
        padding: 12px 16px !important;
        border-radius: 22px !important;
        position: relative !important;
        z-index: 4 !important;
      }
      .card:has(#bookingsTable) {
        margin-top: 20px !important;
        padding: 26px !important;
        border-radius: 28px !important;
        border: 1px solid #d9e3ef !important;
        border-top: 5px solid #0f172a !important;
        box-shadow: 0 24px 65px rgba(15,23,42,.08) !important;
      }
      .card:has(#bookingsTable) .section-title {
        display: grid !important;
        grid-template-columns: 1fr auto !important;
        gap: 16px !important;
        align-items: center !important;
        margin-bottom: 14px !important;
      }
      .booking-heading-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .booking-live-clock {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 13px;
        border-radius: 999px;
        background: #0f172a;
        color: #fff;
        font-size: 13px;
        font-weight: 900;
        box-shadow: 0 12px 30px rgba(15,23,42,.18);
      }
      .booking-region-time {
        color: #64748b;
        font-size: 13px;
        font-weight: 700;
      }
      .card:has(#bookingsTable) .admin-section-note {
        display: block !important;
        max-width: 760px !important;
        margin-top: 6px !important;
        color: #64748b !important;
        font-weight: 700 !important;
      }
      .card:has(#bookingsTable) .section-mini-stats {
        margin: 12px 0 16px !important;
      }
      .card:has(#bookingsTable) .section-mini-stat {
        padding: 7px 11px !important;
        border-radius: 999px !important;
        background: #f8fafc !important;
        border: 1px solid #dbeafe !important;
        color: #334155 !important;
      }
      .card:has(#bookingsTable) .toolbar {
        margin: 12px 0 18px !important;
        padding: 14px !important;
        border-radius: 20px !important;
        background: #f8fbff !important;
        border: 1px solid #dbe5f0 !important;
        grid-template-columns: 1.15fr .85fr .85fr !important;
      }
      .card:has(#bookingsTable) .table-wrap {
        border: 1px solid #dbe5f0 !important;
        border-radius: 22px !important;
        overflow-x: auto !important;
        background: #fff !important;
      }
      .card:has(#bookingsTable) table {
        min-width: 1040px !important;
        border-collapse: separate !important;
        border-spacing: 0 !important;
      }
      .card:has(#bookingsTable) th {
        padding: 12px 14px !important;
        background: #f1f5f9 !important;
        color: #334155 !important;
        font-size: 12px !important;
        text-transform: uppercase !important;
        letter-spacing: .08em !important;
        white-space: nowrap !important;
      }
      .card:has(#bookingsTable) td {
        padding: 15px 14px !important;
        vertical-align: middle !important;
        background: #fff !important;
        border-bottom: 1px solid #e5edf5 !important;
      }
      .card:has(#bookingsTable) tr:nth-child(even) td { background: #fbfdff !important; }
      .booking-ref { font-weight: 900 !important; color: #0f172a !important; white-space: nowrap !important; }
      .booking-guest-card {
        border: 0 !important;
        background: transparent !important;
        padding: 0 !important;
        display: grid !important;
        gap: 3px !important;
        min-width: 180px !important;
      }
      .contact-name-strong { font-size: 16px !important; font-weight: 900 !important; color: #0f172a !important; }
      .booking-meta { color: #64748b !important; font-size: 12.5px !important; line-height: 1.35 !important; }
      .booking-date-box {
        padding: 9px 10px !important;
        border-radius: 14px !important;
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        line-height: 1.45 !important;
        min-width: 118px !important;
        font-size: 13px !important;
      }
      .booking-date-box b { color: #0f172a !important; display: inline !important; }
      .booking-total { font-size: 16px !important; font-weight: 900 !important; color: #0f172a !important; white-space: nowrap !important; }
      .payment-box {
        max-width: 175px !important;
        min-width: 150px !important;
        padding: 10px !important;
        border-radius: 16px !important;
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        line-height: 1.35 !important;
      }
      .payment-method-title { font-size: 14px !important; font-weight: 900 !important; margin: 5px 0 !important; color: #0f172a !important; }
      .payment-box .muted {
        display: block !important;
        font-size: 12px !important;
        max-width: 145px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      .payment-proof-btn { width: 100% !important; margin-top: 7px !important; min-height: 34px !important; padding: 8px 10px !important; }
      .booking-action-stack {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 8px !important;
        min-width: 112px !important;
      }
      .booking-action-stack button {
        margin: 0 !important;
        min-height: 38px !important;
        padding: 8px 12px !important;
        border-radius: 12px !important;
        font-size: 13px !important;
      }
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
      .room-title-card { display: grid; gap: 4px; }
      .room-name-strong, .contact-name-strong { font-weight: 900; color: #0f172a; display: block; }
      .room-meta { color: #64748b; font-size: 13px; display: block; }
      @media(max-width: 850px) {
        .card:has(#bookingsTable) .toolbar { grid-template-columns: 1fr !important; }
        .admin-direct-grid { grid-template-columns: 1fr; }
        .admin-direct-actions { flex-direction: column; }
      }
    `;
    document.head.appendChild(style);
  };

  const ensureLiveBookingClock = () => {
    const bookingCard = [...document.querySelectorAll('#dashboardSection > .card')]
      .find((card) => card.querySelector('#bookingsTable'));
    if (!bookingCard) return;

    const title = bookingCard.querySelector('.section-title h2');
    if (!title) return;

    if (!$('bookingLiveClock')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'booking-heading-wrap';
      title.parentNode.insertBefore(wrapper, title);
      wrapper.appendChild(title);

      const clock = document.createElement('span');
      clock.id = 'bookingLiveClock';
      clock.className = 'booking-live-clock';
      wrapper.appendChild(clock);

      const region = document.createElement('span');
      region.id = 'bookingRegionTime';
      region.className = 'booking-region-time';
      wrapper.appendChild(region);
    }

    const now = new Date();
    const locale = navigator.language || 'en-NG';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
    const dateText = now.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const timeText = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('bookingLiveClock').textContent = `📅 ${dateText} • ${timeText}`;
    $('bookingRegionTime').textContent = `Timezone: ${timeZone}`;
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
    ensureLiveBookingClock();
    addDirectMessageBox();
    strengthenEditRoom();
    fixUploadedImageField();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  setInterval(run, 1000);
})();
