'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, X, Building2, Calendar, MapPin, DollarSign, Link as LinkIcon, BrainCircuit, Trash2, MessageSquare, Loader2, CalendarClock, FileText, Pencil, Check, Eye, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { JobApplication } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from './ToastProvider';

interface JobDrawerProps {
  job: JobApplication | null;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  WISHLIST:  'bg-slate-100 text-slate-700',
  APPLIED:   'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-amber-100 text-amber-700',
  OFFER:     'bg-emerald-100 text-emerald-700',
  REJECTED:  'bg-rose-100 text-rose-700',
};

const STATUS_LABELS: Record<string, string> = {
  WISHLIST: 'Wishlist', APPLIED: 'Applied',
  INTERVIEW: 'Interview', OFFER: 'Offer', REJECTED: 'Rejected',
};

export function JobDrawer({ job, onClose }: JobDrawerProps) {
  const { removeJob, updateJob, setJobResume, resumes, fetchResumes } = useAppStore();
  const { toast } = useToast();

  useEffect(() => {
    if (resumes.length === 0) fetchResumes();
  }, [resumes.length, fetchResumes]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Interview date picker state — shows when moving to Interview stage
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [interviewDateInput, setInterviewDateInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Resume version inline edit
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [resumeInput, setResumeInput] = useState('');
  const [isSavingResume, setIsSavingResume] = useState(false);

  if (!job) return null;

  const handleDelete = async () => {
    if (!confirm(`Remove "${job.role}" at ${job.companyName} from your tracker?\n\nThis will also delete all linked interview rounds.`)) return;
    setIsDeleting(true);
    try {
      await removeJob(job.id);
      toast(`Removed "${job.role}" from tracker`, 'success');
      onClose();
    } catch (e) {
      toast('Failed to remove application', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusClick = (newStatus: string) => {
    const upperStatus = newStatus.toUpperCase();
    if (upperStatus === 'INTERVIEW') {
      // Show date picker before committing the status change
      setPendingStatus(upperStatus);
      // Pre-fill with tomorrow at 10am as a sensible default
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setInterviewDateInput(tomorrow.toISOString().slice(0, 16));
      setShowDatePicker(true);
    } else {
      confirmStatusChange(upperStatus, undefined);
    }
  };

  const confirmStatusChange = async (newStatus: string, date?: string) => {
    setIsUpdating(true);
    setShowDatePicker(false);
    try {
      await updateJob(job.id, newStatus, date);
      toast(`Moved to "${STATUS_LABELS[newStatus] || newStatus}"`, 'success');
    } catch (e) {
      toast('Failed to update status', 'error');
    } finally {
      setIsUpdating(false);
      setPendingStatus(null);
      setInterviewDateInput('');
    }
  };

  const handleSaveResume = async (resumeId: string | null) => {
    setIsSavingResume(true);
    try {
      await setJobResume(job.id, resumeId);
      toast('Resume updated!', 'success');
      setIsEditingResume(false);
    } catch (e) {
      toast('Failed to link resume', 'error');
    } finally {
      setIsSavingResume(false);
    }
  };

  const interviewDate = job.interviewDate ? new Date(job.interviewDate) : null;
  const interviewLabel = interviewDate
    ? interviewDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null;
  const isPast = interviewDate ? interviewDate < new Date() : false;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[job.status] || STATUS_COLORS.WISHLIST}`}>
                {STATUS_LABELS[job.status] || job.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 truncate">{job.role}</h2>
            <p className="text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
              <Building2 className="w-4 h-4" /> {job.companyName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {job.location && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Location</p>
                <p className="font-semibold text-slate-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400"/>{job.location}</p>
              </div>
            )}
            {job.salary && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Salary</p>
                <p className="font-semibold text-slate-700 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400"/>{job.salary}</p>
              </div>
            )}
            {job.appliedDate && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Applied</p>
                <p className="font-semibold text-slate-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400"/>{job.appliedDate}</p>
              </div>
            )}
            {interviewLabel && (
              <div className={`rounded-xl p-4 ${isPast ? 'bg-slate-50' : 'bg-indigo-50 border border-indigo-100'}`}>
                <p className={`text-xs font-bold uppercase mb-1 ${isPast ? 'text-slate-400' : 'text-indigo-500'}`}>Interview{isPast ? ' (Past)' : ''}</p>
                <p className={`font-bold text-sm ${isPast ? 'text-slate-500' : 'text-indigo-700'}`}>{interviewLabel}</p>
              </div>
            )}
          </div>

          {/* ── Resume Vault Tracker ── */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5"/> Resume Sent
              </p>
              {!isEditingResume && (
                <button
                  onClick={() => setIsEditingResume(true)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
                >
                  <Pencil className="w-3 h-3"/> Change
                </button>
              )}
            </div>

            {isEditingResume ? (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    autoFocus
                    value={job.resumeId || ''}
                    onChange={e => handleSaveResume(e.target.value || null)}
                    disabled={isSavingResume}
                    className="w-full appearance-none pl-3 pr-10 py-2 text-sm font-medium bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition"
                  >
                    <option value="">No resume linked</option>
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.label || r.fileName}</option>
                    ))}
                  </select>
                  {isSavingResume ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  )}
                </div>
                <button
                  onClick={() => setIsEditingResume(false)}
                  className="w-full py-1 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingResume(true)}
                className="cursor-pointer group"
              >
                {job.resume ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-bold group-hover:bg-indigo-100 transition">
                      <FileText className="w-3.5 h-3.5"/> {job.resume.label || job.resume.fileName}
                    </div>
                    <a
                      href={job.resume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700 transition-all pl-1"
                    >
                      <Eye className="w-3 h-3" /> View/Review Resume
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm font-medium italic group-hover:text-indigo-600 transition">
                    No resume linked — click to select from vault
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Move Stage ── */}
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 mb-3">Move to Stage</p>
            <div className="flex flex-wrap gap-2">
              {['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusClick(s)}
                  disabled={job.status === s.toUpperCase() || isUpdating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border disabled:cursor-not-allowed
                    ${job.status === s.toUpperCase()
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                >
                  {isUpdating && pendingStatus === s.toUpperCase() ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Interview Date Picker (appears when moving to Interview) ── */}
          {showDatePicker && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-600" />
                <p className="font-bold text-indigo-900 text-sm">Schedule Interview Date & Time</p>
              </div>
              <input
                type="datetime-local"
                value={interviewDateInput}
                onChange={e => setInterviewDateInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition"
              />
              <p className="text-xs text-indigo-500 font-medium">
                📅 Set a date to track this in your Command Center with live countdowns.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDatePicker(false); setPendingStatus(null); }}
                  className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmStatusChange('INTERVIEW', interviewDateInput || undefined)}
                  disabled={isUpdating}
                  className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                  {isUpdating ? 'Saving...' : 'Confirm Interview'}
                </button>
              </div>
            </div>
          )}

          {/* ── Links ── */}
          <div className="space-y-3">
            {job.jobUrl && (
              <a href={job.jobUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 transition group text-slate-600 font-semibold text-sm">
                <LinkIcon className="w-4 h-4 group-hover:text-indigo-600" /> View Original Posting
                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
              </a>
            )}
            <Link href={`/interviews/prep?company=${encodeURIComponent(job.companyName)}&role=${encodeURIComponent(job.role)}`}
              className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition font-semibold text-sm">
              <BrainCircuit className="w-4 h-4" /> AI Interview Prep
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
            </Link>
            <Link href="/interviews/voice-bot"
              className="flex items-center gap-3 p-4 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition font-semibold text-sm">
              <MessageSquare className="w-4 h-4" /> Voice Mock Interview
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
            </Link>
          </div>
        </div>

        {/* Footer — Delete */}
        <div className="p-5 border-t border-slate-100">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition text-sm border border-rose-100 disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? 'Removing...' : 'Remove from Tracker'}
          </button>
        </div>
      </div>
    </>
  );
}
