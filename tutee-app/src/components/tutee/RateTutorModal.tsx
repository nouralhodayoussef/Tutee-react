"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RateTutorModalProps {
  sessionId: number;
  tutorName: string;
  onClose: () => void;
  onSuccess: (stars: number) => void;
}

export default function RateTutorModal({
  sessionId,
  tutorName,
  onClose,
  onSuccess,
}: RateTutorModalProps) {
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRate = async () => {
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:4000/tutee/rate-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduled_session_id: sessionId,
          stars: rating,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      onSuccess(rating);
      onClose();
    } catch {
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-lg font-bold text-gray-500">
          &times;
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Rate Your Tutor</h2>
        <p className="text-sm text-gray-700 mb-2">
          How would you rate your experience with <span className="font-semibold">{tutorName}</span>?
        </p>

        <div className="flex space-x-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`text-4xl transition ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}
              onClick={() => setRating(star)}
              disabled={loading}
              aria-label={`Rate ${star} stars`}
              type="button"
            >
              <Star />
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm bg-gray-300 hover:bg-gray-400"
            type="button"
          >
            Close
          </button>
          <button
            onClick={handleRate}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm bg-[#E8B14F] text-white font-semibold hover:bg-yellow-600"
            type="button"
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
