'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { sendChatMessage, ChatMessage } from '@/actions/aiActions';
import ReactMarkdown from 'react-markdown';

export function InterviewCoachChat({ 
  contextData, 
  title = "AI Interview Coach", 
  placeholder = "Stuck? Ask the coach for a hint!" 
}: { 
  contextData: string; 
  title?: string;
  placeholder?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hi! I'm your AI Interview Coach. I'm actively analyzing our session. Ask me anything if you get stuck or need pointers!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    const systemContext = `
      You are an expert, encouraging AI Interview Coach helping a candidate actively prep.
      You must keep your replies concise (under 3 sentences when possible). No fluff.
      
      CRITICAL CONTEXT ABOUT THE ACTIVE INTERVIEW SESSION:
      ${contextData}
    `;

    const res = await sendChatMessage(newMessages, systemContext);
    
    if (res.success && res.text) {
      setMessages([...newMessages, { role: 'model', text: res.text }]);
    } else {
      setMessages([...newMessages, { role: 'model', text: "Sorry, I'm having trouble analyzing the context right now. Please try again." }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex items-center justify-between">
        <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          {title}
        </h3>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[250px] max-h-[400px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-[13px] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
              <div className="prose prose-sm prose-p:leading-relaxed max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-600 disabled:opacity-50 hover:bg-slate-200 rounded transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
