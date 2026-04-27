'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { format } from 'date-fns';
import { FileText, Search, Filter, Briefcase, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function HistoryPage() {
  const { jobs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = 
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        job.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || job.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
  }, [jobs, searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED': return <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">Applied</span>;
      case 'INTERVIEW': return <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded">Interviewing</span>;
      case 'OFFER': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">Offer</span>;
      case 'REJECTED': return <span className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded">Rejected</span>;
      case 'WISHLIST': return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">Wishlist</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-6 overflow-y-auto font-display">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          Application History
        </h1>
        <p className="text-slate-500 mt-1 font-medium">A centralized log of every application, timeline, and status you submitted.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search company or role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex items-center w-full md:w-auto overflow-x-auto gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mx-2" />
          {['ALL', 'WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'].map(s => (
             <button key={s} onClick={() => setFilterStatus(s)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
               {s === 'ALL' ? 'All Roles' : s}
             </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Company</th>
                <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Role</th>
                <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Status</th>
                <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Applied Date</th>
                <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider bg-indigo-50/50">Interview Rounds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredJobs.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No applications found matching your criteria.</td>
                 </tr>
              ) : (
                filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                       {job.logoUrl ? <img src={job.logoUrl} className="w-6 h-6 rounded border border-slate-200" alt=""/> : <Briefcase className="w-5 h-5 text-slate-400"/>}
                       {job.companyName}
                    </td>
                    <td className="p-4 text-slate-700 font-medium truncate max-w-[200px]">{job.role}</td>
                    <td className="p-4">{getStatusBadge(job.status)}</td>
                    <td className="p-4 text-slate-500 flex items-center gap-2 font-medium">
                      <Calendar className="w-3.5 h-3.5" /> 
                      {job.appliedDate ? format(new Date(job.appliedDate), 'MMM d, yyyy') : 'Unknown'}
                    </td>
                    <td className="p-4 min-w-[250px] bg-indigo-50/10">
                      {job.interviews && job.interviews.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {job.interviews.map(inv => (
                            <div key={inv.id} className="text-xs flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-2 py-1.5 rounded-lg shadow-sm">
                              {inv.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> : <Calendar className="w-3.5 h-3.5 text-amber-500"/>}
                              <span className="font-bold">{inv.type}</span> — {format(new Date(inv.interviewDate), 'MMM d')}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No rounds scheduled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
