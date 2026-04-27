'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, ExternalLink, Loader2, Pencil, Check, X, FileUp, AlertCircle, BookOpen, Eye } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase, RESUME_BUCKET } from '@/lib/supabase';
import { getResumes, uploadAndSaveResume, deleteResume, updateResumeLabel } from '@/actions/resumeActions';
import { useToast } from '@/components/ToastProvider';

interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  label: string | null;
  uploadedAt: Date | string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ResumesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadResumes = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const result = await getResumes(idToken);
      if (result.success) setResumes(result.resumes as Resume[]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadResumes(); }, [user]);

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      toast('Only PDF and Word documents are supported', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('File must be under 5MB', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadProgress(40);

      // Upload and save metadata entirely on the server using Admin SDK
      const saveResult = await uploadAndSaveResume(idToken, formData);

      setUploadProgress(100);

      if (saveResult.success) {
        toast('Resume uploaded successfully!', 'success');
        await loadResumes();
      } else {
        throw new Error(saveResult.error);
      }
    } catch (err: any) {
      toast(err.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDelete = async (resume: Resume) => {
    if (!user || !confirm(`Delete "${resume.label || resume.fileName}"?\n\nThis will unlink it from all job applications.`)) return;
    setDeletingId(resume.id);
    try {
      const idToken = await user.getIdToken();
      const result = await deleteResume(resume.id, idToken);
      if (result.success) {
        toast('Resume deleted', 'success');
        setResumes(prev => prev.filter(r => r.id !== resume.id));
      } else {
        toast(result.error || 'Delete failed', 'error');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveLabel = async (resume: Resume) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    await updateResumeLabel(resume.id, editLabel, idToken);
    setResumes(prev => prev.map(r => r.id === resume.id ? { ...r, label: editLabel } : r));
    setEditingId(null);
    toast('Label updated', 'success');
  };

  const isPdf = (r: Resume) => r.mimeType === 'application/pdf' || r.fileName.endsWith('.pdf');

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 font-display">
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Resume Vault</h1>
              <p className="text-slate-500 mt-0.5 font-medium">Upload all your resume versions. Link them to applications. Review before every interview.</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition text-sm disabled:opacity-60"
          >
            <Upload className="w-4 h-4" /> Upload Resume
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Resumes', value: resumes.length },
            { label: 'Linked to Jobs', value: 0 },
            { label: 'Latest Upload', value: resumes[0] ? formatDate(resumes[0].uploadedAt) : '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative mb-8 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
          } ${isUploading ? 'pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }}
          />

          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-indigo-700">Uploading...</p>
              <div className="w-48 mx-auto bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <FileUp className={`w-10 h-10 mx-auto ${dragActive ? 'text-indigo-600' : 'text-slate-300'} transition`} />
              <p className="font-bold text-slate-700">
                {dragActive ? 'Drop it here!' : 'Drag & drop your resume, or click to browse'}
              </p>
              <p className="text-xs text-slate-400">PDF, DOC, DOCX — Max 5MB</p>
            </div>
          )}
        </div>

        {/* Resume List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No resumes yet</p>
            <p className="text-slate-400 text-sm mt-1">Upload your first resume to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4">Your Resumes ({resumes.length})</h2>
            {resumes.map(resume => (
              <div
                key={resume.id}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all p-5 flex items-center gap-5"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isPdf(resume) ? 'bg-rose-50' : 'bg-blue-50'}`}>
                  <FileText className={`w-6 h-6 ${isPdf(resume) ? 'text-rose-500' : 'text-blue-500'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editingId === resume.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabel(resume); if (e.key === 'Escape') setEditingId(null); }}
                        className="flex-1 px-3 py-1.5 text-sm font-bold bg-slate-50 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                      />
                      <button onClick={() => handleSaveLabel(resume)} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 truncate">{resume.label || resume.fileName}</p>
                      <button
                        onClick={() => { setEditingId(resume.id); setEditLabel(resume.label || resume.fileName.replace(/\.[^.]+$/, '')); }}
                        className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-indigo-600 rounded"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 font-medium">{resume.fileName}</span>
                    {resume.fileSize && <span className="text-xs text-slate-300">•</span>}
                    {resume.fileSize && <span className="text-xs text-slate-400">{formatBytes(resume.fileSize)}</span>}
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{formatDate(resume.uploadedAt)}</span>
                  </div>
                </div>

                {/* File type badge */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPdf(resume) ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                  {isPdf(resume) ? 'PDF' : 'DOCX'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                    title="View/Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={resume.fileUrl}
                    download={resume.fileName}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                    title="Download"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(resume)}
                    disabled={deletingId === resume.id}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-40"
                  >
                    {deletingId === resume.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-800">How to use the Resume Vault</p>
            <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
              Upload all versions of your resume here (e.g. "Frontend Tailored", "Data Science Resume"). Then, when adding or reviewing a job application, you can link the exact resume you sent — so before your interview, you'll know exactly what the recruiter has seen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
