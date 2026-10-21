import { useEffect, useState } from 'react';

interface Ticket {
  id: number;
  title: string;
  description?: string;
  predicted_category: string;
  department: string;
  priority: string;
  status: string;
  confidence: number;
  created_at?: string;
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'NOT_RESOLVED' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTickets = () => {
    fetch('/api/tickets/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tickets');
        return res.json();
      })
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const isResolved = (status: string) => {
    return status?.toLowerCase() === 'resolved';
  };

  const handleUpdateStatus = async (ticketId: number, targetStatus: 'Resolved' | 'Not Resolved') => {
    setUpdatingId(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });

      if (!res.ok) {
        throw new Error(`Failed to update status (${res.status})`);
      }

      const updatedTicket: Ticket = await res.json();

      setTickets(prev =>
        prev.map(t => (t.id === ticketId ? { ...t, status: updatedTicket.status } : t))
      );

      setNotification({
        message: `Ticket #${ticketId} tagged as "${targetStatus}"`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error(err);
      setNotification({
        message: `Error updating Ticket #${ticketId}. Please try again.`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const resolvedCount = tickets.filter(t => isResolved(t.status)).length;
  const notResolvedCount = tickets.length - resolvedCount;
  const highPriorityCount = tickets.filter(t => t.priority === 'HIGH').length;

  const filteredTickets = tickets.filter(t => {
    const resolved = isResolved(t.status);
    if (filterTab === 'RESOLVED' && !resolved) return false;
    if (filterTab === 'NOT_RESOLVED' && resolved) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchCat = (t.predicted_category || '').toLowerCase().includes(q);
      const matchDept = (t.department || '').toLowerCase().includes(q);
      const matchId = String(t.id).includes(q);
      return matchTitle || matchCat || matchDept || matchId;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 transition-all transform animate-in slide-in-from-top-4 duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-200/50'
              : 'bg-rose-600 text-white shadow-rose-200/50'
          }`}
        >
          {notification.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Dashboard</h2>
          <p className="text-slate-500 mt-1.5 text-base">
            Manage, classify, and tag support tickets across departments.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start min-w-[130px]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-extrabold text-slate-800">{tickets.length}</p>
          </div>
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm flex flex-col items-start min-w-[130px]">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Not Resolved
            </p>
            <p className="text-2xl font-extrabold text-amber-700">{notResolvedCount}</p>
          </div>
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm flex flex-col items-start min-w-[130px]">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Resolved
            </p>
            <p className="text-2xl font-extrabold text-emerald-700">{resolvedCount}</p>
          </div>
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-sm flex flex-col items-start min-w-[130px]">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">High Priority</p>
            <p className="text-2xl font-extrabold text-rose-600">{highPriorityCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="inline-flex bg-slate-200/60 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'ALL'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setFilterTab('NOT_RESOLVED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'NOT_RESOLVED'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Not Resolved ({notResolvedCount})
          </button>
          <button
            onClick={() => setFilterTab('RESOLVED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'RESOLVED'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden relative">
        {loading ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="font-medium text-lg">Loading tickets...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/90 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-xs">ID</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-xs">Issue Title</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-xs">AI Category</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-xs">Department</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-xs">Priority</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-xs">Status</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-xs text-right">Tag / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-16 text-center text-slate-500 text-base">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <span className="font-medium">
                          {tickets.length === 0
                            ? 'No tickets found in the system.'
                            : 'No tickets match the selected filter.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map(t => {
                    const resolved = isResolved(t.status);
                    const isUpdating = updatingId === t.id;

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors group ${
                          resolved ? 'bg-slate-50/40 hover:bg-slate-50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* ID */}
                        <td className="px-6 py-4 font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                          #{t.id}
                        </td>

                        {/* Title */}
                        <td className="px-6 py-4">
                          <span className={`font-semibold text-base ${resolved ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-800'}`}>
                            {t.title}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold text-xs border border-indigo-100/60">
                              {t.predicted_category || 'General'}
                            </span>
                            {t.confidence ? (
                              <div
                                className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 text-xs font-bold"
                                title={`Confidence: ${(t.confidence * 100).toFixed(0)}%`}
                              >
                                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span>{(t.confidence * 100).toFixed(0)}%</span>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4 text-slate-600 font-semibold">{t.department}</td>

                        {/* Priority */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border ${
                              t.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/60 shadow-sm shadow-rose-100/50'
                                : 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.priority === 'HIGH'
                                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                  : 'bg-slate-400'
                              }`}
                            ></span>
                            {t.priority}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {resolved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-sm">
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Resolved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Not Resolved</span>
                            </span>
                          )}
                        </td>

                        {/* Tagging Action Button */}
                        <td className="px-6 py-4 text-right">
                          {resolved ? (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'Not Resolved')}
                              disabled={isUpdating}
                              title="Re-open ticket as Not Resolved"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {isUpdating ? (
                                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                              <span>Mark Not Resolved</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'Resolved')}
                              disabled={isUpdating}
                              title="Mark ticket as Resolved"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all shadow-sm shadow-emerald-200/60 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {isUpdating ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              <span>Mark Resolved</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
