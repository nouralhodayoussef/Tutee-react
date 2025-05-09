'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import TutorHeader from '@/components/layout/TutorHeader';
import CheckMaterialModal from '@/components/CheckMaterialModal';
import ModalPortal from '@/components/ModalPortal';

interface Session {
  session_id: number;
  tutee_name: string;
  tutee_photo: string;
  course_code: string;
  course_name: string;
  schedule: string;
  room_link: string | null;
  materials: string[];
  scheduled_date: string;
}

export default function TutorBookedSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutor/booked-sessions', {
          credentials: 'include',
        });
        const data = await res.json();
        setSessions(data.bookedSessions || []);
      } catch (err) {
        console.error('Failed to load booked sessions:', err);
      }
    };

    fetchSessions();
  }, []);

  const handleCheckMaterials = (materials: string[]) => {
    setSelectedMaterials(materials || []);
    setModalOpen(true);
  };

  const isCancelable = (scheduledDate: string) => {
    const sessionTime = new Date(scheduledDate).getTime();
    const now = Date.now();
    return sessionTime - now > 24 * 60 * 60 * 1000;
  };

  return (
    <main className="min-h-screen bg-[#f5f5ef]">
      <TutorHeader />

      <div className="relative mx-auto mt-20 w-[90%] max-w-[1292px] rounded-[15px] bg-white p-10 shadow-md flex flex-col gap-10">
        <div className="flex-1">
          <h1 className="text-[32px] md:text-[36px] font-bold text-black mb-2">
            Booked Sessions
          </h1>
          <p className="text-[16px] md:text-[18px] text-black">
            These are your upcoming booked sessions.
          </p>

          {sessions.length === 0 ? (
            <div className="mt-10 text-sm md:text-base text-gray-600">
              You don’t have any booked sessions yet.
            </div>
          ) : (
            <div className="mt-10 grid gap-6">
              {sessions.map((session, idx) => (
                <div
                  key={idx}
                  className="bg-[#f5f5f5] rounded-[15px] p-6 flex flex-col md:flex-row items-center justify-between"
                >
                  <div className="flex flex-col gap-2 text-center md:text-left">
                    <p className="text-sm md:text-base">
                      <span className="font-bold">{session.course_code}</span> - {session.course_name}
                    </p>
                    <p className="text-sm md:text-base">
                      With: <span className="font-bold">{session.tutee_name}</span>
                    </p>

                    <div className="flex gap-2 items-center justify-center md:justify-start mt-3">
                      <Image
                        src={session.tutee_photo || '/imgs/tutee-profile.png'}
                        alt="Tutee photo"
                        width={60}
                        height={60}
                        className="rounded-full"
                      />
                    </div>

                    <p className="text-sm text-green-700 font-medium mt-2">
                      📅 {session.schedule}
                    </p>

                    <div className="flex gap-3 mt-4 flex-wrap justify-center md:justify-start">
                      {session.room_link ? (
                        <a
                          href={session.room_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold"
                        >
                          Join Room
                        </a>
                      ) : (
                        <p className="text-sm italic text-gray-500">No meeting link available</p>
                      )}

                      <button
                        className="bg-[#E8B14F] px-4 py-2 rounded-full text-sm font-semibold"
                        onClick={() => handleCheckMaterials(session.materials)}
                      >
                        Check Materials
                      </button>

                      {isCancelable(session.scheduled_date) ? (
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold"
                          onClick={() => alert('❌ Cancel functionality coming soon.')}
                        >
                          Cancel Session
                        </button>
                      ) : (
                        <p className="text-sm text-gray-600 italic">Cannot cancel within 24h</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ModalPortal>
          <CheckMaterialModal
            materials={selectedMaterials}
            onClose={() => setModalOpen(false)}
          />
        </ModalPortal>
      )}
    </main>
  );
}
