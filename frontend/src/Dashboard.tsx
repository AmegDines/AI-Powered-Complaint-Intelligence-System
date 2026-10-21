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
    setLoading(true);
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
          className={`fixed top-24 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transition-all transform animate-in slide-in-from-top-4 duration-300 ${
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
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header and Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Intelligence Console</h2>
          <p className="text-slate-500 mt-1 text-sm sm:text-base font-medium">
            Real-time automated ticket categorization, departmental routing, and resolution status.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{tickets.length}</p>
          </div>
        </div>

        {/* Not Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-white to-amber-50/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Not Resolved
            </p>
            <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{notResolvedCount}</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Resolved
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{resolvedCount}</p>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white via-white to-rose-50/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">High Priority</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-0.5">{highPriorityCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="inline-flex bg-slate-200/70 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setFilterTab('NOT_RESOLVED')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
        <div className="relative min-w-[280px]">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
            placeholder="Search by ID, title, or category..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-2xs font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tickets Table Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-base text-slate-700">Loading tickets from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 text-xs uppercase font-extrabold tracking-wider">
                  <th className="px-6 py-4.5">Ticket</th>
                  <th className="px-6 py-4.5">Issue Details</th>
                  <th className="px-6 py-4.5">AI Classification</th>
                  <th className="px-6 py-4.5">Department</th>
                  <th className="px-6 py-4.5">Priority</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Tag Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base">No Tickets Found</h4>
                        <p className="text-slate-400 text-xs mt-1">
                          {tickets.length === 0
                            ? 'There are currently no tickets logged in the database.'
                            : 'No tickets matched your current filter criteria.'}
                        </p>
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
                        className={`transition-colors duration-150 ${
                          resolved ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Ticket ID */}
                        <td className="px-6 py-4.5 font-bold text-slate-400">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700 border border-slate-200">
                            #{t.id}
                          </span>
                        </td>

                        {/* Title & Desc */}
                        <td className="px-6 py-4.5 max-w-xs sm:max-w-sm">
                          <div className={`font-bold text-sm ${resolved ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
                            {t.title}
                          </div>
                          {t.description && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1 truncate">
                              {t.description}
                            </div>
                          )}
                        </td>

                        {/* AI Classification */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shadow-2xs">
                              <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              <span>{t.predicted_category || 'General'}</span>
                            </span>
                            {t.confidence ? (
                              <span className="text-[11px] font-bold text-slate-400">
                                {(t.confidence * 100).toFixed(0)}%
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4.5 text-xs font-bold text-slate-700">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{t.department}</span>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border shadow-2xs ${
                              t.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                t.priority === 'HIGH' ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            ></span>
                            <span>{t.priority}</span>
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4.5">
                          {resolved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Resolved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Not Resolved</span>
                            </span>
                          )}
                        </td>

                        {/* Resolution Tagging Button */}
                        <td className="px-6 py-4.5 text-right">
                          {resolved ? (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'Not Resolved')}
                              disabled={isUpdating}
                              title="Re-open ticket as Not Resolved"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
                            >
                              {isUpdating ? (
                                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
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
                              title="Tag ticket as Resolved"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm shadow-emerald-200"
                            >
                              {isUpdating ? (
                                <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
