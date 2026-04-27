'use client';

import { useState, useEffect, useRef } from 'react';
import { generateInterviewQuestions, evaluateVoiceAnswer } from '@/actions/aiActions';
import { useAppStore } from '@/store/useAppStore';
import { useUserMedia } from '@/hooks/useUserMedia';
import { Mic, MicOff, VideoOff, BrainCircuit, ChevronRight, RotateCcw, Loader2, CheckCircle2, AlertCircle, Video } from 'lucide-react';
import { InterviewCoachChat } from '@/components/InterviewCoachChat';

// Types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VideoMockInterviewPage() {
  const { jobs } = useAppStore();
  const { stream, error, isInitializing } = useUserMedia();
  
  const videoCallbackRef = (node: HTMLVideoElement | null) => {
    if (node && stream) {
      node.srcObject = stream;
    }
  };

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
  const [sessionHistory, setSessionHistory] = useState<{ question: string; transcript: string; feedback: string; score: number; videoUrl: string }[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const manualStopRef = useRef(false);
  const fullTranscriptRef = useRef('');
  const isSpeakingRef = useRef(false); // Ref for echo cancellation

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const totalQuestions = questions.length;
  const isComplete = sessionStarted && currentQIndex >= totalQuestions && totalQuestions > 0;

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // kill anything matching
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Doraemon Persona Tuning 🐱🤖
    utterance.pitch = 1.8;
    utterance.rate = 1.15;
    
    utterance.onstart = () => {
       setIsSpeaking(true);
       isSpeakingRef.current = true;
       // Stop listening to avoid echoing AI's voice
       if (isListening) stopListening();
    };
    
    utterance.onend = () => {
       setIsSpeaking(false);
       isSpeakingRef.current = false;
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    // Prevent starting if AI is speaking (echo cancellation)
    if (isSpeakingRef.current) return;

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
      // Echo cancellation check
      if (isSpeakingRef.current) return;

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

      if (!manualStopRef.current && !isSpeakingRef.current) {
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

    // Start recording video blob natively
    if (stream) {
      recordedChunks.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    }
  };

  const stopListening = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setIsListening(false);
  };

  const handleStartSession = async () => {
    if (!selectedJobId || !resume.trim() || error) return;
    setIsGenerating(true);
    setSessionStarted(false);
    setCurrentQIndex(0);
    setSessionScore(0);
    const job = jobs.find(j => j.id === selectedJobId);
    
    const result = await generateInterviewQuestions(`${job?.role} at ${job?.companyName}`, resume) as any;
    
    if (result.success && result.data?.questions) {
      setQuestions(result.data.questions);
      setSessionStarted(true);
      setSessionHistory([]);
      setAiEvaluation(null);
      setTranscript('');
      fullTranscriptRef.current = '';
      setTimeout(() => speakText(result.data.questions[0].question), 1000);
    }
    setIsGenerating(false);
  };

  const handleNextQuestion = async () => {
    const nextIdx = currentQIndex + 1;
    
    if (transcript.trim().length > 0) {
      setIsEvaluating(true);
      // Wait for AI to grade it
      const evalRes = await evaluateVoiceAnswer(questions[currentQIndex]?.question, transcript);
      setIsEvaluating(false);

      if (evalRes.success && evalRes.data) {
         const pointsEarned = (evalRes.data.score / 100) * (100 / totalQuestions);
         setSessionScore(prev => Math.min(100, Math.round(prev + pointsEarned)));
         setAiEvaluation(evalRes.data);
         
         const videoBlob = new Blob(recordedChunks.current, { type: 'video/webm' });
         const videoUrl = URL.createObjectURL(videoBlob);
         setSessionHistory(prev => [...prev, {
             question: questions[currentQIndex]?.question,
             videoUrl,
             transcript,
             score: evalRes.data.score || 0,
             feedback: evalRes.data.feedback || ''
         }]);
         
      } else {
         setAiEvaluation({ feedback: questions[currentQIndex]?.tips || '' });
      }
    } else {
      setAiEvaluation({ feedback: "No answer detected." });
    }

    recordedChunks.current = [];
    setCurrentQIndex(nextIdx);
    setTranscript('');
    fullTranscriptRef.current = '';
    
    if (nextIdx < totalQuestions) {
      setTimeout(() => speakText(questions[nextIdx].question), 2500); // Wait longer so user can read feedback
    }
  };

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-6 overflow-y-auto font-display">
      
      {/* Session Complete State: Video Gallery Review */}
      {sessionStarted && isComplete && (
        <div className="space-y-8 animate-in fade-in pb-12">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Video Session Complete!</h2>
            <div className="text-6xl font-black text-indigo-600">{sessionScore}%</div>
            <p className="text-slate-500 font-medium">overall performance across {totalQuestions} video answers.</p>
            <button onClick={() => { setSessionStarted(false); setQuestions([]); setCurrentQIndex(0); setSessionScore(0); setSessionHistory([]); }}
              className="px-8 py-3 mt-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Start New Session
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">Your Video Review Gallery</h3>
            {sessionHistory.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2">
                <div className="bg-black relative aspect-video md:aspect-auto">
                   <video src={item.videoUrl} controls playsInline className="w-full h-full object-contain" />
                </div>
                <div className="p-6 flex flex-col gap-4 bg-slate-50">
                   <div>
                     <span className="text-xs font-black uppercase text-indigo-500 mb-1 block">Question {idx + 1}</span>
                     <p className="font-bold text-slate-900">{item.question}</p>
                   </div>
                   <div className="flex-1">
                     <span className="text-xs font-bold text-slate-400 mb-1 block">Your Transcript</span>
                     <p className="text-sm font-medium text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">"{item.transcript}"</p>
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-xs font-bold text-emerald-600 block">AI Evaluation</span>
                       <span className="text-sm font-black text-emerald-700">{item.score}/100</span>
                     </div>
                     <p className="text-sm font-semibold text-emerald-800 bg-emerald-100/50 p-3 rounded-lg leading-relaxed">
                       {item.feedback}
                     </p>
                   </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Lobby State */}
      {!sessionStarted && !isComplete && (
        <div className="max-w-3xl mx-auto w-full">
           <div className="text-center mb-8">
             <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <Video className="w-8 h-8 text-indigo-600" />
             </div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Face-to-Face Video Mock</h1>
             <p className="text-slate-500 font-medium">Practice your body language, eye contact, and spoken delivery in a simulated video call environment.</p>
           </div>
           
           <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
             {/* Camera Preview */}
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Camera Preview</label>
               <div className="bg-black aspect-video rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
                 {isInitializing ? (
                   <Loader2 className="w-8 h-8 text-white animate-spin" />
                 ) : error ? (
                   <div className="text-center text-rose-400 p-4">
                     <VideoOff className="w-8 h-8 mx-auto mb-2" />
                     <p className="text-sm font-bold">{error}</p>
                   </div>
                 ) : (
                   <video ref={videoCallbackRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                 )}
               </div>
             </div>

             <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Target Job</label>
                  <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600">
                    <option value="">— Choose a job —</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.role} at {j.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Paste Your Resume</label>
                  <textarea value={resume} onChange={e => setResume(e.target.value)} rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none"
                    placeholder="Paste your resume text here..." />
                </div>
             </div>
             
             <button onClick={handleStartSession} disabled={!selectedJobId || !resume.trim() || isGenerating || !!error}
               className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-3 disabled:opacity-50">
               {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
               {isGenerating ? 'Structuring Interview...' : 'Join Video Interview'}
             </button>
           </div>
        </div>
      )}

      {/* Active Session State */}
      {sessionStarted && !isComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
          
          {/* Main Video Panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
             
             {/* Center AI Indicator & Video Canvas */}
             <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-800 aspect-video flex items-center justify-center">
               {/* Center AI Pulsating Indicator - Doraemon Persona */}
               <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                 <div className={`relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 transition-all ${isSpeaking ? 'scale-110 shadow-[0_0_40px_rgba(99,102,241,0.6)]' : ''}`}>
                    {isSpeaking && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-indigo-500/40"></span>
                    )}
                    <span className="text-3xl z-10 select-none">😺</span>
                 </div>
                 <span className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-300 drop-shadow-md">
                   {isSpeaking ? 'Recruiter Speaking...' : isListening ? 'Listening' : 'Recruiter Standby'}
                 </span>
               </div>

               {/* Live Camera Feed */}
               <video ref={videoCallbackRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
             </div>
             
             {/* Unobstructed Lower Thirds: Active Question & Transcript */}
             <div className="flex flex-col gap-4">
                
                {/* The Generated Question */}
                <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-2">Question {currentQIndex + 1} of {totalQuestions}</span>
                  <p className="text-lg font-semibold leading-relaxed text-white">{currentQuestion?.question}</p>
                </div>

                {/* User's Transcript & Control */}
                <div className="flex gap-4 items-stretch">
                   <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 text-slate-700 text-sm font-medium leading-relaxed min-h-[80px] shadow-sm">
                     {transcript ? `"${transcript}"` : <span className="italic text-slate-400">Your live speech will be transcribed here. Click the mic to begin recording your answer...</span>}
                   </div>

                   <button onClick={isListening ? stopListening : startListening} disabled={isSpeaking}
                     className={`shrink-0 flex items-center justify-center w-20 rounded-2xl transition-all shadow-md disabled:opacity-50 ${isListening ? 'bg-rose-500 hover:bg-rose-600 animate-pulse text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                     {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                   </button>
                </div>
             </div>
          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col gap-6 h-full overflow-y-auto">
             
             {/* Progress Box */}
             <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm shrink-0">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800">Next Step</h3>
                 <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">({currentQIndex + 1}/{totalQuestions})</span>
               </div>
               <button onClick={handleNextQuestion} disabled={isEvaluating || isSpeaking || isListening}
                 className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-30">
                 {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : currentQIndex + 1 >= totalQuestions ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                 {isEvaluating ? 'AI Grading...' : currentQIndex + 1 >= totalQuestions ? 'Finish Simulation' : 'Submit & Next'}
               </button>
             </div>

             {/* Previous AI Evaluation Box */}
             {aiEvaluation && (
               <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm shrink-0">
                 <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-3">
                   <BrainCircuit className="w-5 h-5 text-indigo-600" />
                   Last Response Graded
                 </h4>
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">Score</span>
                     <span className="text-lg font-black text-indigo-700">{aiEvaluation.score ?? 0}/100</span>
                   </div>
                   {aiEvaluation.feedback && (
                     <p className="text-sm text-indigo-900 bg-white/50 p-3 rounded-lg border border-indigo-100 font-medium leading-relaxed">
                       {aiEvaluation.feedback}
                     </p>
                   )}
                 </div>
               </div>
             )}

             {/* Live Coach */}
             <div className="flex-1 min-h-[300px]">
               <InterviewCoachChat 
                  contextData={`Target job: ${selectedJob?.role}. Current interview question: "${currentQuestion?.question}"`}
                  title="Technical Coach"
                  placeholder="Need a hint? Ask here."
               />
             </div>

          </div>
        </div>
      )}
    </div>
  );
}
