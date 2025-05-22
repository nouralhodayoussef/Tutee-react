"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useToast } from "@/components/Toast";

interface RateTuteeModalProps {
  sessionId: number;
  tuteeName: string;
  onClose: () => void;
  onSuccess: (stars: number, description: string) => void;
}

export default function RateTuteeModal({
  sessionId,
  tuteeName,
  onClose,
  onSuccess,
}: RateTuteeModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast(); // ✅ initialize toast

  const handleRate = async () => {
    if (!rating) {
      toast("Please select a rating.", "error");
      return;
    }
    if (comment.length > 1000) {
      toast("Comment too long (max 1000 characters).", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/tutor/rate-tutee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduled_session_id: sessionId,
          stars: rating,
          description: comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data?.error || "Something went wrong.", "error");
        setLoading(false);
        return;
      }

      toast("Thank you for your feedback!", "success"); // ✅ success toast
      onSuccess(rating, comment);
      onClose();
    } catch {
      toast("Server error. Please try again.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-lg font-bold text-gray-500">
          &times;
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Rate Your Tutee</h2>
        <p className="text-sm text-gray-700 mb-2">
          How would you rate your experience with <span className="font-semibold">{tuteeName}</span>?
        </p>

        {/* Stars */}
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

        {/* Comment box */}
        <textarea
          className="w-full rounded-lg border border-gray-200 p-2 mb-3 min-h-[70px] focus:outline-none focus:ring-2 focus:ring-[#E8B14F] text-sm"
          maxLength={1000}
          placeholder="Leave a comment about your tutee (optional, max 1000 characters)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
        />

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm bg-gray-300 hover:bg-gray-400"
            type="button"
            disabled={loading}
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
