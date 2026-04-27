'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/' || pathname === '/verify-email';
      
      if (!user && !isAuthRoute) {
        // Redirect to login if accessing protected route without being logged in
        router.push('/login');
      } else if (user && !user.emailVerified && !isAuthRoute) {
        // Strict blockade: If they somehow got a session but aren't verified on a protected route
        router.push(`/verify-email?email=${encodeURIComponent(user.email || '')}`);
      } else if (user && user.emailVerified && isAuthRoute && pathname !== '/verify-email') {
        // Redirect to dashboard if logged in and fully verified trying to access auth pages
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading ? children : <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent flex rounded-full animate-spin"></div></div>}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
