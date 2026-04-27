'use client';

import { useState } from 'react';
import { FileText, TrendingUp, PlusCircle, FileCode2, Edit2, Loader2, MinusCircle, AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import { analyzeResumeMatch, AIAnalysisResult, generateCoverLetter, extractPdfText } from '@/actions/aiActions';

export default function ResumeTailorPage() {
  const [jobDesc, setJobDesc] = useState('');
  const [resume, setResume] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
       setErrorMessage('Please upload a valid PDF file.');
       return;
    }

    setIsUploading(true);
    setErrorMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await extractPdfText(formData);
      if (res.success && res.text) {
        setResume(res.text);
      } else {
        setErrorMessage(res.error || 'Failed to extract text from PDF.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!jobDesc || !resume) return;
    setIsGeneratingLetter(true);
    setCoverLetter('');
    try {
      setErrorMessage('');
      const data = await generateCoverLetter(jobDesc, resume);
      if (!data.success) {
        setErrorMessage(data.error || 'Failed to generate cover letter.');
        return;
      }
      setCoverLetter(data.text || '');
    } catch (error) {
      setErrorMessage("Network error: Could not reach the Server Action.");
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDesc || !resume) return;
    
    setIsAnalyzing(true);
    try {
      setErrorMessage('');
      const data = await analyzeResumeMatch(jobDesc, resume);
      if (!data.success) {
        setErrorMessage(data.error || 'Unknown analysis error.');
        return;
      }
      setResult(data as any);
    } catch (error) {
      setErrorMessage("Network error: Could not reach the Server Action.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const circumference = 2 * Math.PI * 100; // 628.31
  const strokeDashoffset = result && result.matchScore !== undefined ? circumference - (circumference * result.matchScore) / 100 : circumference;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-8 overflow-y-auto">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI ATS Simulator</h1>
          <p className="text-slate-500 mt-1">Unlock deterministic resume analysis driven by <span className="text-indigo-600 font-semibold">Gemini 2.5 Flash</span></p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            disabled={isGeneratingLetter || !jobDesc || !resume}
            onClick={handleGenerateCoverLetter} 
            className="flex-1 md:flex-none px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGeneratingLetter ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit2 className="w-5 h-5" />}
            {isGeneratingLetter ? 'Drafting...' : 'Write Cover Letter'}
          </button>
          <button 
            disabled={isAnalyzing || !jobDesc || !resume}
            onClick={handleAnalyze} 
            className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:brightness-100"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuitIcon />}
            {isAnalyzing ? 'Analyzing Alignment...' : 'Calculate Match Score'}
          </button>
        </div>
      </section>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Job Description */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <FileText className="text-indigo-600 w-5 h-5" />
            <h3 className="font-bold text-slate-800">Job Description</h3>
          </div>
          <div className="flex-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-600/20 overflow-hidden">
            <textarea 
              className="w-full h-full min-h-[500px] p-3 outline-none resize-none bg-transparent placeholder:text-slate-400 text-slate-700 text-sm leading-relaxed" 
              placeholder="Paste the target Job Description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        </div>

        {/* Center: Match Score and Keywords */}
        <div className="lg:col-span-4 flex flex-col justify-center items-center gap-8 py-8 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-full h-[2px] bg-slate-300"></div>
          </div>
          
          <div className="relative z-10 block transition-all">
            <div className="w-56 h-56 rounded-full border-[12px] border-slate-100 flex items-center justify-center bg-white shadow-2xl relative overflow-hidden">
              {result && result.matchScore !== undefined && (
                <svg className="absolute w-56 h-56 -rotate-90">
                  <circle 
                    className={`${getScoreStroke(result.matchScore)} transition-all duration-1000 ease-out`} 
                    cx="112" cy="112" fill="transparent" r="100" 
                    stroke="currentColor" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                  />
                </svg>
              )}
              <div className="text-center z-10 transition-opacity">
                {result && result.matchScore !== undefined ? (
                  <>
                    <span className={`text-5xl font-black ${getScoreColor(result.matchScore)}`}>{result.matchScore}%</span>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Match Score</p>
                  </>
                ) : (
                  <div className="text-slate-400 font-medium text-sm px-4">Awaiting Analysis Data</div>
                )}
              </div>
            </div>
          </div>

          <div className={`w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xl z-10 mt-4 transition-opacity duration-500 ${result ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
               Keyword Analysis
            </h4>
            
            {result?.missingKeywords && result.missingKeywords.length > 0 ? (
              <div className="mb-4">
                <span className="text-[10px] font-bold bg-rose-100/50 text-rose-600 px-2 py-0.5 rounded uppercase mb-2 inline-block">Missing (Add these)</span>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map(keyword => (
                    <span key={keyword} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                      <MinusCircle className="w-3.5 h-3.5" /> {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {result?.matchingKeywords && result.matchingKeywords.length > 0 ? (
              <div>
                <span className="text-[10px] font-bold bg-emerald-100/50 text-emerald-600 px-2 py-0.5 rounded uppercase mb-2 inline-block">Matching</span>
                <div className="flex flex-wrap gap-2">
                  {result.matchingKeywords.map(keyword => (
                    <span key={keyword} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: Your Resume */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <FileCode2 className="text-indigo-600 w-5 h-5" />
              <h3 className="font-bold text-slate-800">Your Resume Content</h3>
            </div>
            
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition">
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {isUploading ? 'Extracting...' : 'Upload PDF'}
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={isUploading}
              />
            </label>
          </div>
          
          <div className="flex-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-600/20 overflow-hidden relative">
             <textarea 
              className="w-full h-full min-h-[500px] p-3 outline-none resize-none bg-transparent placeholder:text-slate-400 text-slate-700 text-sm leading-relaxed" 
              placeholder="Paste your raw Resume text here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Footer Info Cards */}
      <div className={`transition-all duration-500 overflow-hidden ${result ? 'opacity-100 h-auto' : 'opacity-0 h-0 hidden'}`}>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
             <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h5 className="font-bold text-slate-900 text-lg">AI Engineering Recommendation</h5>
            <p className="text-slate-600 mt-2 font-medium leading-relaxed">{result?.recommendation}</p>
          </div>
        </div>
      </div>

      {coverLetter && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md mb-4 bg-gradient-to-br from-white to-slate-50">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-indigo-600"/> Perfect-Match Cover Letter
          </h3>
          <div className="p-6 bg-white border border-slate-200 rounded-xl whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-serif shadow-sm">
            {coverLetter}
          </div>
        </div>
      )}

    </div>
  );
}

function BrainCircuitIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-5.224 4.668ab4.3 4.3 0 0 0-.204 2.103 4 4 0 0 0 3.14 4.098 4 4 0 0 0 5.62 2.224 4 4 0 0 0 7.272-1.636c.219-.044.436-.11.646-.2A4 4 0 0 0 19.605 8.7C19.867 8.356 20 7.94 20 7.5a3 3 0 0 0-4-2.83M2 14h4.5M14 19.5v-3M16 11.5l-4-3-4 3M19 14h-4M19 10h-4M12 5v2.5M12 16v-4.5"/><path d="M7 11.5v-2M12 11.5v-2"/></svg>
  );
}
