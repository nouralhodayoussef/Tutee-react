"use client";

import { useState } from "react";
import ModalPortal from "@/components/ModalPortal";

interface TimeSlotsModalProps {
  requestId: number;
  availableSlots: { date: string; time: string }[];
  scheduledSlots: string[];
  onClose: () => void;
  onConfirm: (slot: { date: string; time: string }) => void;
}

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

export default function TimeSlotsModal({
  availableSlots,
  scheduledSlots,
  onClose,
  onConfirm,
}: TimeSlotsModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | "">("");
  const [selectedTime, setSelectedTime] = useState<string | "">("");
  const [error, setError] = useState<string | null>(null);

  const uniqueDates = [
    ...new Set(
      availableSlots.map((slot) =>
        new Date(slot.date).toISOString().split("T")[0]
      )
    ),
  ];

  const timeOptions = selectedDate
    ? availableSlots
        .filter(
          (slot) =>
            new Date(slot.date).toISOString().split("T")[0] === selectedDate
        )
        .map((slot) => slot.time)
    : [];

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time.");
      return;
    }

    const slotDateTimeString = `${selectedDate}T${selectedTime}:00`;
    const slotDate = new Date(slotDateTimeString);

    if (isNaN(slotDate.getTime())) {
      setError("Invalid Date Format");
      return;
    }

    const now = new Date();
    if (slotDate < now) {
      setError("You cannot select a date in the past.");
      return;
    }

    const isoSlot = slotDate.toISOString().slice(0, 16);
    if (scheduledSlots.includes(isoSlot)) {
      setError("This slot is already scheduled.");
      return;
    }

    onConfirm({ date: selectedDate, time: selectedTime });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
        <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-600 text-lg font-bold"
          >
            &times;
          </button>

          <h2 className="text-xl font-bold mb-4">Select a Time Slot</h2>

          <div className="flex gap-2 mb-4">
            <select
              className="flex-1 border rounded px-4 py-2"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime("");
              }}
            >
              <option value="">Select a day</option>
              {uniqueDates.map((date) => {
                const dateObj = new Date(date);
                const display = dateObj.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                });
                const suffix = getOrdinalSuffix(dateObj.getDate());
                return (
                  <option key={date} value={date}>
                    {display + suffix}
                  </option>
                );
              })}
            </select>

            <select
              className="flex-1 border rounded px-4 py-2"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!selectedDate}
            >
              <option value="">Select time</option>
              {timeOptions.map((time, index) => {
                let isDisabled = false;
                try {
                  const isoFull = `${selectedDate}T${time}:00`;
                  const date = new Date(isoFull);
                  if (!isNaN(date.getTime())) {
                    const iso = date.toISOString().slice(0, 16);
                    isDisabled = scheduledSlots.includes(iso);
                  }
                } catch {
                  isDisabled = false;
                }

                return (
                  <option key={time + index} value={time} disabled={isDisabled}>
                    {time} {isDisabled ? "(Taken)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          <button
            className="w-full bg-[#F2D28D] hover:bg-[#e6c780] text-gray-800 font-bold py-2 px-4 rounded-full disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
          >
            Confirm Slot
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
