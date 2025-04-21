'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');

    try {
      const res = await fetch('http://localhost:4000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5ef] flex items-center justify-center font-poppins px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>

        {status === 'success' && (
          <p className="text-green-600 text-center mb-4">Check your email for reset instructions.</p>
        )}
        {status === 'error' && (
          <p className="text-red-500 text-center mb-4">Email failed to send</p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email address"
            className="w-full border rounded px-4 py-3 mb-6 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="submit"
            className="w-full bg-[#f2b300] hover:bg-[#e8b14f] text-white py-3 rounded text-[16px] font-medium"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </main>
  );
}
