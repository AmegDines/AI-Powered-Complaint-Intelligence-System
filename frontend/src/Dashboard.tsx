import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch('http://localhost:8000/tickets/')
      .then(res => res.json())
      .then(data => setTickets(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Admin Dashboard</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">ID</th>
              <th className="px-6 py-3 font-medium text-gray-500">Title</th>
              <th className="px-6 py-3 font-medium text-gray-500">Category</th>
              <th className="px-6 py-3 font-medium text-gray-500">Department</th>
              <th className="px-6 py-3 font-medium text-gray-500">Priority</th>
              <th className="px-6 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{t.id}</td>
                <td className="px-6 py-4">{t.title}</td>
                <td className="px-6 py-4">{t.predicted_category} <span className="text-xs text-gray-400">({(t.confidence*100).toFixed(0)}%)</span></td>
                <td className="px-6 py-4">{t.department}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${t.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {t.priority}
                  </span>
                </td>
                <td className="px-6 py-4">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
