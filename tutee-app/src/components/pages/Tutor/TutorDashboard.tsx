'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import TutorHeader from '../../layout/TutorHeader';

interface Session {
  course_code: string;
  course_name: string;
  tutee_name: string;
  schedule: string;
  tutee_photo?: string;
}

interface Course {
  name: string;
}

interface Tutee {
  name: string;
  major: string;
  university: string;
  photo?: string;
}

interface TutorData {
  first_name: string;
  scheduled_sessions: Session[];
  tutees: Tutee[];
  active_courses: string[];
}

export default function TutorDashboard() {
  const [data, setData] = useState<TutorData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('http://localhost:4000/tutor/home', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();

        if (json.tutees?.[0]?.photo?.includes('drive.google.com')) {
          const match = json.tutees[0].photo.match(/[-\w]{25,}/);
          const fileId = match ? match[0] : '';
          json.tutees[0].photo = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }

        if (json.scheduled_sessions?.[0]?.tutee_photo?.includes('drive.google.com')) {
          const match = json.scheduled_sessions[0].tutee_photo.match(/[-\w]{25,}/);
          const fileId = match ? match[0] : '';
          json.scheduled_sessions[0].tutee_photo = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }

        setData(json);
      } else {
        console.error("Failed to fetch data");
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
              Welcome, {data?.first_name}!
            </h1>
            <p className="text-sm sm:text-base font-medium text-black mb-6">
              Your Upcoming Session
            </p>

            {data?.scheduled_sessions?.length ? (
              <div className="bg-[#F5F5F5] p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-left">
                  <p className="text-sm sm:text-base">
                    <strong>{data.scheduled_sessions[0].course_code}</strong> - {data.scheduled_sessions[0].course_name}
                  </p>
                  <div className="flex items-center mt-2">
                    <Image
                      src="/imgs/calendar-icon.png"
                      alt="Calendar Icon"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    <p className="font-bold text-sm sm:text-base">
                      {data.scheduled_sessions[0].schedule}
                    </p>
                  </div>
                  <p className="text-sm mt-2">
                    <strong>With:</strong> {data.scheduled_sessions[0].tutee_name}
                  </p>
                </div>

                <div className="w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-white shadow-md">
                  <Image
                    src={data.scheduled_sessions[0].tutee_photo || "/imgs/tutor-pic.png"}
                    alt="Tutee Profile"
                    width={100}
                    height={100}
                    unoptimized
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <p className="text-base sm:text-lg text-black mb-4">
                You don’t have any scheduled sessions yet!<br />
                Check your tutee requests or get started now!
              </p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <Link href="/tutor/requests">
                <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                  See All Requests
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
              <p className="text-lg font-semibold text-black">Your Tutees:</p>
              {data?.tutees?.length ? (
                data.tutees.map((tutee, idx) => (
                  <div key={idx} className="bg-[#f5f5f5] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-[64px] h-[64px] rounded-full overflow-hidden">
                      <img
                        src={tutee.photo || "/imgs/tutor-pic.png"}
                        alt="Tutee"
                        width={64}
                        height={64}
                        className="object-cover rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-black text-sm sm:text-base">{tutee.name}</p>
                      <p className="text-gray-700 text-sm">{tutee.major} at {tutee.university}</p>
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
              <p className="text-lg font-semibold text-black">Your Active Courses:</p>
              {data?.active_courses?.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.active_courses.map((course, idx) => (
                    <span
                      key={idx}
                      className="bg-[#E8B14F] text-white text-sm px-4 py-2 rounded-full font-bold"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base text-black">
                  No active courses yet.
                </p>
              )}
              <Link href="/tutor/request-new-course">
                <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                  Request New Course
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
//