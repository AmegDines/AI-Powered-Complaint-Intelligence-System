import { useState } from 'react';
import Dashboard from './Dashboard';
import TicketForm from './TicketForm';

function App() {
  const [view, setView] = useState<'form' | 'dashboard'>('form');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/20 text-slate-900 font-sans">
      {/* Background radial glow */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50/20 to-transparent pointer-events-none"></div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 p-2.5 rounded-2xl shadow-md shadow-indigo-300/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">IntelliDesk</h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  AI v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Intelligent Complaint Routing & Resolution Platform</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
              <button
                onClick={() => setView('form')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  view === 'form'
                    ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Submit Ticket</span>
              </button>
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  view === 'dashboard'
                    ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Admin Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {view === 'form' ? <TicketForm /> : <Dashboard />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/60 py-6 text-center text-xs font-medium text-slate-400">
        <p>IntelliDesk Helpdesk Platform • Powered by Scikit-Learn NLP & FastAPI</p>
      </footer>
    </div>
  );
}

export default App;
