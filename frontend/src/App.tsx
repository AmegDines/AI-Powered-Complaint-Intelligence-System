import { useState } from 'react';
import Dashboard from './Dashboard';
import TicketForm from './TicketForm';

function App() {
  const [view, setView] = useState<'form' | 'dashboard'>('form');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-slate-50 to-slate-50"></div>
      
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">IntelliDesk</h1>
          </div>
          <div className="flex gap-1.5 bg-slate-200/50 p-1.5 rounded-xl border border-slate-200/50">
            <button 
              onClick={() => setView('form')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${view === 'form' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              Submit Ticket
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6 lg:p-8 pt-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {view === 'form' ? <TicketForm /> : <Dashboard />}
        </div>
      </main>
    </div>
  );
}

export default App;
