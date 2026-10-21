import React, { useState } from 'react';

interface CreatedTicketResult {
  id: number;
  title: string;
  department: string;
  priority: string;
  predicted_category: string;
  confidence: number;
}

export default function TicketForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<CreatedTicketResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sampleTickets = [
    {
      label: '🌐 Wi-Fi Issue',
      title: 'Wi-Fi connection keeps dropping in Central Library',
      desc: 'Unable to connect to the campus Wi-Fi network from the second floor of the central library since morning.'
    },
    {
      label: '⚡ Hostel Maintenance',
      title: 'Power socket sparked in Room 204',
      desc: 'The wall socket near the study desk had a spark and is not supplying electricity. Please send maintenance.'
    },
    {
      label: '💳 Accounts & Fees',
      title: 'Semester fee deducted but receipt not issued',
      desc: 'Payment was successfully debited from my bank account via UPI, but portal still shows pending status.'
    },
    {
      label: '🖥️ Hardware / Lab',
      title: 'Lab computer #14 monitor not turning on',
      desc: 'The monitor on desktop station 14 in Computer Lab 3 has a black screen and power LED is not lighting up.'
    }
  ];

  const handleApplySample = (sample: { title: string; desc: string }) => {
    setTitle(sample.title);
    setDescription(sample.desc);
    setResult(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/tickets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to submit ticket. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Container Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/70 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 sm:px-10 py-10 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white mb-4 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Automated Dispatch
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Submit Support Ticket</h2>
          <p className="text-indigo-100 mt-2 text-sm sm:text-base max-w-xl">
            Describe your issue in plain language. Our machine learning engine will automatically classify, prioritize, and route it to the right department.
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* Success Banner */}
          {result && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900 text-base">Ticket #{result.id} Logged Successfully!</h3>
                  <p className="text-sm text-emerald-800 mt-1">
                    Your request was analyzed by the NLP classifier and automatically dispatched:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Category</p>
                      <p className="text-sm font-extrabold text-indigo-700 mt-0.5">{result.predicted_category || 'General'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Dept</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5">{result.department}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Priority Level</p>
                      <p className={`text-sm font-extrabold mt-0.5 ${result.priority === 'HIGH' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {result.priority}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
              <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Quick-fill Suggestion Chips */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Quick Examples (click to test)</p>
            <div className="flex flex-wrap gap-2">
              {sampleTickets.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySample(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Issue Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Cannot connect to Wi-Fi in lab"
                  className="w-full px-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide details about the issue, location, device name, or error message..."
                  className="w-full px-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all h-36 resize-y text-sm font-medium"
                  required
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Processing with AI Model...</span>
                </>
              ) : (
                <>
                  <span>Submit Ticket</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
