'use client';

import { useState, useEffect } from 'react';

interface OtpModalProps {
  email: string;
  userData: any;
  onVerify: () => void;
  onClose: () => void;
}

const OtpModal = ({ email, userData, onVerify, onClose }: OtpModalProps) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const sendOtp = async () => {
      try {
        const res = await fetch('http://localhost:4000/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        // if (!res.ok) {
        //   let errorData = {};
        //   try {
        //     errorData = await res.json();
        //   } catch {}
        //   throw new Error((errorData as any).error || 'Failed to send OTP. Please try again later.');
        // }

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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
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
        {success && <p className="text-green-600 text-sm mt-2 text-center">Verified successfully!</p>}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-full text-sm text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-4 py-2 bg-[#E8B14F] text-white rounded-full text-sm"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;
