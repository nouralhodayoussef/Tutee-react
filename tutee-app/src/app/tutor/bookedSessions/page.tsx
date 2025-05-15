'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TutorHeader from '@/components/layout/TutorHeader';
import CheckMaterialModal from '@/components/CheckMaterialModal';
import CancelSessionModal from '@/components/CancelSessionModal';
import ModalPortal from '@/components/ModalPortal';
import { Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { tuteeLogoBase64 } from '@/utils/pdfLogo';



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
  tutee_avg_rating: number | null;
}

export default function TutorBookedSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [printOption, setPrintOption] = useState<'today' | 'week'>('today');
  const [tutorName, setTutorName] = useState<string>('');



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
        setTutorName(data.tutorName || '');
        console.log('✅ Tutor name loaded:', data.tutorName);
        // ✅ Ensure this line is here
      } catch (err) {
        console.error('Failed to load booked sessions:', err);
      }
    };
    fetchSessions();
  }, []);



  const isCancelable = (scheduledDate: string) => {
    const sessionTime = new Date(scheduledDate.replace(' ', 'T')).getTime();
    const now = Date.now();
    return sessionTime - now > 24 * 60 * 60 * 1000;
  };

  const formatDateTime = (datetime: string): string => {
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

  const handleCheckMaterials = (materials: string[]) => {
    setSelectedMaterials(materials || []);
    setModalOpen(true);
  };

  const handleCancelClick = (session: Session) => {
    setSessionToCancel(session);
    setCancelModalOpen(true);
  };

  const handleCancelSuccess = () => {
    if (sessionToCancel) {
      setSessions((prev) =>
        prev.filter((s) => s.session_id !== sessionToCancel.session_id)
      );
    }
    setCancelModalOpen(false);
    setSessionToCancel(null);
  };

  const getFilteredSessions = (type: 'today' | 'week') => {
    const today = new Date();
    return sessions.filter((session) => {
      const date = new Date(session.scheduled_datetime);
      if (type === 'today') {
        return date.toDateString() === today.toDateString();
      } else {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        return date >= startOfWeek && date <= endOfWeek;
      }
    });
  };

  const handlePrintSchedule = (type: 'today' | 'week') => {
    const filtered = getFilteredSessions(type);
    const doc = new jsPDF();

    // 🟡 Header and Logo
    doc.addImage(tuteeLogoBase64, 'PNG', 10, 10, 40, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('TUTEE - Tutor Schedule', 60, 20);

    if (tutorName) {
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(`Tutor: ${tutorName}`, 60, 28); // 🟡 Keep only this
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const subtitle = type === 'today'
      ? `Schedule for ${new Date().toDateString()}`
      : `Week of ${getStartOfWeek()} to ${getEndOfWeek()}`;
    doc.text(subtitle, 60, 36); // bumped down for spacing


    // 🟡 Today = autoTable layout
    if (type === 'today') {
      autoTable(doc, {
        startY: 40,
        headStyles: {
          fillColor: [232, 177, 79],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        head: [['Time', 'Course', 'Tutee']],
        body: filtered.map((s) => [
          formatDateTime(s.scheduled_datetime),
          `${s.course_code} - ${s.course_name}`,
          s.tutee_name,
        ]),
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
      });
    }

    // 🟡 Week = grid layout
    if (type === 'week') {
      // 🔍 Step 1: Extract earliest/latest session hours to trim grid
      const sessionHours = filtered.map(s => new Date(s.scheduled_datetime).getHours());
      const minHour = Math.max(7, Math.min(...sessionHours) - 1); // Lower bound
      const maxHour = Math.min(23, Math.max(...sessionHours) + 1); // Upper bound
      const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const cellWidth = 25;
      const cellHeight = 12;
      const startX = 30;
      const startY = 40;

      // Day headers
      days.forEach((day, i) => {
        doc.setFillColor(232, 177, 79);
        doc.rect(startX + i * cellWidth, startY, cellWidth, cellHeight, 'F');
        doc.setTextColor(0);
        doc.text(day.slice(0, 3), startX + i * cellWidth + 2, startY + 8);
      });

      // Grid + sessions
      hours.forEach((hour, row) => {
        doc.setFontSize(10); // ✅ reset to a standard size
        doc.setTextColor(0); // ✅ reset color to black
        doc.text(`${hour}:00`, startX - 18, startY + (row + 1) * cellHeight + 8);


        days.forEach((day, col) => {
          const x = startX + col * cellWidth;
          const y = startY + (row + 1) * cellHeight;
          doc.setDrawColor(180);
          doc.rect(x, y, cellWidth, cellHeight);

          const matchingSession = filtered.find((s) => {
            const d = new Date(s.scheduled_datetime);
            const sessionDay = d.toLocaleDateString('en-US', { weekday: 'long' });
            const sessionHour = d.getHours();
            return sessionDay === day && sessionHour === hour;
          });

          if (matchingSession) {
            doc.setFontSize(7);
            doc.setTextColor(50);
            doc.text(`${matchingSession.course_code}`, x + 1, y + 4);
            doc.text(`${matchingSession.tutee_name}`, x + 1, y + 9);
          }
        });
      });
    }

    doc.save(`tutor-schedule-${type}.pdf`);
  };


  function getStartOfWeek() {
    const date = new Date();
    const diff = date.getDate() - date.getDay() + 1;
    return new Date(date.setDate(diff)).toDateString();
  }

  function getEndOfWeek() {
    const date = new Date();
    const diff = date.getDate() - date.getDay() + 7;
    return new Date(date.setDate(diff)).toDateString();
  }


  return (
    <main className="bg-[#F5F5EF] min-h-screen">
      <TutorHeader />

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-black mb-2">Your Sessions</h1>
        <p className="text-lg text-black mb-6">You have these sessions to attend</p>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <select
            className="border border-gray-300 px-4 py-2 rounded-full text-sm"
            value={printOption}
            onChange={(e) => setPrintOption(e.target.value as 'today' | 'week')}
          >
            <option value="today">Print Today&apos;s Schedule</option>
            <option value="week">Print This Week&apos;s Schedule</option>
          </select>
          <button
            onClick={() => handlePrintSchedule(printOption)}
            className="bg-[#E8B14F] text-white font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-500"
          >
            Download PDF
          </button>
        </div>


        <div className="bg-white rounded-xl p-6 shadow-md space-y-8">
          {sessions.map((session) => {
            const canJoin = !!session.room_link;
            const formatted = formatDateTime(session.scheduled_datetime);

            return (
              <div
                key={session.session_id}
                className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <button
                  className="absolute top-4 right-4 text-[#DE5462]"
                  onClick={() => handleCancelClick(session)}
                  title="Cancel Session"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="space-y-2">
                  <p className="font-bold text-[14px]">
                    <span className="font-extrabold text-black">{session.course_code}</span> - {session.course_name}
                  </p>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-black">
                    <span className="text-[18px]">📅</span>
                    <span>{formatted}</span>
                  </div>
                  <p className="text-sm font-bold text-black">With: {session.tutee_name}</p>
                  {session.tutee_avg_rating !== null && !isNaN(Number(session.tutee_avg_rating)) && (
                    <p className="text-sm font-bold text-black">
                      Rating: {Number(session.tutee_avg_rating).toFixed(1)} ⭐
                    </p>
                  )}

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
                        onClick={() => handleCancelClick(session)}
                      >
                        Cancel Session
                      </button>
                    ) : (
                      <p className="text-sm text-gray-600 italic">Cannot cancel within 24h</p>
                    )}
                  </div>
                </div>

                <div className="w-full flex justify-center sm:justify-end -space-x-4 mt-4 sm:mt-0">
                  <img
                    src={session.tutor_photo || '/imgs/default-profile.png'}
                    alt="Tutor"
                    className="w-16 h-16 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src={session.tutee_photo || '/imgs/default-profile.png'}
                    alt="Tutee"
                    className="w-16 h-16 rounded-full border-2 border-white object-cover"
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

      {cancelModalOpen && sessionToCancel && (
        <ModalPortal>
          <CancelSessionModal
            sessionId={sessionToCancel.session_id}
            role="tutor"
            onClose={() => {
              setCancelModalOpen(false);
              setSessionToCancel(null);
            }}
            onCancelSuccess={handleCancelSuccess}
          />
        </ModalPortal>
      )}
    </main>
  );
}
