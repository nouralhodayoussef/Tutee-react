'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import LoadingModal from '@/components/forget-password/LoadingModal';
import OtpModal from '@/components/forget-password/OtpModal';
import NewPasswordModal from '@/components/forget-password/NewPasswordModal';
import RoleProtected from "@/components/security/RoleProtected";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [showLoading, setShowLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showNewPassModal, setShowNewPassModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [otpVerifying, setOtpVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setShowLoading(true);

    try {
      const res = await fetch('http://localhost:4000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setTimeout(() => {
          setShowLoading(false);
          setShowOtpModal(true);
          setStatus('success');
        }, 2000);
      } else {
        setShowLoading(false);
        setStatus('error');
      }
    } catch {
      setShowLoading(false);
      setStatus('error');
    }
  };

  const handleOtpSuccess = async () => {
    setOtpVerifying(true);
    setShowOtpModal(false);
    setShowNewPassModal(true);
    setOtpVerifying(false);
  };

  const handleNewPassSuccess = async () => {
  setShowNewPassModal(false);
  setShowOtpModal(false);
  setShowLoading(false);
  setShowSuccessMessage(true);

  try {
    // ✅ Clear session before redirecting to login
    await fetch('http://localhost:4000/logout', {
      method: 'POST',
      credentials: 'include',
    });

    // Optional: clear frontend state too
    sessionStorage.clear();
    localStorage.clear();
  } catch (err) {
    console.warn('Could not clear session:', err);
  }

  setTimeout(() => {
    router.push('/login');
  }, 3000);
};

  return (
    <RoleProtected requiredRoles={['tutee', 'tutor']}>
    <main className="min-h-screen bg-[#f5f5ef] flex items-center justify-center font-poppins px-4">
      {!showSuccessMessage && (
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>

          {status === 'success' && (
            <p className="text-green-600 text-center mb-4">
              Check your email for reset instructions.
            </p>
          )}
          {status === 'error' && (
            <p className="text-red-500 text-center mb-4">Email failed to send.</p>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
              className="w-full border rounded px-4 py-3 mb-6 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              disabled={showLoading}
            />
            <button
              type="submit"
              className="w-full bg-[#f2b300] hover:bg-[#e8b14f] text-white py-3 rounded text-[16px] font-medium"
              disabled={showLoading}
            >
              Send Reset Link
            </button>
          </form>
        </div>
      )}

      {showSuccessMessage && (
        <div
          className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-md flex items-center justify-center z-50"
          aria-live="polite"
          role="alert"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center animate-fadeInScale"
            style={{ animationDuration: '600ms', animationTimingFunction: 'ease-out' }}
          >
            <svg
              className="w-16 h-16 text-green-500 mb-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
            <p className="text-green-700 text-center mb-4">
              Password changed successfully.<br />
              Redirecting to login...
            </p>
          </div>
        </div>
      )}

      {showLoading && <LoadingModal message="Sending OTP..." />}
      {showOtpModal && (
        <OtpModal
          email={email}
          onSuccess={handleOtpSuccess}
          onClose={() => setShowOtpModal(false)}
          verifying={otpVerifying}
        />
      )}
      {showNewPassModal && (
        <NewPasswordModal
          email={email}
          onSuccess={handleNewPassSuccess}
          onClose={() => setShowNewPassModal(false)}
        />
      )}
    </main>
    </RoleProtected>
  );
}
