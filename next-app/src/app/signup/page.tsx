'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Immediately send verification email
      await sendEmailVerification(userCredential.user);
      // Sign them out so they aren't authenticated until verified
      await signOut(auth);
      
      // Redirect to the verification screen
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in');
      } else {
        setError('An unexpected error occurred: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
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
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-background-light dark:bg-background-dark font-display">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 dark:bg-background-dark relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary/40 rounded-full blur-[100px]"></div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <span className="material-symbols-outlined text-white text-3xl">layers</span>
          </div>
          <h2 className="text-white text-2xl font-bold tracking-tight">JobTracker</h2>
        </div>
        <div className="relative z-10">
          <div className="mb-8 w-full aspect-square max-w-md mx-auto bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl border border-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[160px] opacity-80">trending_up</span>
          </div>
          <h1 className="text-white text-5xl font-black leading-tight mb-4">Elevate your <span className="text-primary">career</span> journey.</h1>
          <p className="text-slate-400 text-lg max-w-md">Join over 50,000 professionals who use JobTracker to land their dream roles and manage their applications efficiently.</p>
        </div>
        <div className="relative z-10 flex gap-6 text-sm text-slate-400">
          <span>© 2024 JobTracker Inc.</span>
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-[440px] space-y-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-primary text-3xl">layers</span>
            <span className="text-2xl font-bold">JobTracker</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Create an Account</h2>
            <p className="text-slate-600 dark:text-slate-400">Start tracking your applications today.</p>
          </div>
          
          <form className="space-y-5" onSubmit={handleSignUp}>
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                <input required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white placeholder:text-slate-400" placeholder="yourname@domain.com" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                <input required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white placeholder:text-slate-400" placeholder="••••••••" type="password" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 px-1">Must be at least 8 characters long.</p>
            </div>
            <button disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
              <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
              {!isLoading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background-light dark:bg-background-dark px-4 text-slate-500 font-semibold tracking-wider">OR</span></div>
          </div>
          
          <button type="button" onClick={handleGoogleSignUp} disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-70 disabled:cursor-not-allowed">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="text-center pt-4">
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account? 
              <Link className="text-primary font-bold hover:underline ml-1" href="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
