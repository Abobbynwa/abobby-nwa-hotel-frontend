(() => {
  const fallbackImg = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900';

  const ensureUpgradeCss = () => {
    if (document.querySelector('link[href*="admin-section-upgrade.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/admin-assets/admin-section-upgrade.css?v=7';
    document.head.appendChild(link);
  };

  const fixBrokenImages = () => {
    document.querySelectorAll('#roomsTable img, .room-image-box img, .thumb').forEach((img) => {
      if (img.dataset.abobbyFixed) return;
      img.dataset.abobbyFixed = '1';
      img.loading = 'lazy';
      img.onerror = () => {
        img.onerror = null;
        img.src = fallbackImg;
        img.alt = 'Hotel room image';
      };
    });
  };

  const improveContactCards = () => {
    const table = document.querySelector('#contactsTable');
    if (!table) return;

    table.querySelectorAll('tr').forEach((row) => {
      row.classList.add('admin-contact-card-row');
      const firstTd = row.querySelector('td:first-child');
      if (firstTd) firstTd.classList.add('admin-contact-customer-cell');
    });
  };

  const improveRoomRows = () => {
    const table = document.querySelector('#roomsTable');
    if (!table) return;

    table.querySelectorAll('tr').forEach((row) => {
      row.classList.add('admin-room-row');
    });
  };

  const injectHardCss = () => {
    if (document.getElementById('adminHardSectionFix')) return;
    const style = document.createElement('style');
    style.id = 'adminHardSectionFix';
    style.textContent = `
      #contactsTable .contact-customer-card,
      #contactsTable .booking-guest-card,
      #contactsTable .room-title-card {
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
      }

      #contactsTable .contact-name-strong,
      #contactsTable .booking-ref,
      #contactsTable .room-name-strong {
        display: block !important;
        font-weight: 900 !important;
        color: #0f172a !important;
      }

      #contactsTable .contact-meta,
      #contactsTable .booking-meta,
      #contactsTable .room-meta {
        display: block !important;
        color: #64748b !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
      }

      #contactsTable .contact-message-box {
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        padding: 14px !important;
      }

      #contactsTable .contact-reply-panel {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
      }

      #contactsTable textarea {
        min-height: 92px !important;
        border-radius: 16px !important;
      }

      .room-image-box img,
      #roomsTable img.thumb {
        width: 112px !important;
        height: 82px !important;
        object-fit: cover !important;
        border-radius: 18px !important;
        background: #e5e7eb !important;
      }

      #roomsTable .empty-image {
        width: 112px !important;
        height: 82px !important;
        border-radius: 18px !important;
        background: #e5e7eb !important;
        display: grid !important;
        place-items: center !important;
        color: #64748b !important;
        font-weight: 900 !important;
      }

      #roomEditorCard form {
        background: linear-gradient(135deg,#f8fafc,#fff) !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 24px !important;
        padding: 24px !important;
      }
    `;
    document.head.appendChild(style);
  };

  const run = () => {
    ensureUpgradeCss();
    injectHardCss();
    fixBrokenImages();
    improveContactCards();
    improveRoomRows();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  setInterval(run, 1000);
})();
