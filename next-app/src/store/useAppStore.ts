import { create } from 'zustand';
import { getJobs, updateJobStatus, createJob, deleteJob } from '@/actions/jobActions';
import { createInterview, updateInterview, deleteInterview } from '@/actions/interviewActions';
import { getResumes, linkResumeToJob } from '@/actions/resumeActions';
import { auth } from '@/lib/firebase';

export interface InterviewRound {
  id: string;
  jobId: string;
  type: string;
  interviewDate: string | Date;
  meetingLink?: string | null;
  prepNotes?: string | null;
  questionsToAsk?: string | null;
  interviewers?: string | null;
  rating?: number | null;
  status: string;
  actualQuestions?: string | null;
  followUpSent?: boolean;
}

export interface ResumeRecord {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  label: string | null;
  uploadedAt: string | Date;
}

export interface JobApplication {
  id: string;
  companyName: string;
  role: string;
  status: string;
  appliedDate: string;
  logoUrl?: string;
  salary?: string;
  location?: string;
  jobUrl?: string;
  notes?: string;
  resumeId?: string | null;
  resume?: ResumeRecord | null;
  interviewDate?: string | null;
  interviews?: InterviewRound[];
}

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  // Jobs state
  jobs: JobApplication[];
  resumes: ResumeRecord[];
  isLoading: boolean;
  error: string | null;

  fetchJobs: () => Promise<void>;
  fetchResumes: () => Promise<void>;
  addJob: (jobData: Omit<JobApplication, 'id'>) => Promise<void>;
  updateJob: (id: string, newStatus: string, interviewDate?: string) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
  setJobResume: (id: string, resumeId: string | null) => Promise<void>;

  // Interview state
  addInterview: (data: Omit<InterviewRound, 'id' | 'status'>) => Promise<void>;
  editInterview: (id: string, data: Partial<InterviewRound>) => Promise<void>;
  removeInterview: (id: string, jobId: string) => Promise<void>;
}

const getFreshToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken(true); // true forces refresh to avoid expiration bugs
};

export const useAppStore = create<AppState>()((set, get) => ({
  // Theme and Auth
  theme: 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
    }
    return { theme: newTheme };
  }),
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),

  // Jobs
  jobs: [],
  resumes: [],
  isLoading: false,
  error: null,

  fetchJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      const idToken = await getFreshToken();
      const result = await getJobs(idToken);
      if (result.success && result.jobs) {
        const mappedJobs: JobApplication[] = result.jobs.map((job: any) => ({
          id: job.id,
          companyName: job.companyName,
          role: job.jobTitle,
          status: job.status,
          appliedDate: new Date(job.createdAt).toISOString().split('T')[0],
          interviewDate: job.interviewDate ? new Date(job.interviewDate).toISOString() : null,
          location: job.location || undefined,
          salary: job.salary || undefined,   
          jobUrl: job.jobUrl || undefined,
          logoUrl: job.logoUrl || undefined, 
          notes: job.notes || undefined,
          resumeId: job.resumeId || null,
          resume: job.resume || null,
          interviews: (job.interviews || []).map((inv: any) => ({
            id: inv.id,
            jobId: inv.jobId,
            type: inv.type,
            interviewDate: inv.interviewDate,
            meetingLink: inv.meetingLink,
            prepNotes: inv.prepNotes,
            questionsToAsk: inv.questionsToAsk,
            interviewers: inv.interviewers,
            rating: inv.rating,
            status: inv.status,
            actualQuestions: inv.actualQuestions,
            followUpSent: inv.followUpSent ?? false,
          })),
          resumeVersion: job.resumeVersion || null,
        }));
        set({ jobs: mappedJobs, isLoading: false });
      } else {
        set({ error: result.error || 'Failed to fetch jobs', isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch jobs', isLoading: false });
    }
  },

  addJob: async (jobData) => {
    set({ isLoading: true, error: null });
    try {
      const idToken = await getFreshToken();
      
      // Ensure status follows new uppercase enum convention if passed generically
      const upperStatus = jobData.status.toUpperCase() as any;

      const result = await createJob({
        companyName: jobData.companyName,
        jobTitle: jobData.role,
        status: upperStatus,
        location: jobData.location ?? undefined,
        salary: jobData.salary ?? undefined,
        jobUrl: jobData.jobUrl ?? undefined,
        notes: jobData.notes ?? undefined,
        resumeId: jobData.resumeId ?? undefined,
      }, idToken);
      
      if (result.success && result.job) {
        const newJob: JobApplication = {
          id: result.job.id,
          companyName: result.job.companyName,
          role: result.job.jobTitle,
          status: result.job.status,
          appliedDate: new Date(result.job.createdAt).toISOString().split('T')[0],
          interviewDate: (result.job as any).interviewDate ? new Date((result.job as any).interviewDate).toISOString() : null,
          location: result.job.location || undefined,
          salary: result.job.salary || undefined,
          jobUrl: result.job.jobUrl || undefined,
          logoUrl: result.job.logoUrl || undefined,
          notes: result.job.notes || undefined,
        };
        set((state) => ({ 
          jobs: [...state.jobs, newJob],
          isLoading: false 
        }));
      } else {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error || 'Failed to add job on server.');
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to add job', isLoading: false });
      throw error;
    }
  },

  updateJob: async (id, newStatus, interviewDate?: string) => {
    const previousJobs = get().jobs;
    const upperStatus = newStatus.toUpperCase() as any;

    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, status: upperStatus, interviewDate: interviewDate || job.interviewDate } : job)),
    }));

    try {
      const idToken = await getFreshToken();
      const result = await updateJobStatus(id, upperStatus, idToken, interviewDate);
      if (!result.success) {
        set({ jobs: previousJobs, error: result.error });
      }
    } catch (error) {
      set({ jobs: previousJobs, error: 'Failed to update status' });
    }
  },

  removeJob: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const idToken = await getFreshToken();
      const result = await deleteJob(id, idToken);
      if (result.success) {
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
        throw new Error(result.error || 'Failed to delete job');
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw error; // Re-throw so the UI can catch + show toast
    }
  },

  fetchResumes: async () => {
    try {
      const idToken = await getFreshToken();
      const result = await getResumes(idToken);
      if (result.success && result.resumes) {
        set({ resumes: result.resumes as ResumeRecord[] });
      }
    } catch (error) {
      console.error('Failed to fetch resumes', error);
    }
  },

  setJobResume: async (id: string, resumeId: string | null) => {
    const previousJobs = get().jobs;
    const selectedResume = get().resumes.find(r => r.id === resumeId) || null;

    // Optimistic update
    set((state) => ({
      jobs: state.jobs.map(job => job.id === id ? { ...job, resumeId, resume: selectedResume } : job)
    }));
    try {
      const idToken = await getFreshToken();
      const result = await linkResumeToJob(id, resumeId, idToken);
      if (!result.success) {
        set({ jobs: previousJobs });
      }
    } catch {
      set({ jobs: previousJobs });
    }
  },

  addInterview: async (data: Omit<InterviewRound, 'id' | 'status'>) => {
    try {
      const idToken = await getFreshToken();
      let d = data.interviewDate;
      const payloadDate = d instanceof Date ? d.toISOString() : d;
      const res = await createInterview({ ...data, interviewDate: payloadDate } as any, idToken);
      if (res.success && res.interview) {
        set((state) => ({
          jobs: state.jobs.map(job => {
            if (job.id === data.jobId) {
              return { 
                ...job, 
                interviews: [...(job.interviews || []), res.interview] 
              };
            }
            return job;
          })
        }));
      }
    } catch (error) {
      console.error(error);
    }
  },

  editInterview: async (id: string, data: Partial<InterviewRound>) => {
    try {
      const idToken = await getFreshToken();
      let d = data.interviewDate;
      const payloadDate = d instanceof Date ? d.toISOString() : d;
      const payload = d ? { ...data, interviewDate: payloadDate } : data;
      
      const res = await updateInterview(id, payload as any, idToken);
      if (res.success && res.interview) {
        set((state) => ({
          jobs: state.jobs.map(job => {
            if (job.id === res.interview.jobId) {
              return {
                ...job,
                interviews: job.interviews?.map(inv => inv.id === id ? res.interview : inv)
              };
            }
            return job;
          })
        }));
      }
    } catch (error) {
      console.error(error);
    }
  },

  removeInterview: async (id: string, jobId: string) => {
    try {
      const idToken = await getFreshToken();
      const res = await deleteInterview(id, idToken);
      if (res.success) {
        set((state) => ({
          jobs: state.jobs.map(job => {
            if (job.id === jobId) {
              return {
                ...job,
                interviews: job.interviews?.filter(inv => inv.id !== id)
              };
            }
            return job;
          })
        }));
      }
    } catch (error) {
      console.error(error);
    }
  }
}));
