// popup.js — Extension popup logic
// Uses Firebase idToken stored via chrome.storage (synced from the main webapp)

const API_BASE = 'http://localhost:3000';

// --- Auth Helpers ---
async function getSavedToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['jt_id_token', 'jt_user_email', 'jt_token_expiry'], (data) => {
      if (data.jt_id_token && data.jt_token_expiry && Date.now() < data.jt_token_expiry) {
        resolve({ token: data.jt_id_token, email: data.jt_user_email });
      } else {
        resolve(null);
      }
    });
  });
}

async function syncTokenFromJobTrackerTab() {
  // Find any open tab running localhost:3000 (the main app)
  return new Promise((resolve) => {
    chrome.tabs.query({ url: '*://localhost:3000/*' }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        // Also try the vercel URL
        chrome.tabs.query({ url: '*://*.vercel.app/*' }, (vercelTabs) => {
          if (!vercelTabs || vercelTabs.length === 0) {
            resolve({ success: false, error: 'JobTracker tab not found. Please open your JobTracker app first.' });
            return;
          }
          extractTokenFromTab(vercelTabs[0].id, resolve);
        });
        return;
      }
      extractTokenFromTab(tabs[0].id, resolve);
    });
  });
}

function extractTokenFromTab(tabId, resolve) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      // Ask the webapp page to expose the current user's token
      return new Promise((res) => {
        // The webapp exposes token on window for extension communication
        if (window.__jt_get_token) {
          window.__jt_get_token().then(token => res(token)).catch(() => res(null));
        } else {
          res(null);
        }
      });
    }
  }, (results) => {
    const token = results?.[0]?.result;
    if (token) {
      // Store for 50 minutes (Firebase tokens last 60min)
      chrome.storage.local.set({
        jt_id_token: token.idToken,
        jt_user_email: token.email,
        jt_token_expiry: Date.now() + 50 * 60 * 1000
      });
      resolve({ success: true, email: token.email });
    } else {
      resolve({ success: false, error: 'Could not get auth token from the JobTracker tab. Make sure you are logged in.' });
    }
  });
}

// --- Job Extraction ---
async function getCurrentTabJob() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const isLinkedIn = location.hostname.includes('linkedin.com');
        const isIndeed   = location.hostname.includes('indeed.com');
        if (!isLinkedIn && !isIndeed) return null;

        const get = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : '';
        };

        if (isLinkedIn) {
          return {
            jobTitle:    get('.job-details-jobs-unified-top-card__job-title h1, h1.t-24'),
            companyName: get('.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name'),
            location:    get('.tvm__text, .jobs-unified-top-card__bullet'),
            jobUrl:      location.href
          };
        }
        if (isIndeed) {
          return {
            jobTitle:    get('h1.jobsearch-JobInfoHeader-title'),
            companyName: get('[data-testid="inlineHeader-companyName"] a'),
            location:    get('[data-testid="job-location"]'),
            jobUrl:      location.href
          };
        }
        return null;
      }
    }, (results) => {
      resolve(results?.[0]?.result || null);
    });
  });
}

// --- Main UI Logic ---
document.addEventListener('DOMContentLoaded', async () => {
  const jobCard     = document.getElementById('job-card');
  const emptyState  = document.getElementById('empty-state');
  const formSection = document.getElementById('form-section');
  const jobTitleEl  = document.getElementById('job-title');
  const jobCompany  = document.getElementById('job-company');
  const jobLocEl    = document.getElementById('job-location');
  const clipBtn     = document.getElementById('clip-btn');
  const statusMsg   = document.getElementById('status-msg');
  const statusSel   = document.getElementById('status-select');
  const authStatusEl= document.getElementById('auth-status');
  const userInfoEl  = document.getElementById('user-info');
  const userEmailEl = document.getElementById('user-email-display');
  const syncBtn     = document.getElementById('sync-auth-btn');

  // Check saved auth
  const savedAuth = await getSavedToken();
  if (savedAuth) {
    authStatusEl.textContent = '✓ Connected to JobTracker';
    authStatusEl.className = 'auth-status logged-in';
    userInfoEl.style.display = 'flex';
    userEmailEl.textContent = savedAuth.email || 'Authenticated';
  }

  // Sync button
  syncBtn.addEventListener('click', async () => {
    syncBtn.textContent = 'Syncing...';
    syncBtn.disabled = true;
    const result = await syncTokenFromJobTrackerTab();
    if (result.success) {
      authStatusEl.textContent = '✓ Connected to JobTracker';
      authStatusEl.className = 'auth-status logged-in';
      userInfoEl.style.display = 'flex';
      userEmailEl.textContent = result.email || 'Authenticated';
      syncBtn.textContent = '✓ Synced!';
    } else {
      authStatusEl.textContent = `⚠ ${result.error}`;
      authStatusEl.className = 'auth-status logged-out';
      syncBtn.textContent = '🔗 Sync from JobTracker Tab';
    }
    syncBtn.disabled = false;
  });

  // Load job from active tab
  const job = await getCurrentTabJob();

  if (!job || !job.jobTitle) {
    emptyState.style.display = 'block';
    return;
  }

  jobTitleEl.textContent  = job.jobTitle   || 'Unknown Role';
  jobCompany.textContent  = job.companyName || 'Unknown Company';
  jobLocEl.textContent    = job.location   || 'Location N/A';
  jobCard.style.display   = 'block';
  formSection.style.display = 'block';
  emptyState.style.display  = 'none';

  // Clip button
  clipBtn.addEventListener('click', async () => {
    const auth = await getSavedToken();
    if (!auth) {
      statusMsg.textContent = '❌ Not authenticated. Click "Sync from JobTracker Tab" first.';
      statusMsg.className = 'status error';
      return;
    }

    clipBtn.textContent = 'Clipping...';
    clipBtn.disabled    = true;
    statusMsg.className = 'status';

    try {
      const res = await fetch(`${API_BASE}/api/clip-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          location: job.location,
          jobUrl: job.jobUrl,
          status: statusSel.value
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        statusMsg.textContent = `✅ "${job.jobTitle}" added to your tracker!`;
        statusMsg.className = 'status success';
        clipBtn.textContent = '✓ Clipped!';
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      statusMsg.textContent = `❌ ${err.message}`;
      statusMsg.className = 'status error';
      clipBtn.textContent = '⚡ Clip to JobTracker';
      clipBtn.disabled = false;
    }
  });
});
