(() => {
  const tokenKey = 'abobby_admin_token';

  const sampleRooms = [
    { name: 'Classic Single Room', type: 'standard', price: 35000, capacity: 1, description: 'Affordable single room for one guest with comfortable bedding, AC, TV, WiFi and clean private bathroom.', amenities: ['WiFi', 'TV', 'AC', 'Private Bathroom', 'Desk'], images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900'] },
    { name: 'Standard Double Room', type: 'standard', price: 65000, capacity: 2, description: 'Comfortable double room suitable for couples or two guests, with modern finishing and essential amenities.', amenities: ['WiFi', 'TV', 'AC', 'Wardrobe', 'Private Bathroom'], images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900'] },
    { name: 'Deluxe King Room', type: 'deluxe', price: 150000, capacity: 2, description: 'Premium deluxe room with king-size bed, elegant interior, work area, smart TV and relaxing bathroom setup.', amenities: ['WiFi', 'Smart TV', 'AC', 'King Bed', 'Mini Fridge', 'Work Desk'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900'] },
    { name: 'Family Deluxe Room', type: 'deluxe', price: 180000, capacity: 4, description: 'Spacious family room with multiple sleeping spaces, warm lighting, AC, WiFi and family-friendly comfort.', amenities: ['WiFi', 'TV', 'AC', 'Family Beds', 'Mini Fridge', 'Private Bathroom'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900'] },
    { name: 'Business Executive Room', type: 'executive', price: 250000, capacity: 2, description: 'Executive room designed for business guests with work desk, fast WiFi, premium bed and quiet ambience.', amenities: ['Fast WiFi', 'Smart TV', 'AC', 'Work Desk', 'Mini Bar', 'Coffee Set'], images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900'] },
    { name: 'Executive Suite Plus', type: 'executive', price: 320000, capacity: 3, description: 'Large executive suite with sitting area, premium bedding, elegant décor and upgraded in-room facilities.', amenities: ['WiFi', 'Smart TV', 'AC', 'Sitting Area', 'Mini Bar', 'Bathrobe'], images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900'] },
    { name: 'Royal Presidential Suite', type: 'presidential', price: 550000, capacity: 6, description: 'Luxury presidential suite with spacious living area, premium comfort, executive ambience and VIP hospitality feel.', amenities: ['WiFi', 'Smart TV', 'AC', 'Luxury Lounge', 'Mini Bar', 'Dining Area', 'VIP Bathroom'], images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900'] },
    { name: 'Penthouse Presidential Suite', type: 'presidential', price: 750000, capacity: 8, description: 'Top-tier penthouse suite for VIP guests, with luxury interiors, large lounge, premium facilities and maximum comfort.', amenities: ['WiFi', 'Smart TV', 'AC', 'Penthouse Lounge', 'Dining Area', 'Mini Bar', 'Luxury Bathroom'], images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900'] }
  ];

  const getToken = () => localStorage.getItem(tokenKey);

  const request = async (path, options = {}) => {
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'Request failed');
    return data;
  };

  const showMessage = (message, type = 'success') => {
    const box = document.getElementById('adminAlert');
    if (!box) return alert(message);
    box.textContent = message;
    box.className = `admin-alert ${type}`;
    setTimeout(() => {
      box.textContent = '';
      box.className = 'admin-alert';
    }, 4000);
  };

  const addRooms = async (button) => {
    if (!getToken()) return showMessage('Please login first.', 'error');
    if (button.dataset.busy === 'true') return;
    if (!confirm('Add 8 more sample rooms to the hotel database?')) return;

    button.dataset.busy = 'true';
    button.disabled = true;
    button.textContent = 'Adding Rooms...';

    try {
      let created = 0;
      for (const room of sampleRooms) {
        await request('/rooms', { method: 'POST', body: JSON.stringify(room) });
        created += 1;
      }
      showMessage(`${created} new rooms added successfully.`);
      if (window.loadRooms) await window.loadRooms();
      else document.getElementById('refreshRoomsBtn')?.click();
    } catch (error) {
      showMessage(error.message || 'Unable to add rooms.', 'error');
    } finally {
      button.dataset.busy = 'false';
      button.disabled = false;
      button.textContent = 'Quick Add 8 Rooms';
    }
  };

  const mountButton = () => {
    const refreshBtn = document.getElementById('refreshRoomsBtn');
    if (!refreshBtn) return;

    let button = document.getElementById('quickAddRoomsBtn');
    if (!button) {
      button = document.createElement('button');
      button.id = 'quickAddRoomsBtn';
      button.type = 'button';
      button.className = 'success';
      button.textContent = 'Quick Add 8 Rooms';
      refreshBtn.parentNode.insertBefore(button, refreshBtn);
    }

    if (button.dataset.seedReady === 'true') return;
    button.dataset.seedReady = 'true';
    button.onclick = () => addRooms(button);
  };

  setInterval(mountButton, 700);
  document.addEventListener('DOMContentLoaded', mountButton);
})();
