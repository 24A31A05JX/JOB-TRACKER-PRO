'use client';

import { useState, useEffect, Suspense } from 'react';
import { Bot, FileText, Loader2, Target, CheckCircle2, ChevronRight, Mic, Send, RotateCcw, MessageSquare } from 'lucide-react';
import { generateInterviewQuestions, evaluateVoiceAnswer } from '@/actions/aiActions';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function InterviewPrepContent() {
  const searchParams = useSearchParams();
  const [jobDesc, setJobDesc] = useState(
    searchParams.get('company') && searchParams.get('role')
      ? `Role: ${searchParams.get('role')}\nCompany: ${searchParams.get('company')}`
      : ''
  );
  const [resume, setResume] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [sessionScore, setSessionScore] = useState(0);

  const prefillCompany = searchParams.get('company') || '';
  const prefillRole = searchParams.get('role') || '';

  const totalQuestions = questions.length;
  const isComplete = sessionStarted && currentQIndex >= totalQuestions && totalQuestions > 0;

  const handleGenerate = async () => {
    if (!jobDesc || !resume) return;
    setIsGenerating(true);
    setSessionStarted(false);
    try {
      setError('');
      const res = await generateInterviewQuestions(jobDesc, resume, numQuestions);
      if (!res.success) {
        setError(res.error || 'Failed to generate questions.');
        return;
      }
      setQuestions(res.data.questions);
      setEvaluations(new Array(res.data.questions.length).fill(null));
      setCurrentQIndex(0);
      setSessionScore(0);
      setSessionStarted(true);
    } catch (err) {
      setError('Network error: Could not reach Server Action.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!answer.trim()) return;
    setIsEvaluating(true);
    
    const evalRes = await evaluateVoiceAnswer(questions[currentQIndex]?.question, answer);
    setIsEvaluating(false);

    let newEvals = [...evaluations];
    let pointsEarned = 0;

    if (evalRes.success && evalRes.data) {
       newEvals[currentQIndex] = evalRes.data;
       const questionWeight = 100 / totalQuestions;
       pointsEarned = (evalRes.data.score / 100) * questionWeight;
    } else {
       newEvals[currentQIndex] = { score: 0, feedback: "Error grading answer. Suggestion: " + questions[currentQIndex]?.tips };
    }

    setEvaluations(newEvals);
    setSessionScore(prev => Math.min(100, Math.round(prev + pointsEarned)));
  };

  const handleNextQuestion = () => {
    setCurrentQIndex(currentQIndex + 1);
    setAnswer('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-8 overflow-y-auto font-display bg-slate-50">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Interview Coach</h1>
          {prefillCompany && prefillRole ? (
            <p className="text-indigo-600 font-semibold mt-1 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Prepped for: <strong>{prefillRole}</strong> at <strong>{prefillCompany}</strong>
            </p>
          ) : (
            <p className="text-slate-500 mt-1">Generate tailored behavioral and technical questions based on your resume and JD.</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/interviews/voice-bot"
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl font-bold text-sm hover:bg-violet-100 transition">
            <Mic className="w-4 h-4" /> Voice Bot
          </Link>
          <button
            disabled={isGenerating || !jobDesc || !resume}
            onClick={handleGenerate}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
            {isGenerating ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Form Settings (Hidden when session is running to maximize focus, or just faded) */}
        {!sessionStarted ? (
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Target className="text-indigo-600 w-4 h-4" /> Job Description / Role
              </label>
              <textarea
                className="w-full h-32 rounded-xl border border-slate-200 bg-white p-3 shadow-sm focus:ring-2 focus:ring-indigo-600/20 outline-none resize-none text-sm text-slate-700"
                placeholder="Paste the Job Description or type the role/company..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <FileText className="text-indigo-600 w-4 h-4" /> Your Resume
              </label>
              <textarea
                className="w-full h-32 rounded-xl border border-slate-200 bg-white p-3 shadow-sm focus:ring-2 focus:ring-indigo-600/20 outline-none resize-none text-sm text-slate-700"
                placeholder="Paste your Resume text here..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
               <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <MessageSquare className="text-indigo-600 w-4 h-4" /> Number of Questions
               </label>
               <select 
                 value={numQuestions} 
                 onChange={(e) => setNumQuestions(Number(e.target.value))}
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600/20"
               >
                 {[3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Questions</option>)}
               </select>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2">Powered by Gemini 2.5 Flash. Generates a personalized interactive mock interview.</p>
          </div>
        ) : (
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Session Score</h3>
              <div className="text-5xl font-black text-indigo-600 mb-2">{sessionScore}%</div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${sessionScore}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium">{isComplete ? "Session Complete!" : `Question ${currentQIndex + 1} of ${totalQuestions}`}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600 font-medium">
              You are in an active interview session for {numQuestions} questions. Answer carefully to maximize your score! 
              <br/><br/>
              <button 
                onClick={() => setSessionStarted(false)}
                className="text-indigo-600 font-bold hover:underline"
              >
                Abort & Change Settings
              </button>
            </div>
          </div>
        )}

        {/* Right Column: Chat Assistant Interface */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {!sessionStarted ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex-1 shadow-sm flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[400px]">
              <Bot className="w-14 h-14 opacity-20" />
              <p className="font-medium text-slate-500">Configure your session on the left and click Generate.</p>
            </div>
          ) : isComplete ? (
             <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center text-center gap-6 flex-1 justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Interview Complete!</h2>
                <div className="text-7xl font-black text-indigo-600">{sessionScore}%</div>
                <p className="text-slate-500 font-medium max-w-sm">Great job. Review your feedback above or start a new session to keep practicing.</p>
                <button onClick={() => setSessionStarted(false)}
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 mt-4">
                  <RotateCcw className="w-5 h-5" /> Back to Settings
                </button>
             </div>
          ) : (
            <div className="flex flex-col gap-5 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${(currentQIndex / totalQuestions) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-500">Q{currentQIndex + 1}/{totalQuestions}</span>
              </div>

              {/* Bot Question */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative">
                <div className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-indigo-200">
                  AI Recruiter
                </div>
                <p className="text-xl font-semibold leading-relaxed mt-4">{questions[currentQIndex]?.question}</p>
                <p className="text-indigo-300 text-sm mt-4 italic opacity-80 border-t border-white/10 pt-4">Internal reasoning: {questions[currentQIndex]?.reasoning}</p>
              </div>

              {/* User Answer Area */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-bold text-slate-800">Your Answer</h3>
                <textarea
                  className="w-full h-40 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner focus:ring-2 focus:ring-indigo-600/20 outline-none resize-none text-slate-700"
                  placeholder="Type your compelling answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={evaluations[currentQIndex] !== null || isEvaluating}
                />
                
                {evaluations[currentQIndex] === null ? (
                   <button 
                     onClick={handleEvaluateAnswer} 
                     disabled={isEvaluating || !answer.trim()}
                     className="self-end px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg disabled:opacity-50"
                   >
                     {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                     {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
                   </button>
                ) : (
                   <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                     <div className={`p-4 rounded-xl border flex items-start gap-4 ${evaluations[currentQIndex].score >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : evaluations[currentQIndex].score >= 40 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                        <div className="flex flex-col items-center justify-center shrink-0">
                          <span className="text-3xl font-black">{evaluations[currentQIndex].score}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Mark</span>
                        </div>
                        <div className="w-[1px] self-stretch bg-black/10 mx-2"></div>
                        <div className="text-sm font-medium leading-relaxed">
                           <span className="font-bold block mb-1">Feedback:</span>
                           {evaluations[currentQIndex].feedback}
                        </div>
                     </div>
                     <button onClick={handleNextQuestion}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg">
                        {currentQIndex + 1 >= totalQuestions ? <><CheckCircle2 className="w-5 h-5" /> Finish Interview</> : <><ChevronRight className="w-5 h-5" /> Next Question</>}
                     </button>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <InterviewPrepContent />
    </Suspense>
  );
}
