'use client';

import { X, FileText, Download, Mail, Phone, Archive } from 'lucide-react';

interface JobDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string;
}

export default function JobDetailDrawer({ isOpen, onClose, jobId }: JobDetailDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-md md:max-w-lg bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300 font-display text-slate-900">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
                Active Application
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Senior Product Designer</h1>
              <p className="text-slate-500 text-sm">Design Systems Team • New York, NY</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
            >
              <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
            </button>
          </div>

          {/* Status Timeline */}
          <div className="mt-8">
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
              <span className="text-indigo-600">Applied</span>
              <span className="text-indigo-600">Screening</span>
              <span className="text-indigo-600">Interview</span>
              <span>Offer</span>
            </div>
            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full" style={{ width: '75%' }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-[0%] w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-[33%] w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-[66%] w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-[100%] w-3 h-3 bg-slate-300 rounded-full border-2 border-white"></div>
            </div>
            <p className="mt-3 text-xs text-slate-500 italic">
              Next step: Final Interview with VP of Product (Scheduled Oct 28)
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
          
          {/* Notes Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-indigo-600 w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Notes Section</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="prose prose-sm">
                <p className="text-sm leading-relaxed text-slate-600">
                  The company culture seems heavily focused on <strong className="text-indigo-600">asynchronous communication</strong> and radical transparency. During the initial screening, the recruiter emphasized that they value design systems thinking over individual &quot;hero&quot; features.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 list-disc pl-4">
                  <li>Values work-life harmony</li>
                  <li>Strong focus on user-centric KPIs</li>
                  <li>Weekly design crits on Thursdays</li>
                </ul>
              </div>
              <button className="mt-4 text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline">
                Edit Notes
              </button>
            </div>
          </section>

          {/* Document Association */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-indigo-600 w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Document Association</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-600/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 flex items-center justify-center rounded-lg">
                    <span className="text-red-500 font-bold text-xs">PDF</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Resume_v4.pdf</p>
                    <p className="text-xs text-slate-500">2.4 MB • Updated 2 days ago</p>
                  </div>
                </div>
                <Download className="text-slate-400 w-5 h-5 group-hover:text-indigo-600 transition-colors" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-600/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 flex items-center justify-center rounded-lg">
                    <span className="text-red-500 font-bold text-xs">PDF</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Cover_Letter_Tailored.pdf</p>
                    <p className="text-xs text-slate-500">1.1 MB • Tailored for SaaS</p>
                  </div>
                </div>
                <Download className="text-slate-400 w-5 h-5 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-indigo-600 w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Contact Info</h3>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  alt="Portrait of Hiring Manager" 
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-200" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrxEVbCIOcduoUYknYRaC4oOjnMsb6quuYlGA4H2WX3bGjMMAjq4VZHrMpi7CHWX3F7SExTLdYE85yOvlLaDV2Gn94YIgwGjzkAnR-BWznlozLH_Iv2UqgvkHAYiDUxrJckt48rfz7508bi3Pvon1mSfG7mZMkOugyO63ms17eCg4DHW9vy5-EpY2bgpQaUpOnLgD21440qJIPxc_WSkjSqqZsleYmDP4HKuN3B4dneNfTp-T42fKhPm3ZZeuw5_jaxStqMmwRUsVJ" 
                />
                <div>
                  <p className="text-sm text-slate-500 font-medium">Hiring Manager</p>
                  <h4 className="text-lg font-bold text-slate-900 leading-tight">Marcus Sterling</h4>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white flex items-center justify-center rounded-lg border border-slate-200">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">m.sterling@enterprise-saas.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white flex items-center justify-center rounded-lg border border-slate-200">
                    <Phone className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">+1 (555) 012-3456</span>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]">
            Schedule Interview
          </button>
          <button className="p-3 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
            <Archive className="w-6 h-6 text-slate-500" />
          </button>
        </div>
      </aside>
    </>
  );
}
