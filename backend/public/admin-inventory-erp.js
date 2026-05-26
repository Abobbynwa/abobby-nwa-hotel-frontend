(() => {
  const API = '/api';
  const getToken = () => localStorage.getItem('hotelToken') || localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

  const categories = ['Bedsheets', 'Towels', 'Soap', 'Drinks', 'Food Items', 'Cleaning Items', 'Room Supplies', 'Tools/Repairs', 'Other'];
  const units = ['pcs', 'packs', 'cartons', 'litres', 'kg', 'bags', 'sets', 'bottles'];

  async function request(path, options = {}) {
    const res = await fetch(API + path, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  function alertBox(message, type = 'success') {
    const box = document.getElementById('adminAlert');
    if (!box) return alert(message);
    box.className = `admin-alert ${type}`;
    box.textContent = message;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 4500);
  }

  function ensureInventorySection() {
    if (document.getElementById('inventoryErpCard')) return;
    const dash = document.getElementById('dashboardSection');
    if (!dash) return;

    const section = document.createElement('section');
    section.className = 'card';
    section.id = 'inventoryErpCard';
    section.innerHTML = `
      <div class="section-title">
        <div>
          <h2>Inventory / Store Management</h2>
          <p class="muted">Track bedsheets, towels, soap, drinks, food items, cleaning items, and room supplies.</p>
        </div>
        <button id="refreshInventoryBtn" type="button">Refresh Inventory</button>
      </div>

      <div class="grid" id="inventorySummaryCards" style="margin-top:12px"></div>
      <div id="lowStockBox" class="card" style="background:#fff7ed;border:1px solid #fed7aa;margin-top:14px;display:none"></div>

      <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0">

      <h3>Add / Edit Store Item</h3>
      <form id="inventoryForm">
        <input type="hidden" id="inventoryId" />
        <div class="grid">
          <div><label>Item Name</label><input id="inventoryName" required placeholder="White bedsheet"></div>
          <div><label>Category</label><select id="inventoryCategory" required>${categories.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
          <div><label>Unit</label><select id="inventoryUnit">${units.map(u => `<option value="${u}">${u}</option>`).join('')}</select></div>
          <div><label>Opening Quantity</label><input id="inventoryQuantity" type="number" min="0" value="0"></div>
          <div><label>Minimum Stock Alert</label><input id="inventoryMinimum" type="number" min="0" value="5"></div>
          <div><label>Location</label><input id="inventoryLocation" placeholder="Store room A"></div>
          <div><label>Status</label><select id="inventoryStatus"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
        <div style="margin-top:14px"><label>Note</label><textarea id="inventoryNote" placeholder="Optional item note"></textarea></div>
        <div style="margin-top:14px">
          <button class="success" type="submit" id="saveInventoryBtn">Save Inventory Item</button>
          <button class="secondary hidden" type="button" id="cancelInventoryEditBtn">Cancel Edit</button>
        </div>
      </form>

      <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0">

      <h3>Stock Movement</h3>
      <form id="movementForm">
        <div class="grid">
          <div><label>Select Item</label><select id="movementItem" required></select></div>
          <div><label>Movement Type</label><select id="movementType"><option value="stock_in">Stock In</option><option value="stock_out">Stock Out</option><option value="adjustment">Adjustment</option></select></div>
          <div><label>Quantity</label><input id="movementQuantity" type="number" min="1" required></div>
          <div><label>Reason</label><input id="movementReason" placeholder="Used for room cleaning"></div>
        </div>
        <div style="margin-top:14px"><button type="submit" class="warning">Update Stock</button></div>
      </form>

      <div class="toolbar">
        <div><label>Search Item</label><input id="inventorySearch" placeholder="Search item, category, location"></div>
        <div><label>Filter Category</label><select id="inventoryCategoryFilter"><option value="all">All Categories</option>${categories.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
        <div><label>Status</label><select id="inventoryStatusFilter"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <div style="align-self:end"><button type="button" id="filterInventoryBtn">Filter Inventory</button></div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Min Alert</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="inventoryTable"><tr><td colspan="7">Loading inventory...</td></tr></tbody>
        </table>
      </div>

      <details style="margin-top:18px">
        <summary style="cursor:pointer;font-weight:800">Recent Stock Movements</summary>
        <div class="table-wrap" style="margin-top:12px">
          <table>
            <thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Before</th><th>After</th><th>By</th><th>Reason</th></tr></thead>
            <tbody id="movementTable"><tr><td colspan="8">Loading movements...</td></tr></tbody>
          </table>
        </div>
      </details>
    `;

    const expenseCard = document.getElementById('expenseErpCard');
    const staffCard = document.getElementById('staffErpCard');
    const roomEditor = document.getElementById('roomEditorCard');
    if (staffCard) dash.insertBefore(section, staffCard);
    else if (expenseCard && expenseCard.nextSibling) dash.insertBefore(section, expenseCard.nextSibling);
    else if (roomEditor) dash.insertBefore(section, roomEditor);
    else dash.appendChild(section);

    document.getElementById('inventoryForm').addEventListener('submit', saveInventoryItem);
    document.getElementById('movementForm').addEventListener('submit', saveMovement);
    document.getElementById('refreshInventoryBtn').addEventListener('click', loadInventoryErp);
    document.getElementById('filterInventoryBtn').addEventListener('click', loadInventoryItems);
    document.getElementById('cancelInventoryEditBtn').addEventListener('click', resetInventoryForm);
  }

  function inventoryQuery() {
    const params = new URLSearchParams();
    const search = document.getElementById('inventorySearch')?.value.trim();
    const category = document.getElementById('inventoryCategoryFilter')?.value || 'all';
    const status = document.getElementById('inventoryStatusFilter')?.value || 'all';
    if (search) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    if (status !== 'all') params.set('status', status);
    return params.toString() ? '?' + params.toString() : '';
  }

  function getItemBody() {
    return {
      name: document.getElementById('inventoryName').value.trim(),
      category: document.getElementById('inventoryCategory').value,
      unit: document.getElementById('inventoryUnit').value,
      quantity: Number(document.getElementById('inventoryQuantity').value || 0),
      minimum_stock: Number(document.getElementById('inventoryMinimum').value || 0),
      location: document.getElementById('inventoryLocation').value.trim(),
      note: document.getElementById('inventoryNote').value.trim(),
      status: document.getElementById('inventoryStatus').value
    };
  }

  function resetInventoryForm() {
    document.getElementById('inventoryForm').reset();
    document.getElementById('inventoryId').value = '';
    document.getElementById('inventoryQuantity').disabled = false;
    document.getElementById('saveInventoryBtn').textContent = 'Save Inventory Item';
    document.getElementById('cancelInventoryEditBtn').classList.add('hidden');
  }

  async function saveInventoryItem(e) {
    e.preventDefault();
    const id = document.getElementById('inventoryId').value;
    const body = getItemBody();
    try {
      if (id) {
        delete body.quantity;
        await request(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        alertBox('Inventory item updated successfully');
      } else {
        await request('/inventory', { method: 'POST', body: JSON.stringify(body) });
        alertBox('Inventory item created successfully');
      }
      resetInventoryForm();
      loadInventoryErp();
    } catch (err) {
      alertBox(err.message, 'error');
    }
  }

  async function saveMovement(e) {
    e.preventDefault();
    const id = document.getElementById('movementItem').value;
    const body = {
      movement_type: document.getElementById('movementType').value,
      quantity: Number(document.getElementById('movementQuantity').value || 0),
      reason: document.getElementById('movementReason').value.trim()
    };
    try {
      await request(`/inventory/${id}/move`, { method: 'POST', body: JSON.stringify(body) });
      alertBox('Stock updated successfully');
      document.getElementById('movementForm').reset();
      loadInventoryErp();
    } catch (err) {
      alertBox(err.message, 'error');
    }
  }

  function renderSummary(data = {}) {
    const summary = data.summary || {};
    const box = document.getElementById('inventorySummaryCards');
    if (box) {
      box.innerHTML = `
        <div class="card"><h3>Total Items</h3><h2>${summary.total_items || 0}</h2></div>
        <div class="card"><h3>Active Items</h3><h2>${summary.active_items || 0}</h2></div>
        <div class="card"><h3>Low Stock</h3><h2>${summary.low_stock_items || 0}</h2></div>
        <div class="card"><h3>Total Quantity</h3><h2>${summary.total_quantity || 0}</h2></div>
      `;
    }
    const lowBox = document.getElementById('lowStockBox');
    const low = data.lowStock || [];
    if (lowBox) {
      if (!low.length) {
        lowBox.style.display = 'none';
      } else {
        lowBox.style.display = 'block';
        lowBox.innerHTML = `<h3 style="margin-top:0;color:#9a3412">Low Stock Alert</h3>${low.map(i => `<p><strong>${i.name}</strong> — ${i.quantity} ${i.unit} left. Minimum: ${i.minimum_stock}</p>`).join('')}`;
      }
    }
  }

  function renderItems(items = []) {
    const table = document.getElementById('inventoryTable');
    const select = document.getElementById('movementItem');
    if (select) select.innerHTML = items.map(i => `<option value="${i.id}">${i.name} (${i.quantity} ${i.unit})</option>`).join('');
    if (!table) return;
    if (!items.length) {
      table.innerHTML = '<tr><td colspan="7">No inventory item yet.</td></tr>';
      return;
    }
    table.innerHTML = items.map(item => `
      <tr>
        <td><strong>${item.name}</strong><br><span class="muted">${item.note || ''}</span></td>
        <td>${item.category}</td>
        <td><span class="pill ${item.low_stock ? 'pending' : 'paid'}">${item.quantity} ${item.unit}</span></td>
        <td>${item.minimum_stock} ${item.unit}</td>
        <td>${item.location || '-'}</td>
        <td><span class="pill ${item.status === 'active' ? 'paid' : 'cancelled'}">${item.status || 'active'}</span></td>
        <td>
          <button class="secondary" type="button" data-edit='${encodeURIComponent(JSON.stringify(item))}'>Edit</button>
          <button class="danger" type="button" data-delete="${item.id}">Delete</button>
        </td>
      </tr>
    `).join('');
    table.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editItem(JSON.parse(decodeURIComponent(btn.dataset.edit)))));
    table.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteItem(btn.dataset.delete)));
  }

  function editItem(item) {
    document.getElementById('inventoryId').value = item.id;
    document.getElementById('inventoryName').value = item.name || '';
    document.getElementById('inventoryCategory').value = item.category || 'Other';
    document.getElementById('inventoryUnit').value = item.unit || 'pcs';
    document.getElementById('inventoryQuantity').value = item.quantity || 0;
    document.getElementById('inventoryQuantity').disabled = true;
    document.getElementById('inventoryMinimum').value = item.minimum_stock || 0;
    document.getElementById('inventoryLocation').value = item.location || '';
    document.getElementById('inventoryNote').value = item.note || '';
    document.getElementById('inventoryStatus').value = item.status || 'active';
    document.getElementById('saveInventoryBtn').textContent = 'Update Inventory Item';
    document.getElementById('cancelInventoryEditBtn').classList.remove('hidden');
    document.getElementById('inventoryErpCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteItem(id) {
    if (!confirm('Delete this inventory item permanently?')) return;
    try {
      await request(`/inventory/${id}`, { method: 'DELETE' });
      alertBox('Inventory item deleted successfully');
      loadInventoryErp();
    } catch (err) {
      alertBox(err.message, 'error');
    }
  }

  function renderMovements(movements = []) {
    const table = document.getElementById('movementTable');
    if (!table) return;
    if (!movements.length) {
      table.innerHTML = '<tr><td colspan="8">No stock movement yet.</td></tr>';
      return;
    }
    table.innerHTML = movements.map(m => `
      <tr>
        <td>${m.created_at ? new Date(m.created_at).toLocaleString() : '-'}</td>
        <td>${m.item_name || '-'}</td>
        <td><span class="pill ${m.movement_type === 'stock_out' ? 'pending' : 'paid'}">${m.movement_type}</span></td>
        <td>${m.quantity} ${m.unit || ''}</td>
        <td>${m.previous_quantity}</td>
        <td>${m.new_quantity}</td>
        <td>${m.created_by_name || '-'}</td>
        <td>${m.reason || '-'}</td>
      </tr>
    `).join('');
  }

  async function loadInventoryItems() {
    const data = await request('/inventory' + inventoryQuery());
    renderItems(data.items || []);
  }

  async function loadInventorySummary() {
    const data = await request('/inventory/summary');
    renderSummary(data);
  }

  async function loadMovements() {
    const data = await request('/inventory/movements');
    renderMovements(data.movements || []);
  }

  async function loadInventoryErp() {
    ensureInventorySection();
    if (!getToken()) return;
    try {
      await loadInventorySummary();
      await loadInventoryItems();
      await loadMovements();
    } catch (err) {
      const table = document.getElementById('inventoryTable');
      if (table) table.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
    }
  }

  function boot() {
    ensureInventorySection();
    setTimeout(loadInventoryErp, 1200);
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', () => setTimeout(loadInventoryErp, 1500));
  }

  window.loadInventoryErp = loadInventoryErp;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
