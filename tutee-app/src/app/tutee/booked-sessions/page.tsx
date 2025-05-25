/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import TuteeHeader from '@/components/layout/TuteeHeader';
import CancelSessionModal from '@/components/CancelSessionModal';
import RoleProtected from "@/components/security/RoleProtected";
import { Trash2, Star } from 'lucide-react';
import RateTutorModal from '@/components/tutee/RateTutorModal';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

  // For rateSession param
  const searchParams = useSearchParams();
  const rateSessionIdStr = searchParams.get('rateSession');
  const rateSessionId = rateSessionIdStr && !isNaN(Number(rateSessionIdStr)) ? Number(rateSessionIdStr) : null;
  const [thankYou, setThankYou] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4000/tutee/booked-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(setSessions)
      .catch(() => console.error('Failed to load sessions'));
    fetch('http://localhost:4000/tutee/completed-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(setCompletedSessions)
      .catch(() => console.error('Failed to load completed sessions'));
    fetch('http://localhost:4000/tutee/cancelled-sessions', { credentials: 'include' })
      .then(res => res.json())
      .then(setCancelledSessions)
      .catch(() => console.error('Failed to load cancelled sessions'));
  }, []);

  useEffect(() => {
    if (rateSessionId && (sessions.length > 0 || completedSessions.length > 0)) {
      let sessionToRate: CompletedSession | undefined = completedSessions.find(s => Number(s.session_id) === rateSessionId);

      if (!sessionToRate) {
        const s = sessions.find(s => Number(s.session_id) === rateSessionId);
        if (s) sessionToRate = { ...s, tutor_rating: null };
      }
      if (sessionToRate && sessionToRate.tutor_rating == null) {
        setSessionToRate(sessionToRate);
        setRateModalOpen(true);
      }
    }
  }, [rateSessionId, sessions, completedSessions]);

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
  const openRateModal = (session: CompletedSession) => {
    setSessionToRate(session);
    setRating(0);
    setRateModalOpen(true);
    setRateError("");
  };
  const tabClass = (type: ViewType) =>
    "px-5 py-2 rounded-full font-semibold transition " +
    (view === type
      ? "bg-[#E8B14F] text-white shadow"
      : "bg-gray-100 text-black hover:bg-gray-200");

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.10,
        type: 'spring',
        stiffness: 120,
        damping: 18,
      }
    }),
    exit: { opacity: 0, y: 20, transition: { duration: 0.13 } },
  };

  const listContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } }
  };

  // --- RENDER SESSIONS ---
  function renderSessions() {
    let arr: (Session | CompletedSession | CancelledSession)[] = [];
    if (view === 'scheduled') arr = sessions;
    if (view === 'completed') arr = completedSessions;
    if (view === 'cancelled') arr = cancelledSessions;

    const isEmpty = arr.length === 0;

    return (
      <motion.div
        key={view}
        variants={listContainer}
        initial="hidden"
        animate="show"
        exit="hidden"
        className="bg-white rounded-xl p-6 shadow-md space-y-8"
      >
        <AnimatePresence>
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              {view === 'scheduled' && (
                <>
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
                </>
              )}
              {view === 'completed' && (
                <p className="text-center text-gray-600">You have no completed sessions yet.</p>
              )}
              {view === 'cancelled' && (
                <p className="text-center text-gray-600">You have no cancelled sessions yet.</p>
              )}
            </motion.div>
          ) : arr.map((session, i) => {
            const formatted = formatDateTime(session.scheduled_datetime);
            if (view === 'scheduled') {
              const s = session as Session;
              const canJoin = !!s.room_link;
              const cancelable = isCancelable(s.scheduled_datetime);
              return (
                <motion.div
                  layout
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  key={s.session_id}
                  className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  {cancelable && (
                    <button
                      className="absolute top-4 right-4 text-[#DE5462]"
                      onClick={() => {
                        setSessionToCancel(s);
                        setCancelModalOpen(true);
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <div className="space-y-2">
                    <p className="font-bold text-[14px]">
                      <span className="font-extrabold text-black">{s.course_code}</span> - {s.course_name}
                    </p>
                    <div className="flex items-center space-x-2 text-sm font-semibold text-black">
                      <span className="text-[18px]">📅</span>
                      <span>{formatted}</span>
                    </div>
                    <p className="text-sm font-bold text-black">
                      With: {s.tutor_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {canJoin ? (
                        <>
                          <a
                            href={`/session/setup/${s.room_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#E8B14F] hover:bg-[#d9a13e] text-black font-bold text-xs px-6 py-2 rounded-full"
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
                  <div className="flex -space-x-4 self-end sm:self-auto sm:mr-4">
                    <img
                      src={s.tutor_photo || '/imgs/default-profile.png'}
                      alt="Tutor"
                      className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    />
                    <img
                      src={s.tutee_photo || '/imgs/default-profile.png'}
                      alt="Tutee"
                      className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    />
                  </div>
                </motion.div>
              );
            }
            if (view === 'completed') {
              const c = session as CompletedSession;
              return (
                <motion.div
                  layout
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  key={c.session_id}
                  className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-2">
                    <p className="font-bold text-[14px]">
                      <span className="font-extrabold text-black">{c.course_code}</span> - {c.course_name}
                    </p>
                    <div className="flex items-center space-x-2 text-sm font-semibold text-black">
                      <span className="text-[18px]">📅</span>
                      <span>{formatted}</span>
                    </div>
                    <p className="text-sm font-bold text-black">
                      With: {c.tutor_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {c.tutor_rating == null ? (
                        <button
                          className="bg-[#E8B14F] cursor-pointer hover:bg-[#d9a13e] text-black font-bold text-xs px-6 py-2 rounded-full"
                          onClick={() => openRateModal(c)}
                        >
                          Rate Tutor
                        </button>
                      ) : (
                        <span className="text-yellow-500 font-bold text-sm flex items-center gap-1">
                          <Star className="w-4 h-4 inline" />
                          {c.tutor_rating} (You rated)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex -space-x-4 self-end sm:self-auto sm:mr-4">
                    <img
                      src={c.tutor_photo || '/imgs/default-profile.png'}
                      alt="Tutor"
                      className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    />
                    <img
                      src={c.tutee_photo || '/imgs/default-profile.png'}
                      alt="Tutee"
                      className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    />
                  </div>
                </motion.div>
              );
            }
            if (view === 'cancelled') {
              const can = session as CancelledSession;
              return (
                <motion.div
                  layout
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  key={can.session_id}
                  className="relative bg-[#F9F9F9] rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-60"
                >
                  <div>
                    <p className="font-bold text-[14px]">
                      <span className="font-extrabold text-black">{can.course_code}</span> - {can.course_name}
                    </p>
                    <div className="flex items-center space-x-2 text-sm font-semibold text-black">
                      <span className="text-[18px]">📅</span>
                      <span>{formatted}</span>
                    </div>
                    <p className="text-sm font-bold text-black">
                      With: {can.tutor_name}
                    </p>
                    <p className="text-xs text-red-500 font-bold pt-2">
                      Session Cancelled
                      {can.canceled_by_role && <> by <span className="capitalize">{can.canceled_by_role}</span></>}
                      {can.reason_note && <> — Reason: <span className="text-black font-medium">{can.reason_note}</span></>}
                    </p>
                  </div>
                  <div className="flex -space-x-4 self-end sm:self-auto sm:mr-4">
                    <img
                      src={can.tutor_photo || '/imgs/default-profile.png'}
                      alt="Tutor"
                      className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    />
                    <img
                      src={can.tutee_photo || '/imgs/default-profile.png'}
                      alt="Tutee"
                      className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    />
                  </div>
                </motion.div>
              );
            }
            return null;
          })}
        </AnimatePresence>
      </motion.div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <RoleProtected requiredRoles={['tutee']}>
      <main className="bg-[#F5F5EF] min-h-screen">
        <TuteeHeader />

        <section className="max-w-6xl mx-auto px-6 py-12">
          {/* Tabs Toggle */}
          <div className="flex gap-3 mb-8">
            <button className={`${tabClass('scheduled')} cursor-pointer`}onClick={() => setView('scheduled')}>Scheduled</button>
            <button className={`${tabClass('completed')} cursor-pointer`} onClick={() => setView('completed')}>Completed</button>
            <button className={`${tabClass('cancelled')} cursor-pointer`} onClick={() => setView('cancelled')}>Canceled</button>
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
          <AnimatePresence mode="wait">{renderSessions()}</AnimatePresence>
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
              setRateModalOpen(false);
              setThankYou(true);

              setCompletedSessions(prev =>
                prev.map(s => s.session_id === sessionToRate.session_id
                  ? { ...s, tutor_rating: stars }
                  : s
                )
              );

              setTimeout(() => {
                setThankYou(false);
                // Reload session lists
                fetch('http://localhost:4000/tutee/booked-sessions', { credentials: 'include' })
                  .then(res => res.json())
                  .then(setSessions)
                  .catch(() => { });
                fetch('http://localhost:4000/tutee/completed-sessions', { credentials: 'include' })
                  .then(res => res.json())
                  .then(setCompletedSessions)
                  .catch(() => { });
                fetch('http://localhost:4000/tutee/cancelled-sessions', { credentials: 'include' })
                  .then(res => res.json())
                  .then(setCancelledSessions)
                  .catch(() => { });
                // Optionally, remove the ?rateSession param from URL:
                if (window.history.replaceState) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('rateSession');
                  window.history.replaceState({}, '', url.pathname);
                }
              }, 2000);
            }}
          />
        )}
      </main>
    </RoleProtected>
  );
}
