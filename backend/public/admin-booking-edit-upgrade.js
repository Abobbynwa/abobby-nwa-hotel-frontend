(() => {
  const fallbackImg = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900';
  const tokenKey = 'abobby_admin_token';
  const getToken = () => localStorage.getItem(tokenKey);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  const money = (n) => '₦' + Number(n || 0).toLocaleString();
  const dateFmt = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const nights = (a, b) => {
    const start = new Date(a);
    const end = new Date(b);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-';
    return Math.max(1, Math.round((end - start) / 86400000));
  };
  const note = (txt, label) => {
    const m = String(txt || '').match(new RegExp(label + ':\\s*([^|]+)', 'i'));
    return m ? m[1].trim() : '';
  };

  const api = async (path, options = {}) => {
    const res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
    return data;
  };

  const alertBox = (message, type = 'success') => {
    const box = document.getElementById('adminAlert');
    if (!box) return alert(message);
    box.textContent = message;
    box.className = `admin-alert ${type}`;
    setTimeout(() => {
      box.textContent = '';
      box.className = 'admin-alert';
    }, 3500);
  };

  const injectStyles = () => {
    if (document.getElementById('bookingEditUpgradeStyle')) return;
    const style = document.createElement('style');
    style.id = 'bookingEditUpgradeStyle';
    style.textContent = `
      .admin-booking-board {
        display: grid;
        gap: 16px;
        margin-top: 18px;
      }
      .admin-booking-card {
        display: grid;
        grid-template-columns: 1.25fr 1fr 1fr .95fr;
        gap: 16px;
        align-items: stretch;
        background: #fff;
        border: 1px solid #dbe5f0;
        border-radius: 24px;
        padding: 18px;
        box-shadow: 0 18px 45px rgba(15, 23, 42, .07);
      }
      .booking-card-main h3 {
        margin: 0 0 6px;
        font-size: 19px;
        color: #0f172a;
      }
      .booking-ref-badge {
        display: inline-flex;
        padding: 7px 10px;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        font-weight: 900;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .booking-mini-line {
        color: #64748b;
        margin: 4px 0;
        font-size: 13px;
        line-height: 1.45;
      }
      .booking-room-block,
      .booking-stay-block,
      .booking-payment-block {
        background: linear-gradient(135deg, #f8fafc, #ffffff);
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 14px;
      }
      .booking-block-label {
        display: block;
        color: #64748b;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .08em;
        margin-bottom: 8px;
      }
      .booking-room-name,
      .booking-amount {
        display: block;
        color: #0f172a;
        font-size: 18px;
        font-weight: 900;
        margin-bottom: 8px;
      }
      .booking-stay-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .booking-date-chip {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 10px;
      }
      .booking-date-chip b {
        display: block;
        color: #0f172a;
        font-size: 14px;
      }
      .booking-date-chip span {
        color: #64748b;
        font-size: 12px;
      }
      .booking-nights {
        margin-top: 8px;
        display: inline-flex;
        padding: 6px 10px;
        border-radius: 999px;
        background: #fef3c7;
        color: #92400e;
        font-size: 12px;
        font-weight: 900;
      }
      .booking-action-panel {
        display: flex;
        flex-direction: column;
        gap: 9px;
        justify-content: center;
      }
      .booking-action-panel button,
      .booking-action-panel a button {
        width: 100%;
        min-height: 44px;
        margin: 0 !important;
      }
      .booking-status-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      .booking-proof-link { display: block; margin-top: 10px; }
      .booking-empty-state {
        padding: 28px;
        text-align: center;
        color: #64748b;
        border: 1px dashed #cbd5e1;
        border-radius: 22px;
        background: #fff;
        font-weight: 800;
      }
      #bookingsTable { display: block !important; }
      #bookingsTable tr, #bookingsTable td { display: block !important; border: 0 !important; padding: 0 !important; }
      #bookingsTable .admin-booking-board { display: grid !important; }
      #bookingsTable + * { display: none; }
      .card:has(#bookingsTable) table thead { display: none !important; }
      .card:has(#bookingsTable) table { border-collapse: separate !important; }
      @media(max-width: 1050px) {
        .admin-booking-card { grid-template-columns: 1fr 1fr; }
      }
      @media(max-width: 720px) {
        .admin-booking-card { grid-template-columns: 1fr; }
        .booking-stay-grid { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  };

  const getFilteredBookings = () => {
    const source = Array.isArray(window.bookings) ? window.bookings : [];
    const localBookings = source.length ? source : Array.from(document.querySelectorAll('#bookingsTable tr')).map(() => null).filter(Boolean);
    const q = (document.getElementById('bookingSearch')?.value || '').toLowerCase().trim();
    const st = document.getElementById('bookingStatusFilter')?.value || 'all';
    const pay = document.getElementById('bookingPaymentFilter')?.value || 'all';
    return localBookings.filter((b) =>
      (!q || `${b.reference} ${b.full_name} ${b.email} ${b.phone} ${b.room_name} ${b.room_type}`.toLowerCase().includes(q)) &&
      (st === 'all' || b.status === st) &&
      (pay === 'all' || b.payment_status === pay)
    );
  };

  const renderBookingCards = () => {
    if (!Array.isArray(window.bookings) || !document.getElementById('bookingsTable')) return false;
    const table = document.getElementById('bookingsTable');
    const pageSize = 5;
    window.__bookingCardPage = window.__bookingCardPage || 1;
    const list = getFilteredBookings();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    window.__bookingCardPage = Math.min(Math.max(1, window.__bookingCardPage), pages);
    const start = (window.__bookingCardPage - 1) * pageSize;
    const rows = list.slice(start, start + pageSize);

    if (!rows.length) {
      table.innerHTML = `<tr><td><div class="booking-empty-state">No bookings found for this filter.</div></td></tr>`;
    } else {
      table.innerHTML = `<tr><td><div class="admin-booking-board">${rows.map((b) => {
        const wallet = note(b.payment_note, 'Selected Bank/Wallet') || b.transfer_bank || '-';
        const nar = note(b.payment_note, 'Unique Narration') || '-';
        const stayNights = nights(b.check_in, b.check_out);
        const proof = b.payment_proof ? `<a class="booking-proof-link" href="${esc(b.payment_proof)}" target="_blank"><button class="secondary">View Payment Proof</button></a>` : '<p class="booking-mini-line">No proof uploaded</p>';
        const canPay = b.payment_status !== 'paid';
        const canConfirm = b.status !== 'confirmed';
        return `<article class="admin-booking-card">
          <div class="booking-card-main">
            <span class="booking-ref-badge">${esc(b.reference)}</span>
            <h3>${esc(b.full_name || 'Guest')}</h3>
            <p class="booking-mini-line">📧 ${esc(b.email || '-')}</p>
            <p class="booking-mini-line">📞 ${esc(b.phone || '-')}</p>
            <p class="booking-mini-line">👤 ${esc(b.gender || '-')}</p>
            <div class="booking-status-row">
              <span class="pill ${esc(b.status)}">${esc(b.status)}</span>
              <span class="pill ${esc(b.payment_status)}">${esc(b.payment_status)}</span>
            </div>
          </div>
          <div class="booking-room-block">
            <span class="booking-block-label">Room & Total</span>
            <span class="booking-room-name">${esc(b.room_name || b.room_type || '-')}</span>
            <span class="booking-amount">${money(b.total)}</span>
            <p class="booking-mini-line">Guests: ${esc(b.guests || b.number_of_guests || '-')}</p>
          </div>
          <div class="booking-stay-block">
            <span class="booking-block-label">Stay Details</span>
            <div class="booking-stay-grid">
              <div class="booking-date-chip"><span>Check-in</span><b>${dateFmt(b.check_in)}</b></div>
              <div class="booking-date-chip"><span>Check-out</span><b>${dateFmt(b.check_out)}</b></div>
            </div>
            <span class="booking-nights">${stayNights} night(s)</span>
          </div>
          <div class="booking-payment-block">
            <span class="booking-block-label">Payment</span>
            <strong>${esc(b.payment_method === 'bank_transfer' ? 'Bank Transfer' : (b.payment_method || 'Paystack/None'))}</strong>
            <p class="booking-mini-line">Wallet: ${esc(wallet)}</p>
            <p class="booking-mini-line">Narration: ${esc(nar)}</p>
            ${proof}
            <div class="booking-action-panel">
              ${canPay ? `<button class="success" onclick="updateBooking(${b.id},'confirmed','paid')">Mark Paid</button>` : ''}
              ${canConfirm ? `<button class="warning" onclick="updateBooking(${b.id},'confirmed','${esc(b.payment_status)}')">Confirm</button>` : ''}
              <button class="danger" onclick="updateBooking(${b.id},'cancelled','${esc(b.payment_status)}')">Cancel</button>
              <button class="danger" onclick="deleteBooking(${b.id})">Delete</button>
            </div>
          </div>
        </article>`;
      }).join('')}</div></td></tr>`;
    }

    const info = document.getElementById('bookingPageInfo');
    if (info) info.textContent = `Showing ${list.length ? start + 1 : 0}-${Math.min(start + pageSize, list.length)} of ${list.length} bookings | Page ${window.__bookingCardPage}/${pages}`;
    const prev = document.getElementById('bookingPrevBtn');
    const next = document.getElementById('bookingNextBtn');
    if (prev) prev.disabled = window.__bookingCardPage <= 1;
    if (next) next.disabled = window.__bookingCardPage >= pages;
    return true;
  };

  const patchBookingPagination = () => {
    const prev = document.getElementById('bookingPrevBtn');
    const next = document.getElementById('bookingNextBtn');
    if (prev && prev.dataset.cardPatch !== 'true') {
      prev.dataset.cardPatch = 'true';
      prev.onclick = () => {
        window.__bookingCardPage = Math.max(1, (window.__bookingCardPage || 1) - 1);
        renderBookingCards();
      };
    }
    if (next && next.dataset.cardPatch !== 'true') {
      next.dataset.cardPatch = 'true';
      next.onclick = () => {
        window.__bookingCardPage = (window.__bookingCardPage || 1) + 1;
        renderBookingCards();
      };
    }
    ['bookingSearch', 'bookingStatusFilter', 'bookingPaymentFilter'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.dataset.cardPatch !== 'true') {
        el.dataset.cardPatch = 'true';
        el.addEventListener('input', () => { window.__bookingCardPage = 1; setTimeout(renderBookingCards, 30); });
        el.addEventListener('change', () => { window.__bookingCardPage = 1; setTimeout(renderBookingCards, 30); });
      }
    });
  };

  const patchEditRoom = () => {
    const original = window.editRoom;
    if (window.__editRoomStrongPatched) return;
    window.__editRoomStrongPatched = true;
    window.editRoom = function strongEditRoom(id) {
      if (typeof original === 'function') original(id);
      setTimeout(() => {
        const tabBtn = document.querySelector('.admin-tab-btn[data-tab="add-room"]');
        if (tabBtn) tabBtn.click();
        if (window.showAdminTab) window.showAdminTab('add-room');
        const form = document.getElementById('roomEditorCard');
        if (form) {
          form.classList.remove('admin-tab-hidden');
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        const title = document.getElementById('roomFormTitle');
        if (title) title.textContent = `Edit Room #${id}`;
      }, 150);
    };
  };

  const exposeBookings = () => {
    if (!Array.isArray(window.bookings) && typeof bookings !== 'undefined') {
      try { window.bookings = bookings; } catch (e) {}
    }
  };

  const run = () => {
    injectStyles();
    patchEditRoom();
    patchBookingPagination();
    exposeBookings();
    renderBookingCards();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  setInterval(run, 1000);
})();
