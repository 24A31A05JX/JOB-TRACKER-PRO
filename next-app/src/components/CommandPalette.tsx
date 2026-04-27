'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useAppStore } from '@/store/useAppStore';
import { Search, LayoutDashboard, Briefcase, FileText, PieChart, Settings, Bot } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { jobs } = useAppStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Command label="Global Command Palette" loop className="w-full">
          <div className="flex items-center border-b border-slate-100 px-4" onClick={(e) => e.stopPropagation()}>
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <Command.Input 
              autoFocus 
              placeholder="Search jobs, companies, or commands... (Ctrl+K)" 
              className="flex-1 w-full bg-transparent border-0 py-4 px-3 outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400 sm:text-sm" 
            />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-2 border border-slate-200">ESC</span>
          </div>

          <Command.List className="max-h-[350px] overflow-y-auto p-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>
            
            <Command.Group heading={<div className="px-2 py-1 text-[11px] font-bold tracking-wider uppercase text-slate-400">Quick Links</div>} className="mb-2">
              <Command.Item onSelect={() => runCommand(() => router.push('/dashboard'))} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700 transition-colors">
                <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push('/interviews'))} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700 transition-colors">
                <Briefcase className="w-4 h-4 text-slate-400" /> Interviews
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push('/analytics'))} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700 transition-colors">
                <PieChart className="w-4 h-4 text-slate-400" /> Analytics
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push('/resume-tailor'))} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700 transition-colors">
                <FileText className="w-4 h-4 text-slate-400" /> Resume Tailor
              </Command.Item>
            </Command.Group>

            {jobs.length > 0 && (
              <Command.Group heading={<div className="px-2 py-1 text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-2">Active Jobs</div>}>
                {jobs.map((job) => (
                  <Command.Item 
                    key={job.id} 
                    value={`${job.companyName} ${job.role} ${job.status}`} 
                    onSelect={() => runCommand(() => router.push('/dashboard'))} 
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700 transition-colors border-l-2 border-transparent data-[selected=true]:border-indigo-500"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="scale-75 origin-left shrink-0">
                        <CompanyLogo companyName={job.companyName} logoUrl={job.logoUrl} />
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="font-bold text-slate-900 truncate">{job.role}</span>
                        <span className="text-xs text-slate-500 truncate">{job.companyName}</span>
                      </div>
                    </div>
                    <span className="text-[10px] shrink-0 font-bold px-2 py-0.5 bg-white text-slate-600 rounded-full border border-slate-200 shadow-sm">{job.status}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            
          </Command.List>
        </Command>
      </div>
      {/* Invisible backdrop click handler */}
      <div className="absolute inset-0 z-[-1]" onClick={() => setOpen(false)} />
    </div>
  );
}
