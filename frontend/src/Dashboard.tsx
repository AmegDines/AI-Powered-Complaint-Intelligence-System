import { useEffect, useState } from 'react';

interface Ticket {
  id: number;
  title: string;
  predicted_category: string;
  department: string;
  priority: string;
  status: string;
  confidence: number;
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/tickets/')
      .then(res => res.json())
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const highPriorityCount = tickets.filter(t => t.priority === 'HIGH').length;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Admin Dashboard</h2>
          <p className="text-slate-500 mt-1.5 text-lg">Overview of all AI-routed support tickets.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 flex flex-col items-start min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tickets</p>
            <p className="text-3xl font-extrabold text-slate-800">{tickets.length}</p>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 flex flex-col items-start min-w-[140px]">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">High Priority</p>
            <p className="text-3xl font-extrabold text-rose-600">{highPriorityCount}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden relative">
        {loading ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center justify-center">
             <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
             <p className="font-medium text-lg">Loading tickets...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-8 py-5 font-bold tracking-wide uppercase text-xs">Ticket ID</th>
                  <th className="px-6 py-5 font-bold tracking-wide uppercase text-xs">Issue Title</th>
                  <th className="px-6 py-5 font-bold tracking-wide uppercase text-xs">AI Classification</th>
                  <th className="px-6 py-5 font-bold tracking-wide uppercase text-xs">Routed To</th>
                  <th className="px-6 py-5 font-bold tracking-wide uppercase text-xs">Priority</th>
                  <th className="px-8 py-5 font-bold tracking-wide uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-slate-500 text-base">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <span className="font-medium">No tickets found in the system.</span>
                      </div>
                    </td>
                  </tr>
                ) : tickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5 font-bold text-slate-400 group-hover:text-slate-600 transition-colors">#{t.id}</td>
                    <td className="px-6 py-5 font-semibold text-slate-800 text-base">{t.title}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold text-xs border border-indigo-100/50">
                          {t.predicted_category}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title={`Confidence: ${(t.confidence*100).toFixed(0)}%`}>
                           <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                           <span className="text-xs font-bold">{(t.confidence*100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600 font-semibold">{t.department}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 border ${
                        t.priority === 'HIGH' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200/60 shadow-sm shadow-rose-100/50' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-sm shadow-emerald-100/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.priority === 'HIGH' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-emerald-500'}`}></span>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="capitalize">{t.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
