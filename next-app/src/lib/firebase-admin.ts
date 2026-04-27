import * as admin from 'firebase-admin';

const hasAdminCredentials =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

// Only initialize Firebase Admin when real credentials are present.
// In local dev without credentials, we fall back to manual JWT decoding.
if (hasAdminCredentials && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

/**
 * Securely verify a Firebase idToken from the frontend.
 * 
 * In production: uses Firebase Admin SDK (full JWT crypto verification).
 * In local dev without credentials: decodes the JWT payload directly
 *   (no signature check — safe only in development on localhost).
 */
export async function getAuthenticatedUserUID(token: string): Promise<string> {
  if (!token) throw new Error('No token provided');

  const cleanToken = token.startsWith('Bearer ') ? token.split('Bearer ')[1] : token;

  // ── LOCAL DEV FALLBACK (no Admin credentials) ──────────────────
  if (!hasAdminCredentials) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin credentials are required in production.');
    }
    try {
      // Manually decode JWT payload (base64url → JSON) — no sig verification
      const payloadBase64 = cleanToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const parsed = JSON.parse(jsonPayload);
      const uid = parsed.user_id || parsed.sub || parsed.uid;
      if (uid) {
        console.log('[DEV] Firebase Admin fallback: decoded UID from JWT =', uid);
        return uid;
      }
    } catch (e) {
      console.warn('[DEV] JWT fallback decode failed:', e);
    }
    throw new Error('Could not decode user UID from token in dev fallback.');
  }

  // ── PRODUCTION PATH (Admin SDK full verification) ───────────────
  try {
    const decodedToken = await admin.auth().verifyIdToken(cleanToken, true);
    if (!decodedToken.uid) throw new Error('Invalid token payload — no UID');
    return decodedToken.uid;
  } catch (err: any) {
    console.error('Token verification failed:', err.message);
    throw new Error('Unauthorized');
  }
}

// Keep adminAuth export for any code that uses it directly (only safe when credentials exist)
export const adminAuth = hasAdminCredentials ? admin.auth() : null;
