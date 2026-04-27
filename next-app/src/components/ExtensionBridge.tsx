'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';

/**
 * Exposes window.__jt_get_token() for the Chrome extension to call
 * via chrome.scripting.executeScript when syncing auth.
 */
export function ExtensionBridge() {
  useEffect(() => {
    (window as any).__jt_get_token = async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const idToken = await user.getIdToken(false);
      return { idToken, email: user.email };
    };
    return () => {
      delete (window as any).__jt_get_token;
    };
  }, []);

  return null;
}
