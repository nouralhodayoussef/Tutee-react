'use client';
import { useState } from 'react';

interface DeleteUserModalProps {
  userFullName: string;
  email: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function DeleteUserModal({
  userFullName,
  email,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  const [reason, setReason] = useState('');

  return (
<div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-2">Suspended {userFullName}?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Please provide a reason for suspending this user. An email will be sent to: <strong>{email}</strong>
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason..."
          className="w-full border border-gray-300 rounded p-2 mb-4"
          rows={3}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="px-4 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-red-300"
          >
            Suspend
          </button>
        </div>
      </div>
    </div>
  );
}
