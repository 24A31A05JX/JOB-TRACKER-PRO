'use client';

import { X, Sparkles, Wand2, Briefcase, Building2, CircleDollarSign, Calendar, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface MagicJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MagicJobModal({ isOpen, onClose }: MagicJobModalProps) {
  const [url, setUrl] = useState('https://www.linkedin.com/jobs/view/3948572/');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-display">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Add New Job Application
              <Wand2 className="text-indigo-600 w-6 h-6 animate-pulse" />
            </h2>
            <p className="text-slate-500 text-sm">Paste a URL to automatically extract job details.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-indigo-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Paste Job URL (LinkedIn, Indeed, etc.)
            </label>
            <div className="relative">
              <input 
                className="w-full pl-4 pr-12 py-4 rounded-xl border-2 border-indigo-600/30 bg-indigo-600/5 focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 font-medium text-base animate-glow" 
                placeholder="https://www.linkedin.com/jobs/view/..." 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Wand2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600 w-5 h-5" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                Scanning requirements...
              </span>
              <span className="text-indigo-600 italic">AI at work</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
              <div className="bg-indigo-600 h-full absolute animate-progress rounded-full shadow-[0_0_10px_#4f46e5]"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</label>
              <div className="relative group">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                <input readOnly className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-green-50/30 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 ai-glow ai-shimmer" type="text" value="Senior Product Designer" />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
              <div className="relative group">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                <input readOnly className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-green-50/30 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 ai-glow ai-shimmer" type="text" value="Google" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Salary Range</label>
              <div className="relative group">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                <input readOnly className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-green-50/30 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 ai-glow ai-shimmer" type="text" value="$140,000 - $185,000" />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date Submitted</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all" type="date" defaultValue="2024-03-01" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Work Location</label>
              <div className="flex p-1 bg-slate-100 rounded-xl gap-1 ai-glow">
                <button className="flex-1 py-2 text-sm font-medium rounded-lg text-slate-500 hover:bg-white/50 transition-all" type="button">Remote</button>
                <button className="flex-1 py-2 text-sm font-medium rounded-lg bg-white text-slate-900 shadow-sm border border-slate-200" type="button">Hybrid</button>
                <button className="flex-1 py-2 text-sm font-medium rounded-lg text-slate-500 hover:bg-white/50 transition-all" type="button">On-site</button>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status Tracking</label>
              <div className="relative">
                <select className="w-full appearance-none pl-4 pr-10 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-slate-900 font-medium cursor-pointer" defaultValue="applied">
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interviewing</option>
                  <option value="offer">Offer Received</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
              </div>
            </div>
          </div>
        </form>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button onClick={onClose} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Save Application
          </button>
        </div>
      </div>
    </div>
  );
}
