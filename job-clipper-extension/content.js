// content.js — Injected into LinkedIn and Indeed job pages
// Reads the DOM to extract job details and injects a "Clip" button overlay

(function() {
  'use strict';
  
  const BUTTON_ID = 'jobtracker-clip-btn';
  
  // --- DOM Selectors for different job boards ---
  const SELECTORS = {
    linkedin: {
      title:   '.job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title h1, h1.t-24',
      company: '.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__subtitle-primary-grouping a',
      location:'.job-details-jobs-unified-top-card__primary-description-container .tvm__text, .jobs-unified-top-card__bullet',
    },
    indeed: {
      title:   'h1.jobsearch-JobInfoHeader-title, h1[data-testid="jobsearch-JobInfoHeader-title"]',
      company: '[data-testid="inlineHeader-companyName"] a, .jobsearch-InlineCompanyRating-companyHeader a',
      location:'[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle .jobsearch-JobInfoHeader-subtitle-locationLink',
    }
  };

  function detectBoard() {
    const host = window.location.hostname;
    if (host.includes('linkedin.com')) return 'linkedin';
    if (host.includes('indeed.com')) return 'indeed';
    return null;
  }

  function getText(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  function extractJobData() {
    const board = detectBoard();
    if (!board) return null;
    const sel = SELECTORS[board];
    return {
      jobTitle:    getText(sel.title),
      companyName: getText(sel.company),
      location:    getText(sel.location),
      jobUrl:      window.location.href,
    };
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      <span>Clip to JobTracker</span>
    `;
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '700',
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(79, 70, 229, 0.4)',
      transition: 'all 0.2s ease',
    });
    btn.onmouseover = () => { btn.style.backgroundColor = '#4338ca'; btn.style.transform = 'translateY(-2px)'; };
    btn.onmouseout  = () => { btn.style.backgroundColor = '#4f46e5'; btn.style.transform = 'translateY(0)'; };
    btn.onclick = handleClip;
    document.body.appendChild(btn);
  }

  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '86px',
      right: '24px',
      zIndex: '999999',
      padding: '10px 18px',
      borderRadius: '10px',
      backgroundColor: isError ? '#ef4444' : '#10b981',
      color: 'white',
      fontWeight: '600',
      fontSize: '13px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      transition: 'opacity 0.3s ease',
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  async function handleClip() {
    const btn = document.getElementById(BUTTON_ID);
    if (btn) { btn.textContent = 'Clipping...'; btn.style.opacity = '0.75'; }

    const jobData = extractJobData();
    if (!jobData || !jobData.jobTitle) {
      showToast('Could not extract job details from this page.', true);
      if (btn) { btn.innerHTML = '✖ Failed'; btn.style.opacity = '1'; }
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'CLIP_JOB', job: jobData, apiBase: 'http://localhost:3000' },
      (response) => {
        if (response && response.success) {
          showToast(`✅ "${jobData.jobTitle}" clipped to JobTracker!`);
          if (btn) { btn.innerHTML = '✅ Clipped!'; btn.style.backgroundColor = '#10b981'; }
          setTimeout(() => {
            if (btn) { btn.innerHTML = '<span>Clip to JobTracker</span>'; btn.style.backgroundColor = '#4f46e5'; btn.style.opacity = '1'; }
          }, 3000);
        } else {
          showToast('Failed to clip. Make sure JobTracker is running.', true);
          if (btn) { btn.innerHTML = '✖ Failed'; btn.style.opacity = '1'; }
        }
      }
    );
  }

  // Watch for SPA navigations (LinkedIn heavily uses React routing)
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(injectButton, 1500);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true });

  // Initial injection
  setTimeout(injectButton, 1500);
})();
