'use client';

import { useEffect, useState } from 'react';
import TuteeHeader from '@/components/layout/TuteeHeader';
import CancelSessionModal from '@/components/CancelSessionModal';
import RoleProtected from "@/components/security/RoleProtected";
import { Trash2, Star } from 'lucide-react';
import RateTutorModal from '@/components/tutee/RateTutorModal';

type ViewType = 'scheduled' | 'completed' | 'cancelled';

interface Session {
  session_id: number;
  scheduled_datetime: string;
  room_link: string | null;
  tutor_name: string;
  tutor_photo: string | null;
  tutee_photo: string | null;
  course_code: string;
  course_name: string;
}

interface CompletedSession extends Session {
  tutor_rating: number | null;
}

interface CancelledSession extends Session {
  canceled_by_role?: string | null;
  reason_note?: string | null;
  cancelled_at?: string | null;
}
export default function TuteeBookedSessions() {
  // STATE
  const [view, setView] = useState<ViewType>('scheduled');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelledSessions, setCancelledSessions] = useState<CancelledSession[]>([]);

  // For rating
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [sessionToRate, setSessionToRate] = useState<CompletedSession | null>(null);
  const [, setRating] = useState<number>(0);
  const [, setRateError] = useState<string>("");

  // --- DATA LOADERS ---
  useEffect(() => {
    // Scheduled
    fetch('http://localhost:4000/tutee/booked-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(setSessions)
      .catch(() => console.error('Failed to load sessions'));
    // Completed
    fetch('http://localhost:4000/tutee/completed-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(setCompletedSessions)
      .catch(() => console.error('Failed to load completed sessions'));
    // Cancelled
    fetch('http://localhost:4000/tutee/cancelled-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(setCancelledSessions)
      .catch(() => console.error('Failed to load cancelled sessions'));
  }, []);

  // --- HELPERS ---
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
  const isCancelable = (datetime: string) => {
    const time = new Date(datetime).getTime();
    return time - Date.now() > 24 * 60 * 60 * 1000;
  };
  const handleCancelSuccess = () => {
    if (sessionToCancel) {
      setSessions(prev => prev.filter(s => s.session_id !== sessionToCancel.session_id));
    }
    setCancelModalOpen(false);
    setSessionToCancel(null);
  };
  // --- RATING LOGIC ---
  const openRateModal = (session: CompletedSession) => {
    setSessionToRate(session);
    setRating(0);
    setRateModalOpen(true);
    setRateError("");
  };


  // --- SESSION TABS ---
  const tabClass = (type: ViewType) =>
    "px-5 py-2 rounded-full font-semibold transition " +
    (view === type
      ? "bg-[#E8B14F] text-white shadow"
      : "bg-gray-100 text-black hover:bg-gray-200");

  // --- RENDER SELECTED SESSIONS ---
  function renderSessions() {
    if (view === 'scheduled') {
      return (
        <div className="bg-white rounded-xl p-6 shadow-md space-y-8">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-700 mb-6">
                You don&apos;t have any upcoming booked sessions.
              </h2>
              <div className="flex justify-center gap-4 flex-wrap">
                <a
                  href="/tutee-findcourse"
                  className="bg-[#E8B14F] hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-full shadow transition"
                >
                  🎯 Find a Course
                </a>
                <a
                  href="/find-tutor"
                  className="bg-[#E8B14F] hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-full shadow transition"
                >
                  🧑‍🏫 Find a Tutor
                </a>
              </div>
            </div>
          ) : sessions.map((session) => {
            const formatted = formatDateTime(session.scheduled_datetime);
            const canJoin = !!session.room_link;
            const cancelable = isCancelable(session.scheduled_datetime);

            return (
              <div
                key={session.session_id}
                className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                {/* Trash icon = cancel */}
                {cancelable && (
                  <button
                    className="absolute top-4 right-4 text-[#DE5462]"
                    onClick={() => {
                      setSessionToCancel(session);
                      setCancelModalOpen(true);
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
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
                    With: {session.tutor_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {canJoin ? (
                      <>
                        <a
                          href={`/session/setup/${session.room_link}`}
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
                {/* Photos */}
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
                  <p className="text-sm font-bold text-black">
                    With: {session.tutor_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {session.tutor_rating == null ? (
                      <button
                        className="bg-[#E8B14F] text-black font-bold text-xs px-6 py-2 rounded-full"
                        onClick={() => openRateModal(session)}
                      >
                        Rate Tutor
                      </button>
                    ) : (
                      <span className="text-yellow-500 font-bold text-sm flex items-center gap-1">
                        <Star className="w-4 h-4 inline" />
                        {session.tutor_rating} (You rated)
                      </span>
                    )}
                  </div>
                </div>
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
                    With: {session.tutor_name}
                  </p>
                  <p className="text-xs text-red-500 font-bold pt-2">
                    Session Cancelled
                    {session.canceled_by_role && <> by <span className="capitalize">{session.canceled_by_role}</span></>}
                    {session.reason_note && <> — Reason: <span className="text-black font-medium">{session.reason_note}</span></>}
                  </p>
                </div>
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
      );
    }
    return null;
  }

  // --- MAIN RENDER ---
  return (
    <RoleProtected requiredRoles={['tutee']}>
      <main className="bg-[#F5F5EF] min-h-screen">
        <TuteeHeader />

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

        {/* Cancel Modal */}
        {cancelModalOpen && sessionToCancel && (
          <CancelSessionModal
            sessionId={sessionToCancel.session_id}
            role="tutee"
            onClose={() => setCancelModalOpen(false)}
            onCancelSuccess={handleCancelSuccess}
          />
        )}

        {/* Rate Modal */}
        {rateModalOpen && sessionToRate && (
          <RateTutorModal
            sessionId={sessionToRate.session_id}
            tutorName={sessionToRate.tutor_name}
            onClose={() => setRateModalOpen(false)}
            onSuccess={(stars) => {
              setCompletedSessions(prev =>
                prev.map(s => s.session_id === sessionToRate.session_id
                  ? { ...s, tutor_rating: stars }
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
