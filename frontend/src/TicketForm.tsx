import React, { useState } from 'react';

export default function TicketForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/tickets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();
      setMessage(`Ticket created! Assigned to ${data.department} with priority ${data.priority}.`);
      setTitle('');
      setDescription('');
    } catch (err) {
      setMessage('Error creating ticket.');
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Submit a Ticket</h2>
      {message && <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">{message}</div>}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required 
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Description</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 border rounded h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Submit Ticket
        </button>
      </form>
    </div>
  );
}
