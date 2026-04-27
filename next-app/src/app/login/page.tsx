'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email or password is incorrect');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Capture the OAuth token and sync to Firestore
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      if (credential?.accessToken) {
        const { getFirestore, doc, setDoc } = await import('firebase/firestore');
        const db = getFirestore(auth.app);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          googleAccessToken: credential.accessToken,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        router.push(`/verify-email?email=${encodeURIComponent(userCredential.user.email || '')}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google Sign-In failed: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/50 dark:bg-background-dark/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-3xl font-bold">layers</span>
          <h1 className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-tight">JobTracker</h1>
        </Link>
        <div className="flex items-center gap-4">
          <button className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">Help Center</button>
          <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/20 transition-all">
            Product Tour
          </button>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 md:p-10">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">rocket_launch</span>
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Sign in with Firebase Authentication.</p>
          </div>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="yourname@domain.com" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline transition-all">Forgot password?</Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="••••••••" type="password" />
              </div>
            </div>
            <button disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
              <span>{isLoading ? 'Logging In...' : 'Log In'}</span>
              {!isLoading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 dark:text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Google
          </button>

          {/* Footer Link */}
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New here? <Link className="text-primary font-bold hover:underline" href="/signup">Create an account</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Global Footer Decor */}
      <footer className="p-6 text-center text-xs text-slate-400 dark:text-slate-600">
        <p>© 2024 JobTracker Analytics. All rights reserved. Professional Grade Tracking.</p>
      </footer>
    </div>
  );
}
