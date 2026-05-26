(() => {
  const modules = [
    { id: 'expenseErpCard', key: 'finance', label: 'Finance & Expenses', icon: '💰' },
    { id: 'inventoryErpCard', key: 'inventory', label: 'Inventory / Store', icon: '📦' },
    { id: 'staffErpCard', key: 'staff', label: 'Staff Management', icon: '👥' }
  ];

  let activeModule = localStorage.getItem('activeErpModule') || 'finance';

  function existingModules() {
    return modules.filter((module) => document.getElementById(module.id));
  }

  function ensureOrganizer() {
    const dash = document.getElementById('dashboardSection');
    if (!dash) return false;

    const found = existingModules();
    if (!found.length) return false;

    let organizer = document.getElementById('erpWorkspaceOrganizer');
    if (!organizer) {
      organizer = document.createElement('section');
      organizer.className = 'card erp-workspace-card';
      organizer.id = 'erpWorkspaceOrganizer';
      organizer.innerHTML = `
        <div class="section-title">
          <div>
            <h2>ERP Workspace</h2>
            <p class="muted">Open one business module at a time. This keeps the admin panel clean and professional.</p>
          </div>
          <button id="erpShowAllBtn" type="button" class="secondary">Show All</button>
        </div>
        <div id="erpModuleTabs" class="erp-module-tabs"></div>
      `;

      const firstModule = document.getElementById(found[0].id);
      dash.insertBefore(organizer, firstModule);

      document.getElementById('erpShowAllBtn').addEventListener('click', () => {
        activeModule = 'all';
        localStorage.setItem('activeErpModule', activeModule);
        applyLayout();
      });
    }

    const tabs = document.getElementById('erpModuleTabs');
    tabs.innerHTML = found.map((module) => `
      <button type="button" class="erp-tab-btn" data-module="${module.key}">
        <span>${module.icon}</span> ${module.label}
      </button>
    `).join('');

    tabs.querySelectorAll('[data-module]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeModule = btn.dataset.module;
        localStorage.setItem('activeErpModule', activeModule);
        applyLayout();
      });
    });

    return true;
  }

  function applyLayout() {
    const found = existingModules();
    if (!found.length) return;

    if (!found.some((module) => module.key === activeModule) && activeModule !== 'all') {
      activeModule = found[0].key;
      localStorage.setItem('activeErpModule', activeModule);
    }

    found.forEach((module) => {
      const el = document.getElementById(module.id);
      if (!el) return;
      el.classList.add('erp-module-card');
      el.style.display = activeModule === 'all' || activeModule === module.key ? 'block' : 'none';
    });

    document.querySelectorAll('.erp-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', activeModule === btn.dataset.module);
    });

    const showAllBtn = document.getElementById('erpShowAllBtn');
    if (showAllBtn) showAllBtn.classList.toggle('success', activeModule === 'all');
  }

  function boot() {
    const style = document.createElement('style');
    style.textContent = `
      .erp-workspace-card{border:1px solid #dbeafe;background:linear-gradient(135deg,#ffffff,#f8fafc)}
      .erp-module-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-top:16px}
      .erp-tab-btn{background:#f8fafc!important;color:#111827!important;border:1px solid #e5e7eb!important;padding:14px 16px!important;border-radius:16px!important;text-align:left!important;font-weight:900!important;box-shadow:0 8px 24px rgba(15,23,42,.05)}
      .erp-tab-btn:hover,.erp-tab-btn.active{background:#111827!important;color:#fff!important;border-color:#111827!important;transform:translateY(-1px)}
      .erp-module-card{border:1px solid #e5e7eb;box-shadow:0 14px 40px rgba(15,23,42,.07)}
      .erp-module-card > .section-title h2{letter-spacing:-.02em}
    `;
    document.head.appendChild(style);

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const ready = ensureOrganizer();
      if (ready) applyLayout();
      if (ready && attempts > 4) clearInterval(timer);
      if (attempts > 30) clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
