(() => {
  const injectStyles = () => {
    if (document.getElementById('adminLoginUpgradeStyles')) return;

    const style = document.createElement('style');
    style.id = 'adminLoginUpgradeStyles';
    style.textContent = `
      body:has(#loginSection:not(.hidden)) {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(14,165,233,.18), transparent 32%),
          radial-gradient(circle at top right, rgba(249,115,22,.18), transparent 30%),
          linear-gradient(135deg, #eef6ff 0%, #f8fafc 48%, #fff7ed 100%) !important;
      }

      body:has(#loginSection:not(.hidden)) header {
        justify-content: center !important;
        min-height: 88px !important;
        box-shadow: 0 18px 50px rgba(15, 23, 42, .22) !important;
        border-bottom: 1px solid rgba(255,255,255,.08) !important;
      }

      body:has(#loginSection:not(.hidden)) header h1 {
        font-size: clamp(24px, 3vw, 32px) !important;
        letter-spacing: .02em !important;
      }

      body:has(#loginSection:not(.hidden)) main {
        max-width: 1180px !important;
        min-height: calc(100vh - 92px) !important;
        display: grid !important;
        place-items: center !important;
        padding: 42px 24px !important;
      }

      #loginSection {
        position: relative !important;
        width: min(980px, 100%) !important;
        overflow: hidden !important;
        border-radius: 32px !important;
        padding: 0 !important;
        border: 1px solid rgba(148, 163, 184, .45) !important;
        box-shadow: 0 30px 90px rgba(15, 23, 42, .16) !important;
        background: #fff !important;
      }

      #loginSection::before {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: 36%;
        background:
          linear-gradient(145deg, rgba(15,23,42,.94), rgba(30,41,59,.98)),
          url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900');
        background-size: cover;
        background-position: center;
        z-index: 0;
      }

      #loginSection::after {
        content: 'Secure Admin Console';
        position: absolute;
        left: 34px;
        bottom: 34px;
        width: 28%;
        color: #fff;
        font-size: 28px;
        line-height: 1.15;
        font-weight: 900;
        letter-spacing: -.04em;
        z-index: 1;
      }

      .login-panel-inner {
        position: relative;
        z-index: 2;
        margin-left: 36%;
        padding: 44px;
      }

      .login-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        font-size: 13px;
        font-weight: 900;
        margin-bottom: 14px;
      }

      .login-title-row h2 {
        margin: 0 !important;
        font-size: clamp(30px, 4vw, 42px) !important;
        letter-spacing: -.05em !important;
        color: #0f172a !important;
      }

      .login-title-row p {
        max-width: 560px;
        margin: 10px 0 26px;
        color: #64748b;
        line-height: 1.65;
        font-weight: 600;
      }

      #loginForm.grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr auto !important;
        gap: 14px !important;
        align-items: end !important;
      }

      #loginForm label {
        color: #334155 !important;
        font-size: 13px !important;
        letter-spacing: .02em !important;
      }

      #loginForm input {
        min-height: 56px !important;
        border-radius: 16px !important;
        border: 1px solid #cbd5e1 !important;
        background: #f8fafc !important;
        padding: 0 16px !important;
        font-size: 15px !important;
        outline: none !important;
        transition: .18s ease !important;
      }

      #loginForm input:focus {
        border-color: #2563eb !important;
        background: #fff !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, .12) !important;
      }

      #loginBtn {
        min-height: 56px !important;
        min-width: 118px !important;
        border-radius: 16px !important;
        background: linear-gradient(135deg, #0f172a, #1e293b) !important;
        box-shadow: 0 18px 35px rgba(15, 23, 42, .22) !important;
        text-transform: uppercase !important;
        letter-spacing: .04em !important;
      }

      #loginStatus {
        margin-top: 16px !important;
        padding-left: 4px !important;
      }

      .login-support-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 28px;
      }

      .login-support-card {
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        border-radius: 18px;
        padding: 14px;
      }

      .login-support-card b {
        display: block;
        color: #0f172a;
        margin-bottom: 4px;
      }

      .login-support-card span {
        color: #64748b;
        font-size: 12px;
        line-height: 1.45;
        font-weight: 600;
      }

      @media (max-width: 850px) {
        #loginSection::before,
        #loginSection::after { display: none !important; }
        .login-panel-inner { margin-left: 0 !important; padding: 26px !important; }
        #loginForm.grid { grid-template-columns: 1fr !important; }
        #loginBtn { width: 100% !important; }
        .login-support-row { grid-template-columns: 1fr !important; }
      }
    `;

    document.head.appendChild(style);
  };

  const enhanceLogin = () => {
    const section = document.getElementById('loginSection');
    if (!section || section.dataset.upgraded === 'true') return;

    const h2 = section.querySelector('h2');
    const form = document.getElementById('loginForm');
    const status = document.getElementById('loginStatus');
    if (!h2 || !form || !status) return;

    section.dataset.upgraded = 'true';

    const wrapper = document.createElement('div');
    wrapper.className = 'login-panel-inner';

    const title = document.createElement('div');
    title.className = 'login-title-row';
    title.innerHTML = `
      <span class="login-kicker">🔐 Admin Access Only</span>
      <h2>Welcome Back</h2>
      <p>Login to manage bookings, room availability, customer messages, payment reviews, and hotel operations from one secure dashboard.</p>
    `;

    h2.remove();
    wrapper.appendChild(title);
    wrapper.appendChild(form);
    wrapper.appendChild(status);

    const support = document.createElement('div');
    support.className = 'login-support-row';
    support.innerHTML = `
      <div class="login-support-card"><b>Bookings</b><span>Confirm, cancel, restore, and verify guest reservations.</span></div>
      <div class="login-support-card"><b>Rooms</b><span>Edit prices, availability, images, and room details.</span></div>
      <div class="login-support-card"><b>Messages</b><span>Read enquiries and reply to customers from the admin panel.</span></div>
    `;
    wrapper.appendChild(support);

    section.appendChild(wrapper);
  };

  const run = () => {
    injectStyles();
    enhanceLogin();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
