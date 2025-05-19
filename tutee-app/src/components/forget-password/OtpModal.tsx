'use client';
import { useState } from 'react';

interface OtpModalProps {
  email: string;
  onSuccess: () => void;
  onClose: () => void;
  verifying?: boolean;
}

export default function OtpModal({ email, onSuccess, onClose, verifying = false }: OtpModalProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:4000/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid OTP code');
      }
    } catch {
      setError('Something went wrong');
    }
  };

  return (
<div className="fixed inset-0 bg-orange bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4 text-center">Enter OTP Code</h3>
        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            required
            disabled={verifying}
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <button
            type="submit"
            disabled={verifying}
            className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
          >
            {verifying ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
        <button
          className="text-sm text-gray-500 mt-4 mx-auto block"
          onClick={onClose}
          disabled={verifying}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
