/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface CancelSessionModalProps {
  sessionId: number;
  onClose: () => void;
  onCancelSuccess: () => void;
  role: "tutor" | "tutee";
}

export default function CancelSessionModal({
  sessionId,
  onClose,
  onCancelSuccess,
  role,
}: CancelSessionModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const handleCancel = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/cancel-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data?.error || "Something went wrong.", "error");
        setLoading(false);
        return;
      }

      toast("Session cancelled successfully", "success");
      onCancelSuccess();
      onClose();
    } catch (err) {
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

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Cancel Session
        </h2>

        <p className="text-sm text-gray-700 mb-2">
          Please tell us why you’re cancelling this session ({role}). This note will be shared with the tutee.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-3 h-28 resize-none text-sm mb-4"
          placeholder="Optional reason (e.g., scheduling conflict, emergency)..."
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm bg-gray-300 hover:bg-gray-400"
          >
            Close
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm bg-red-500 text-white font-semibold hover:bg-red-600"
          >
            {loading ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
