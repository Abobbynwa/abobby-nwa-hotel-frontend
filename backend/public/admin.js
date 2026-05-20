const API_BASE = `${window.location.origin}/api`;
const tokenKey = 'abobby_admin_token';
const userKey = 'abobby_admin_user';

let roomCache = [];

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginStatus = document.getElementById('loginStatus');
const adminUser = document.getElementById('adminUser');
const bookingsTable = document.getElementById('bookingsTable');
const roomsTable = document.getElementById('roomsTable');
const refreshBookingsBtn = document.getElementById('refreshBookingsBtn');
const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
const roomForm = document.getElementById('roomForm');
const roomStatus = document.getElementById('roomStatus');
const roomFormTitle = document.getElementById('roomFormTitle');
const editBanner = document.getElementById('editBanner');
const newRoomBtn = document.getElementById('newRoomBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const imagePreview = document.getElementById('imagePreview');
const roomImageUpload = document.getElementById('roomImageUpload');

const roomCount = document.getElementById('roomCount');
const bookingCount = document.getElementById('bookingCount');
const paidCount = document.getElementById('paidCount');

const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`;
const getToken = () => localStorage.getItem(tokenKey);

const setStatus = (element, message, type = '') => {
  element.textContent = message;
  element.className = `status ${type}`.trim();
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const apiRequest = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
};

const showDashboard = () => {
  const user = JSON.parse(localStorage.getItem(userKey) || 'null');
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  adminUser.textContent = user ? `${user.name} (${user.email})` : 'Admin';
};

const showLogin = () => {
  loginSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  logoutBtn.classList.add('hidden');
  adminUser.textContent = '';
};

const getRoomPayload = () => ({
  name: document.getElementById('roomName').value.trim(),
  type: document.getElementById('roomType').value,
  price: Number(document.getElementById('roomPrice').value),
  capacity: Number(document.getElementById('roomCapacity').value),
  description: document.getElementById('roomDescription').value.trim(),
  amenities: document.getElementById('roomAmenities').value.split(',').map((item) => item.trim()).filter(Boolean),
  images: document.getElementById('roomImages').value.split(',').map((item) => item.trim()).filter(Boolean),
  available: document.getElementById('roomAvailable').value === 'true'
});

const renderImagePreview = () => {
  const urls = document.getElementById('roomImages').value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  imagePreview.innerHTML = urls.map((url) => `
    <img class="thumb" src="${escapeHtml(url)}" alt="Room image preview" onerror="this.style.display='none'" />
  `).join('');
};

const resetRoomForm = () => {
  roomForm.reset();
  document.getElementById('roomId').value = '';
  document.getElementById('roomCapacity').value = 2;
  document.getElementById('roomAvailable').value = 'true';
  roomFormTitle.textContent = 'Add Room';
  editBanner.classList.add('hidden');
  cancelEditBtn.classList.add('hidden');
  setStatus(roomStatus, '');
  renderImagePreview();
};

const fillRoomForm = (room) => {
  document.getElementById('roomId').value = room.id;
  document.getElementById('roomName').value = room.name || '';
  document.getElementById('roomType').value = room.type || 'standard';
  document.getElementById('roomPrice').value = room.price || '';
  document.getElementById('roomCapacity').value = room.capacity || 2;
  document.getElementById('roomDescription').value = room.description || '';
  document.getElementById('roomAmenities').value = Array.isArray(room.amenities) ? room.amenities.join(', ') : '';
  document.getElementById('roomImages').value = Array.isArray(room.images) ? room.images.join(', ') : '';
  document.getElementById('roomAvailable').value = String(Boolean(room.available));
  roomFormTitle.textContent = `Edit Room #${room.id}`;
  editBanner.textContent = `Editing: ${room.name}`;
  editBanner.classList.remove('hidden');
  cancelEditBtn.classList.remove('hidden');
  renderImagePreview();
  document.getElementById('roomEditorCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const loadRooms = async () => {
  roomsTable.innerHTML = '<tr><td colspan="7">Loading rooms...</td></tr>';
  const data = await apiRequest('/rooms');
  roomCache = data.rooms || [];
  roomCount.textContent = roomCache.length;

  if (!roomCache.length) {
    roomsTable.innerHTML = '<tr><td colspan="7">No rooms found.</td></tr>';
    return;
  }

  roomsTable.innerHTML = roomCache.map((room) => {
    const image = Array.isArray(room.images) && room.images.length ? room.images[0] : '';
    return `
      <tr>
        <td>${image ? `<img class="thumb" src="${escapeHtml(image)}" alt="${escapeHtml(room.name)}" />` : '-'}</td>
        <td>${escapeHtml(room.name)}</td>
        <td>${escapeHtml(room.type)}</td>
        <td>${formatCurrency(room.price)}</td>
        <td>${room.capacity || '-'}</td>
        <td><span class="pill ${room.available ? 'available' : 'unavailable'}">${room.available ? 'Available' : 'Unavailable'}</span></td>
        <td>
          <div class="small-actions">
            <button onclick="editRoom(${room.id})">Edit</button>
            <button class="warning" onclick="toggleRoom(${room.id})">${room.available ? 'Disable' : 'Enable'}</button>
            <button class="danger" onclick="deleteRoom(${room.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

const loadBookings = async () => {
  bookingsTable.innerHTML = '<tr><td colspan="8">Loading bookings...</td></tr>';
  const data = await apiRequest('/bookings');
  const bookings = data.bookings || [];
  bookingCount.textContent = bookings.length;
  paidCount.textContent = bookings.filter((booking) => booking.payment_status === 'paid').length;

  if (!bookings.length) {
    bookingsTable.innerHTML = '<tr><td colspan="8">No bookings found.</td></tr>';
    return;
  }

  bookingsTable.innerHTML = bookings.map((booking) => {
    const proof = booking.payment_proof
      ? `<br><a href="${booking.payment_proof}" target="_blank"><img src="${booking.payment_proof}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;margin-top:6px;" /></a>`
      : '<br><span class="muted">No proof</span>';

    const method = booking.payment_method === 'bank_transfer'
      ? `Transfer<br><span class="muted">${escapeHtml(booking.transfer_bank || 'Opay / Palmpay / Moniepoint')}</span>${proof}`
      : (booking.payment_method || 'Paystack/None');

    return `
      <tr>
        <td>${escapeHtml(booking.reference)}</td>
        <td>${escapeHtml(booking.full_name)}<br><span class="muted">${escapeHtml(booking.email)}</span></td>
        <td>${escapeHtml(booking.room_name || booking.room_type || '-')}</td>
        <td>${escapeHtml(booking.check_in || '-')}<br>${escapeHtml(booking.check_out || '-')}</td>
        <td>${formatCurrency(booking.total)}</td>
        <td><span class="pill ${booking.status}">${escapeHtml(booking.status)}</span></td>
        <td><span class="pill ${booking.payment_status}">${escapeHtml(booking.payment_status)}</span><br>${method}</td>
        <td>
          <button class="success" onclick="updateBooking(${booking.id}, 'confirmed', 'paid')">Mark Paid</button>
          <button class="warning" onclick="updateBooking(${booking.id}, 'confirmed', '${booking.payment_status}')">Confirm</button>
          <button class="danger" onclick="updateBooking(${booking.id}, 'cancelled', '${booking.payment_status}')">Cancel</button>
        </td>
      </tr>
    `;
  }).join('');
};

window.editRoom = (id) => {
  const room = roomCache.find((item) => Number(item.id) === Number(id));
  if (!room) return alert('Room not found');
  fillRoomForm(room);
};

window.toggleRoom = async (id) => {
  const room = roomCache.find((item) => Number(item.id) === Number(id));
  if (!room) return alert('Room not found');

  try {
    await apiRequest(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...room, available: !room.available })
    });
    await loadRooms();
  } catch (error) {
    alert(error.message);
  }
};

window.deleteRoom = async (id) => {
  if (!confirm('Delete this room permanently?')) return;

  try {
    await apiRequest(`/rooms/${id}`, { method: 'DELETE' });
    resetRoomForm();
    await loadRooms();
  } catch (error) {
    alert(error.message);
  }
};

window.updateBooking = async (id, status, paymentStatus) => {
  try {
    await apiRequest(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, payment_status: paymentStatus })
    });
    await loadBookings();
  } catch (error) {
    alert(error.message);
  }
};

const loadDashboard = async () => {
  try {
    await Promise.all([loadRooms(), loadBookings()]);
  } catch (error) {
    alert(error.message);
    if (error.message.toLowerCase().includes('not authorized')) {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      showLogin();
    }
  }
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginBtn.disabled = true;
  setStatus(loginStatus, 'Logging in...');

  try {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem(tokenKey, data.token);
    localStorage.setItem(userKey, JSON.stringify(data.user));
    setStatus(loginStatus, 'Login successful', 'success');
    showDashboard();
    await loadDashboard();
  } catch (error) {
    setStatus(loginStatus, error.message, 'error');
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  showLogin();
});

refreshBookingsBtn.addEventListener('click', loadBookings);
refreshRoomsBtn.addEventListener('click', loadRooms);
newRoomBtn.addEventListener('click', resetRoomForm);
cancelEditBtn.addEventListener('click', resetRoomForm);
document.getElementById('roomImages').addEventListener('input', renderImagePreview);

roomImageUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 750000) {
    alert('Image is too large. Use an image below 750KB or paste an image URL.');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const current = document.getElementById('roomImages').value.trim();
    document.getElementById('roomImages').value = current ? `${current}, ${reader.result}` : reader.result;
    renderImagePreview();
  };
  reader.readAsDataURL(file);
});

roomForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const roomId = document.getElementById('roomId').value;
  const isEditing = Boolean(roomId);
  setStatus(roomStatus, isEditing ? 'Updating room...' : 'Adding room...');

  try {
    await apiRequest(isEditing ? `/rooms/${roomId}` : '/rooms', {
      method: isEditing ? 'PUT' : 'POST',
      body: JSON.stringify(getRoomPayload())
    });
    setStatus(roomStatus, isEditing ? 'Room updated successfully' : 'Room added successfully', 'success');
    resetRoomForm();
    await loadRooms();
  } catch (error) {
    setStatus(roomStatus, error.message, 'error');
  }
});

if (getToken()) {
  showDashboard();
  loadDashboard();
} else {
  showLogin();
}
