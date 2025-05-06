'use client';

import { useEffect, useState } from 'react';
import TutorHeader from '@/components/layout/TutorHeader';

const daysOfWeek = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 7, name: 'Sunday' },
];

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const toTimeString = (mins: number) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const checkOverlap = (ranges: { start: string; end: string }[]) => {
  const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (toMinutes(sorted[i].end) > toMinutes(sorted[i + 1].start)) return true;
  }
  return false;
};

const findNextAvailableRange = (ranges: { start: string; end: string }[]) => {
  const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  let start = 8 * 60;
  for (let r of sorted) {
    const rStart = toMinutes(r.start);
    if (start + 60 <= rStart) {
      return {
        start: toTimeString(start),
        end: toTimeString(start + 60),
      };
    }
    start = Math.max(start, toMinutes(r.end));
  }
  return {
    start: toTimeString(start),
    end: toTimeString(start + 60),
  };
};

export default function TutorScheduleEditor() {
  const [availability, setAvailability] = useState<{ [dayId: number]: { start: string; end: string }[] }>({});
  const [errors, setErrors] = useState<{ [dayId: number]: string }>({});

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutor/availability', {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.availability) {
          setAvailability(data.availability);
        }
      } catch (err) {
        console.error('Failed to fetch availability', err);
      }
    };

    fetchAvailability();
  }, []);

  const addRange = (dayId: number) => {
    const existing = availability[dayId] || [];
    const suggested = findNextAvailableRange(existing);

    const newRanges = [...existing, suggested];
    if (checkOverlap(newRanges)) {
      setErrors((prev) => ({ ...prev, [dayId]: 'This time slot overlaps with an existing one.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [dayId]: '' }));
    setAvailability((prev) => ({
      ...prev,
      [dayId]: newRanges,
    }));
  };

  const removeRange = (dayId: number, index: number) => {
    const updated = (availability[dayId] || []).filter((_, i) => i !== index);
    setAvailability((prev) => ({ ...prev, [dayId]: updated }));
    setErrors((prev) => ({ ...prev, [dayId]: '' }));
  };

  const updateRange = (dayId: number, index: number, field: 'start' | 'end', value: string) => {
    const updated = [...(availability[dayId] || [])];
    updated[index][field] = value;

    if (toMinutes(updated[index].start) >= toMinutes(updated[index].end)) {
      setErrors((prev) => ({ ...prev, [dayId]: 'End time must be after start time.' }));
      return;
    }

    const filtered = updated.filter((_, i) => i !== index);
    if (checkOverlap([...filtered, updated[index]])) {
      setErrors((prev) => ({ ...prev, [dayId]: 'This time range overlaps with another.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [dayId]: '' }));
    setAvailability((prev) => ({ ...prev, [dayId]: updated }));
  };

  const handleSubmit = async () => {
    const payload = Object.entries(availability).flatMap(([dayId, ranges]) =>
      ranges.map((r) => ({
        day_id: Number(dayId),
        start_time: r.start,
        end_time: r.end,
      }))
    );

    if (payload.length === 0) {
      alert('Please add at least one valid time slot.');
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/tutor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ availability: payload }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Schedule saved successfully!');
      } else {
        alert(data.error || 'Error saving schedule.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5EF]">
      <TutorHeader />

      <div className="p-6 max-w-4xl mx-auto mt-8 w-full">
        <h2 className="text-2xl font-bold mb-6 text-black">Edit Your Weekly Schedule</h2>

        <div className="space-y-6 overflow-x-auto">
          {daysOfWeek.map((day) => (
            <div key={day.id} className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">{day.name}</h3>

              {(availability[day.id] || []).map((range, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3"
                >
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={range.start}
                      onChange={(e) => updateRange(day.id, index, 'start', e.target.value)}
                      className="border px-3 py-2 rounded-md w-[120px] sm:w-32"
                    />
                    <span className="text-sm font-medium self-center">to</span>
                    <input
                      type="time"
                      value={range.end}
                      onChange={(e) => updateRange(day.id, index, 'end', e.target.value)}
                      className="border px-3 py-2 rounded-md w-[120px] sm:w-32"
                    />
                  </div>
                  <button
                    onClick={() => removeRange(day.id, index)}
                    className="text-red-500 text-sm hover:underline mt-1 sm:mt-0"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {errors[day.id] && <p className="text-red-600 text-sm">{errors[day.id]}</p>}

              <button
                onClick={() => addRange(day.id)}
                className="text-[#E8B14F] text-sm font-medium hover:underline mt-2"
              >
                + Add Time Range
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={handleSubmit}
            className="bg-[#E8B14F] text-white font-bold py-2 px-6 rounded-full hover:bg-yellow-500 transition"
          >
            Save Schedule
          </button>
        </div>
      </div>
    </main>
  );
}
