(() => {
  const API_BASE = `${window.location.origin}/api`;
  const tokenKey = 'abobby_admin_token';
  const pageSize = 5;

  let bookings = [];
  let contacts = [];
  let bookingPage = 1;
  let contactPage = 1;

  const token = () => localStorage.getItem(tokenKey);
  const money = (n) => `₦${Number(n || 0).toLocaleString()}`;
  const esc = (v = '') => String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const date = (v) => {
    if (!v) return '-';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const request = async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token() ? `Bearer ${token()}` : '',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
    return data;
  };

  const alertBox = (msg, type = 'success') => {
    let box = document.getElementById('adminAlert');
    if (!box) {
      box = document.createElement('div');
      box.id = 'adminAlert';
      const dashboard = document.getElementById('dashboardSection');
      dashboard?.prepend(box);
    }
    box.textContent = msg;
    box.className = `admin-alert ${type}`;
    setTimeout(() => {
      box.textContent = '';
      box.className = 'admin-alert';
    }, 3500);
  };

  const noteValue = (note = '', label) => {
    const re = new RegExp(`${label}:\\s*([^|]+)`, 'i');
    const match = String(note).match(re);
    return match ? match[1].trim() : '-';
  };

  const ensureBookingTools = () => {
    if (document.getElementById('bookingSearch')) return;
    const section = document.querySelector('#bookingsTable')?.closest('section');
    const tableWrap = section?.querySelector('.table-wrap');
    if (!section || !tableWrap) return;

    tableWrap.insertAdjacentHTML('beforebegin', `
      <div class="toolbar">
        <div><label>Search bookings</label><input id="bookingSearch" placeholder="Name, email, reference..." /></div>
        <div><label>Status</label><select id="bookingStatusFilter"><option value="all">All Status</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></div>
        <div><label>Payment</label><select id="bookingPaymentFilter"><option value="all">All Payments</option><option value="unpaid">Unpaid</option><option value="pending_review">Pending Review</option><option value="paid">Paid</option></select></div>
      </div>
    `);
    tableWrap.insertAdjacentHTML('afterend', `
      <div class="pager"><span id="bookingPageInfo" class="muted"></span><div class="pager-controls"><button id="bookingPrevBtn" class="secondary">Previous</button><button id="bookingNextBtn" class="secondary">Next</button></div></div>
    `);

    document.getElementById('bookingSearch').addEventListener('input', () => { bookingPage = 1; renderBookings(); });
    document.getElementById('bookingStatusFilter').addEventListener('change', () => { bookingPage = 1; renderBookings(); });
    document.getElementById('bookingPaymentFilter').addEventListener('change', () => { bookingPage = 1; renderBookings(); });
    document.getElementById('bookingPrevBtn').addEventListener('click', () => { bookingPage = Math.max(1, bookingPage - 1); renderBookings(); });
    document.getElementById('bookingNextBtn').addEventListener('click', () => { bookingPage += 1; renderBookings(); });
  };

  const filteredBookings = () => {
    const q = (document.getElementById('bookingSearch')?.value || '').toLowerCase().trim();
    const status = document.getElementById('bookingStatusFilter')?.value || 'all';
    const payment = document.getElementById('bookingPaymentFilter')?.value || 'all';
    return bookings.filter((b) => {
      const text = `${b.reference} ${b.full_name} ${b.email} ${b.phone} ${b.room_name} ${b.room_type}`.toLowerCase();
      return (!q || text.includes(q)) && (status === 'all' || b.status === status) && (payment === 'all' || b.payment_status === payment);
    });
  };

  const renderBookings = () => {
    const tbody = document.getElementById('bookingsTable');
    const info = document.getElementById('bookingPageInfo');
    if (!tbody) return;
    const list = filteredBookings();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    bookingPage = Math.min(Math.max(1, bookingPage), pages);
    const start = (bookingPage - 1) * pageSize;
    const rows = list.slice(start, start + pageSize);

    tbody.innerHTML = rows.length ? rows.map((b) => {
      const wallet = noteValue(b.payment_note, 'Selected Bank/Wallet') !== '-' ? noteValue(b.payment_note, 'Selected Bank/Wallet') : (b.transfer_bank || 'Not selected');
      const narration = noteValue(b.payment_note, 'Unique Narration');
      const proof = b.payment_proof ? `<br><a href="${b.payment_proof}" target="_blank"><button class="secondary" style="margin-top:6px;">View Proof</button></a>` : '<br><span class="muted">No proof uploaded</span>';
      const payment = b.payment_method === 'bank_transfer' ? `Transfer<br><span class="muted">Wallet: ${esc(wallet)}</span><br><span class="muted">Narration: ${esc(narration)}</span>${proof}` : (b.payment_method || 'Paystack/None');
      const buttons = [
        b.payment_status !== 'paid' ? `<button class="success" onclick="adminEnhanceUpdateBooking(${b.id}, 'confirmed', 'paid')">Mark Paid</button>` : '',
        b.status !== 'confirmed' ? `<button class="warning" onclick="adminEnhanceUpdateBooking(${b.id}, 'confirmed', '${b.payment_status}')">Confirm</button>` : '',
        b.status !== 'cancelled' ? `<button class="danger" onclick="adminEnhanceUpdateBooking(${b.id}, 'cancelled', '${b.payment_status}')">Cancel</button>` : `<button class="warning" onclick="adminEnhanceUpdateBooking(${b.id}, 'pending', '${b.payment_status}')">Restore</button>`,
        `<button class="danger" onclick="adminEnhanceDeleteBooking(${b.id})">Delete</button>`
      ].filter(Boolean).join(' ');
      return `<tr><td><strong>${esc(b.reference)}</strong></td><td><strong>${esc(b.full_name)}</strong><br><span class="muted">${esc(b.email)}</span><br><span class="muted">Phone: ${esc(b.phone || '-')}</span><br><span class="muted">Gender: ${esc(b.gender || '-')}</span><br><span class="muted">Next of Kin: ${esc(b.next_of_kin_name || '-')}</span><br><span class="muted">NOK Phone: ${esc(b.next_of_kin_phone || '-')}</span></td><td>${esc(b.room_name || b.room_type || '-')}</td><td>${date(b.check_in)}<br>${date(b.check_out)}</td><td>${money(b.total)}</td><td><span class="pill ${esc(b.status)}">${esc(b.status)}</span></td><td><span class="pill ${esc(b.payment_status)}">${esc(b.payment_status)}</span><br>${payment}</td><td><div class="small-actions">${buttons}</div></td></tr>`;
    }).join('') : '<tr><td colspan="8">No bookings match your filter.</td></tr>';

    if (info) info.textContent = `Showing ${list.length ? start + 1 : 0}-${Math.min(start + pageSize, list.length)} of ${list.length} bookings | Page ${bookingPage}/${pages}`;
    const prev = document.getElementById('bookingPrevBtn');
    const next = document.getElementById('bookingNextBtn');
    if (prev) prev.disabled = bookingPage <= 1;
    if (next) next.disabled = bookingPage >= pages;
  };

  const loadBookingsEnhanced = async () => {
    ensureBookingTools();
    const data = await request('/bookings');
    bookings = data.bookings || [];
    document.getElementById('bookingCount').textContent = bookings.length;
    document.getElementById('paidCount').textContent = bookings.filter((b) => b.payment_status === 'paid').length;
    renderBookings();
  };

  const ensureContactTools = () => {
    const section = document.getElementById('contactSection');
    const tableWrap = section?.querySelector('.table-wrap');
    if (!section || !tableWrap || document.getElementById('contactSearch')) return;
    tableWrap.insertAdjacentHTML('beforebegin', `<div class="toolbar"><div><label>Search messages</label><input id="contactSearch" placeholder="Name, email, message..." /></div><div><label>Status</label><select id="contactStatusFilter"><option value="all">All Messages</option><option value="new">New Only</option><option value="replied">Replied Only</option></select></div></div>`);
    tableWrap.insertAdjacentHTML('afterend', `<div class="pager"><span id="contactPageInfo" class="muted"></span><div class="pager-controls"><button id="contactPrevBtn" class="secondary">Previous</button><button id="contactNextBtn" class="secondary">Next</button></div></div>`);
    document.getElementById('contactSearch').addEventListener('input', () => { contactPage = 1; renderContacts(); });
    document.getElementById('contactStatusFilter').addEventListener('change', () => { contactPage = 1; renderContacts(); });
    document.getElementById('contactPrevBtn').addEventListener('click', () => { contactPage = Math.max(1, contactPage - 1); renderContacts(); });
    document.getElementById('contactNextBtn').addEventListener('click', () => { contactPage += 1; renderContacts(); });
  };

  const filteredContacts = () => {
    const q = (document.getElementById('contactSearch')?.value || '').toLowerCase().trim();
    const status = document.getElementById('contactStatusFilter')?.value || 'all';
    return contacts.filter((c) => {
      const text = `${c.name} ${c.email} ${c.phone} ${c.subject} ${c.message}`.toLowerCase();
      return (!q || text.includes(q)) && (status === 'all' || c.status === status);
    });
  };

  const renderContacts = () => {
    const tbody = document.getElementById('contactsTable');
    if (!tbody) return;
    ensureContactTools();
    const list = filteredContacts();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    contactPage = Math.min(Math.max(1, contactPage), pages);
    const start = (contactPage - 1) * pageSize;
    const rows = list.slice(start, start + pageSize);
    tbody.innerHTML = rows.length ? rows.map((c) => `<tr><td>${esc(c.name)}<br><span class="muted">${esc(c.email)}</span><br><span class="muted">${esc(c.phone || 'No phone')}</span></td><td>${esc(c.subject || 'Contact Message')}</td><td><div class="collapsed-text" title="${esc(c.message)}">${esc(c.message)}</div>${c.admin_reply ? `<br><br><strong>Admin Reply:</strong><br><span class="muted">${esc(c.admin_reply)}</span>` : ''}</td><td><span class="pill ${esc(c.status || 'new')}">${esc(c.status || 'new')}</span></td><td><textarea id="contactReply-${c.id}" placeholder="Type reply..." rows="4" style="width:220px;padding:8px;border-radius:8px;">${esc(c.admin_reply || '')}</textarea><br><button class="success" style="margin-top:8px;" onclick="adminEnhanceReplyContact(${c.id})">Send Reply</button></td></tr>`).join('') : '<tr><td colspan="5">No messages match your filter.</td></tr>';
    const info = document.getElementById('contactPageInfo');
    if (info) info.textContent = `Showing ${list.length ? start + 1 : 0}-${Math.min(start + pageSize, list.length)} of ${list.length} messages | Page ${contactPage}/${pages}`;
    const prev = document.getElementById('contactPrevBtn');
    const next = document.getElementById('contactNextBtn');
    if (prev) prev.disabled = contactPage <= 1;
    if (next) next.disabled = contactPage >= pages;
  };

  const loadContactsEnhanced = async () => {
    const data = await request('/contact');
    contacts = data.messages || [];
    renderContacts();
  };

  window.adminEnhanceUpdateBooking = async (id, status, payment_status) => {
    try {
      await request(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status, payment_status }) });
      alertBox('Booking updated successfully.', 'success');
      await loadBookingsEnhanced();
    } catch (e) { alertBox(e.message, 'error'); }
  };

  window.adminEnhanceDeleteBooking = async (id) => {
    if (!confirm('Delete this booking permanently?')) return;
    try {
      await request(`/bookings/${id}`, { method: 'DELETE' });
      alertBox('Booking deleted successfully.', 'success');
      await loadBookingsEnhanced();
    } catch (e) { alertBox(e.message, 'error'); }
  };

  window.adminEnhanceReplyContact = async (id) => {
    const replyMessage = document.getElementById(`contactReply-${id}`)?.value?.trim();
    if (!replyMessage) return alertBox('Please type a reply first.', 'error');
    try {
      await request(`/contact/${id}/reply`, { method: 'POST', body: JSON.stringify({ replyMessage }) });
      alertBox('Reply saved. Email will send if active.', 'success');
      await loadContactsEnhanced();
    } catch (e) { alertBox(e.message, 'error'); }
  };

  const boot = () => {
    if (!token()) return;
    setTimeout(() => {
      loadBookingsEnhanced().catch(() => {});
      loadContactsEnhanced().catch(() => {});
      document.getElementById('refreshBookingsBtn')?.addEventListener('click', loadBookingsEnhanced);
      document.getElementById('refreshContactsBtn')?.addEventListener('click', loadContactsEnhanced);
    }, 800);
  };

  boot();
})();
