'use client';

interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

export default function SuccessModal({ message, onClose }: SuccessModalProps) {
  return (
<div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl text-center">
        <h2 className="text-lg font-semibold mb-3 text-green-600">Success</h2>
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[#E8B14F] text-black font-medium rounded hover:bg-yellow-400"
        >
          Close
        </button>
      </div>
    </div>
  );
}
