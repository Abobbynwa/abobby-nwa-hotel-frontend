const API = '/api';
const PAGE = 5;
const $ = (id) => document.getElementById(id);
const tokenKey = 'abobby_admin_token';
const userKey = 'abobby_admin_user';

let bookings = [];
let rooms = [];
let contacts = [];
let bPage = 1;
let cPage = 1;

const fallbackImg = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900';
const token = () => localStorage.getItem(tokenKey);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
const money = (n) => '₦' + Number(n || 0).toLocaleString();
const d = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const note = (txt, label) => {
  const m = String(txt || '').match(new RegExp(label + ':\\s*([^|]+)', 'i'));
  return m ? m[1].trim() : '';
};

const imgList = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string') {
    const value = v.trim();
    if (!value) return [];
    if (value.startsWith('data:image')) return [value];
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (e) {
        return [];
      }
    }
    return value.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
};

async function api(path, opt = {}) {
  const r = await fetch(API + path, {
    ...opt,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: 'Bearer ' + token() } : {}),
      ...(opt.headers || {})
    }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

function alertBox(msg, type = 'success') {
  const box = $('adminAlert');
  if (!box) return alert(msg);
  box.textContent = msg;
  box.className = 'admin-alert ' + type;
  setTimeout(() => {
    box.textContent = '';
    box.className = 'admin-alert';
  }, 3500);
}

function status(el, msg, type = '') {
  el.textContent = msg;
  el.className = ('status ' + type).trim();
}

function showLogin() {
  $('loginSection').classList.remove('hidden');
  $('dashboardSection').classList.add('hidden');
  $('logoutBtn').classList.add('hidden');
}

function showDash() {
  const u = JSON.parse(localStorage.getItem(userKey) || 'null');
  $('loginSection').classList.add('hidden');
  $('dashboardSection').classList.remove('hidden');
  $('logoutBtn').classList.remove('hidden');
  $('adminUser').textContent = u ? `${u.name} (${u.email})` : 'Admin';
}

function ensureContact() {
  if ($('contactsTable')) return;

  const s = document.createElement('section');
  s.id = 'contactSection';
  s.className = 'card admin-message-section';
  s.innerHTML = `
    <div class="section-title admin-section-head">
      <div>
        <h2>Contact Messages</h2>
        <span class="admin-section-note">Customer inbox for enquiries, complaints, and direct admin replies.</span>
      </div>
      <button id="refreshContactsBtn">Refresh Messages</button>
    </div>

    <div id="contactMiniStats" class="section-mini-stats"></div>

    <div class="toolbar admin-message-toolbar">
      <div>
        <label>Search messages</label>
        <input id="contactSearch" placeholder="Search by name, email, or message...">
      </div>
      <div>
        <label>Status</label>
        <select id="contactStatus">
          <option value="all">All Messages</option>
          <option value="new">New Only</option>
          <option value="replied">Replied Only</option>
        </select>
      </div>
    </div>

    <div id="contactsTable" class="admin-message-inbox"></div>

    <div class="pager">
      <span id="contactInfo" class="muted"></span>
      <div>
        <button id="contactPrev" class="secondary">Previous</button>
        <button id="contactNext" class="secondary">Next</button>
      </div>
    </div>
  `;

  $('roomEditorCard').parentNode.insertBefore(s, $('roomEditorCard'));
  $('refreshContactsBtn').onclick = loadContacts;
  $('contactSearch').oninput = () => { cPage = 1; renderContacts(); };
  $('contactStatus').onchange = () => { cPage = 1; renderContacts(); };
  $('contactPrev').onclick = () => { cPage = Math.max(1, cPage - 1); renderContacts(); };
  $('contactNext').onclick = () => { cPage++; renderContacts(); };
}

function fBookings() {
  const q = ($('bookingSearch')?.value || '').toLowerCase().trim();
  const st = $('bookingStatusFilter')?.value || 'all';
  const pay = $('bookingPaymentFilter')?.value || 'all';

  return bookings.filter((b) =>
    (!q || `${b.reference} ${b.full_name} ${b.email} ${b.phone} ${b.room_name} ${b.room_type}`.toLowerCase().includes(q)) &&
    (st === 'all' || b.status === st) &&
    (pay === 'all' || b.payment_status === pay)
  );
}

function renderBookings() {
  const list = fBookings();
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  bPage = Math.min(Math.max(1, bPage), pages);
  const start = (bPage - 1) * PAGE;
  const rows = list.slice(start, start + PAGE);

  const mini = $('bookingMiniStats');
  if (mini) {
    mini.innerHTML = `
      <span class="section-mini-stat">Total: ${bookings.length}</span>
      <span class="section-mini-stat">Confirmed: ${bookings.filter(b => b.status === 'confirmed').length}</span>
      <span class="section-mini-stat">Pending: ${bookings.filter(b => b.status === 'pending').length}</span>
      <span class="section-mini-stat">Cancelled: ${bookings.filter(b => b.status === 'cancelled').length}</span>
    `;
  }

  $('bookingsTable').innerHTML = rows.length ? rows.map((b) => {
    const wallet = note(b.payment_note, 'Selected Bank/Wallet') || b.transfer_bank || '-';
    const nar = note(b.payment_note, 'Unique Narration') || '-';
    const proof = b.payment_proof ? `<a href="${b.payment_proof}" target="_blank"><button class="secondary payment-proof-btn">View Proof</button></a>` : '<span class="muted">No proof uploaded</span>';

    let act = '';
    if (b.payment_status !== 'paid') act += `<button class="success booking-paid-btn" onclick="updateBooking(${b.id},'confirmed','paid')">Mark Paid</button>`;
    if (b.status !== 'confirmed') act += `<button class="warning booking-confirm-btn" onclick="updateBooking(${b.id},'confirmed','${b.payment_status}')">Confirm</button>`;
    if (b.status === 'cancelled') act += `<button class="warning booking-confirm-btn" onclick="updateBooking(${b.id},'pending','${b.payment_status}')">Restore</button>`;
    else act += `<button class="danger booking-cancel-btn" onclick="updateBooking(${b.id},'cancelled','${b.payment_status}')">Cancel</button>`;
    act += `<button class="danger booking-delete-btn" onclick="deleteBooking(${b.id})">Delete</button>`;

    const pay = b.payment_method === 'bank_transfer'
      ? `<div class="payment-box"><span class="pill ${esc(b.payment_status)}">${esc(b.payment_status)}</span><div class="payment-method-title">Transfer</div><span class="muted">Wallet: ${esc(wallet)}</span><br><span class="muted">Narration: ${esc(nar)}</span><br>${proof}</div>`
      : `<div class="payment-box"><span class="pill ${esc(b.payment_status)}">${esc(b.payment_status)}</span><div class="payment-method-title">${esc(b.payment_method || 'Paystack/None')}</div></div>`;

    return `<tr>
      <td><span class="booking-ref">${esc(b.reference)}</span></td>
      <td><div class="booking-guest-card"><span class="contact-name-strong">${esc(b.full_name)}</span><span class="booking-meta">${esc(b.email)}</span><span class="booking-meta">Phone: ${esc(b.phone || '-')}</span><span class="booking-meta">Gender: ${esc(b.gender || '-')}</span></div></td>
      <td><strong>${esc(b.room_name || b.room_type || '-')}</strong></td>
      <td><div class="booking-date-box"><b>Check-in:</b> ${d(b.check_in)}<br><b>Check-out:</b> ${d(b.check_out)}</div></td>
      <td><span class="booking-total">${money(b.total)}</span></td>
      <td><span class="pill ${esc(b.status)}">${esc(b.status)}</span></td>
      <td>${pay}</td>
      <td><div class="booking-action-stack">${act}</div></td>
    </tr>`;
  }).join('') : '<tr><td colspan="8">No bookings found.</td></tr>';

  $('bookingPageInfo').textContent = `Showing ${list.length ? start + 1 : 0}-${Math.min(start + PAGE, list.length)} of ${list.length} bookings | Page ${bPage}/${pages}`;
  $('bookingPrevBtn').disabled = bPage <= 1;
  $('bookingNextBtn').disabled = bPage >= pages;
}

async function loadBookings() {
  $('bookingsTable').innerHTML = '<tr><td colspan="8">Loading bookings...</td></tr>';
  const data = await api('/bookings');
  bookings = data.bookings || [];
  $('bookingCount').textContent = bookings.length;
  $('paidCount').textContent = bookings.filter((b) => b.payment_status === 'paid').length;
  renderBookings();
}

function fContacts() {
  const q = ($('contactSearch')?.value || '').toLowerCase().trim();
  const st = $('contactStatus')?.value || 'all';

  return contacts.filter((c) =>
    (!q || `${c.name} ${c.email} ${c.phone} ${c.subject} ${c.message}`.toLowerCase().includes(q)) &&
    (st === 'all' || (c.status || 'new') === st)
  );
}

function renderContacts() {
  ensureContact();
  const list = fContacts();
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  cPage = Math.min(Math.max(1, cPage), pages);
  const start = (cPage - 1) * PAGE;
  const rows = list.slice(start, start + PAGE);

  const mini = $('contactMiniStats');
  if (mini) {
    mini.innerHTML = `
      <span class="section-mini-stat">Messages: ${contacts.length}</span>
      <span class="section-mini-stat">New: ${contacts.filter(c => (c.status || 'new') === 'new').length}</span>
      <span class="section-mini-stat">Replied: ${contacts.filter(c => c.status === 'replied').length}</span>
    `;
  }

  $('contactsTable').innerHTML = rows.length ? rows.map((c) => {
    const initials = String(c.name || 'Guest').slice(0, 2).toUpperCase();
    return `<article class="message-card">
      <div class="message-card-top">
        <div class="message-avatar">${esc(initials)}</div>
        <div class="message-customer">
          <h3>${esc(c.name || 'Guest')}</h3>
          <p>${esc(c.email || 'No email')}</p>
          <p>${esc(c.phone || 'No phone')}</p>
        </div>
        <span class="pill ${esc(c.status || 'new')}">${esc(c.status || 'new')}</span>
      </div>

      <div class="message-body">
        <span class="message-subject">${esc(c.subject || 'Contact Message')}</span>
        <p>${esc(c.message || '')}</p>
      </div>

      ${c.admin_reply ? `<div class="message-reply-preview"><b>Admin Reply</b><p>${esc(c.admin_reply)}</p></div>` : ''}

      <div class="message-reply-box">
        <label>Reply to customer</label>
        <textarea id="reply-${c.id}" placeholder="Write a professional reply...">${esc(c.admin_reply || '')}</textarea>
        <button class="success reply-btn" onclick="replyContact(${c.id})">Send Reply</button>
      </div>
    </article>`;
  }).join('') : '<div class="empty-admin-state">No contact messages found.</div>';

  $('contactInfo').textContent = `Showing ${list.length ? start + 1 : 0}-${Math.min(start + PAGE, list.length)} of ${list.length} messages | Page ${cPage}/${pages}`;
  $('contactPrev').disabled = cPage <= 1;
  $('contactNext').disabled = cPage >= pages;
}

async function loadContacts() {
  ensureContact();
  $('contactsTable').innerHTML = '<div class="empty-admin-state">Loading messages...</div>';
  const data = await api('/contact');
  contacts = data.messages || [];
  renderContacts();
}

async function loadRooms() {
  const data = await api('/rooms');
  rooms = data.rooms || [];
  $('roomCount').textContent = rooms.length;

  const mini = $('roomMiniStats');
  if (mini) {
    mini.innerHTML = `
      <span class="section-mini-stat">Rooms: ${rooms.length}</span>
      <span class="section-mini-stat">Available: ${rooms.filter(r => r.available).length}</span>
      <span class="section-mini-stat">Disabled: ${rooms.filter(r => !r.available).length}</span>
    `;
  }

  $('roomsTable').innerHTML = rooms.map((r) => {
    const img = imgList(r.images)[0] || fallbackImg;
    return `<tr>
      <td><div class="room-image-box"><img class="thumb" src="${esc(img)}" onerror="this.onerror=null;this.src='${fallbackImg}'"></div></td>
      <td><div class="room-title-card"><span class="room-name-strong">${esc(r.name)}</span><span class="room-meta">${esc(r.description || 'No description').slice(0, 90)}${String(r.description || '').length > 90 ? '...' : ''}</span></div></td>
      <td><span class="pill">${esc(r.type)}</span></td>
      <td><span class="booking-total">${money(r.price)}</span></td>
      <td>${r.capacity || '-'} guest(s)</td>
      <td><span class="pill ${r.available ? 'available' : 'unavailable'}">${r.available ? 'Available' : 'Unavailable'}</span></td>
      <td><div class="room-action-stack"><button class="room-edit-btn" onclick="editRoom(${r.id})">Edit</button><button class="warning room-disable-btn" onclick="toggleRoom(${r.id})">${r.available ? 'Disable' : 'Enable'}</button><button class="danger room-delete-btn" onclick="deleteRoom(${r.id})">Delete</button></div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7">No rooms found.</td></tr>';
}

function roomData() {
  return {
    name: $('roomName').value.trim(),
    type: $('roomType').value,
    price: Number($('roomPrice').value),
    capacity: Number($('roomCapacity').value),
    description: $('roomDescription').value.trim(),
    amenities: $('roomAmenities').value.split(',').map((x) => x.trim()).filter(Boolean),
    images: $('roomImages').value.split(',').map((x) => x.trim()).filter(Boolean),
    available: $('roomAvailable').value === 'true'
  };
}

function resetRoom() {
  $('roomForm').reset();
  $('roomId').value = '';
  $('roomCapacity').value = 2;
  $('roomAvailable').value = 'true';
  $('roomFormTitle').textContent = 'Add Room';
  $('editBanner').classList.add('hidden');
  $('cancelEditBtn').classList.add('hidden');
  $('imagePreview').innerHTML = '';
}

window.updateBooking = async (id, status, payment_status) => {
  try {
    await api(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status, payment_status }) });
    alertBox('Booking updated successfully');
    await loadBookings();
  } catch (e) {
    alertBox(e.message, 'error');
  }
};

window.deleteBooking = async (id) => {
  if (!confirm('Delete this booking permanently?')) return;
  try {
    await api(`/bookings/${id}`, { method: 'DELETE' });
    alertBox('Booking deleted');
    await loadBookings();
  } catch (e) {
    alertBox(e.message, 'error');
  }
};

window.replyContact = async (id) => {
  const replyMessage = $(`reply-${id}`).value.trim();
  if (!replyMessage) return alertBox('Type a reply first', 'error');
  try {
    await api(`/contact/${id}/reply`, { method: 'POST', body: JSON.stringify({ replyMessage }) });
    alertBox('Reply saved. Email will send if SMTP is active.');
    await loadContacts();
  } catch (e) {
    alertBox(e.message, 'error');
  }
};

window.editRoom = (id) => {
  const r = rooms.find((x) => Number(x.id) === Number(id));
  if (!r) return;
  $('roomId').value = r.id;
  $('roomName').value = r.name || '';
  $('roomType').value = r.type || 'standard';
  $('roomPrice').value = r.price || '';
  $('roomCapacity').value = r.capacity || 2;
  $('roomDescription').value = r.description || '';
  $('roomAmenities').value = Array.isArray(r.amenities) ? r.amenities.join(', ') : '';
  $('roomImages').value = imgList(r.images).join(', ');
  $('roomAvailable').value = String(Boolean(r.available));
  $('roomFormTitle').textContent = `Edit Room #${r.id}`;
  $('editBanner').textContent = `Editing: ${r.name}`;
  $('editBanner').classList.remove('hidden');
  $('cancelEditBtn').classList.remove('hidden');
  if (window.showAdminTab) window.showAdminTab('add-room');
  else $('roomEditorCard').scrollIntoView({ behavior: 'smooth' });
};

window.toggleRoom = async (id) => {
  const r = rooms.find((x) => Number(x.id) === Number(id));
  if (!r) return;
  try {
    await api(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify({ ...r, available: !r.available }) });
    alertBox('Room updated');
    await loadRooms();
  } catch (e) {
    alertBox(e.message, 'error');
  }
};

window.deleteRoom = async (id) => {
  if (!confirm('Delete this room permanently?')) return;
  try {
    await api(`/rooms/${id}`, { method: 'DELETE' });
    alertBox('Room deleted');
    await loadRooms();
  } catch (e) {
    alertBox(e.message, 'error');
  }
};

function upgradeStaticSections() {
  const bookingCard = [...document.querySelectorAll('#dashboardSection > .card')].find((c) => c.querySelector('h2')?.textContent.toLowerCase().includes('bookings'));
  if (bookingCard && !$('bookingMiniStats')) {
    bookingCard.querySelector('.section-title h2').insertAdjacentHTML('afterend', '<span class="admin-section-note">Control reservations, verify payments, confirm stays, cancel wrong records, or delete test bookings.</span>');
    bookingCard.querySelector('.section-title').insertAdjacentHTML('afterend', '<div id="bookingMiniStats" class="section-mini-stats"></div>');
  }

  const roomCard = [...document.querySelectorAll('#dashboardSection > .card')].find((c) => c.querySelector('h2')?.textContent.toLowerCase().includes('room management'));
  if (roomCard && !$('roomMiniStats')) {
    roomCard.querySelector('.section-title h2').insertAdjacentHTML('afterend', '<span class="admin-section-note">Manage room images, prices, capacity, status, and availability from one section.</span>');
    roomCard.querySelector('.section-title').insertAdjacentHTML('afterend', '<div id="roomMiniStats" class="section-mini-stats"></div>');
  }

  if ($('roomEditorCard') && !$('roomFormHelper')) {
    $('roomFormTitle').insertAdjacentHTML('afterend', '<span id="roomFormHelper" class="admin-section-note">Create a new room or edit an existing room. Use short descriptions and clear room images.</span>');
    $('roomName').insertAdjacentHTML('afterend', '<span class="form-helper-text">Example: Deluxe King Room, Executive Suite Plus.</span>');
    $('roomImages').insertAdjacentHTML('afterend', '<span class="form-helper-text">Paste image URLs separated with commas or upload one small image below.</span>');
    $('roomAmenities').insertAdjacentHTML('afterend', '<span class="form-helper-text">Example: WiFi, AC, TV, Mini Bar, Jacuzzi.</span>');
  }
}

async function loadAll() {
  showDash();
  ensureContact();
  upgradeStaticSections();
  await Promise.all([loadRooms(), loadBookings(), loadContacts()]);
}

$('loginForm').onsubmit = async (e) => {
  e.preventDefault();
  $('loginBtn').disabled = true;
  status($('loginStatus'), 'Logging in...');
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('email').value.trim(), password: $('password').value }) });
    localStorage.setItem(tokenKey, data.token);
    localStorage.setItem(userKey, JSON.stringify(data.user));
    await loadAll();
  } catch (err) {
    status($('loginStatus'), err.message, 'error');
  } finally {
    $('loginBtn').disabled = false;
  }
};

$('logoutBtn').onclick = () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  showLogin();
};

$('refreshBookingsBtn').onclick = loadBookings;
$('refreshRoomsBtn').onclick = loadRooms;
['bookingSearch', 'bookingStatusFilter', 'bookingPaymentFilter'].forEach((id) => {
  $(id).oninput = $(id).onchange = () => { bPage = 1; renderBookings(); };
});
$('bookingPrevBtn').onclick = () => { bPage = Math.max(1, bPage - 1); renderBookings(); };
$('bookingNextBtn').onclick = () => { bPage++; renderBookings(); };
$('newRoomBtn').onclick = resetRoom;
$('cancelEditBtn').onclick = resetRoom;
$('roomImages').oninput = () => {
  $('imagePreview').innerHTML = imgList($('roomImages').value).map((u) => `<img class="thumb" src="${esc(u)}" onerror="this.onerror=null;this.src='${fallbackImg}'">`).join('');
};
$('roomImageUpload').onchange = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (f.size > 750000) {
    alertBox('Image too large. Use below 750KB', 'error');
    return;
  }
  const rd = new FileReader();
  rd.onload = () => {
    $('roomImages').value = rd.result;
    $('roomImages').dispatchEvent(new Event('input'));
  };
  rd.readAsDataURL(f);
};
$('roomForm').onsubmit = async (e) => {
  e.preventDefault();
  const id = $('roomId').value;
  try {
    await api(id ? `/rooms/${id}` : '/rooms', { method: id ? 'PUT' : 'POST', body: JSON.stringify(roomData()) });
    alertBox(id ? 'Room updated' : 'Room added');
    resetRoom();
    await loadRooms();
    if (window.showAdminTab) window.showAdminTab('rooms');
  } catch (err) {
    alertBox(err.message, 'error');
  }
};

if (token()) loadAll().catch((e) => { alertBox(e.message, 'error'); showLogin(); });
else showLogin();
