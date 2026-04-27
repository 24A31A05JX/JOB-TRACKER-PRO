'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Briefcase, CheckCircle2, Calendar, X, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/components/AuthProvider';
import AddJobModal from '@/components/AddJobModal';
import CompanyLogo from '@/components/CompanyLogo';
import { JobDrawer } from '@/components/JobDrawer';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';

const COLUMNS = [
  { id: 'WISHLIST', title: 'Wishlist', color: 'slate' },
  { id: 'APPLIED', title: 'Applied', color: 'blue' },
  { id: 'INTERVIEW', title: 'Interviewing', color: 'amber' }, 
  { id: 'OFFER', title: 'Offer', color: 'emerald' },
  { id: 'REJECTED', title: 'Rejected', color: 'rose' }
];

export default function Dashboard() {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  // Smart Drop state
  const [pendingDragJobId, setPendingDragJobId] = useState<string | null>(null);
  const [pendingDragTargetCol, setPendingDragTargetCol] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const { fetchJobs, isLoading, jobs, updateJob } = useAppStore();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      fetchJobs();
    }
  }, [fetchJobs, user?.uid]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !active.id || !over.id) return;

    const draggedJob = jobs.find(j => j.id === active.id);
    if (!draggedJob || draggedJob.status === over.id) return;

    if (over.id === 'INTERVIEW') {
      setPendingDragJobId(active.id as string);
      setPendingDragTargetCol('INTERVIEW');
      setScheduleDate('');
      setIsScheduleModalOpen(true);
    } else {
      updateJob(active.id as string, over.id as string);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!pendingDragJobId) return;
    setIsSavingSchedule(true);
    await updateJob(pendingDragJobId, 'INTERVIEW', scheduleDate || undefined);
    setIsSavingSchedule(false);
    setIsScheduleModalOpen(false);
    setPendingDragJobId(null);
  };

  const handleSkipSchedule = async () => {
    if (!pendingDragJobId) return;
    await updateJob(pendingDragJobId, 'INTERVIEW');
    setIsScheduleModalOpen(false);
    setPendingDragJobId(null);
  };

  // Quick Stats Logic explicitly implemented as requested
  const stats = {
    total: jobs.length,
    activeInterviews: jobs.filter(j => j.status === 'INTERVIEW').length,
    successRate: jobs.length > 0 
      ? Number(((jobs.filter(j => j.status === 'OFFER').length / jobs.length) * 100).toFixed(1))
      : 0
  };

  const activeJobData = activeId ? jobs.find(j => j.id === activeId) : null;
  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Header & Stats */}
      <header className="p-6 bg-white border-b border-slate-200" data-purpose="header-section">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-800">Application Dashboard</h2>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setIsAdvanced(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isAdvanced ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Standard
                </button>
                <button 
                  onClick={() => setIsAdvanced(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isAdvanced ? 'bg-indigo-600 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Smart Mode
                </button>
              </div>
            </div>
            <p className="text-slate-500">Track and manage your professional growth</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Application
          </button>
        </div>

        {/* Quick Stats Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Applications</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Interviews</p>
              <p className="text-3xl font-bold mt-1">{stats.activeInterviews}</p>
            </div>
            <div className="flex -space-x-3">
              <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center border-2 border-white text-xs font-bold">I</div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Success Rate</p>
              <p className="text-3xl font-bold mt-1">{stats.successRate}%</p>
            </div>
            <div className="relative w-14 h-14" data-purpose="circular-progress">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-200" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" strokeWidth="6"></circle>
                <circle className="text-indigo-600" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" strokeDasharray="150.7" strokeDashoffset={150.7 - (150.7 * (stats.successRate / 100))} strokeWidth="6"></circle>
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto p-6 bg-slate-50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map((col) => {
              const columnJobs = jobs.filter(j => j.status === col.id);
              return (
                <Column 
                  key={col.id} 
                  id={col.id} 
                  title={col.title} 
                  color={col.color} 
                  jobs={columnJobs} 
                  isAdvanced={isAdvanced}
                  onCardClick={(id: string) => setSelectedJobId(id)}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeJobData ? (
              <JobCard job={activeJobData} isAdvanced={isAdvanced} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <AddJobModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Job Detail Drawer */}
      <JobDrawer 
        job={selectedJob || null} 
        onClose={() => setSelectedJobId(null)} 
      />
    </div>
  );
}

// Subcomponents for DND logic

function Column({ id, title, color, jobs, isAdvanced, onCardClick }: any) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const colorClassMap: Record<string, any> = {
    'slate': { bg: 'bg-slate-400', tagBg: 'bg-slate-200', text: 'text-slate-600' },
    'blue': { bg: 'bg-blue-500', tagBg: 'bg-blue-100', text: 'text-blue-600' },
    'amber': { bg: 'bg-amber-500', tagBg: 'bg-amber-100', text: 'text-amber-600' },
    'emerald': { bg: 'bg-emerald-500', tagBg: 'bg-emerald-100', text: 'text-emerald-600' },
    'rose': { bg: 'bg-rose-500', tagBg: 'bg-rose-100', text: 'text-rose-600' }
  };
  const styles = colorClassMap[color] || colorClassMap['slate'];

  return (
    <section 
      ref={setNodeRef} 
      className={`w-80 flex flex-col rounded-2xl transition-colors ${isOver ? 'bg-indigo-50/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${styles.bg}`}></span>
          {title} <span className={`${styles.tagBg} ${styles.text} text-xs px-2 py-0.5 rounded-full ml-1`}>{jobs.length}</span>
        </h3>
      </div>
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-4 min-h-[500px]">
        {jobs.map((job: any) => (
          <DraggableJobCard key={job.id} job={job} isAdvanced={isAdvanced} color={color} onCardClick={onCardClick} />
        ))}
        {jobs.length === 0 && (
          <div className={`flex-1 border-2 border-dashed rounded-2xl flex items-center justify-center text-sm font-medium py-10 transition-colors ${isOver ? 'border-indigo-400 text-indigo-500 bg-indigo-50/50' : 'border-slate-200 text-slate-400'}`}>
            Drop Here
          </div>
        )}
      </div>
    </section>
  );
}

function DraggableJobCard({ job, isAdvanced, color, onCardClick }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { status: job.status }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.4 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} isAdvanced={isAdvanced} color={color} onOpen={() => onCardClick?.(job.id)} />
    </div>
  );
}

function JobCard({ job, isAdvanced, isOverlay, color, onOpen }: any) {
  const colorClassMap: Record<string, string> = {
    'slate': 'border-slate-200 hover:border-indigo-300 border-l-slate-400',
    'blue': 'border-slate-200 border-l-blue-500 hover:border-indigo-300',
    'amber': 'border-amber-200 border-l-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    'emerald': 'border-emerald-500 bg-emerald-50/10',
    'rose': 'border-rose-200 border-l-rose-500'
  };
  
  const borderClass = color ? colorClassMap[color] : 'border-slate-200 border-l-slate-400';

  return (
    <article 
      className={`bg-white p-4 rounded-2xl shadow-sm border border-l-4 transition-all cursor-grab active:cursor-grabbing relative group ${borderClass} ${isOverlay ? 'scale-105 shadow-2xl rotate-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <CompanyLogo companyName={job.companyName} logoUrl={job.logoUrl} />
          <div>
            <h4 className="font-bold text-slate-800 leading-tight block truncate max-w-[170px]">{job.role}</h4>
            <p className="text-sm text-slate-500">{job.companyName}</p>
          </div>
        </div>
        {/* Info button — uses pointer-events stop so it doesn't trigger drag */}
        {onOpen && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onOpen(); }}
            className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 shrink-0"
            title="View details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {job.location && <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[11px] font-semibold rounded-lg">{job.location}</span>}
        {job.salary && <span className="px-2 py-1 bg-slate-50 text-slate-600 text-[11px] font-semibold rounded-lg">{job.salary}</span>}
      </div>
      
      {isAdvanced && (
        <div className="mt-2 mb-1 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
          {job.status === 'WISHLIST' && (
            <button 
              onClick={(e) => { e.stopPropagation(); window.location.href = '/resume-tailor?job=' + job.id; }}
              onPointerDown={e => e.stopPropagation()}
              className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Tailor Resume
            </button>
          )}

          {job.status === 'APPLIED' && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const subject = encodeURIComponent(`Application Follow-up: ${job.role} at ${job.companyName}`);
                window.location.href = `mailto:?subject=${subject}`;
              }}
              onPointerDown={e => e.stopPropagation()}
              className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg> Draft Follow-up
            </button>
          )}

          {job.status === 'INTERVIEW' && (
            <button 
              onClick={(e) => { e.stopPropagation(); window.location.href = '/interviews'; }}
              onPointerDown={e => e.stopPropagation()}
              className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg> Practice AI Mock
            </button>
          )}

          {(job.status === 'OFFER' || job.status === 'REJECTED') && (
            <p className="text-[10px] text-center font-semibold text-slate-400">
              {job.status === 'OFFER' ? '🎉 Congratulations on the offer!' : 'Keep pushing forward!'}
            </p>
          )}

          {job.appliedDate && (
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1 px-1">
              <span>Time since applied:</span>
              <span>{Math.floor((new Date().getTime() - new Date(job.appliedDate).getTime()) / (1000 * 3600 * 24))} days</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
