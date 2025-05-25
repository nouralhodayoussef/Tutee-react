'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import TuteeHeader from '../../layout/TuteeHeader';
import { motion, AnimatePresence } from 'framer-motion';

interface Session {
  course_code: string;
  course_name: string;
  scheduled_date: string;
  slot_time: string;
  tutor_name: string;
  tutor_photo?: string;
}

interface Tutor {
  name: string;
  bio: string;
  rating?: number;
  tutee_count?: number;
  course_count?: number;
  photo?: string;
  id?: number;
}

export default function TuteeHome() {
  const [firstName, setFirstName] = useState('');
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [courses, setCourses] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('http://localhost:4000/tutee/home', {
        credentials: 'include',
      });

      if (res.ok) {
        const json = await res.json();

        if (json.next_session?.tutor_photo?.includes('drive.google.com')) {
          const match = json.next_session.tutor_photo.match(/[-\w]{25,}/);
          const fileId = match ? match[0] : '';
          json.next_session.tutor_photo = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }

        if (Array.isArray(json.tutors)) {
          json.tutors = json.tutors.map((tutor: Tutor) => {
            if (tutor.photo?.includes('drive.google.com')) {
              const match = tutor.photo.match(/[-\w]{25,}/);
              const fileId = match ? match[0] : '';
              tutor.photo = `https://drive.google.com/uc?export=view&id=${fileId}`;
            }
            return tutor;
          });
        }

        setFirstName(json.first_name || '');
        setNextSession(json.next_session || null);
        setTutors(json.tutors || []);
        setCourses(json.courses || []);
      } else {
        console.error('Failed to fetch data');
      }
    };

    fetchData();
  }, []);

  // Animation variants
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.13,
      },
    },
  };

  const cardFade = {
    hidden: { opacity: 0, y: 32 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 16 } },
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 32 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <main className="min-h-screen bg-[#F5F5EF]">
      <TuteeHeader />

      <motion.section
        initial="hidden"
        animate="show"
        variants={container}
        className="w-full px-6 sm:px-10 md:px-24 py-12"
      >
        {/* Hero & Session Card */}
        <motion.div
          variants={cardFade}
          className="bg-white rounded-2xl shadow-md p-8 mb-20 flex flex-col lg:flex-row justify-between items-center gap-12"
        >
          <motion.div className="flex-1" variants={fadeIn}>
            <motion.h1
              className="text-3xl sm:text-4xl font-bold text-black mb-2"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              Welcome, {firstName}!
            </motion.h1>
            <motion.p
              className="text-sm sm:text-base font-medium text-black mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              Your Booked Sessions
            </motion.p>

            <AnimatePresence>
              {nextSession ? (
                <motion.div
                  key="session"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 16 }}
                  className="bg-[#F5F5F5] p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex-1 text-left">
                    <p className="text-sm sm:text-base">
                      <strong>{nextSession.course_code}</strong> - {nextSession.course_name}
                    </p>
                    <div className="flex items-center mt-2">
                      <Image
                        src="/imgs/calendar-icon.png"
                        alt="Calendar Icon"
                        width={40}
                        height={40}
                        className="mr-2"
                      />
                      <p className="font-bold text-sm sm:text-base">
                        {new Date(nextSession.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })} at {nextSession.slot_time}
                      </p>
                    </div>
                    <p className="text-sm mt-2">
                      <strong>With:</strong> {nextSession.tutor_name}
                    </p>
                  </div>
                  <motion.div
                    className="w-[100px] h-[100px] relative rounded-full overflow-hidden border-4 border-white shadow-md"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.18, type: 'spring', stiffness: 150, damping: 18 }}
                  >
                    <Image
                      src={nextSession.tutor_photo || '/imgs/tutor-pic.png'}
                      alt="Tutor Profile"
                      fill
                      unoptimized
                      className="object-cover rounded-full"
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.p
                  key="nosession"
                  className="text-base sm:text-lg text-black mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  You don’t have any booked sessions yet!
                  <br />
                  Find a Tutor and a Course and get started now!
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div className="mt-6 flex items-center gap-4">
              <Link href="/tutee-findcourse">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow"
                >
                  Search & Schedule
                </motion.button>
              </Link>
              <ArrowRight className="text-[#E8B14F] w-6 h-6" />
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            className="max-w-[350px]"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.22, duration: 0.7, type: 'spring', stiffness: 120 }}
          >
            <Image
              src="/imgs/tutee-hero.png"
              alt="Hero Illustration"
              width={350}
              height={333}
              className="w-full h-auto"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Activity Grid */}
        <motion.div variants={fadeIn} className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
            Your Activity:
          </h2>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            variants={container}
          >
            {/* Tutors */}
            <motion.div
              variants={cardFade}
              className="bg-white rounded-2xl shadow-md p-6 space-y-6"
            >
              <p className="text-lg font-semibold text-black">Your Tutors:</p>
              <AnimatePresence>
                {tutors.length ? (
                  tutors.map((tutor, idx) => (
                    <motion.div
                      key={idx}
                      variants={cardFade}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="bg-[#f5f5f5] rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="w-[64px] h-[64px] relative rounded-full overflow-hidden border-2 border-white shadow-md">
                        <Image
                          src={tutor.photo || '/imgs/tutor-pic.png'}
                          alt="Tutor"
                          fill
                          unoptimized
                          className="object-cover rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-black text-sm sm:text-base">{tutor.name}</p>
                        <p className="text-gray-700 text-sm">{tutor.bio}</p>
                        <div className="flex gap-4 text-xs text-gray-600 mt-2">
                          <span>👤 {tutor.tutee_count ?? 0} Tutee</span>
                          <span>⭐ {tutor.rating ?? 5} Rating</span>
                          <span>📚 {tutor.course_count ?? 0} Sessions</span>
                        </div>
                      </div>
                      <Link href={`/tutee/tutor-profile/${tutor.id}`}>
                        <button className="bg-[#E8B14F] text-black font-bold px-4 py-2 text-xs rounded-full shadow">
                          Schedule
                        </button>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <motion.p
                    className="text-base text-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    You don’t have any Tutor yet!
                    <br />
                    Find a Tutor and a Course and get started now!
                  </motion.p>
                )}
              </AnimatePresence>
              <Link href="tutee/find-tutor">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow"
                >
                  Find A Tutor
                </motion.button>
              </Link>
            </motion.div>

            {/* Courses */}
            <motion.div
              variants={cardFade}
              className="bg-white rounded-2xl shadow-md p-6 space-y-6"
            >
              <p className="text-lg font-semibold text-black">Your Courses:</p>
              <AnimatePresence>
                {courses.length ? (
                  <div className="flex flex-wrap gap-2">
                    {courses.map((course, idx) => (
                      <motion.span
                        key={idx}
                        variants={cardFade}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        className="bg-[#E8B14F] text-white text-sm px-4 py-2 rounded-full font-bold"
                      >
                        {course}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <motion.p
                    className="text-base text-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    You don’t have any courses yet!
                    <br />
                    Find a Tutor and a Course and get started now!
                  </motion.p>
                )}
              </AnimatePresence>
              <Link href="/tutee-findcourse">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow"
                >
                  Find A Course
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </main>
  );
}
