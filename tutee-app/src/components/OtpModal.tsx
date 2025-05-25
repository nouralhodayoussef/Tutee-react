'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react'; // Lucide icon for green success circle

interface OtpModalProps {
  email: string;
  userData: any;
  onVerify: () => void;
  onClose: () => void;
}

const OtpModal = ({ email, userData, onVerify, onClose }: OtpModalProps) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sendOtp = async () => {
      try {
        const res = await fetch('http://localhost:4000/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        console.log('✅ OTP sent to:', email, '| Server message:', data.message);
        setError('');
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    };

    sendOtp();
  }, [email]);

  const handleVerify = async () => {
    setVerifying(true);
    setError('');

    try {
      const res = await fetch('http://localhost:4000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        const transformedData = {
          ...userData,
          universityId: parseInt(userData.universityId),
          majorId: parseInt(userData.majorId),
        };

        const registerRes = await fetch('http://localhost:4000/register-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        });

        if (registerRes.ok) {
          setSuccess(true);
          onVerify();

          setTimeout(() => {
            setFadeOut(true);
          }, 1000);

          setTimeout(() => {
            router.push('/login');
          }, 2500);
        } else {
          const err = await registerRes.json();
          setError(err.error || 'Failed to register');
        }
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative transition-opacity duration-500">
        {!success ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Verify Your Email!</h2>
            <p className="text-sm text-center text-gray-600 mb-6">
              A verification code has been sent to your email address.
            </p>

            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full px-4 py-3 border border-yellow-400 rounded-full text-sm focus:outline-none focus:border-yellow-500"
            />

            {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-4 cursor-pointer py-2 bg-gray-300 rounded-full text-sm text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="px-4 cursor-pointer py-2 bg-[#E8B14F] text-white rounded-full text-sm"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <CheckCircle2 size={64} className="text-green-500 mb-4 animate-ping-once" />
            <p className="text-green-600 text-lg font-semibold text-center">
              Verification successful! Redirecting...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpModal;
