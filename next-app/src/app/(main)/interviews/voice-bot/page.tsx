'use client';

import { useState, useEffect, useRef } from 'react';
import { generateInterviewQuestions, evaluateVoiceAnswer } from '@/actions/aiActions';
import { useAppStore } from '@/store/useAppStore';
import { Mic, MicOff, Volume2, VolumeX, BrainCircuit, ChevronRight, RotateCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { InterviewCoachChat } from '@/components/InterviewCoachChat';

// Types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function InterviewVoiceBotPage() {
  const { jobs } = useAppStore();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [resume, setResume] = useState('');
  const [questions, setQuestions] = useState<Array<{ question: string; reasoning: string; tips: string }>>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);
  const fullTranscriptRef = useRef('');

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const totalQuestions = questions.length;
  const isComplete = sessionStarted && currentQIndex >= totalQuestions && totalQuestions > 0;

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let currentSessionTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
         currentSessionTranscript += event.results[i][0].transcript;
      }
      
      const baseString = fullTranscriptRef.current ? fullTranscriptRef.current + ' ' : '';
      setTranscript(baseString + currentSessionTranscript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      if (typeof event.error === 'string' && ['not-allowed', 'audio-capture', 'network'].includes(event.error)) {
         manualStopRef.current = true;
         setIsListening(false);
      }
    };
    
    recognition.onend = () => {
      setTranscript(prev => {
         fullTranscriptRef.current = prev.trim();
         return prev;
      });

      if (!manualStopRef.current) {
        try { 
           setTimeout(() => { if (!manualStopRef.current) recognition.start() }, 100); 
        } catch(e) {}
      } else {
        setIsListening(false);
      }
    };
    
    manualStopRef.current = false;
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleStartSession = async () => {
    if (!selectedJobId || !resume.trim()) return;
    setIsGenerating(true);
    setSessionStarted(false);
    setCurrentQIndex(0);
    setSessionScore(0);
    const job = jobs.find(j => j.id === selectedJobId);
    const result = await generateInterviewQuestions(
      `${job?.role} at ${job?.companyName}`,
      resume
    ) as any;
    if (result.success && result.data?.questions) {
      setQuestions(result.data.questions);
      setSessionStarted(true);
      setAiEvaluation(null);
      setTranscript('');
      fullTranscriptRef.current = '';
      setTimeout(() => speakText(result.data.questions[0].question), 500);
    }
    setIsGenerating(false);
  };

  const handleNextQuestion = async () => {
    const nextIdx = currentQIndex + 1;
    
    // Evaluate the answer using real AI instead of length check
    if (transcript.trim().length > 0) {
      setIsEvaluating(true);
      const evalRes = await evaluateVoiceAnswer(questions[currentQIndex]?.question, transcript);
      setIsEvaluating(false);

      if (evalRes.success && evalRes.data) {
         // Add proportional score to session total
         const questionWeight = 100 / totalQuestions;
         const pointsEarned = (evalRes.data.score / 100) * questionWeight;
         setSessionScore(prev => Math.min(100, Math.round(prev + pointsEarned)));
         
         // Show specific feedback instead of static tips
         setAiEvaluation(evalRes.data);
      } else {
         setAiEvaluation({ feedback: questions[currentQIndex]?.tips || '' });
      }
    } else {
      setAiEvaluation({ feedback: questions[currentQIndex]?.tips || '' });
    }

    setCurrentQIndex(nextIdx);
    setTranscript('');
    fullTranscriptRef.current = '';
    
    if (nextIdx < totalQuestions) {
      setTimeout(() => speakText(questions[nextIdx].question), 1500);
    }
  };

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-6 overflow-y-auto font-display">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-indigo-600" />
          Voice Interview Chatbot
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Speak your answers aloud. The AI reads out each question using Text-to-Speech.</p>
      </div>

      {!sessionStarted ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Job to Prep For</label>
            <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600">
              <option value="">— Choose a job —</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.role} at {j.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Paste Your Resume</label>
            <textarea value={resume} onChange={e => setResume(e.target.value)} rows={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none"
              placeholder="Paste your resume text here..." />
          </div>
          <button onClick={handleStartSession} disabled={!selectedJobId || !resume.trim() || isGenerating}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-3 disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
            {isGenerating ? 'Generating Questions...' : 'Start Mock Interview Session'}
          </button>
        </div>
      ) : isComplete ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Session Complete!</h2>
          <div className="text-7xl font-black text-indigo-600">{sessionScore}%</div>
          <p className="text-slate-500 font-medium">Preparation Score based on {totalQuestions} questions answered.</p>
          <button onClick={() => { setSessionStarted(false); setQuestions([]); setCurrentQIndex(0); setSessionScore(0); }}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
            <RotateCcw className="w-5 h-5" /> Start New Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question Panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${(currentQIndex / totalQuestions) * 100}%` }} />
              </div>
              <span className="text-sm font-bold text-slate-500">Q{currentQIndex + 1}/{totalQuestions}</span>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Question {currentQIndex + 1}</span>
                <button onClick={() => speakText(currentQuestion?.question)}
                  className={`p-2 rounded-lg transition ${isSpeaking ? 'bg-indigo-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xl font-semibold leading-relaxed">{currentQuestion?.question}</p>
              <p className="text-indigo-300 text-sm mt-4 italic">{currentQuestion?.reasoning}</p>
            </div>

            {/* Voice Recorder */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Your Answer</h3>
                <button onClick={isListening ? stopListening : startListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  {isListening ? <><MicOff className="w-4 h-4" /> Stop Recording</> : <><Mic className="w-4 h-4" /> Start Recording</>}
                </button>
              </div>
              <div className={`min-h-[80px] p-4 rounded-xl text-sm font-medium leading-relaxed ${transcript ? 'bg-slate-50 text-slate-700 border border-slate-200' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'}`}>
                {transcript || 'Start speaking your answer... Your speech will appear here in real-time.'}
              </div>
              <button onClick={handleNextQuestion} disabled={isEvaluating}
                className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
                {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : currentQIndex + 1 >= totalQuestions ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {isEvaluating ? 'AI Grading Answer...' : currentQIndex + 1 >= totalQuestions ? 'Finish Session' : 'Next Question'}
              </button>
            </div>

            {aiEvaluation && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    AI Evaluation Score: {aiEvaluation.score ?? 0}/100
                  </h4>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h5 className="text-xs font-black uppercase text-slate-400 mb-2">Overall Feedback</h5>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{aiEvaluation.feedback}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiEvaluation.pros && aiEvaluation.pros.length > 0 && (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <h5 className="text-xs font-black uppercase text-emerald-600 mb-2">What you did well</h5>
                        <ul className="space-y-1">
                          {aiEvaluation.pros.map((p: string, i: number) => (
                            <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                              <span className="font-medium">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiEvaluation.cons && aiEvaluation.cons.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <h5 className="text-xs font-black uppercase text-amber-600 mb-2">Areas for Improvement</h5>
                        <ul className="space-y-1">
                          {aiEvaluation.cons.map((c: string, i: number) => (
                            <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span className="font-medium">{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {aiEvaluation.idealAnswer && (
                    <div className="bg-white rounded-xl p-5 border border-slate-200">
                      <h5 className="text-xs font-black uppercase text-indigo-500 mb-2">The Ideal Answer</h5>
                      <p className="text-sm text-slate-700 italic border-l-4 border-indigo-200 pl-4 py-1 leading-relaxed">"{aiEvaluation.idealAnswer}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Session Score</h3>
              <div className="text-5xl font-black text-indigo-600 mb-2">{sessionScore}%</div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${sessionScore}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium">Answer {totalQuestions} questions to complete your session.</p>
            </div>
            {/* Inline AI Coach Side Panel */}
            <div className="h-[450px]">
              <InterviewCoachChat 
                 contextData={`Target job: ${selectedJob?.role} at ${selectedJob?.companyName}. Current interview question the user is trying to answer: "${currentQuestion?.question}"`}
                 title="Live Mock Coach"
                 placeholder="Stuck on this question? Ask me for a hint!"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
