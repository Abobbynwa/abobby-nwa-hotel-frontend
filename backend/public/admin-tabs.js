(() => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'messages', label: 'Messages' },
    { id: 'add-room', label: 'Add Room' }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const hasHeading = (section, words) => {
    const heading = section?.querySelector('h2');
    return heading && heading.textContent.toLowerCase().includes(words);
  };

  const getParts = () => {
    const dashboard = $('#dashboardSection');
    if (!dashboard) return null;

    const directCards = $$('#dashboardSection > .card');

    return {
      dashboard,
      alert: $('#adminAlert'),
      stats: $('#dashboardSection > .grid'),
      summary: $('#dashboardSummary'),
      bookings: directCards.find((card) => hasHeading(card, 'bookings')),
      rooms: directCards.find((card) => hasHeading(card, 'room management')),
      messages: $('#contactSection'),
      addRoom: $('#roomEditorCard')
    };
  };

  const hide = (el) => el && el.classList.add('admin-tab-hidden');
  const show = (el) => el && el.classList.remove('admin-tab-hidden');

  const hideAllMainSections = () => {
    const p = getParts();
    if (!p) return;
    [p.stats, p.summary, p.bookings, p.rooms, p.messages, p.addRoom].forEach(hide);
  };

  const setActiveButton = (tabId) => {
    $$('.admin-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
  };

  const showTab = (tabId = 'dashboard') => {
    const p = getParts();
    if (!p) return;

    setActiveButton(tabId);
    hideAllMainSections();

    if (tabId === 'dashboard') {
      show(p.stats);
      show(p.summary);
    }

    if (tabId === 'bookings') show(p.bookings);
    if (tabId === 'rooms') show(p.rooms);
    if (tabId === 'messages') show(p.messages);
    if (tabId === 'add-room') show(p.addRoom);

    sessionStorage.setItem('abobby_admin_active_tab', tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.showAdminTab = showTab;

  const makeSummary = () => {
    const p = getParts();
    if (!p || $('#dashboardSummary') || !p.stats) return;

    const summary = document.createElement('section');
    summary.id = 'dashboardSummary';
    summary.className = 'card dashboard-summary-card';
    summary.innerHTML = `
      <div class="section-title">
        <div>
          <h2>Admin Overview</h2>
          <p class="muted">Manage one section at a time. Use the tabs to open bookings, rooms, messages, or add a new room.</p>
        </div>
      </div>
      <div class="quick-actions">
        <button type="button" onclick="showAdminTab('bookings')">Manage Bookings</button>
        <button type="button" onclick="showAdminTab('rooms')">Manage Rooms</button>
        <button type="button" onclick="showAdminTab('messages')">View Messages</button>
        <button type="button" class="success" onclick="showAdminTab('add-room')">Add Room</button>
      </div>
    `;

    p.stats.insertAdjacentElement('afterend', summary);
  };

  const makeTabs = () => {
    const p = getParts();
    if (!p || !p.dashboard) return false;
    if (!p.stats || !p.bookings || !p.rooms || !p.messages || !p.addRoom) return false;

    if (!$('#adminTabs')) {
      const nav = document.createElement('nav');
      nav.id = 'adminTabs';
      nav.className = 'admin-tabs';
      nav.innerHTML = tabs
        .map((tab) => `<button type="button" class="admin-tab-btn" data-tab="${tab.id}">${tab.label}</button>`)
        .join('');

      p.dashboard.insertBefore(nav, p.dashboard.children[1] || null);

      $$('.admin-tab-btn', nav).forEach((btn) => {
        btn.addEventListener('click', () => showTab(btn.dataset.tab));
      });
    }

    const savedTab = sessionStorage.getItem('abobby_admin_active_tab') || 'dashboard';
    showTab(savedTab);
    return true;
  };

  const installStyles = () => {
    if ($('#adminTabsStrongStyles')) return;

    const style = document.createElement('style');
    style.id = 'adminTabsStrongStyles';
    style.textContent = `
      .admin-tab-hidden { display: none !important; }

      .admin-tabs {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        background: rgba(255,255,255,.98);
        border: 1px solid #dbe5f0;
        border-radius: 22px;
        padding: 14px;
        margin: 0 0 24px;
        box-shadow: 0 18px 45px rgba(15,23,42,.08);
        position: sticky;
        top: 92px;
        z-index: 9;
      }

      .admin-tab-btn {
        background: #e5e7eb !important;
        color: #0f172a !important;
        box-shadow: none !important;
        border: 1px solid #cbd5e1 !important;
      }

      .admin-tab-btn.active {
        background: linear-gradient(135deg,#0f172a,#1e293b) !important;
        color: #fff !important;
        border-color: #0f172a !important;
      }

      .dashboard-summary-card {
        background: linear-gradient(135deg,#ffffff,#eff6ff) !important;
        border-left: 6px solid #2563eb !important;
      }

      .quick-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 16px;
      }

      @media(max-width:850px){
        .admin-tabs { position: static; }
        .admin-tab-btn { flex: 1 1 130px; }
      }
    `;

    document.head.appendChild(style);
  };

  const refreshTabs = () => {
    installStyles();
    makeSummary();
    return makeTabs();
  };

  const boot = () => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const ready = refreshTabs();
      if (ready || attempts > 80) clearInterval(timer);
    }, 250);

    const observer = new MutationObserver(() => {
      window.clearTimeout(window.__abobbyTabRefreshTimer);
      window.__abobbyTabRefreshTimer = window.setTimeout(() => {
        refreshTabs();
        const current = sessionStorage.getItem('abobby_admin_active_tab') || 'dashboard';
        showTab(current);
      }, 120);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
