'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const validatePassword = (password: string) => {
    const lengthOk = password.length >= 8 && password.length <= 18;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[#@$.&%]/.test(password);
    return lengthOk && hasUpper && hasLower && hasSpecial;
  };

  const handleUpdate = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    if (!validatePassword(newPassword)) {
      setErrorMsg('Password must be 8–18 chars, include upper/lowercase and one of: # $ @ . & %');
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('✅ Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => router.push('/tutee'), 1500);
      } else {
        setErrorMsg(data.error || 'Old password is incorrect');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center font-poppins">
      <div className="bg-white p-10 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-center text-2xl font-bold mb-6">Change Password</h2>

        {/* Old Password */}
        <div className="relative mb-2">
          <input
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Old Password"
            className="w-full border border-gray-400 rounded-full px-6 py-3 pr-12 text-sm outline-none"
          />
          <i
            className={`bi bi-eye${showOld ? '-slash' : ''} absolute right-4 top-[50%] translate-y-[-50%] cursor-pointer`}
            onClick={() => setShowOld(!showOld)}
          />
        </div>

        {/* New Password */}
        <div className="relative mb-2">
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className="w-full border border-gray-400 rounded-full px-6 py-3 pr-12 text-sm outline-none"
          />
          <i
            className={`bi bi-eye${showNew ? '-slash' : ''} absolute right-4 top-[50%] translate-y-[-50%] cursor-pointer`}
            onClick={() => setShowNew(!showNew)}
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            className="w-full border border-gray-400 rounded-full px-6 py-3 text-sm outline-none"
          />
        </div>

        {/* Error / Success Messages */}
        {errorMsg && <p className="text-red-600 text-sm mb-4 flex items-center"><i className="bi bi-x-circle mr-2"></i>{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-sm mb-4">{successMsg}</p>}

        {/* Submit Button */}
        <button
          onClick={handleUpdate}
          className="w-full bg-[#E8B14F] text-white font-semibold py-3 rounded-full hover:opacity-90"
        >
          Update Password
        </button>

        {/* Forgot password link */}
        <p className="text-center mt-4 text-sm text-gray-600">
          Forgot your old password?{' '}
          <span
            className="text-[#E8B14F] hover:underline cursor-pointer"
            onClick={() => router.push('/forgot-password')}
          >
            Try other ways
          </span>
        </p>
      </div>
    </div>
  );
}
