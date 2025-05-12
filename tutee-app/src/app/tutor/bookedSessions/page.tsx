'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TutorHeader from '@/components/layout/TutorHeader';
import CheckMaterialModal from '@/components/CheckMaterialModal';
import ModalPortal from '@/components/ModalPortal';
import { Trash2 } from 'lucide-react';

interface Session {
  session_id: number;
  tutee_name: string;
  tutee_photo: string | null;
  tutor_photo: string | null;
  course_code: string;
  course_name: string;
  scheduled_datetime: string;
  room_link: string | null;
  materials: string[];
}

export default function TutorBookedSessionsPage() {
  const router = useRouter();
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
        const sorted = (data.bookedSessions || []).sort((a: Session, b: Session) => {
          const dateA = new Date(a.scheduled_datetime.replace(' ', 'T')).getTime();
          const dateB = new Date(b.scheduled_datetime.replace(' ', 'T')).getTime();
          return dateA - dateB;
        });
        setSessions(sorted);
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

  const formatDateTime = (datetime: string | undefined): string => {
    if (!datetime) return 'Unknown';
    try {
      const parsed = new Date(datetime.replace(' ', 'T'));
      return parsed.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Invalid Date';
    }
  };
  

  return (
    <main className="bg-[#F5F5EF] min-h-screen">
      <TutorHeader />

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-black mb-2">Your Sessions</h1>
        <p className="text-lg text-black mb-10">You have these sessions to attend</p>

        <div className="bg-white rounded-xl p-6 shadow-md space-y-8">
          {sessions.map((session) => {
            const canJoin = !!session.room_link;
            const formatted = formatDateTime(session.scheduled_datetime);

            return (
              <div
                key={session.session_id}
                className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                {/* Trash icon */}
                <button className="absolute top-4 right-4 text-[#DE5462]">
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Left section */}
                <div className="space-y-2">
                  <p className="font-bold text-[14px]">
                    <span className="font-extrabold text-black">{session.course_code}</span> - {session.course_name}
                  </p>

                  <div className="flex items-center space-x-2 text-sm font-semibold text-black">
                    <span className="text-[18px]">📅</span>
                    <span>{formatted}</span>
                  </div>

                  <p className="text-sm font-bold text-black">
                    With: {session.tutee_name}
                  </p>

                  {/* Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {canJoin ? (
                      <>
                        <button
                          onClick={() => router.push(`/session/setup/${session.room_link}`)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-xs font-semibold"
                        >
                          Join Session
                        </button>
                        <span className="text-green-600 text-2xl font-bold">→</span>
                      </>
                    ) : (
                      <div className="bg-black text-white font-bold text-xs px-6 py-2 rounded-full">
                        You cannot join now
                      </div>
                    )}

                    <button
                      className="bg-[#E8B14F] px-4 py-2 rounded-full text-xs font-semibold"
                      onClick={() => handleCheckMaterials(session.materials)}
                    >
                      Check Materials
                    </button>

                    {isCancelable(session.scheduled_datetime) ? (
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-xs font-semibold"
                        onClick={() => alert('❌ Cancel functionality coming soon.')}
                      >
                        Cancel Session
                      </button>
                    ) : (
                      <p className="text-sm text-gray-600 italic">Cannot cancel within 24h</p>
                    )}
                  </div>
                </div>

                {/* Tutee + Tutor photos */}
                <div className="flex -space-x-4 self-end sm:self-auto sm:mr-4">
                  <img
                    src={session.tutor_photo || '/imgs/default-profile.png'}
                    alt="Tutor"
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src={session.tutee_photo || '/imgs/default-profile.png'}
                    alt="Tutee"
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

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

