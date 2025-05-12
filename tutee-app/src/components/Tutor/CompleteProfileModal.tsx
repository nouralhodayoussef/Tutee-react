'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteProfileModal() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('http://localhost:4000/check-tutor-profile', {
          credentials: 'include',
        });

        const data = await res.json();
        if (data.needsProfileCompletion) {
          setShowModal(true);
          // Disable scrolling behind modal
          document.body.style.overflow = 'hidden';
        }
      } catch (error) {
        console.error('Failed to check profile status:', error);
      }
    }

    checkProfile();

    return () => {
      // Re-enable scroll when component unmounts
      document.body.style.overflow = '';
    };
  }, []);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md text-center relative">
        <h2 className="text-xl font-bold mb-2">Complete your profile</h2>
        <p className="mb-4 text-gray-600">
          Complete your profile by setting a price, and the courses you can teach.
        </p>
        <button
          onClick={() => router.push('/tutor-edit-profile')}
          className="bg-[#E8B14F] text-white px-6 py-2 rounded-full font-semibold hover:bg-yellow-600"
        >
          Go to Profile
        </button>
      </div>
    </div>
  );
}
