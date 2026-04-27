'use client';

import { useState } from 'react';
import { X, Briefcase, Calendar, Link as LinkIcon, Loader2, CheckCircle2, ChevronDown, User, Target } from 'lucide-react';
import { useAppStore, JobApplication } from '@/store/useAppStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobApplication[];
}

const EMPTY_FORM = {
  jobId: '',
  type: 'Technical',
  interviewDate: '',
  meetingLink: '',
  prepNotes: '',
  questionsToAsk: '',
  interviewers: ''
};

export default function AddInterviewModal({ isOpen, onClose, jobs }: Props) {
  const { addInterview } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobId) return alert('Please select a job role.');
    setIsSubmitting(true);
    await addInterview({
      jobId: formData.jobId,
      type: formData.type,
      interviewDate: formData.interviewDate,
      meetingLink: formData.meetingLink,
      prepNotes: formData.prepNotes,
      questionsToAsk: formData.questionsToAsk,
      interviewers: formData.interviewers,
    });
    setIsSubmitting(false);
    onClose();
    setFormData(EMPTY_FORM);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-display">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Target className="w-6 h-6 text-indigo-600"/> Log Interview Round</h2>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">Link this scheduled round to an existing job application.</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto">
          <form id="add-interview-form" onSubmit={handleSubmit} className="p-8 space-y-6">

            {/* Which Job */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Target Job Application *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select required name="jobId" value={formData.jobId} onChange={handleChange} disabled={isSubmitting}
                  className="w-full appearance-none pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition text-slate-900 font-semibold cursor-pointer text-sm">
                  <option value="" disabled>Select the company and role...</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.companyName} - {job.role}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Round Type</label>
                <div className="relative">
                  <select name="type" value={formData.type} onChange={handleChange} disabled={isSubmitting}
                    className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition text-slate-900 font-semibold cursor-pointer text-sm">
                    <option value="HR Screen">HR Phone Screen</option>
                    <option value="Technical">Technical Round</option>
                    <option value="System Design">System Design</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Take-Home Review">Take-Home Review</option>
                    <option value="Behavioral">Behavioral (Values)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Date &amp; Time *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input required name="interviewDate" value={formData.interviewDate} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition font-semibold text-slate-800"
                    type="datetime-local" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Meeting Link</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input name="meetingLink" value={formData.meetingLink} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition placeholder:text-slate-400 font-medium"
                    placeholder="Zoom, Google Meet, Teams" type="url" />
                </div>
              </div>

              {/* Interviewers */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Interviewers</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input name="interviewers" value={formData.interviewers} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition placeholder:text-slate-400 font-medium"
                    placeholder="Names, LinkedIn profiles..." type="text" />
                </div>
              </div>
            </div>

            {/* Notes Workspace */}
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col gap-4">
               <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-indigo-700 mb-2">Prep Notes / Research</label>
                  <textarea name="prepNotes" value={formData.prepNotes} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-600/20 outline-none transition placeholder:text-slate-400 font-medium min-h-[100px] resize-y"
                    placeholder="e.g. They just raised Series B. Focus heavily on scalability experience..." />
               </div>
               <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-indigo-700 mb-2">Questions To Ask Them</label>
                  <textarea name="questionsToAsk" value={formData.questionsToAsk} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-600/20 outline-none transition placeholder:text-slate-400 font-medium min-h-[80px] resize-y"
                    placeholder="1. How does engineering collaborate with product?\n2. What is the biggest technical challenge right now?" />
               </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 font-bold uppercase">Ready for action</p>
          <div className="flex gap-3">
            <button type="button" disabled={isSubmitting} onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" form="add-interview-form" disabled={isSubmitting}
              className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 text-sm disabled:opacity-70">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSubmitting ? 'Saving...' : 'Save Interview'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
