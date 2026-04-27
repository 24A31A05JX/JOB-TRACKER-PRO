'use client';

import Link from 'next/link';
import { ArrowRight, Bot, Target, TrendingUp, Layers, Zap, Shield, Globe, Calendar, Mail, Chrome, Star, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const STATS = [
  { value: '10k+', label: 'Jobs Tracked' },
  { value: '94%', label: 'Offer Rate' },
  { value: '3.2×', label: 'Faster Hiring' },
  { value: '4.9★', label: 'User Rating' },
];

const FEATURES = [
  {
    icon: Target, 
    color: 'blue',
    title: 'Visual Kanban Pipeline',
    desc: 'Drag cards across Wishlist → Applied → Interviewing → Offer. Smart Drop auto-schedules interview reminders.',
  },
  {
    icon: Bot,
    color: 'indigo',
    title: 'Voice Interview Chatbot',
    desc: 'AI reads questions aloud, you speak your answers. Real-time Speech-to-Text scoring powered by Gemini 2.5 Flash.',
  },
  {
    icon: TrendingUp,
    color: 'emerald',
    title: 'Analytics Funnel',
    desc: 'See exactly where applications drop off. Interview rate, offer rate, and conversion metrics in real time.',
  },
  {
    icon: Mail,
    color: 'violet',
    title: 'Gmail Auto-Sync',
    desc: 'OAuth 2.0 Gmail integration reads your inbox and automatically moves jobs through your pipeline.',
  },
  {
    icon: Chrome,
    color: 'amber',
    title: 'Chrome Extension',
    desc: 'One-click job clipping from LinkedIn and Indeed. The "Clip" button appears directly on every job page.',
  },
  {
    icon: Zap,
    color: 'rose',
    title: 'AI Job Clipper',
    desc: 'Paste any job URL and Gemini auto-fills title, company, salary, and location in under 3 seconds.',
  },
];

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald:'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  amber:  'bg-amber-50 text-amber-600',
  rose:   'bg-rose-50 text-rose-600',
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white font-display flex flex-col overflow-x-hidden">
      
      {/* Sticky Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Layers className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-slate-900 text-lg font-bold tracking-tight">JobTracker <span className="text-indigo-600">Pro</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#stats" className="hover:text-indigo-600 transition">Results</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-600 text-sm font-bold hover:text-indigo-600 transition">Log In</Link>
            <Link href="/signup" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="pt-32 pb-20 px-4 text-center relative flex flex-col items-center">
        {/* BG blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-indigo-100/60 to-transparent rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute top-40 left-[10%] w-64 h-64 bg-purple-100/40 rounded-full blur-[80px] -z-10 pointer-events-none" />
        <div className="absolute top-20 right-[10%] w-64 h-64 bg-blue-100/40 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-8 animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          Powered by Gemini 2.5 Flash — Built for Job Seekers
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.08] mb-6 animate-in fade-in slide-in-from-bottom-6">
          The intelligent system<br />to land your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
            dream job.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8">
          Stop losing track in spreadsheets. JobTracker Pro gives you a real-time AI-powered command center — from first application to signed offer letter.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center mb-8 animate-in fade-in slide-in-from-bottom-10">
          <Link href="/signup"
            className="group w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-base hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2">
            Start for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-base hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm text-center">
            Open Dashboard →
          </Link>
        </div>

        <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> No credit card required · OAuth 2.0 secured · Free forever
        </p>

        {/* Mini dashboard preview */}
        <div className="mt-16 w-full max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden relative">
          <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="flex-1 mx-4 bg-slate-100 rounded-full h-4 max-w-48" />
          </div>
          <div className="flex gap-4 p-4 bg-slate-50 overflow-x-auto">
            {['Wishlist', 'Applied', 'Interviewing', 'Offer'].map((col, i) => (
              <div key={col} className="min-w-[150px] bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-3">{col}</div>
                {[...Array(i === 0 ? 3 : i === 1 ? 4 : i === 2 ? 2 : 1)].map((_, j) => (
                  <div key={j} className="h-10 bg-slate-50 rounded-lg border border-slate-100 mb-2 animate-pulse" style={{animationDelay:`${j*0.15}s`}} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Stats Section */}
      <section id="stats" className="py-16 border-y border-slate-100 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-black text-slate-900 mb-1">{s.value}</div>
              <div className="text-sm font-semibold text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3 block">Everything You Need</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Your entire job search,<br />in one dashboard.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${COLOR_MAP[f.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-slate-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.3),transparent)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 text-indigo-300 text-sm font-bold">
            <Star className="w-4 h-4 fill-current" /> Trusted by B.Tech Students & Working Professionals
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Ready to land your dream role?</h2>
          <p className="text-slate-400 mb-10 text-lg">Set up your personal AI job tracker in under 60 seconds.</p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-indigo-600/30">
            Get Started — It&apos;s Free <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-slate-600 text-sm mt-6 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card · <Globe className="w-4 h-4 text-emerald-500" /> Works globally
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-8 text-center text-slate-600 text-sm font-medium">
        © 2025 JobTracker Pro — Built with Next.js, Prisma, Gemini AI & ❤️
      </footer>
    </div>
  );
}
