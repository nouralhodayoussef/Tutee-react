'use client';

import { useEffect, useState } from 'react';
import TuteeHeader from '@/components/layout/TuteeHeader';
import { Trash2 } from 'lucide-react';

interface Session {
  session_id: number;
  scheduled_date: string;
  slot_time: string;
  room_link: string | null;
  tutor_name: string;
  tutor_photo: string | null;
  tutee_photo: string | null;
  course_code: string;
  course_name: string;
}

export default function TuteeBookedSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutee/booked-sessions', {
          credentials: 'include',
        });
        const data = await res.json();
        setSessions(data);
      } catch {
        console.error('Failed to load sessions');
      }
    };
    fetchSessions();
  }, []);

  const formatDateTime = (datetime: string): string => {
    try {
      const parsed = new Date(datetime);
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
      <TuteeHeader />

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-black mb-2">Your Sessions</h1>
        <p className="text-lg text-black mb-10">You have these sessions to attend</p>

        <div className="bg-white rounded-xl p-6 shadow-md space-y-8">
          {sessions.map((session) => {
              console.log('DATE:', session.scheduled_date, 'TIME:', session.slot_time); 
            const canJoin = !!session.room_link;
            const formatted = formatDateTime(session.scheduled_date);

            return (
              <div
                key={session.session_id}
                className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex justify-between items-center"
              >
                {/* Trash icon */}
                <button className="absolute top-4 right-4 text-[#DE5462]">
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Left text */}
                <div className="space-y-2">
                  <p className="font-bold text-[14px]">
                    <span className="font-extrabold text-black">{session.course_code}</span> - {session.course_name}
                  </p>

                  <div className="flex items-center space-x-2 text-sm font-semibold text-black">
                    <span className="text-[18px]">📅</span>
                    <span>{formatted}</span>
                  </div>

                  <p className="text-sm font-bold text-black">
                    With: {session.tutor_name}
                  </p>

                  {/* Buttons */}
                  <div className="flex items-center space-x-2 pt-2">
                    {canJoin ? (
                      <>
                        <a
                          href={`https://meet.tutee.com/${session.room_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#E8B14F] text-black font-bold text-xs px-6 py-2 rounded-full"
                        >
                          Join Session Now
                        </a>
                        <span className="text-[#E8B14F] text-2xl font-bold">→</span>
                      </>
                    ) : (
                      <div className="bg-black text-white font-bold text-xs px-6 py-2 rounded-full">
                        You cannot join now
                      </div>
                    )}
                  </div>
                </div>

                {/* Tutor + Tutee photos */}
                <div className="flex -space-x-4 mr-4">
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
    </main>
  );
}
