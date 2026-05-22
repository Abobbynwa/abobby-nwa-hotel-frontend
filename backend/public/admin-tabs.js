(() => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'messages', label: 'Messages' },
    { id: 'add-room', label: 'Add Room' }
  ];

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const sectionHasHeading = (section, text) => {
    const heading = qs('h2', section);
    return heading && heading.textContent.trim().toLowerCase().includes(text);
  };

  const getSections = () => {
    const dashboard = qs('#dashboardSection');
    if (!dashboard) return null;

    const cards = qsa(':scope > .card', dashboard);
    const statGrid = qs(':scope > .grid', dashboard);

    const bookings = cards.find((card) => sectionHasHeading(card, 'bookings'));
    const rooms = cards.find((card) => sectionHasHeading(card, 'room management'));
    const addRoom = qs('#roomEditorCard');
    const messages = qs('#contactSection');

    return { dashboard, statGrid, bookings, rooms, messages, addRoom };
  };

  const showTab = (tabId) => {
    const sections = getSections();
    if (!sections) return;

    qsa('.admin-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    const targets = [
      sections.statGrid,
      sections.bookings,
      sections.rooms,
      sections.messages,
      sections.addRoom
    ].filter(Boolean);

    targets.forEach((target) => target.classList.add('admin-tab-hidden'));

    if (tabId === 'dashboard') {
      sections.statGrid?.classList.remove('admin-tab-hidden');
      return;
    }

    if (tabId === 'bookings') sections.bookings?.classList.remove('admin-tab-hidden');
    if (tabId === 'rooms') sections.rooms?.classList.remove('admin-tab-hidden');
    if (tabId === 'messages') sections.messages?.classList.remove('admin-tab-hidden');
    if (tabId === 'add-room') sections.addRoom?.classList.remove('admin-tab-hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.showAdminTab = showTab;

  const buildTabs = () => {
    const sections = getSections();
    if (!sections || !sections.bookings || !sections.rooms || !sections.addRoom) return false;

    if (!sections.messages) return false;

    if (!qs('#adminTabs')) {
      const nav = document.createElement('nav');
      nav.id = 'adminTabs';
      nav.className = 'admin-tabs';
      nav.innerHTML = tabs
        .map((tab) => `<button type="button" class="admin-tab-btn" data-tab="${tab.id}">${tab.label}</button>`)
        .join('');

      sections.dashboard.insertBefore(nav, sections.dashboard.children[1] || null);

      qsa('.admin-tab-btn', nav).forEach((btn) => {
        btn.addEventListener('click', () => showTab(btn.dataset.tab));
      });
    }

    showTab('dashboard');
    return true;
  };

  const addDashboardSummary = () => {
    const sections = getSections();
    if (!sections || qs('#dashboardSummary')) return;

    const summary = document.createElement('section');
    summary.id = 'dashboardSummary';
    summary.className = 'card dashboard-summary-card';
    summary.innerHTML = `
      <div class="section-title">
        <div>
          <h2>Admin Overview</h2>
          <p class="muted">Use the tabs above to manage bookings, rooms, messages, and new room uploads without scrolling through everything.</p>
        </div>
      </div>
      <div class="quick-actions">
        <button type="button" onclick="showAdminTab('bookings')">Manage Bookings</button>
        <button type="button" onclick="showAdminTab('rooms')">Manage Rooms</button>
        <button type="button" onclick="showAdminTab('messages')">View Messages</button>
        <button type="button" class="success" onclick="showAdminTab('add-room')">Add Room</button>
      </div>
    `;

    if (sections.statGrid) {
      sections.statGrid.insertAdjacentElement('afterend', summary);
    }
  };

  const boot = () => {
    const style = document.createElement('style');
    style.textContent = `
      .admin-tabs {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        background: rgba(255,255,255,.95);
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

      .admin-tab-hidden {
        display: none !important;
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

      @media(max-width: 850px) {
        .admin-tabs {
          position: static;
        }
        .admin-tab-btn {
          flex: 1 1 130px;
        }
      }
    `;
    document.head.appendChild(style);

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      addDashboardSummary();
      if (buildTabs() || attempts > 30) clearInterval(interval);
    }, 500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
