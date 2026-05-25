(() => {
  const TOKEN_KEY = 'abobby_admin_token';
  const $ = (id) => document.getElementById(id);
  const token = () => localStorage.getItem(TOKEN_KEY);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));

  let viewingTrash = false;

  async function api(path, options = {}) {
    const res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
    return data;
  }

  function notice(message, type = 'success') {
    const box = $('adminAlert');
    if (!box) return alert(message);
    box.textContent = message;
    box.className = `admin-alert ${type}`;
    setTimeout(() => {
      box.textContent = '';
      box.className = 'admin-alert';
    }, 3500);
  }

  function addStyles() {
    if ($('contactTrashStyles')) return;
    const style = document.createElement('style');
    style.id = 'contactTrashStyles';
    style.textContent = `
      .contact-trash-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0 16px}
      .contact-trash-toolbar button{border-radius:14px!important;min-height:42px!important}
      .contact-trash-toolbar .active-trash{background:#dc2626!important;color:#fff!important}
      .message-card-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .message-card-actions button{min-width:120px!important;border-radius:14px!important}
      .trash-mode-banner{padding:13px 15px;border-radius:16px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-weight:900;margin:8px 0 14px}
      .smtp-test-box{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin:12px 0 16px;padding:14px;border:1px solid #dbeafe;background:#eff6ff;border-radius:18px}
      .smtp-test-box input{max-width:320px;background:#fff!important}
    `;
    document.head.appendChild(style);
  }

  function ensureToolbar() {
    const section = $('contactSection');
    if (!section || $('contactTrashToolbar')) return;

    const mini = $('contactMiniStats') || section.querySelector('.section-title');
    const toolbar = document.createElement('div');
    toolbar.id = 'contactTrashToolbar';
    toolbar.className = 'contact-trash-toolbar';
    toolbar.innerHTML = `
      <button type="button" id="viewInboxBtn" class="success">Inbox Messages</button>
      <button type="button" id="viewTrashBtn" class="danger">Recycle Trash</button>
      <button type="button" id="testSmtpBtn" class="secondary">Test Email</button>
      <input id="testSmtpEmail" type="email" placeholder="Test recipient email (optional)">
    `;
    mini.insertAdjacentElement('afterend', toolbar);

    $('viewInboxBtn').onclick = () => {
      viewingTrash = false;
      $('viewInboxBtn').classList.add('success');
      $('viewTrashBtn').classList.remove('active-trash');
      if (typeof window.loadContacts === 'function') window.loadContacts();
      else $('refreshContactsBtn')?.click();
    };

    $('viewTrashBtn').onclick = () => {
      viewingTrash = true;
      $('viewTrashBtn').classList.add('active-trash');
      loadTrash();
    };

    $('testSmtpBtn').onclick = testEmail;
  }

  async function testEmail() {
    const btn = $('testSmtpBtn');
    const to = $('testSmtpEmail')?.value?.trim();
    btn.disabled = true;
    btn.textContent = 'Testing...';
    try {
      const data = await api('/contact/admin/test-email', {
        method: 'POST',
        body: JSON.stringify(to ? { to } : {})
      });
      notice(data.message || 'SMTP test completed.');
      console.log('SMTP TEST RESULT:', data);
    } catch (error) {
      notice(error.message, 'error');
      console.error('SMTP TEST ERROR:', error);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Test Email';
    }
  }

  async function moveToTrash(id) {
    if (!confirm('Move this message to Recycle Trash?')) return;
    try {
      await api(`/contact/${id}/trash`, { method: 'PATCH' });
      notice('Message moved to Recycle Trash.');
      if (typeof window.loadContacts === 'function') window.loadContacts();
      else $('refreshContactsBtn')?.click();
    } catch (error) {
      notice(error.message, 'error');
    }
  }

  async function restoreMessage(id) {
    try {
      await api(`/contact/${id}/restore`, { method: 'PATCH' });
      notice('Message restored to Inbox.');
      loadTrash();
    } catch (error) {
      notice(error.message, 'error');
    }
  }

  async function permanentDelete(id) {
    if (!confirm('Permanently delete this message? This cannot be undone.')) return;
    try {
      await api(`/contact/${id}/permanent`, { method: 'DELETE' });
      notice('Message permanently deleted.');
      loadTrash();
    } catch (error) {
      notice(error.message, 'error');
    }
  }

  window.moveContactToTrash = moveToTrash;
  window.restoreContactMessage = restoreMessage;
  window.permanentDeleteContactMessage = permanentDelete;

  function addDeleteButtonsToInbox() {
    if (viewingTrash) return;
    document.querySelectorAll('#contactsTable .message-card').forEach((card) => {
      if (card.querySelector('.trash-contact-btn')) return;
      const textarea = card.querySelector('textarea[id^="reply-"]');
      if (!textarea) return;
      const id = textarea.id.replace('reply-', '');
      const actions = document.createElement('div');
      actions.className = 'message-card-actions';
      actions.innerHTML = `<button type="button" class="danger trash-contact-btn" onclick="moveContactToTrash(${id})">Move to Trash</button>`;
      const box = card.querySelector('.message-reply-box') || card;
      box.appendChild(actions);
    });
  }

  function renderTrash(messages) {
    const table = $('contactsTable');
    if (!table) return;
    const section = $('contactSection');
    let banner = $('trashModeBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'trashModeBanner';
      banner.className = 'trash-mode-banner';
      section.querySelector('.toolbar')?.insertAdjacentElement('beforebegin', banner);
    }
    banner.textContent = `Recycle Trash: ${messages.length} deleted message(s). Restore or permanently delete from here.`;

    table.innerHTML = messages.length ? messages.map((c) => {
      const initials = String(c.name || 'Guest').slice(0, 2).toUpperCase();
      return `
        <article class="message-card">
          <div class="message-card-top">
            <div class="message-avatar">${esc(initials)}</div>
            <div class="message-customer">
              <h3>${esc(c.name || 'Guest')}</h3>
              <p>${esc(c.email || 'No email')}</p>
              <p>${esc(c.phone || 'No phone')}</p>
            </div>
            <span class="pill cancelled">Trash</span>
          </div>
          <div class="message-body">
            <span class="message-subject">${esc(c.subject || 'Contact Message')}</span>
            <p>${esc(c.message || '')}</p>
          </div>
          ${c.admin_reply ? `<div class="message-reply-preview"><b>Admin Reply</b><p>${esc(c.admin_reply)}</p></div>` : ''}
          <div class="message-card-actions">
            <button type="button" class="success" onclick="restoreContactMessage(${c.id})">Restore</button>
            <button type="button" class="danger" onclick="permanentDeleteContactMessage(${c.id})">Delete Forever</button>
          </div>
        </article>
      `;
    }).join('') : '<div class="empty-admin-state">Recycle Trash is empty.</div>';

    const info = $('contactInfo');
    if (info) info.textContent = `Trash: ${messages.length} message(s)`;
  }

  async function loadTrash() {
    const table = $('contactsTable');
    if (table) table.innerHTML = '<div class="empty-admin-state">Loading Trash...</div>';
    try {
      const data = await api('/contact?trash=true');
      renderTrash(data.messages || []);
    } catch (error) {
      notice(error.message, 'error');
    }
  }

  function hideTrashBannerIfInbox() {
    if (!viewingTrash) $('trashModeBanner')?.remove();
  }

  function run() {
    addStyles();
    ensureToolbar();
    hideTrashBannerIfInbox();
    addDeleteButtonsToInbox();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  setInterval(run, 1200);
})();
