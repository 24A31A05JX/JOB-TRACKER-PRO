'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAppStore, InterviewRound } from '@/store/useAppStore';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import {
  Calendar as CalendarIcon, Clock, ChevronDown, Video, Target, Plus,
  BrainCircuit, Sparkles, Loader2, Save, RefreshCw, CheckCircle2,
  Star, MessageSquare, Mail, MailCheck, CheckCheck
} from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import { InterviewCountdown } from '@/components/InterviewCountdown';
import AddInterviewModal from '@/components/AddInterviewModal';
import { generateInterviewPrepNotes } from '@/actions/aiActions';
import { InterviewCoachChat } from '@/components/InterviewCoachChat';

// ──────────────────────────────
// Markdown renderer for AI notes
// ──────────────────────────────
function PrepMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h2 className="text-sm font-black text-indigo-700 uppercase tracking-wider mt-4 mb-2 first:mt-0 flex items-center gap-1.5">{children}</h2>
        ),
        ul: ({ children }) => <ul className="space-y-1 mb-3">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-1 mb-3 list-decimal list-inside">{children}</ol>,
        li: ({ children }) => (
          <li className="text-slate-700 text-sm font-medium flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
            <span>{children}</span>
          </li>
        ),
        p: ({ children }) => <p className="text-slate-600 text-sm font-medium mb-2 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="text-slate-900 font-bold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ──────────────────────────────
// 5-Star Rating Component
// ──────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-all duration-100 hover:scale-110"
        >
          <Star
            className="w-7 h-7 transition-colors"
            fill={(hovered || value) >= star ? '#f59e0b' : 'transparent'}
            stroke={(hovered || value) >= star ? '#f59e0b' : '#cbd5e1'}
            strokeWidth={2}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm font-bold text-amber-600 ml-1">
          {['', 'Rough 😣', 'Okay 😐', 'Good 🙂', 'Great 😊', 'Nailed it! 🔥'][value]}
        </span>
      )}
    </div>
  );
}

// ──────────────────────────────
// Main Page
// ──────────────────────────────
type ExtendedInterview = InterviewRound & {
  companyName: string;
  role: string;
  logoUrl?: string;
  jobNotes?: string;
  jobUrl?: string;
};

export default function InterviewsCommandCenter() {
  const { jobs, fetchJobs, editInterview, addInterview } = useAppStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // AI generation
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Local editable state per card
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Feedback state per card
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, {
    rating: number;
    actualQuestions: string;
    followUpSent: boolean;
  }>>({});
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) fetchJobs();
    setIsMounted(true);
  }, [fetchJobs, user?.uid]);

  const allInterviews = useMemo(() => {
    const arr: ExtendedInterview[] = [];
    jobs.forEach(job => {
      if (job.interviews && job.interviews.length > 0) {
        job.interviews.forEach(inv => {
          arr.push({ ...inv, companyName: job.companyName, role: job.role, logoUrl: job.logoUrl, jobNotes: job.notes ?? undefined, jobUrl: job.jobUrl ?? undefined });
        });
      } else if (job.interviewDate || job.status === 'INTERVIEW') {
        // Fallback to exactly 24 hours from now if marked as INTERVIEW but no precise date is scheduled
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 1);
        
        arr.push({
          id: `legacy-${job.id}`, jobId: job.id, type: job.interviewDate ? 'General Interview' : 'Interview (Unscheduled)',
          interviewDate: job.interviewDate || fallbackDate.toISOString(), status: 'UPCOMING',
          companyName: job.companyName, role: job.role, logoUrl: job.logoUrl,
          jobNotes: job.notes ?? undefined, jobUrl: job.jobUrl ?? undefined,
        });
      }
    });
    return arr.sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime());
  }, [jobs]);

  const now = new Date().getTime();
  const upcoming = allInterviews.filter(i => i.status !== 'COMPLETED' && new Date(i.interviewDate).getTime() > now - 60 * 60 * 1000);
  const past = allInterviews.filter(i => i.status === 'COMPLETED' || new Date(i.interviewDate).getTime() <= now - 60 * 60 * 1000);

  // Initialize feedback draft from existing data when card expands
  const handleExpand = (inv: ExtendedInterview) => {
    const id = inv.id;
    if (!feedbackDraft[id]) {
      setFeedbackDraft(prev => ({
        ...prev,
        [id]: {
          rating: inv.rating ?? 0,
          actualQuestions: inv.actualQuestions ?? '',
          followUpSent: inv.followUpSent ?? false,
        }
      }));
    }
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGeneratePrep = useCallback(async (inv: ExtendedInterview) => {
    setGeneratingId(inv.id);
    setGenError(null);
    try {
      const result = await generateInterviewPrepNotes({
        companyName: inv.companyName, jobTitle: inv.role, interviewType: inv.type,
        jobNotes: inv.jobNotes, jobUrl: inv.jobUrl,
      });
      if (result.success && result.prepNotes) {
        setLocalNotes(prev => ({ ...prev, [inv.id]: result.prepNotes! }));
        if (!inv.id.startsWith('legacy-')) await editInterview(inv.id, { prepNotes: result.prepNotes });
      } else {
        setGenError(result.error || 'AI generation failed.');
      }
    } catch (e: any) { setGenError(e.message); }
    finally { setGeneratingId(null); }
  }, [editInterview]);

  const handleSaveNotes = useCallback(async (invId: string, inv: ExtendedInterview) => {
    const notes = localNotes[invId];
    if (!notes) return;
    setSavingId(invId);
    if (invId.startsWith('legacy-')) {
       await addInterview({
         jobId: inv.jobId,
         type: 'General Interview',
         interviewDate: inv.interviewDate,
         prepNotes: notes
       });
    } else {
       await editInterview(invId, { prepNotes: notes });
    }
    setSavingId(null);
  }, [addInterview, editInterview, localNotes]);

  const handleSaveFeedback = useCallback(async (inv: ExtendedInterview) => {
    const draft = feedbackDraft[inv.id];
    if (!draft) return;
    setSavingFeedbackId(inv.id);
    
    if (inv.id.startsWith('legacy-')) {
      await addInterview({
        jobId: inv.jobId,
        type: 'General Interview',
        interviewDate: inv.interviewDate,
        rating: draft.rating || undefined,
        actualQuestions: draft.actualQuestions || undefined,
        followUpSent: draft.followUpSent,
      });
    } else {
      await editInterview(inv.id, {
        rating: draft.rating || undefined,
        actualQuestions: draft.actualQuestions || undefined,
        followUpSent: draft.followUpSent,
      } as any);
    }
    
    setSavingFeedbackId(null);
    toast('Feedback saved!', 'success');
  }, [addInterview, editInterview, feedbackDraft, toast]);

  const handleMarkComplete = useCallback(async (inv: ExtendedInterview) => {
    const draft = feedbackDraft[inv.id];
    setCompletingId(inv.id);

    if (inv.id.startsWith('legacy-')) {
      await addInterview({
        jobId: inv.jobId,
        type: 'General Interview',
        interviewDate: inv.interviewDate,
        status: 'COMPLETED',
        rating: draft?.rating || undefined,
        actualQuestions: draft?.actualQuestions || undefined,
        followUpSent: draft?.followUpSent ?? false,
      } as any);
    } else {
      await editInterview(inv.id, {
        status: 'COMPLETED',
        rating: draft?.rating || undefined,
        actualQuestions: draft?.actualQuestions || undefined,
        followUpSent: draft?.followUpSent ?? false,
      } as any);
    }
    
    setExpandedId(null);
    setCompletingId(null);
    toast('Round marked complete! Great job finishing that round! 🎉', 'success');
  }, [addInterview, editInterview, feedbackDraft, toast]);

  if (!isMounted) return null;

  const renderCard = (inv: ExtendedInterview, isPastCard = false) => {
    const iDate = new Date(inv.interviewDate);
    const diffHours = (iDate.getTime() - now) / (1000 * 60 * 60);
    const isUrgent = !isPastCard && diffHours > 0 && diffHours <= 2;
    const isTomorrow = !isPastCard && diffHours > 2 && diffHours <= 48 && iDate.getDate() !== new Date().getDate();
    const isExpanded = expandedId === inv.id;
    const isGenerating = generatingId === inv.id;
    const isSaving = savingId === inv.id;
    const isSavingFeedback = savingFeedbackId === inv.id;
    const isCompleting = completingId === inv.id;
    const currentNotes = localNotes[inv.id] ?? inv.prepNotes ?? '';
    const feedback = feedbackDraft[inv.id] ?? { rating: inv.rating ?? 0, actualQuestions: inv.actualQuestions ?? '', followUpSent: inv.followUpSent ?? false };

    let borderColor = isPastCard ? 'border-slate-200' : 'border-slate-200';
    let glow = '';
    if (isUrgent) { borderColor = 'border-rose-300'; glow = 'ring-4 ring-rose-500/10 bg-rose-50/30'; }
    else if (isTomorrow) { borderColor = 'border-amber-300'; glow = 'bg-amber-50/20'; }
    else if (isPastCard && inv.status === 'COMPLETED') { borderColor = 'border-emerald-200'; }

    return (
      <div key={inv.id} className={`bg-white rounded-2xl border ${borderColor} ${glow} shadow-sm overflow-hidden transition-all duration-300`}>

        {/* Card Header */}
        <div
          onClick={() => handleExpand(inv)}
          className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 cursor-pointer hover:bg-slate-50/50 ${isPastCard ? 'opacity-90' : ''}`}
        >
          <div className="flex items-center gap-4">
            <CompanyLogo companyName={inv.companyName} logoUrl={inv.logoUrl} />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{inv.type}</span>
                {isUrgent && <span className="text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded-md animate-pulse">STARTING SOON</span>}
                {isTomorrow && <span className="text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md">TOMORROW</span>}
                {inv.status === 'COMPLETED' && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCheck className="w-3 h-3"/>Completed</span>}
                {currentNotes && inv.status !== 'COMPLETED' && <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Sparkles className="w-3 h-3"/>AI Prepped</span>}
                {inv.rating && <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">{Array(inv.rating).fill('★').join('')}</span>}
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-snug">{inv.companyName} <span className="text-slate-400 font-medium px-1">—</span> {inv.role}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{iDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {!isPastCard && (
              <div className={`px-4 py-2 rounded-xl ${isUrgent ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                <InterviewCountdown targetDate={inv.interviewDate} />
              </div>
            )}
            {isPastCard && inv.status === 'COMPLETED' && inv.rating && (
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4" fill={s <= inv.rating! ? '#f59e0b' : 'transparent'} stroke={s <= inv.rating! ? '#f59e0b' : '#e2e8f0'} strokeWidth={2} />)}
              </div>
            )}
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expanded Workspace */}
        {isExpanded && (
          <div className="border-t border-slate-100 animate-in slide-in-from-top-2">

            {/* ─── AI PREP SECTION (Upcoming only) ─── */}
            {!isPastCard && (
              <>
                <div className="bg-gradient-to-r from-indigo-950 to-slate-900 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">AI Prep Engine</p>
                    <p className="text-white font-bold text-sm">
                      {currentNotes ? 'Prep notes generated. Regenerate for a fresh take.' : `Generate a complete prep guide for your ${inv.type} round.`}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleGeneratePrep(inv); }}
                    disabled={isGenerating}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-800 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                  >
                    {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin"/> Generating...</>
                      : currentNotes ? <><RefreshCw className="w-4 h-4"/> Regenerate Prep</>
                      : <><Sparkles className="w-4 h-4"/> Generate AI Prep</>}
                  </button>
                </div>
                {genError && expandedId === inv.id && (
                  <div className="bg-rose-50 border-b border-rose-100 px-5 py-3 text-xs font-bold text-rose-600">⚠ {genError}</div>
                )}
              </>
            )}

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">

              {/* Prep Notes */}
              {!isPastCard && (
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5"/> Prep Notes</h4>
                    {localNotes[inv.id] && (
                      <button onClick={e => { e.stopPropagation(); handleSaveNotes(inv.id, inv); }} disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition disabled:opacity-60">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                        {isSaving ? 'Saving...' : 'Save Notes'}
                      </button>
                    )}
                  </div>
                  {isGenerating ? (
                    <div className="bg-white rounded-xl border border-indigo-100 p-6 flex flex-col items-center gap-3 min-h-[200px] justify-center">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin"/>
                      <p className="text-sm font-bold text-slate-600">Gemini is generating your prep guide...</p>
                      <p className="text-xs text-slate-400">This takes 5–10 seconds</p>
                    </div>
                  ) : currentNotes ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                      <div className="bg-white rounded-xl border border-slate-200 p-5 min-h-[400px] max-h-[600px] overflow-y-auto">
                        <PrepMarkdown content={currentNotes} />
                      </div>
                      <div className="h-[400px] lg:h-auto">
                        <InterviewCoachChat 
                           contextData={`Role: ${inv.role} at ${inv.companyName}. Generated AI Prep Notes:\n\n${currentNotes}`}
                           title="Prep Guide Coach"
                           placeholder="Ask a question about this prep guide..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-6 min-h-[120px] flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Sparkles className="w-8 h-8 text-indigo-200"/>
                      <p className="text-sm font-bold text-slate-500">Hit "Generate AI Prep" above to get a full guide.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── POST-INTERVIEW FEEDBACK SECTION ─── */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className={`px-5 py-3 flex items-center gap-2 border-b border-slate-100 ${isPastCard ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    <MessageSquare className={`w-4 h-4 ${isPastCard ? 'text-emerald-600' : 'text-slate-400'}`}/>
                    <h4 className={`text-xs font-black uppercase tracking-widest ${isPastCard ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {isPastCard ? 'Post-Interview Review' : 'Round Evaluation (Fill after the interview)'}
                    </h4>
                  </div>
                  <div className="p-5 space-y-5">

                    {/* Star Rating */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">How did it go?</label>
                      <StarRating value={feedback.rating} onChange={v => setFeedbackDraft(p => ({ ...p, [inv.id]: { ...p[inv.id] ?? { rating: 0, actualQuestions: '', followUpSent: false }, rating: v } }))} />
                    </div>

                    {/* Question Bank */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Questions Asked (Your Personal Question Bank)</label>
                      <textarea
                        value={feedback.actualQuestions}
                        onChange={e => setFeedbackDraft(p => ({ ...p, [inv.id]: { ...p[inv.id] ?? { rating: 0, actualQuestions: '', followUpSent: false }, actualQuestions: e.target.value } }))}
                        rows={4}
                        className="w-full px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-y placeholder:text-slate-400 transition"
                        placeholder={"e.g.\n- Explain the difference between useEffect and useLayoutEffect\n- How would you optimize a slow React component?\n- Tell me about a time you debugged a production issue"}
                      />
                      <p className="text-xs text-slate-400 font-medium mt-1.5">💡 These get fed to the AI Mock Prep for future practice rounds.</p>
                    </div>

                    {/* Follow-up Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        {feedback.followUpSent
                          ? <MailCheck className="w-5 h-5 text-emerald-600"/>
                          : <Mail className="w-5 h-5 text-slate-400"/>}
                        <div>
                          <p className="text-sm font-bold text-slate-800">Thank You Email Sent</p>
                          <p className="text-xs text-slate-400 font-medium">Send within 24 hrs to leave a positive impression.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFeedbackDraft(p => ({ ...p, [inv.id]: { ...p[inv.id] ?? { rating: 0, actualQuestions: '', followUpSent: false }, followUpSent: !feedback.followUpSent } }))}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${feedback.followUpSent ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${feedback.followUpSent ? 'translate-x-6' : 'translate-x-0'}`}/>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleSaveFeedback(inv); }}
                        disabled={isSavingFeedback}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition disabled:opacity-50"
                      >
                        {isSavingFeedback ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        Save Draft
                      </button>
                      {!isPastCard && (
                        <button
                          onClick={e => { e.stopPropagation(); handleMarkComplete(inv); }}
                          disabled={isSavingFeedback}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-60"
                        >
                          {isCompleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                          {isCompleting ? 'Saving...' : 'Mark Round Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Join Call + Interviewers */}
              {!isPastCard && (
                <>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Questions to Ask</h4>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 min-h-[60px] whitespace-pre-wrap">
                      {inv.questionsToAsk || 'No custom questions logged yet.'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5"/> Interviewers</h4>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 min-h-[60px]">
                      {inv.interviewers || 'Not specified'}
                    </div>
                    {inv.meetingLink ? (
                      <a href={inv.meetingLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition">
                        <Video className="w-4 h-4"/> Join Call
                      </a>
                    ) : (
                      <button disabled className="px-6 py-3 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                        <Video className="w-4 h-4"/> No Meeting Link
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-8 overflow-y-auto font-display bg-slate-50">

      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personal Command Center</h1>
            <p className="text-slate-500 mt-0.5 font-medium text-sm">AI prep + lifecycle tracking for every round.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setAddModalOpen(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Log Interview
          </button>
          <Link href="/interviews/prep" className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
            <BrainCircuit className="w-5 h-5" /> AI Mock Prep
          </Link>
        </div>
      </section>

      {/* ── Upcoming Rounds ── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" /> Upcoming Rounds ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <div className="flex flex-col gap-4">{upcoming.map(inv => renderCard(inv, false))}</div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center flex flex-col items-center">
            <CalendarIcon className="w-10 h-10 text-slate-200 mb-3"/>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Upcoming Rounds</h3>
            <p className="text-slate-400 text-sm font-medium max-w-xs mb-5">Log a round to unlock AI prep notes and the feedback tracker.</p>
            <button onClick={() => setAddModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition">
              Log First Interview
            </button>
          </div>
        )}
      </div>

      {/* ── Past / Completed Rounds ── */}
      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Past Rounds ({past.length})
          </h2>
          <div className="flex flex-col gap-4">{past.map(inv => renderCard(inv, true))}</div>
        </div>
      )}

      <AddInterviewModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} jobs={jobs} />
    </div>
  );
}
