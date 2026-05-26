(() => {
  const API = '/api';
  const money = (value) => '₦' + Number(value || 0).toLocaleString();
  const getToken = () => localStorage.getItem('hotelToken') || localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

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

  function ensureStaffSection() {
    if (document.getElementById('staffErpCard')) return;
    const dash = document.getElementById('dashboardSection');
    if (!dash) return;

    const section = document.createElement('section');
    section.className = 'card';
    section.id = 'staffErpCard';
    section.innerHTML = `
      <div class="section-title">
        <div>
          <h2>Staff ERP Management</h2>
          <p class="muted">Create staff logins, assign role, salary, and monitor who can access each ERP page.</p>
        </div>
        <div>
          <a class="btn secondary" href="/staff" target="_blank">Open Staff Portal</a>
          <button id="refreshStaffBtn" type="button">Refresh Staff</button>
        </div>
      </div>

      <form id="staffForm" style="margin-top:14px">
        <input type="hidden" id="staffId" />
        <div class="grid">
          <div><label>Full Name</label><input id="staffNameInput" required placeholder="Staff full name"></div>
          <div><label>Email/Login</label><input id="staffEmailInput" type="email" required placeholder="staff@email.com"></div>
          <div><label>Password</label><input id="staffPasswordInput" type="text" required placeholder="Temporary password"></div>
          <div><label>Role</label><select id="staffRoleInput" required>
            <option value="receptionist">Receptionist</option>
            <option value="housekeeping">Housekeeping</option>
            <option value="accountant">Accountant</option>
            <option value="manager">Manager</option>
            <option value="maintenance">Maintenance</option>
          </select></div>
          <div><label>Phone</label><input id="staffPhoneInput" placeholder="Phone number"></div>
          <div><label>Department</label><input id="staffDepartmentInput" placeholder="Front Desk, Finance, Housekeeping"></div>
          <div><label>Job Title</label><input id="staffJobTitleInput" placeholder="Front Desk Officer"></div>
          <div><label>Salary</label><input id="staffSalaryInput" type="number" min="0" value="0"></div>
          <div><label>Employment Date</label><input id="staffEmploymentInput" type="date"></div>
          <div><label>Status</label><select id="staffStatusInput"><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></div>
        </div>
        <div class="grid" style="margin-top:14px">
          <div><label>Address</label><textarea id="staffAddressInput" placeholder="Home address"></textarea></div>
          <div><label>Emergency Contact</label><textarea id="staffEmergencyInput" placeholder="Name and phone number"></textarea></div>
        </div>
        <div style="margin-top:14px">
          <button class="success" type="submit" id="saveStaffBtn">Create Staff Login</button>
          <button class="secondary hidden" type="button" id="cancelStaffEditBtn">Cancel Edit</button>
        </div>
      </form>

      <div class="grid" id="staffSummaryCards" style="margin-top:18px"></div>

      <div class="table-wrap" style="margin-top:18px">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="staffTable"><tr><td colspan="6">Loading staff...</td></tr></tbody>
        </table>
      </div>
    `;

    const roomEditor = document.getElementById('roomEditorCard');
    if (roomEditor) dash.insertBefore(section, roomEditor);
    else dash.appendChild(section);

    document.getElementById('staffForm').addEventListener('submit', saveStaff);
    document.getElementById('refreshStaffBtn').addEventListener('click', loadStaff);
    document.getElementById('cancelStaffEditBtn').addEventListener('click', resetStaffForm);
  }

  function formData() {
    return {
      name: document.getElementById('staffNameInput').value.trim(),
      email: document.getElementById('staffEmailInput').value.trim(),
      password: document.getElementById('staffPasswordInput').value.trim(),
      role: document.getElementById('staffRoleInput').value,
      phone: document.getElementById('staffPhoneInput').value.trim(),
      salary: Number(document.getElementById('staffSalaryInput').value || 0),
      department: document.getElementById('staffDepartmentInput').value.trim(),
      job_title: document.getElementById('staffJobTitleInput').value.trim(),
      employment_date: document.getElementById('staffEmploymentInput').value || null,
      status: document.getElementById('staffStatusInput').value,
      address: document.getElementById('staffAddressInput').value.trim(),
      emergency_contact: document.getElementById('staffEmergencyInput').value.trim()
    };
  }

  function resetStaffForm() {
    document.getElementById('staffForm').reset();
    document.getElementById('staffId').value = '';
    document.getElementById('staffPasswordInput').required = true;
    document.getElementById('saveStaffBtn').textContent = 'Create Staff Login';
    document.getElementById('cancelStaffEditBtn').classList.add('hidden');
  }

  async function saveStaff(e) {
    e.preventDefault();
    const id = document.getElementById('staffId').value;
    const body = formData();

    try {
      if (id) {
        if (!body.password) delete body.password;
        await request(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        alertBox('Staff account updated successfully');
      } else {
        if (!body.password || body.password.length < 6) throw new Error('Password must be at least 6 characters');
        await request('/staff', { method: 'POST', body: JSON.stringify(body) });
        alertBox('Staff login created successfully');
      }
      resetStaffForm();
      loadStaff();
    } catch (err) {
      alertBox(err.message, 'error');
    }
  }

  function editStaff(staff) {
    document.getElementById('staffId').value = staff.id;
    document.getElementById('staffNameInput').value = staff.name || '';
    document.getElementById('staffEmailInput').value = staff.email || '';
    document.getElementById('staffPasswordInput').value = '';
    document.getElementById('staffPasswordInput').required = false;
    document.getElementById('staffRoleInput').value = staff.role || 'receptionist';
    document.getElementById('staffPhoneInput').value = staff.phone || '';
    document.getElementById('staffSalaryInput').value = staff.salary || 0;
    document.getElementById('staffDepartmentInput').value = staff.department || '';
    document.getElementById('staffJobTitleInput').value = staff.job_title || '';
    document.getElementById('staffEmploymentInput').value = staff.employment_date ? String(staff.employment_date).slice(0, 10) : '';
    document.getElementById('staffStatusInput').value = staff.status || 'active';
    document.getElementById('staffAddressInput').value = staff.address || '';
    document.getElementById('staffEmergencyInput').value = staff.emergency_contact || '';
    document.getElementById('saveStaffBtn').textContent = 'Update Staff Account';
    document.getElementById('cancelStaffEditBtn').classList.remove('hidden');
    document.getElementById('staffErpCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderStaff(staff = []) {
    const table = document.getElementById('staffTable');
    if (!table) return;
    if (!staff.length) {
      table.innerHTML = '<tr><td colspan="6">No staff accounts yet. Create the first staff login above.</td></tr>';
      return;
    }
    table.innerHTML = staff.map((s) => `
      <tr>
        <td><strong>${s.name || '-'}</strong><br><span class="muted">${s.department || s.job_title || ''}</span></td>
        <td>${s.email || '-'}</td>
        <td><span class="pill">${s.role || '-'}</span></td>
        <td>${s.salary === null || s.salary === undefined ? 'Hidden' : money(s.salary)}</td>
        <td><span class="pill ${s.status === 'active' ? 'paid' : 'cancelled'}">${s.status || 'active'}</span></td>
        <td><button type="button" class="secondary" data-staff='${encodeURIComponent(JSON.stringify(s))}'>Edit</button></td>
      </tr>
    `).join('');

    table.querySelectorAll('button[data-staff]').forEach((btn) => {
      btn.addEventListener('click', () => editStaff(JSON.parse(decodeURIComponent(btn.dataset.staff))));
    });
  }

  function renderSummary(summary) {
    const box = document.getElementById('staffSummaryCards');
    if (!box || !summary) return;
    box.innerHTML = `
      <div class="card"><h3>Total Staff</h3><h2>${summary.staff ?? summary.total_staff ?? 0}</h2></div>
      <div class="card"><h3>Active Staff</h3><h2>${summary.active ?? summary.active_staff ?? 0}</h2></div>
      <div class="card"><h3>Monthly Salary</h3><h2>${summary.monthlySalaryTotal === null ? 'Hidden' : money(summary.monthlySalaryTotal || summary.total_salary || 0)}</h2></div>
    `;
  }

  async function loadStaff() {
    ensureStaffSection();
    if (!getToken()) return;
    try {
      const data = await request('/staff');
      renderStaff(data.staff || []);
    } catch (err) {
      const table = document.getElementById('staffTable');
      if (table) table.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
    }
    try {
      const data = await request('/staff/summary');
      renderSummary(data.summary);
    } catch (_) {}
  }

  function boot() {
    ensureStaffSection();
    setTimeout(loadStaff, 800);
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', () => setTimeout(loadStaff, 1200));
  }

  window.loadStaffErp = loadStaff;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
