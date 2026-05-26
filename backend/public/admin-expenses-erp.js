(() => {
  const API = '/api';
  const money = (value) => '₦' + Number(value || 0).toLocaleString();
  const getToken = () => localStorage.getItem('hotelToken') || localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

  const categories = [
    'Diesel/Fuel', 'NEPA/Light Bill', 'Water', 'Repairs', 'Laundry',
    'Cleaning Materials', 'Food/Kitchen', 'Staff Salary', 'Other Expenses'
  ];

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

  function ensureExpenseSection() {
    if (document.getElementById('expenseErpCard')) return;
    const dash = document.getElementById('dashboardSection');
    if (!dash) return;

    const section = document.createElement('section');
    section.className = 'card';
    section.id = 'expenseErpCard';
    section.innerHTML = `
      <div class="section-title">
        <div>
          <h2>ERP Dashboard & Expenses</h2>
          <p class="muted">Track money entering the hotel, money going out, and profit/loss.</p>
        </div>
        <button id="refreshExpensesBtn" type="button">Refresh ERP</button>
      </div>

      <div class="toolbar">
        <div><label>From</label><input id="erpFromDate" type="date"></div>
        <div><label>To</label><input id="erpToDate" type="date"></div>
        <div style="align-self:end"><button type="button" id="filterErpBtn">Apply Filter</button></div>
      </div>

      <div class="grid" id="erpSummaryCards" style="margin-top:12px"></div>

      <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0">

      <h3>Add Expense</h3>
      <form id="expenseForm">
        <input type="hidden" id="expenseId" />
        <div class="grid">
          <div><label>Expense Title</label><input id="expenseTitle" required placeholder="Diesel purchase"></div>
          <div><label>Category</label><select id="expenseCategory" required>${categories.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
          <div><label>Amount</label><input id="expenseAmount" type="number" min="0" required placeholder="50000"></div>
          <div><label>Date</label><input id="expenseDate" type="date"></div>
          <div><label>Status</label><select id="expenseStatus"><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select></div>
        </div>
        <div style="margin-top:14px"><label>Note</label><textarea id="expenseNote" placeholder="Optional expense note"></textarea></div>
        <div style="margin-top:14px">
          <button class="success" type="submit" id="saveExpenseBtn">Save Expense</button>
          <button class="secondary hidden" type="button" id="cancelExpenseEditBtn">Cancel Edit</button>
        </div>
      </form>

      <div class="toolbar">
        <div><label>Filter Category</label><select id="expenseCategoryFilter"><option value="all">All Categories</option>${categories.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
        <div style="align-self:end"><button type="button" id="filterExpensesBtn">Filter Expenses</button></div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Created By</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="expenseTable"><tr><td colspan="7">Loading expenses...</td></tr></tbody>
        </table>
      </div>
    `;

    const staffCard = document.getElementById('staffErpCard');
    const roomEditor = document.getElementById('roomEditorCard');
    if (staffCard) dash.insertBefore(section, staffCard);
    else if (roomEditor) dash.insertBefore(section, roomEditor);
    else dash.appendChild(section);

    document.getElementById('expenseDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('expenseForm').addEventListener('submit', saveExpense);
    document.getElementById('refreshExpensesBtn').addEventListener('click', loadErp);
    document.getElementById('filterErpBtn').addEventListener('click', loadErp);
    document.getElementById('filterExpensesBtn').addEventListener('click', loadExpenses);
    document.getElementById('cancelExpenseEditBtn').addEventListener('click', resetExpenseForm);
  }

  function dateQuery() {
    const params = new URLSearchParams();
    const from = document.getElementById('erpFromDate')?.value;
    const to = document.getElementById('erpToDate')?.value;
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params.toString() ? '?' + params.toString() : '';
  }

  function renderSummary(summary = {}, categories = []) {
    const box = document.getElementById('erpSummaryCards');
    if (!box) return;
    const hidden = summary.confirmedRevenue === null || summary.confirmedRevenue === undefined;
    box.innerHTML = `
      <div class="card"><h3>Total Bookings</h3><h2>${summary.totalBookings || 0}</h2></div>
      <div class="card"><h3>Paid Bookings</h3><h2>${summary.paidBookings || 0}</h2></div>
      <div class="card"><h3>Confirmed Revenue</h3><h2>${hidden ? 'Hidden' : money(summary.confirmedRevenue)}</h2></div>
      <div class="card"><h3>Total Expenses</h3><h2>${hidden ? 'Hidden' : money(summary.totalExpenses)}</h2></div>
      <div class="card"><h3>Profit/Loss</h3><h2>${hidden ? 'Hidden' : money(summary.profitLoss)}</h2></div>
      <div class="card"><h3>Expense Records</h3><h2>${summary.expenseCount || 0}</h2></div>
    `;
    if (categories.length) {
      box.innerHTML += `<div class="card" style="grid-column:1/-1"><h3>Expense By Category</h3>${categories.map(c => `<p><strong>${c.category}</strong>: ${money(c.total)} <span class="muted">(${c.count})</span></p>`).join('')}</div>`;
    }
  }

  function getExpenseBody() {
    return {
      title: document.getElementById('expenseTitle').value.trim(),
      category: document.getElementById('expenseCategory').value,
      amount: Number(document.getElementById('expenseAmount').value || 0),
      expense_date: document.getElementById('expenseDate').value || new Date().toISOString().slice(0, 10),
      note: document.getElementById('expenseNote').value.trim(),
      status: document.getElementById('expenseStatus').value
    };
  }

  function resetExpenseForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('saveExpenseBtn').textContent = 'Save Expense';
    document.getElementById('cancelExpenseEditBtn').classList.add('hidden');
  }

  async function saveExpense(e) {
    e.preventDefault();
    const id = document.getElementById('expenseId').value;
    const body = getExpenseBody();
    try {
      if (id) {
        await request(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        alertBox('Expense updated successfully');
      } else {
        await request('/expenses', { method: 'POST', body: JSON.stringify(body) });
        alertBox('Expense saved successfully');
      }
      resetExpenseForm();
      loadErp();
    } catch (err) {
      alertBox(err.message, 'error');
    }
  }

  function editExpense(expense) {
    document.getElementById('expenseId').value = expense.id;
    document.getElementById('expenseTitle').value = expense.title || '';
    document.getElementById('expenseCategory').value = expense.category || 'Other Expenses';
    document.getElementById('expenseAmount').value = expense.amount || 0;
    document.getElementById('expenseDate').value = expense.expense_date ? String(expense.expense_date).slice(0, 10) : '';
    document.getElementById('expenseNote').value = expense.note || '';
    document.getElementById('expenseStatus').value = expense.status || 'approved';
    document.getElementById('saveExpenseBtn').textContent = 'Update Expense';
    document.getElementById('cancelExpenseEditBtn').classList.remove('hidden');
    document.getElementById('expenseErpCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function removeExpense(id) {
    if (!confirm('Delete this expense permanently?')) return;
    try {
      await request(`/expenses/${id}`, { method: 'DELETE' });
      alertBox('Expense deleted successfully');
      loadErp();
    } catch (err) {
      alertBox(err.message, 'error');
    }
  }

  function renderExpenses(expenses = []) {
    const table = document.getElementById('expenseTable');
    if (!table) return;
    if (!expenses.length) {
      table.innerHTML = '<tr><td colspan="7">No expenses recorded yet.</td></tr>';
      return;
    }
    table.innerHTML = expenses.map(exp => `
      <tr>
        <td>${exp.expense_date ? String(exp.expense_date).slice(0, 10) : '-'}</td>
        <td><strong>${exp.title}</strong><br><span class="muted">${exp.note || ''}</span></td>
        <td>${exp.category}</td>
        <td>${money(exp.amount)}</td>
        <td>${exp.created_by_name || '-'}</td>
        <td><span class="pill ${exp.status === 'approved' ? 'paid' : exp.status === 'pending' ? 'pending' : 'cancelled'}">${exp.status || 'approved'}</span></td>
        <td>
          <button class="secondary" type="button" data-edit='${encodeURIComponent(JSON.stringify(exp))}'>Edit</button>
          <button class="danger" type="button" data-delete="${exp.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    table.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editExpense(JSON.parse(decodeURIComponent(btn.dataset.edit)))));
    table.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => removeExpense(btn.dataset.delete)));
  }

  async function loadExpenses() {
    const params = new URLSearchParams();
    const cat = document.getElementById('expenseCategoryFilter')?.value || 'all';
    if (cat !== 'all') params.set('category', cat);
    const dateParams = new URLSearchParams(dateQuery().replace(/^\?/, ''));
    for (const [k, v] of dateParams.entries()) params.set(k, v);
    const query = params.toString() ? '?' + params.toString() : '';
    const data = await request('/expenses' + query);
    renderExpenses(data.expenses || []);
  }

  async function loadSummary() {
    const data = await request('/expenses/summary' + dateQuery());
    renderSummary(data.summary, data.categories || []);
  }

  async function loadErp() {
    ensureExpenseSection();
    if (!getToken()) return;
    try {
      await loadSummary();
      await loadExpenses();
    } catch (err) {
      const table = document.getElementById('expenseTable');
      if (table) table.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
    }
  }

  function boot() {
    ensureExpenseSection();
    setTimeout(loadErp, 1000);
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', () => setTimeout(loadErp, 1300));
  }

  window.loadExpenseErp = loadErp;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
