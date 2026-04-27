// background.js — Service Worker
// Handles secure API calls using the Firebase idToken stored via chrome.storage

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CLIP_JOB') {
    const { job, apiBase } = request;

    // Retrieve the stored Firebase token before making the API call
    chrome.storage.local.get(['jt_id_token', 'jt_token_expiry'], (data) => {
      const isValid = data.jt_id_token && data.jt_token_expiry && Date.now() < data.jt_token_expiry;

      if (!isValid) {
        sendResponse({ 
          success: false, 
          error: 'Not authenticated. Open the extension popup and click "Sync from JobTracker Tab".' 
        });
        return;
      }

      fetch(`${apiBase}/api/clip-job`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.jt_id_token}`
        },
        body: JSON.stringify(job)
      })
      .then(res => res.json())
      .then(resData => sendResponse({ success: resData.success ?? true, data: resData }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    });

    return true; // Required for async sendResponse
  }
});
