'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetScheduleModal() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAvailability() {
      try {
        const res = await fetch('http://localhost:4000/check-tutor-availability', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.hasNoAvailability) {
          setShowModal(true);
          document.body.style.overflow = 'hidden';
        }
      } catch (err) {
        console.error('Failed to check tutor availability', err);
      }
    }

    checkAvailability();
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md text-center relative">
        <h2 className="text-xl font-bold mb-2">Set your Schedule</h2>
        <p className="mb-4 text-gray-600">
          Set your schedule in order to start navigating.
        </p>
        <button
          onClick={() => router.push('/tutor/editSchedule')}
          className="bg-[#E8B14F] text-white px-6 py-2 rounded-full font-semibold hover:bg-yellow-600"
        >
          Set it Now!
        </button>
      </div>
    </div>
  );
}
