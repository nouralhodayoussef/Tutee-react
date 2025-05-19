'use client';

export default function LoadingModal({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white bg-opacity-30 flex flex-col items-center justify-center z-50 text-gray-900 text-lg font-semibold">
      <svg
        className="animate-spin h-12 w-12 mb-4 text-yellow-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        ></path>
      </svg>
      {message}
    </div>
  );
}
