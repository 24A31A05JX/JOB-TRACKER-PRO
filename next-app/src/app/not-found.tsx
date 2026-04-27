import Link from 'next/link';
import { Layers, ArrowLeft, Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 font-display">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.15),transparent)] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6 max-w-md">
        <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center">
          <Frown className="w-10 h-10 text-indigo-400" />
        </div>

        <div>
          <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-3">404 — Page Not Found</p>
          <h1 className="text-6xl font-black text-white mb-4">Oops.</h1>
          <p className="text-slate-400 font-medium leading-relaxed">
            This page doesn&apos;t exist in your tracker. It might have been moved, deleted, or you&apos;re on the wrong URL.
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition">
            <Layers className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/"
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
