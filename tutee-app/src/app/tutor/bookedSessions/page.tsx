'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TutorHeader from '@/components/layout/TutorHeader';
import RoleProtected from "@/components/security/RoleProtected";
import CompleteProfileModal from '@/components/Tutor/CompleteProfileModal';
import SetScheduleModal from '@/components/Tutor/SetScheduleModal';
import CheckMaterialModal from '@/components/CheckMaterialModal';
import CancelSessionModal from '@/components/CancelSessionModal';
import ModalPortal from '@/components/ModalPortal';
import RateTuteeModal from '@/components/Tutor/RateTuteeModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Star } from 'lucide-react';
import { tuteeLogoBase64 } from '@/utils/pdfLogo';

type ViewType = 'scheduled' | 'completed' | 'cancelled';


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
interface CompletedSession extends Session {
  tutee_rating: number | null;
}

interface CancelledSession extends Session {
  canceled_by_role?: string | null;
  reason_note?: string | null;
  cancelled_at?: string | null;
}

export default function TutorSessionsPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewType>('scheduled');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [cancelledSessions, setCancelledSessions] = useState<CancelledSession[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [printOption, setPrintOption] = useState<'today' | 'week'>('today');
  const [tutorName, setTutorName] = useState<string>('');

  // Rate Tutee Modal
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [sessionToRate, setSessionToRate] = useState<CompletedSession | null>(null);

  useEffect(() => {
    // Scheduled Sessions
    fetch('http://localhost:4000/tutor/booked-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const sorted = (data.bookedSessions || []).sort((a: Session, b: Session) => {
          const dateA = new Date(a.scheduled_datetime.replace(' ', 'T')).getTime();
          const dateB = new Date(b.scheduled_datetime.replace(' ', 'T')).getTime();
          return dateA - dateB;
        });
        setSessions(sorted);
        setTutorName(data.tutorName || '');
      });

    // Completed Sessions
    fetch('http://localhost:4000/tutor/completed-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(setCompletedSessions);

    // Cancelled Sessions
    fetch('http://localhost:4000/tutor/cancelled-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(setCancelledSessions);
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
  // Tabs UI class
  const tabClass = (type: ViewType) =>
    "px-5 py-2 rounded-full font-semibold transition " +
    (view === type
      ? "bg-[#E8B14F] text-white shadow"
      : "bg-gray-100 text-black hover:bg-gray-200");

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

      hours.forEach((hour, row) => {
        doc.setFontSize(10);
        doc.setTextColor(0);
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
  // --- RENDER SELECTED SESSIONS ---
  function renderSessions() {
    if (view === 'scheduled') {
      return (
        <div className="bg-white rounded-xl p-6 shadow-md space-y-8">
          <div className="border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center gap-4">
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
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-700 mb-6">
                You don&apos;t have any upcoming booked sessions.
              </h2>
              <div className="flex justify-center gap-4 flex-wrap">
                <a
                  href="/tutor/editSchedule"
                  className="bg-[#E8B14F] hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-full shadow transition"
                >
                  ✏️ Edit Your Schedule
                </a>
                <a
                  href="/tutor-edit-profile"
                  className="bg-[#E8B14F] hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-full shadow transition"
                >
                  🧑‍🏫 Edit Your Profile
                </a>
              </div>
            </div>
          ) : sessions.map((session) => {
            const canJoin = !!session.room_link;
            const formatted = formatDateTime(session.scheduled_datetime);

            return (
              <div
                key={session.session_id}
                className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
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
      );
    }
    if (view === 'completed') {
      return (
        <div className="bg-white rounded-xl p-6 shadow-md space-y-8">
          {completedSessions.length === 0 ? (
            <p className="text-center text-gray-600">You have no completed sessions yet.</p>
          ) : completedSessions.map((session) => {
            const formatted = formatDateTime(session.scheduled_datetime);
            return (
              <div
                key={session.session_id}
                className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-2">
                  <p className="font-bold text-[14px]">
                    <span className="font-extrabold text-black">{session.course_code}</span> - {session.course_name}
                  </p>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-black">
                    <span className="text-[18px]">📅</span>
                    <span>{formatted}</span>
                  </div>
                  <p className="text-sm font-bold text-black">With: {session.tutee_name}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {session.tutee_rating == null ? (
                      <button
                        className="bg-[#E8B14F] text-black font-bold text-xs px-6 py-2 rounded-full"
                        onClick={() => {
                          setSessionToRate(session);
                          setRateModalOpen(true);
                        }}
                      >
                        Rate Tutee
                      </button>
                    ) : (
                      <span className="text-yellow-500 font-bold text-sm flex items-center gap-1">
                        <Star className="w-4 h-4 inline" />
                        {session.tutee_rating} (You rated)
                      </span>
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
      );
    }
    if (view === 'cancelled') {
      return (
        <div className="bg-white rounded-xl p-6 shadow-md space-y-8">
          {cancelledSessions.length === 0 ? (
            <p className="text-center text-gray-600">You have no cancelled sessions yet.</p>
          ) : cancelledSessions.map((session) => {
            const formatted = formatDateTime(session.scheduled_datetime);
            return (
              <div
                key={session.session_id}
                className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-60"
              >
                <div>
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
                  <p className="text-xs text-red-500 font-bold pt-2">
                    Session Cancelled
                    {session.canceled_by_role && <> by <span className="capitalize">{session.canceled_by_role}</span></>}
                    {session.reason_note && <> — Reason: <span className="text-black font-medium">{session.reason_note}</span></>}
                  </p>
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
      );
    }
    return null;
  }
  // --- MAIN RENDER ---
  return (
    <RoleProtected requiredRoles={['tutor']}>
      <main className="bg-[#F5F5EF] min-h-screen">
        <CompleteProfileModal />
        <SetScheduleModal />
        <TutorHeader />

        <section className="max-w-6xl mx-auto px-6 py-12">
          {/* Tabs Toggle */}
          <div className="flex gap-3 mb-8">
            <button className={tabClass('scheduled')} onClick={() => setView('scheduled')}>Scheduled</button>
            <button className={tabClass('completed')} onClick={() => setView('completed')}>Completed</button>
            <button className={tabClass('cancelled')} onClick={() => setView('cancelled')}>Cancelled</button>
          </div>

          {/* Section Header */}
          <h1 className="text-4xl font-bold text-black mb-2">
            {view === 'scheduled' && 'Your Sessions'}
            {view === 'completed' && 'Completed Sessions'}
            {view === 'cancelled' && 'Cancelled Sessions'}
          </h1>
          <p className="text-lg text-black mb-10">
            {view === 'scheduled' && 'You have these sessions to attend'}
            {view === 'completed' && 'Your finished sessions'}
            {view === 'cancelled' && 'Previously cancelled sessions'}
          </p>

          {/* Sessions */}
          {renderSessions()}
        </section>

        {/* Check Materials Modal */}
        {modalOpen && (
          <ModalPortal>
            <CheckMaterialModal
              materials={selectedMaterials}
              onClose={() => setModalOpen(false)}
            />
          </ModalPortal>
        )}

        {/* Cancel Modal */}
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

        {/* Rate Tutee Modal */}
        {rateModalOpen && sessionToRate && (
          <RateTuteeModal
            sessionId={sessionToRate.session_id}
            tuteeName={sessionToRate.tutee_name}
            onClose={() => setRateModalOpen(false)}
            onSuccess={(stars) => {
              setCompletedSessions(prev =>
                prev.map(s => s.session_id === sessionToRate.session_id
                  ? { ...s, tutee_rating: stars }
                  : s
                )
              );
            }}
          />
        )}
      </main>
    </RoleProtected>
  );
}