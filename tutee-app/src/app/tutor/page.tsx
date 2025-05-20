'use client';

import { useEffect, useState } from 'react';
import TutorHeader from '@/components/layout/TutorHeader';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import CompleteProfileModal from '@/components/Tutor/CompleteProfileModal';
import SetScheduleModal from '@/components/Tutor/SetScheduleModal';
import RoleProtected from "@/components/security/RoleProtected";
interface Tutee {
  name: string;
  photo?: string;
  avg_rating?: number;
  university_name?: string;
  major_name?: string;
  session_count?: number;
}

interface Course {
  course_code: string;
  course_name: string;
}

interface Session {
  course_code: string;
  course_name: string;
  scheduled_date: string;
  slot_time: string;
  tutee_name: string;
  tutee_photo?: string;
}

export default function TutorHomePage() {
  const [tutorName, setTutorName] = useState('');
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [tutees, setTutees] = useState<Tutee[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutor/dashboard', {
          credentials: 'include',
        });
        const data = await res.json();
        console.log('📦 Tutees data:', data.tutees);

        setTutorName(data.firstName || 'Tutor');
        setNextSession(data.nextSession || null);
        setTutees(data.tutees || []);
        setCourses(data.courses || []);
      } catch (err) {
        console.error('❌ Error loading tutor dashboard:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <RoleProtected requiredRoles={['tutor']}>
    <main className="min-h-screen bg-[#F5F5EF]">
      <CompleteProfileModal />
      <SetScheduleModal />
      <TutorHeader />

      <section className="w-full px-6 sm:px-10 md:px-24 py-12">
        {/* Welcome & Next Session */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-20 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
              Welcome, {tutorName}!
            </h1>
            <p className="text-sm sm:text-base font-medium text-black mb-6">
              Your Upcoming Session
            </p>

            {nextSession ? (
              <div className="bg-[#F5F5F5] p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
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
                      {nextSession.scheduled_date} at {nextSession.slot_time}
                    </p>
                  </div>
                  <p className="text-sm mt-2">
                    <strong>With:</strong> {nextSession.tutee_name}
                  </p>
                </div>
                <div className="w-[100px] h-[100px] rounded-full border-4 border-white shadow-md overflow-hidden">
                  <Image
                    src={nextSession.tutee_photo || '/imgs/tutee-profile.png'}
                    alt={nextSession.tutee_name}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <p className="text-base sm:text-lg text-black mb-4">
                You don’t have any scheduled sessions yet!
              </p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <Link href="/tutor/bookedSessions">
                <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                  See All Scheduled Sessions
                </button>
              </Link>
              <ArrowRight className="text-[#E8B14F] w-6 h-6" />
            </div>
          </div>

          <div className="max-w-[350px]">
            <Image
              src="/imgs/tutee-hero.png"
              alt="Hero Illustration"
              width={350}
              height={333}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Activity Section */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Your Activity:</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tutees */}
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
              <p className="text-lg font-semibold text-black">Previous Tutees:</p>
              {tutees.length > 0 ? (
                tutees.map((tutee, idx) => (
                  <div key={idx} className="bg-[#f5f5f5] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-[64px] h-[64px] rounded-full border-2 border-white shadow-sm overflow-hidden">
                      <Image
                        src={tutee.photo || '/imgs/tutee-profile.png'}
                        alt={tutee.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-black text-sm sm:text-base">{tutee.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-1">
                        {tutee.major_name && (
                          <span className="flex items-center gap-1">🎓 {tutee.major_name}</span>
                        )}
                        {tutee.university_name && (
                          <span className="flex items-center gap-1">🏛 {tutee.university_name}</span>
                        )}
                        {typeof tutee.session_count === 'number' && (
                          <span className="flex items-center gap-1">
                            📚 {tutee.session_count} session{tutee.session_count !== 1 ? 's' : ''}
                          </span>
                        )}
                        {tutee.avg_rating !== undefined && !isNaN(Number(tutee.avg_rating)) && (
                          <span className="flex items-center gap-1">
                            ⭐ {Number(tutee.avg_rating).toFixed(1)}
                          </span>
                        )}


                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-base text-black">You haven’t tutored anyone yet.</p>
              )}
            </div>

            {/* Courses */}
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
              <p className="text-lg font-semibold text-black">Active Courses:</p>
              {courses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {courses.map((course, idx) => (
                    <span
                      key={idx}
                      className="bg-[#E8B14F] text-white text-sm px-4 py-2 rounded-full font-bold"
                    >
                      {course.course_code}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base text-black">You don’t have any active courses yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
    </RoleProtected>
  );
}
