'use client';

import { Chrome, Download, FolderOpen, Puzzle, CheckCircle2, ArrowRight, Code2, MousePointerClick, Zap } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    icon: Download,
    title: 'Download the Extension',
    desc: 'The Job Clipper extension lives in the stitch/job-clipper-extension/ folder of this project.',
  },
  {
    icon: Chrome,
    title: 'Open Chrome Extensions',
    desc: 'Open Chrome and navigate to chrome://extensions/ in your address bar.',
  },
  {
    icon: Code2,
    title: 'Enable Developer Mode',
    desc: 'Toggle "Developer Mode" in the top-right corner of the Extensions page.',
  },
  {
    icon: FolderOpen,
    title: 'Load the Folder',
    desc: 'Click "Load unpacked" and select the job-clipper-extension/ folder from your project.',
  },
  {
    icon: MousePointerClick,
    title: 'Navigate to a Job',
    desc: 'Go to any LinkedIn or Indeed job posting. You will see a purple "Clip to JobTracker" button in the bottom-right corner.',
  },
  {
    icon: Zap,
    title: 'Clip It!',
    desc: 'Click the button and the job is instantly added to your Kanban board. Make sure JobTracker Pro is running on localhost:3000.',
  },
];

export default function ExtensionPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 font-display">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Puzzle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Job Clipper</h1>
            <p className="text-slate-500 mt-1 font-medium">Chrome Extension — Clip jobs from LinkedIn and Indeed directly into your tracker with one click.</p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-3 mb-10">
          {['LinkedIn Support', 'Indeed Support', 'One-Click Clip', 'Auto Status', 'Session Auth'].map(b => (
            <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
              <CheckCircle2 className="w-3.5 h-3.5" /> {b}
            </span>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold text-slate-900">Installation Guide</h2>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-200 transition group">
                <div className="w-10 h-10 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 transition">
                  <Icon className="w-5 h-5 text-indigo-600 group-hover:text-white transition" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">Step {i + 1}</span>
                  </div>
                  <h3 className="font-bold text-slate-900">{step.title}</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <h3 className="font-bold mb-3 text-lg">How the Magic Works</h3>
          <div className="space-y-2.5 text-sm text-slate-300 font-medium">
            <p><span className="text-indigo-400 font-bold">content.js</span> — Reads the job page DOM to extract title, company, and location</p>
            <p><span className="text-indigo-400 font-bold">popup.js</span> — Shows extracted data in the extension popup with a Clip button</p>
            <p><span className="text-indigo-400 font-bold">background.js</span> — Service worker that sends the POST with your session cookie</p>
            <p><span className="text-indigo-400 font-bold">/api/clip-job</span> — Your Next.js endpoint authenticates and creates the Prisma record</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 flex gap-4">
          <Link href="/dashboard"
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm">
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
