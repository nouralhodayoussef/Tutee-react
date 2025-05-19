'use client';
import { useState } from 'react';
import { validatePassword } from '@/utils/passwordValidator';
import { Eye, EyeOff } from 'lucide-react';  // <-- import icons

interface NewPasswordModalProps {
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewPasswordModal({ email, onClose, onSuccess }: NewPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);          // toggle visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { valid, errors } = validatePassword(password);
    if (!valid) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/reset-password-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-orange bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-500"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-password-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm transform transition-transform duration-500 ease-in-out">
        <h3 id="new-password-title" className="text-lg font-semibold mb-4 text-center">
          Set New Password
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Password input with eye toggle */}
          <div className="relative mb-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              className="w-full px-4 py-2 border rounded pr-10"
              aria-describedby="password-errors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-800"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {validationErrors.length > 0 && (
            <ul
              id="password-errors"
              className="text-red-500 text-xs mb-3 list-disc list-inside"
              role="alert"
            >
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}

          {/* Confirm password input with eye toggle */}
          <div className="relative mb-1">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className="w-full px-4 py-2 border rounded pr-10"
              aria-describedby="confirm-error"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-800"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && !validationErrors.length && (
            <p id="confirm-error" className="text-red-500 text-xs mb-3" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>

        <button
          className="text-sm text-gray-500 mt-4 mx-auto block"
          onClick={onClose}
          aria-label="Cancel password change"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
