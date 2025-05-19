'use client';

import React from 'react';

interface PasswordNotificationProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export default function PasswordNotification({ type = 'info', message, onClose }: PasswordNotificationProps) {
  const colors = {
    success: 'bg-green-100 text-green-700 border-green-400',
    error: 'bg-red-100 text-red-700 border-red-400',
    info: 'bg-blue-100 text-blue-700 border-blue-400',
  };

  return (
    <div
      className={`fixed top-5 right-5 border-l-4 p-4 rounded shadow-md max-w-xs z-50 ${colors[type]}`}
      role="alert"
      aria-live="assertive"
    >
      <p>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="ml-4 font-bold text-lg leading-none focus:outline-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
