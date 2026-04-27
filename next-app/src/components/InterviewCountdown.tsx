'use client';

import { useState, useEffect } from 'react';

export function InterviewCountdown({ targetDate }: { targetDate: string | Date }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, expired: boolean }>({ hours: 0, minutes: 0, expired: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, expired: true });
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24;
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ hours, minutes, expired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // update every minute

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) return <span className="text-sm font-medium tracking-wide">Loading...</span>;

  if (timeLeft.expired) {
    return <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Started / Ended</span>;
  }

  const isUrgent = timeLeft.hours < 2 && !timeLeft.expired;

  return (
    <div className={`flex items-center gap-1.5 font-bold ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
      <span className="text-xs uppercase tracking-widest opacity-70">Starts in: </span>
      <span className="text-lg tracking-tight bg-white/50 px-2 py-0.5 rounded border border-current">{String(timeLeft.hours).padStart(2, '0')}h</span>
      <span className="text-lg tracking-tight bg-white/50 px-2 py-0.5 rounded border border-current">{String(timeLeft.minutes).padStart(2, '0')}m</span>
    </div>
  );
}
