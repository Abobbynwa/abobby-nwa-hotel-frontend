const API_BASE = `${window.location.origin}/api`;
const tokenKey = 'abobby_admin_token';
const userKey = 'abobby_admin_user';

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

const roomCount = document.getElementById('roomCount');
const bookingCount = document.getElementById('bookingCount');
const paidCount = document.getElementById('paidCount');

const formatCurrency = (amount) => {
  return `₦${Number(amount || 0).toLocaleString()}`;
};

const getToken = () => localStorage.getItem(tokenKey);

const setStatus = (element, message, type = '') => {
  element.textContent = message;
  element.className = `status ${type}`.trim();
};

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

const loadRooms = async () => {
  roomsTable.innerHTML = '<tr><td colspan="5">Loading rooms...</td></tr>';
  const data = await apiRequest('/rooms');
  const rooms = data.rooms || [];
  roomCount.textContent = rooms.length;

  if (!rooms.length) {
    roomsTable.innerHTML = '<tr><td colspan="5">No rooms found.</td></tr>';
    return;
  }

  roomsTable.innerHTML = rooms.map((room) => `
    <tr>
      <td>${room.name}</td>
      <td>${room.type}</td>
      <td>${formatCurrency(room.price)}</td>
      <td>${room.capacity || '-'}</td>
      <td><span class="pill ${room.available ? 'paid' : 'cancelled'}">${room.available ? 'Available' : 'Unavailable'}</span></td>
    </tr>
  `).join('');
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

  bookingsTable.innerHTML = bookings.map((booking) => `
    <tr>
      <td>${booking.reference}</td>
      <td>${booking.full_name}<br><span class="muted">${booking.email}</span></td>
      <td>${booking.room_name || booking.room_type || '-'}</td>
      <td>${booking.check_in || '-'}<br>${booking.check_out || '-'}</td>
      <td>${formatCurrency(booking.total)}</td>
      <td><span class="pill ${booking.status}">${booking.status}</span></td>
      <td><span class="pill ${booking.payment_status}">${booking.payment_status}</span></td>
      <td>
        <button class="success" onclick="updateBooking(${booking.id}, 'confirmed', '${booking.payment_status}')">Confirm</button>
        <button class="danger" onclick="updateBooking(${booking.id}, 'cancelled', '${booking.payment_status}')">Cancel</button>
      </td>
    </tr>
  `).join('');
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

roomForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(roomStatus, 'Adding room...');

  const payload = {
    name: document.getElementById('roomName').value.trim(),
    type: document.getElementById('roomType').value,
    price: Number(document.getElementById('roomPrice').value),
    capacity: Number(document.getElementById('roomCapacity').value),
    description: document.getElementById('roomDescription').value.trim(),
    amenities: document.getElementById('roomAmenities').value.split(',').map((item) => item.trim()).filter(Boolean),
    images: document.getElementById('roomImages').value.split(',').map((item) => item.trim()).filter(Boolean)
  };

  try {
    await apiRequest('/rooms', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    roomForm.reset();
    document.getElementById('roomCapacity').value = 2;
    setStatus(roomStatus, 'Room added successfully', 'success');
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
