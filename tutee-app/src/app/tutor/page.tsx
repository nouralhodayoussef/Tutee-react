'use client';

import { useEffect, useState } from 'react';
import TutorHeader from '@/components/layout/TutorHeader';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TutorHomePage() {
  const [data, setData] = useState<{
    upcomingSession: any;
    previousTutees: any[];
    activeCourses: string[];
    booked_sessions?: {
      tutee_name: String;
      course_code: string;
      course_name: string;
      schedule: string;
      tutor_name: string;
      tutee_photo: string;
    }[];
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
        <div className="bg-white rounded-2xl shadow-md p-8 mb-20 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
              Welcome, {tutorName}!
            </h1>
            <p className="text-sm sm:text-base font-medium text-black mb-6">
              Your Scheduled Session
            </p>

            {data?.booked_sessions?.length ? (
              <div className="bg-[#F5F5F5] p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-left">
                  <p className="text-sm sm:text-base">
                    <strong>{data.booked_sessions[0].course_code}</strong> - {data.booked_sessions[0].course_name}
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
                      {data.booked_sessions[0].schedule}
                    </p>
                  </div>
                  <p className="text-sm mt-2">
                    <strong>With:</strong> {data.booked_sessions[0].tutee_name}
                  </p>
                </div>

                <div className="w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-white shadow-md">
                  <Image
                    src={data.booked_sessions[0].tutee_photo || "/imgs/tutor-pic.png"}
                    alt="Tutor Profile"
                    width={100}
                    height={100}
                    unoptimized
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <p className="text-base sm:text-lg text-black mb-4">
                You don’t have any scheduled sessions yet!
              </p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <Link href="#scheduling">
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

        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Your Activity:</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
