'use client';

import { useEffect, useState } from 'react';
import TutorHeader from '@/components/layout/TutorHeader';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TutorDashboard() {
  const [data, setData] = useState<{
    upcomingSession: any;
    previousTutees: any[];
    activeCourses: string[];
  } | null>(null);

  const [tutorName, setTutorName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardRes = await fetch('http://localhost:4000/tutor/home', {
          credentials: 'include',
        });
        const dashboardData = await dashboardRes.json();
        setData(dashboardData);

        const infoRes = await fetch('http://localhost:4000/tutor/info', {
          credentials: 'include',
        });
        const infoData = await infoRes.json();
        setTutorName(infoData.first_name || 'Tutor');
      } catch (err) {
        console.error('❌ Error loading tutor dashboard:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F5EF]">
      <TutorHeader />

      <section className="w-full px-6 sm:px-10 md:px-24 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col lg:flex-row justify-between items-center gap-8 mb-20">
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-black">
              Welcome, {tutorName || '...'}!
            </h1>
            <p className="text-sm sm:text-base font-medium text-black">Your Upcoming Session</p>

            {data?.upcomingSession ? (
              <div className="space-y-2">
                <p className="text-base sm:text-lg text-black">
                  <strong>{data.upcomingSession.course_code}</strong> - {data.upcomingSession.course_name}
                </p>
                <p className="text-sm text-black">With: {data.upcomingSession.tutee_name}</p>
                <p className="text-sm text-black">
                  {data.upcomingSession.date} at {data.upcomingSession.time}
                </p>
              </div>
            ) : (
              <p className="text-base sm:text-lg text-black">
                You don’t have any scheduled sessions yet!
              </p>
            )}

            <Link href="#scheduling">
              <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow mt-2">
                See All Scheduled Sessions
              </button>
            </Link>
          </div>

          <div className="relative w-full max-w-[365px] h-[334px] hidden md:block">
            <Image
              src="/imgs/tutee-hero.png"
              alt="Tutor Hero Illustration"
              width={365}
              height={334}
              className="object-contain"
            />
          </div>
        </div>

        {/* Your Activity Section (TuteeHome style) */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Your Activity:</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Previous Tutees Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
              <p className="text-lg font-semibold text-black">Previous Tutees:</p>
              {data?.previousTutees?.length ? (
                data.previousTutees.map((tutee, idx) => (
                  <div key={idx} className="bg-[#f5f5f5] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-[64px] h-[64px] rounded-full overflow-hidden">
                      <Image
                        src="/imgs/tutee-profile.png"
                        alt="Tutee"
                        width={64}
                        height={64}
                        className="object-cover rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-black text-sm sm:text-base">{tutee.name}</p>
                      <div className="flex gap-2 text-xs text-gray-600 mt-1">
                        <span>🎓 {tutee.major}</span>
                        <span>🏛 {tutee.university}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-base text-black">
                  You haven’t tutored anyone yet.
                </p>
              )}
            </div>

            {/* Active Courses Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
              <p className="text-lg font-semibold text-black">Active Courses:</p>
              {data?.activeCourses?.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.activeCourses.map((code, idx) => (
                    <span
                      key={idx}
                      className="bg-[#E8B14F] text-white text-sm px-4 py-2 rounded-full font-bold"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base text-black">
                  You don’t have any active courses yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
