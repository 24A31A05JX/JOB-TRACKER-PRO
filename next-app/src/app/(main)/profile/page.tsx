'use client';

import { useAuth } from '@/components/AuthProvider';
import { User, Mail, Calendar, Shield, Zap, BrainCircuit, Mic, LayoutDashboard, ArrowRight, KeyRound, LogOut, Edit2, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { updateProfile, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  const quickLinks = [
    { icon: LayoutDashboard, label: 'Kanban Dashboard',   href: '/dashboard' },
    { icon: BrainCircuit,    label: 'AI Interview Prep',  href: '/interviews/prep' },
    { icon: Mic,             label: 'Voice Mock Bot',     href: '/interviews/voice-bot' },
    { icon: Zap,             label: 'Analytics Funnel',   href: '/analytics' },
  ];

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim(),
      });
      // Force reload to reflect user state
      window.location.reload();
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleLogOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 font-display">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
            <p className="text-slate-500 mt-1 font-medium">Your account details and quick navigation hub.</p>
          </div>
          <button onClick={handleLogOut} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>

        {/* Avatar Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 flex items-center gap-6 text-white shadow-xl">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-20 h-20 rounded-2xl border-2 border-white/20 shadow-lg" />
          ) : (
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black border-2 border-indigo-400/30">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black">{user?.displayName || 'Guest User'}</h2>
            <p className="text-indigo-300 font-medium flex items-center gap-1.5 mt-1">
              <Mail className="w-4 h-4" /> {user?.email || 'No email'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/20">
                <Shield className="w-3 h-3" /> Authenticated
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl overflow-hidden p-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Profile</h3>
            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Display Name</label>
                 <input 
                   type="text" 
                   value={displayName}
                   onChange={e => setDisplayName(e.target.value)}
                   className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                   placeholder="e.g. John Doe"
                 />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Photo URL</label>
                 <input 
                   type="url" 
                   value={photoURL}
                   onChange={e => setPhotoURL(e.target.value)}
                   className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                   placeholder="https://..."
                 />
               </div>
               <div className="flex gap-3 justify-end pt-2">
                 <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-50 border border-slate-200 rounded-xl transition">
                   Cancel
                 </button>
                 <button onClick={handleSaveProfile} disabled={isSaving} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                   {isSaving ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /> Save Changes</>}
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="font-bold text-slate-700">Account Details</span>
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">
              <Edit2 className="w-3.5 h-3.5" /> Edit Details
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-4 px-6 py-4">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Full Name</p>
                <p className="font-semibold text-slate-800">{user?.displayName || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                <p className="font-semibold text-slate-800">{user?.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <KeyRound className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Auth Provider</p>
                <p className="font-semibold text-slate-800">Credentials / Google OAuth</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Session</p>
                <p className="font-semibold text-slate-800">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Nav */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickLinks.map(({ icon: Icon, label, href }) => (
              <Link key={href} href={href}
                className="group flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition">
                <div className="w-10 h-10 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center transition">
                  <Icon className="w-5 h-5 text-indigo-600 group-hover:text-white transition" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{label}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Settings link */}
        <div className="text-center">
          <Link href="/settings" className="text-sm text-slate-400 hover:text-indigo-600 font-semibold transition">
            Go to Settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
