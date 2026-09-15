import React, { useState } from 'react';
import Dashboard from './Dashboard';
import TicketForm from './TicketForm';

function App() {
  const [view, setView] = useState<'form' | 'dashboard'>('form');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 p-4 text-white shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Helpdesk Platform</h1>
        <div>
          <button 
            onClick={() => setView('form')}
            className={`mr-4 px-3 py-1 rounded ${view === 'form' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
          >
            Submit Ticket
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`px-3 py-1 rounded ${view === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
          >
            Admin Dashboard
          </button>
        </div>
      </nav>
      <main className="p-4">
        {view === 'form' ? <TicketForm /> : <Dashboard />}
      </main>
    </div>
  );
}

export default App;
