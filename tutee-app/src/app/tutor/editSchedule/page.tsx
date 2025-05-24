/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import TutorHeader from '@/components/layout/TutorHeader';
import { useToast } from '@/components/Toast';
import RoleProtected from '@/components/security/RoleProtected';

type TimeRange = { start: string; end: string };

type ConflictSession = {
  session_id: number;
  scheduled_date: string;
  day_id: number;
  slot_time: string;
  tutee_first_name: string;
  tutee_last_name: string;
  course_code: string;
  course_name: string;
};

type ConflictModalProps = {
  sessions: ConflictSession[];
  onCancel: () => void;
  onConfirm: () => void;
};

// ---- Utilities ----
const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const toTimeString = (mins: number): string => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const checkOverlap = (ranges: TimeRange[]): boolean => {
  const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (toMinutes(sorted[i].end) > toMinutes(sorted[i + 1].start)) return true;
  }
  return false;
};

const findNextAvailableRange = (ranges: TimeRange[]): TimeRange => {
  const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  let start = 8 * 60;
  for (const r of sorted) {
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

const daysOfWeek = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 7, name: 'Sunday' },
];

// ---- Modal ----
function ConflictModal({ sessions, onCancel, onConfirm }: ConflictModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 relative">
        <h2 className="text-xl font-bold mb-2 text-red-600">Warning</h2>
        <p className="mb-4">The following sessions will be cancelled if you remove this slot:</p>
        <ul className="mb-6 max-h-64 overflow-y-auto">
          {sessions.map((s) => (
            <li key={s.session_id} className="mb-2 p-2 bg-yellow-50 rounded">
              <div>
                <b>{s.tutee_first_name} {s.tutee_last_name}</b>
              </div>
              <div className="text-sm text-gray-600">
                {daysOfWeek.find(d => d.id === s.day_id)?.name || `Day ${s.day_id}`}, {s.scheduled_date?.slice(0, 10)} at {s.slot_time?.slice(0, 5)}<br />
                <b>{s.course_code}:</b> {s.course_name}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-[#E8B14F] text-white font-semibold hover:bg-yellow-500">Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function TutorScheduleEditor() {
  const toast = useToast();

  const [availability, setAvailability] = useState<{ [dayId: number]: TimeRange[] }>({});
  const [errors, setErrors] = useState<{ [dayId: number]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [modalSessions, setModalSessions] = useState<ConflictSession[]>([]);
  const [modalDay, setModalDay] = useState<number | null>(null);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

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

  const removeRange = async (dayId: number, index: number) => {
  const rangeToRemove = (availability[dayId] || [])[index];
  if (!rangeToRemove) return;

  const tutorId = 1;

  const ranges = [{
    day_id: dayId,
    start: rangeToRemove.start,
    end: rangeToRemove.end,
  }];

  try {
    const res = await fetch('http://localhost:4000/tutor/check-schedule-conflicts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tutor_id: tutorId, ranges }),
    });
    const data = await res.json();

    setModalDay(dayId);
    setModalIndex(index);

    if (data.sessions && data.sessions.length > 0) {
      setModalSessions(data.sessions);
      setShowModal(true);
    } else {
      actuallyRemoveRange(dayId, index); 
    }
  } catch (err) {
    alert('Error checking for session conflicts.');
  }
};



  const actuallyRemoveRange = (dayId: number, index: number) => {
    const updated = (availability[dayId] || []).filter((_, i) => i !== index);
    setAvailability((prev) => ({ ...prev, [dayId]: updated }));
    setErrors((prev) => ({ ...prev, [dayId]: '' }));
    setShowModal(false);
    setModalSessions([]);
    setModalDay(null);
    setModalIndex(null);
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setModalSessions([]);
    setModalDay(null);
    setModalIndex(null);
  };

  const handleModalConfirm = async () => {
  if (modalDay === null || modalIndex === null) return;

  // Cancel sessions in DB if any
  const tutorId = 1;
  const rangeToRemove = (availability[modalDay] || [])[modalIndex];
  try {
    await fetch('http://localhost:4000/tutor/cancel-sessions-and-remove-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        tutor_id: tutorId,
        ranges: [{
          day_id: modalDay,
          start: rangeToRemove?.start,
          end: rangeToRemove?.end,
        }],
        session_ids: modalSessions.map(s => s.session_id),
        reason: "Schedule edited by tutor"
      }),
    });

    actuallyRemoveRange(modalDay, modalIndex); 
  } catch (err) {
    alert('Error cancelling sessions.');
  }
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
    const hasErrors = Object.values(errors).some(err => err && err.trim().length > 0);
    if (hasErrors) {
      toast('Please fix all schedule errors before submitting.', 'error');
      return;
    }

    const payload = Object.entries(availability).flatMap(([dayId, ranges]) =>
      ranges.map((r) => ({
        day_id: Number(dayId),
        start_time: r.start,
        end_time: r.end,
      }))
    );

    if (payload.length === 0) {
      toast('Please add at least one valid time slot.', 'error');
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
        toast('Schedule saved successfully!', 'success');
      } else {
        toast(data.error || 'Error saving schedule.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Network error.', 'error');
    }
  };

  return (
    <RoleProtected requiredRoles={['tutor']}>
      <main className="min-h-screen bg-[#F5F5EF]">
        <TutorHeader />
        <div className="p-6 max-w-4xl mx-auto mt-8 w-full">
          <h2 className="text-2xl font-bold mb-6 text-black">Edit Your Weekly Schedule</h2>

          <div className="space-y-6 overflow-x-auto">
            {daysOfWeek.map((day) => (
              <div key={day.id} className="bg-white p-4 rounded-xl shadow border border-gray-200">
                <h3 className="text-lg font-semibold mb-2">{day.name}</h3>

                {(availability[day.id] || []).map((range, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
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

        {showModal && (
          <ConflictModal
            sessions={modalSessions}
            onCancel={handleModalCancel}
            onConfirm={handleModalConfirm}
          />
        )}
      </main>
    </RoleProtected>
  );
}
