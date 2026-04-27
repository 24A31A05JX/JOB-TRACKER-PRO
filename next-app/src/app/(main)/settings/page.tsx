'use client';

import React, { useState } from 'react';
import { Mail, RefreshCw, Bot, ShieldCheck, Power, AlertTriangle, Key, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<{timestamp: string, msg: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      
      const userCredential = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      
      if (credential?.accessToken && user?.uid) {
        const { getFirestore, doc, setDoc } = await import('firebase/firestore');
        const db = getFirestore(auth.app);
        await setDoc(doc(db, 'users', user.uid), {
          googleAccessToken: credential.accessToken,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), msg: "Workspace Authenticated Successfully!" }, ...prev]);
      }
    } catch(err: any) {
      setError(err.message);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      if (!user?.uid) throw new Error("Unauthorized");
      const res = await fetch('/api/sync-emails', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid })
      });
      const data = await res.json();
      
      const now = new Date().toLocaleTimeString();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync emails");
      }

      if (data.log && data.log.length > 0) {
        setLogs(prev => [
          ...data.log.map((msg: string) => ({ timestamp: now, msg })),
          ...prev
        ]);
      } else {
        setLogs(prev => [{ timestamp: now, msg: data.message || "No new relevant emails found." }, ...prev]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-8 overflow-y-auto font-display bg-slate-50 dark:bg-[#1a110c]">
      
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings & Automation</h1>
        <p className="text-slate-500 mt-1 font-medium">Configure your intelligent CRM background workers.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Email Automation Suite */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
               <Mail className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-900">Email Automation Suite</h2>
               <p className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition">OAuth 2.0 Gmail Sync</p>
             </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 font-medium">
             <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
               <p><strong>Privacy Smart Filter:</strong> We strictly request read-only access and locally filter for queries matching <code className="bg-slate-200 px-1 rounded text-slate-800">interview OR application</code>. Your personal mail is completely ignored.</p>
             </div>

             <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <Bot className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
               <p><strong>Auto-Update Pipeline:</strong> Unread emails are parsed by Gemini and mapped to your existing job applications in the database.</p>
             </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              onClick={handleConnect}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 font-bold py-3.5 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-200"
            >
              <LinkIcon className="w-5 h-5" />
              Connect Workspace
            </button>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-[2] flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
              {isSyncing ? 'Scanning Inbox...' : 'Run Manual Sync'}
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-lg flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p>Error: {error}. You may need to sign out and sign back in to requested the advanced scopes.</p>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl overflow-hidden flex flex-col relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Automation Activity Log</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[400px] pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-12 flex flex-col items-center gap-3">
                 <Bot className="w-8 h-8 opacity-50" />
                 <p>System idle. Run a sync to scan for updates.</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-indigo-400 font-mono shrink-0">[{log.timestamp}]</span>
                  <span className="text-slate-200 font-medium">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
