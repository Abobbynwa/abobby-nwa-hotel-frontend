const API_URL = window.location.origin + '/api';
let token = localStorage.getItem('adminToken');

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminName', data.user.name);
            showDashboard();
        } else {
            errorDiv.textContent = data.message || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
});

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    location.reload();
}

// Show Dashboard
function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('adminName').textContent = localStorage.getItem('adminName');
    loadDashboardData();
}

// Load Dashboard Data
async function loadDashboardData() {
    await Promise.all([
        loadRooms(),
        loadBookings(),
        loadStats()
    ]);
}

// Load Stats
async function loadStats() {
    try {
        const [roomsRes, bookingsRes] = await Promise.all([
            fetch(`${API_URL}/rooms`),
            fetch(`${API_URL}/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const roomsData = await roomsRes.json();
        const bookingsData = await bookingsRes.json();

        document.getElementById('totalRooms').textContent = roomsData.count || 0;
        document.getElementById('totalBookings').textContent = bookingsData.count || 0;
        
        const pending = bookingsData.bookings?.filter(b => b.status === 'pending').length || 0;
        document.getElementById('pendingBookings').textContent = pending;

        const revenue = bookingsData.bookings
            ?.filter(b => b.payment_status === 'paid')
            .reduce((sum, b) => sum + parseInt(b.total), 0) || 0;
        document.getElementById('totalRevenue').textContent = revenue.toLocaleString();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Rooms
async function loadRooms() {
    try {
        const res = await fetch(`${API_URL}/rooms`);
        const data = await res.json();

        const table = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.rooms.map(room => `
                        <tr>
                            <td>${room.id}</td>
                            <td>${room.name}</td>
                            <td>${room.type}</td>
                            <td>₦${room.price.toLocaleString()}</td>
                            <td>${room.capacity}</td>
                            <td><span class="badge ${room.available ? 'confirmed' : 'pending'}">${room.available ? 'Available' : 'Unavailable'}</span></td>
                            <td>
                                <button class="action-btn edit-btn" onclick='editRoom(${JSON.stringify(room)})'>Edit</button>
                                <button class="action-btn delete-btn" onclick="deleteRoom(${room.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('roomsTable').innerHTML = table;
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

// Load Bookings
async function loadBookings() {
    try {
        const res = await fetch(`${API_URL}/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        const table = `
            <table>
                <thead>
                    <tr>
                        <th>Reference</th>
                        <th>Guest</th>
                        <th>Room</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Payment</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.bookings.map(booking => `
                        <tr>
                            <td>${booking.reference}</td>
                            <td>${booking.full_name}<br><small>${booking.email}</small></td>
                            <td>${booking.room_type}</td>
                            <td>${new Date(booking.check_in).toLocaleDateString()}</td>
                            <td>${new Date(booking.check_out).toLocaleDateString()}</td>
                            <td>₦${parseInt(booking.total).toLocaleString()}</td>
                            <td><span class="badge ${booking.status}">${booking.status}</span></td>
                            <td><span class="badge ${booking.payment_status}">${booking.payment_status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('bookingsTable').innerHTML = table;
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Switch Tab
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

// Room Modal Functions
function openRoomModal(room = null) {
    document.getElementById('roomModal').style.display = 'flex';
    document.getElementById('roomModalTitle').textContent = room ? 'Edit Room' : 'Add New Room';
    
    if (room) {
        document.getElementById('roomId').value = room.id;
        document.getElementById('roomName').value = room.name;
        document.getElementById('roomType').value = room.type;
        document.getElementById('roomPrice').value = room.price;
        document.getElementById('roomCapacity').value = room.capacity;
        document.getElementById('roomDescription').value = room.description || '';
        document.getElementById('roomAmenities').value = room.amenities?.join(', ') || '';
        document.getElementById('roomImages').value = room.images?.join(', ') || '';
    } else {
        document.getElementById('roomForm').reset();
        document.getElementById('roomId').value = '';
    }
}

function closeRoomModal() {
    document.getElementById('roomModal').style.display = 'none';
}

function editRoom(room) {
    openRoomModal(room);
}

// Save Room
document.getElementById('roomForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('roomId').value;
    const data = {
        name: document.getElementById('roomName').value,
        type: document.getElementById('roomType').value,
        price: parseInt(document.getElementById('roomPrice').value),
        capacity: parseInt(document.getElementById('roomCapacity').value),
        description: document.getElementById('roomDescription').value,
        amenities: document.getElementById('roomAmenities').value.split(',').map(a => a.trim()),
        images: document.getElementById('roomImages').value.split(',').map(i => i.trim()),
        available: true
    };

    try {
        const url = id ? `${API_URL}/rooms/${id}` : `${API_URL}/rooms`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.success) {
            closeRoomModal();
            loadRooms();
            loadStats();
            alert(id ? 'Room updated successfully!' : 'Room created successfully!');
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error saving room');
        console.error(error);
    }
});

// Delete Room
async function deleteRoom(id) {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
        const res = await fetch(`${API_URL}/rooms/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.success) {
            loadRooms();
            loadStats();
            alert('Room deleted successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error deleting room');
        console.error(error);
    }
}

// Check if logged in
if (token) {
    showDashboard();
}