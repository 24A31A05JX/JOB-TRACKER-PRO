'use client';

import { useEffect, useState } from 'react';
import { X, Briefcase, Building2, CircleDollarSign, Calendar, Link as LinkIcon, ChevronDown, CheckCircle2, Loader2, Sparkles, Wand2, FileText, FilePlus, ExternalLink, Upload } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/components/AuthProvider';
import { autoFillJobFromUrl } from '@/actions/aiActions';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  jobTitle: '',
  companyName: '',
  salaryRange: '',
  appliedDate: new Date().toISOString().split('T')[0],
  location: 'Remote',
  status: 'Wishlist',
  jobUrl: '',
  interviewDate: '',
  resumeId: '',
};

export default function AddJobModal({ isOpen, onClose }: AddJobModalProps) {
  const { addJob, resumes, fetchResumes } = useAppStore();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen && resumes.length === 0) {
      fetchResumes();
    }
  }, [isOpen, resumes.length, fetchResumes]);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importWarning, setImportWarning] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAutoFill = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    setImportError('');
    setImportWarning('');
    try {
      const result = await autoFillJobFromUrl(importUrl);
      const res = result as any;
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          jobTitle: res.data.jobTitle || prev.jobTitle,
          companyName: res.data.companyName || prev.companyName,
          salaryRange: res.data.salaryRange || prev.salaryRange,
          location: res.data.location || prev.location,
          jobUrl: importUrl
        }));
        setImportUrl('');
        if (res.warning) setImportWarning(res.warning);
      } else {
        setImportError(res.error || 'Failed to extract job details.');
      }
    } catch (err) {
      setImportError('Failed to connect to AI parsing service.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addJob({
        companyName: formData.companyName,
        role: formData.jobTitle,
        status: formData.status,
        appliedDate: formData.appliedDate,
        location: formData.location,
        salary: formData.salaryRange,
        jobUrl: formData.jobUrl,
        resumeId: formData.resumeId || undefined,
        interviewDate: formData.interviewDate || null,
      });
      onClose();
      setFormData(EMPTY_FORM);
    } catch (err: any) {
      console.error('Save Application Error:', err);
      alert(err.message || 'Failed to save application'); // Simple alert fallback if toast absent
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return null AFTER all hooks
  if (!isOpen) return null;

  const isInterview = formData.status === 'Interview';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-display">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add New Job Application</h2>
            <p className="text-slate-500 text-sm">Keep track of your career progress with precision.</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AI Job Clipper */}
        <div className="px-8 py-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col gap-3">
          <label className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Job Clipper
          </label>
          <div className="flex gap-2">
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Paste LinkedIn or Indeed job URL to auto-fill..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-indigo-200 bg-white text-sm focus:ring-2 focus:ring-indigo-600/20 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              disabled={isImporting || !importUrl || isSubmitting}
              onClick={handleAutoFill}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 min-w-[120px]"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isImporting ? 'Parsing...' : 'Auto-Fill'}
            </button>
          </div>
          {importError && <p className="text-xs text-rose-600 font-medium bg-rose-50 px-3 py-1.5 rounded-md border border-rose-100">{importError}</p>}
          {importWarning && <p className="text-xs text-amber-700 font-medium bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">⚠ {importWarning}</p>}
        </div>

        {/* Form */}
        <form id="add-job-form" onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[55vh]">

          {/* Row 1: Title + Company */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Title</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input required name="jobTitle" value={formData.jobTitle} onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition placeholder:text-slate-400"
                  placeholder="e.g. Senior Product Designer" type="text" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input required name="companyName" value={formData.companyName} onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition placeholder:text-slate-400"
                  placeholder="e.g. Google" type="text" />
              </div>
            </div>
          </div>

          {/* Row 2: Salary + Applied Date */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Salary Range</label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input name="salaryRange" value={formData.salaryRange} onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition placeholder:text-slate-400"
                  placeholder="$120k - $150k" type="text" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date Applied</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input required name="appliedDate" value={formData.appliedDate} onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition"
                  type="date" />
              </div>
            </div>
          </div>

          {/* Row 3: Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Location</label>
            <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
              {['Remote', 'Hybrid', 'On-site'].map(loc => (
                <button key={loc} type="button" disabled={isSubmitting}
                  onClick={() => setFormData(prev => ({ ...prev, location: loc }))}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.location === loc ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-white/50'}`}>
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <div className="relative">
              <select name="status" value={formData.status} onChange={handleChange} disabled={isSubmitting}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border-2 border-indigo-600/30 bg-indigo-600/5 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition text-slate-900 font-semibold cursor-pointer text-sm">
                <option value="Wishlist">Wishlist</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interviewing</option>
                <option value="Offer">Offer Received</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Row 5: Interview Date (conditional) */}
          {isInterview && (
            <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-4">
              <label className="block text-sm font-bold text-indigo-700 mb-2">
                📅 Interview Date &amp; Time
              </label>
              <input
                name="interviewDate"
                value={formData.interviewDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                type="datetime-local"
              />
              <p className="text-xs text-indigo-500 font-medium mt-2">
                🔔 A BullMQ reminder will be automatically queued after entering the time.
              </p>
            </div>
          )}

          {/* Row 6: Resume from Vault */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> Resume from Vault</span>
              </label>
              <Link href="/resumes" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition" target="_blank">
                <FilePlus className="w-3 h-3" /> Manage Vault
              </Link>
            </div>
            
            {resumes.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center">
                <p className="text-xs text-slate-500 mb-2">Your Resume Vault is empty.</p>
                <Link href="/resumes" target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition">
                   <Upload className="w-3 h-3" /> Upload first resume
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <select 
                    name="resumeId" 
                    value={formData.resumeId} 
                    onChange={handleChange} 
                    disabled={isSubmitting}
                    className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition text-sm cursor-pointer"
                  >
                    <option value="">No resume linked</option>
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.label || r.fileName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
                {formData.resumeId && (
                  <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700 truncate flex-1">
                      {resumes.find(r => r.id === formData.resumeId)?.label || 'Selected Resume'}
                    </span>
                    <a 
                      href={resumes.find(r => r.id === formData.resumeId)?.fileUrl} 
                      target="_blank" 
                      className="text-[10px] font-black uppercase tracking-tighter text-indigo-400 hover:text-indigo-600 flex items-center gap-0.5"
                    >
                      Verify <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 7: Job URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input name="jobUrl" value={formData.jobUrl} onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition placeholder:text-slate-400"
                placeholder="https://careers.google.com/..." type="url" />
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">All fields marked * are required.</p>
          <div className="flex gap-3">
            <button type="button" disabled={isSubmitting} onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" form="add-job-form" disabled={isSubmitting}
              className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-70 text-sm">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSubmitting ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
