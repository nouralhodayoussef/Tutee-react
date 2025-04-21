'use client';

import { useState } from 'react';
import ScheduleModal from '@/components/tutee/ScheduleModal'; // Adjust path if needed

export default function TestModalPage() {
  const [showModal, setShowModal] = useState(true);

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-yellow-500 text-white rounded-full"
      >
        Open Schedule Modal
      </button>

      {/* {showModal && (
        <ScheduleModal
          onClose={() => setShowModal(false)}
          tutorName="Bob Smith"
          courseCode="CS201"
        />
      )} */}
    </main>
  );
}
//
