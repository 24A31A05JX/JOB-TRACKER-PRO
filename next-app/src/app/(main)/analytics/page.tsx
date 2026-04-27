"use client"
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, RadialBarChart, RadialBar, PolarAngleAxis,
  LineChart, Line, CartesianGrid, PieChart, Pie
} from 'recharts';
import { useAppStore } from '@/store/useAppStore'; 
import { useAuth } from '@/components/AuthProvider';
import { Activity, Target, AlertTriangle, MessageSquare } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';

export default function AnalyticsPage() {
  const { jobs, fetchJobs, isLoading } = useAppStore();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchJobs();
    }
    setIsMounted(true);
  }, [fetchJobs, user?.uid]);

  if (!isMounted) return null;

  // KPIs
  const totalApplications = jobs.length;
  const responses = jobs.filter(j => ['INTERVIEW', 'OFFER', 'REJECTED'].includes(j.status)).length;
  const responseRate = totalApplications ? Math.round((responses / totalApplications) * 100) : 0;

  const interviews = jobs.filter(j => ['INTERVIEW', 'OFFER'].includes(j.status)).length;
  const interviewRate = totalApplications ? Math.round((interviews / totalApplications) * 100) : 0;

  const now = new Date();
  const ghosted = jobs.filter(j => {
    if (j.status !== 'APPLIED') return false;
    const appliedDate = new Date(j.appliedDate || now.getTime());
    const diffTime = Math.abs(now.getTime() - appliedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 30;
  }).length;
  const ghostingRate = totalApplications ? Math.round((ghosted / totalApplications) * 100) : 0;

  // Pipeline Funnel Data
  const funnelData = [
    { name: 'Applied', value: totalApplications || 1, fill: '#6366f1' },
    { name: 'Screen/Respond', value: responses, fill: '#3b82f6' },
    { name: 'Interviews', value: interviews, fill: '#8b5cf6' },
    { name: 'Offers', value: jobs.filter(j => j.status === 'OFFER').length, fill: '#10b981' },
  ];

  // Velocity timeline Data
  const timelineDataMap = new Map();
  jobs.forEach(j => {
    if (!j.appliedDate) return;
    const dateStr = new Date(j.appliedDate).toISOString().split('T')[0];
    const count = timelineDataMap.get(dateStr) || 0;
    timelineDataMap.set(dateStr, count + 1);
  });
  const timelineData = Array.from(timelineDataMap, ([date, count]) => ({ date, count }))
    .sort((a,b) => a.date.localeCompare(b.date));

  // Source/Platform Effectiveness Data
  const sourceMap = new Map();
  jobs.forEach(j => {
    if (!j.jobUrl) {
      sourceMap.set('Direct/Manual', (sourceMap.get('Direct/Manual') || 0) + 1);
      return;
    }
    try {
      let hostname = new URL(j.jobUrl).hostname;
      hostname = hostname.replace('www.', '').split('.')[0];
      sourceMap.set(hostname, (sourceMap.get(hostname) || 0) + 1);
    } catch (e) {
      sourceMap.set('Direct/Manual', (sourceMap.get('Direct/Manual') || 0) + 1);
    }
  });
  
  const COLORS = ['#6366f1', '#10b981', '#f50b0bff', '#ec4899', '#8b5cf6'];
  const sourceData = Array.from(sourceMap, ([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="p-8 space-y-8 bg-[#030712] min-h-screen text-slate-200 flex-1 overflow-y-auto font-display">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Analytics Dashboard</h1>
          <p className="text-slate-400">Track your job hunt velocity, funnels, and performance bottlenecks.</p>
        </div>
        <div className="px-4 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-sm text-indigo-400 font-bold backdrop-blur-sm">
          Live Real-Time Sync
        </div>
      </div>

      {/* 1. Core KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400"/> Total Applications</p>
          <p className="text-4xl font-extrabold text-white">{totalApplications}</p>
        </div>
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-400"/> Response Rate</p>
          <p className="text-4xl font-extrabold text-white">{responseRate}%</p>
        </div>
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-400"/> Interview Rate</p>
          <p className="text-4xl font-extrabold text-white">{interviewRate}%</p>
        </div>
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400"/> Ghosting Rate</p>
          <p className="text-4xl font-extrabold text-white">{ghostingRate}%</p>
          <p className="text-xs text-rose-400/80 mt-1">&gt;30 days w/ no response</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. THE FUNNEL CHART */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h2 className="text-lg font-bold mb-6 text-white border-b border-slate-800 pb-4">Job Hunt Funnel</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={13} width={100} fontWeight={600} />
                <Tooltip 
                  cursor={{fill: '#1e293b50'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" barSize={35} radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. PLATFORM EFFECTIVENESS */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h2 className="text-lg font-bold mb-6 text-white border-b border-slate-800 pb-4">Top Sourcing Platforms</h2>
          <div className="h-[300px] w-full flex items-center">
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">No URL data available</div>
            )}
          </div>
        </div>

        {/* 4. VELOCITY CHART */}
        <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h2 className="text-lg font-bold mb-6 text-white border-b border-slate-800 pb-4">Application Velocity Over Time</h2>
          <div className="h-[250px] w-full">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">Add applications to see velocity tracking.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
