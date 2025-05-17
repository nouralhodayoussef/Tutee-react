'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import TuteeHeader from '../../layout/TuteeHeader';

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

  return (
    <main className="min-h-screen bg-[#F5F5EF]">
      <TuteeHeader />

      <section className="w-full px-6 sm:px-10 md:px-24 py-12">
        <div className="bg-white rounded-2xl shadow-md p-8 mb-20 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
              Welcome, {firstName}!
            </h1>
            <p className="text-sm sm:text-base font-medium text-black mb-6">
              Your Booked Sessions
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
                      {new Date(nextSession.scheduled_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })} at {nextSession.slot_time}
                    </p>
                  </div>
                  <p className="text-sm mt-2">
                    <strong>With:</strong> {nextSession.tutor_name}
                  </p>
                </div>

                <div className="w-[100px] h-[100px] relative rounded-full overflow-hidden border-4 border-white shadow-md">
  <Image
    src={nextSession.tutor_photo || "/imgs/tutor-pic.png"}
    alt="Tutor Profile"
    fill
    unoptimized
    className="object-cover rounded-full"
  />
</div>

              </div>
            ) : (
              <p className="text-base sm:text-lg text-black mb-4">
                You don’t have any booked sessions yet!<br />
                Find a Tutor and a Course and get started now!
              </p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <Link href="/tutee-findcourse">
                <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                  Search & Schedule
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
              <p className="text-lg font-semibold text-black">Your Tutors:</p>
              {tutors.length ? (
                tutors.map((tutor, idx) => (
                  <div key={idx} className="bg-[#f5f5f5] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-[64px] h-[64px] relative rounded-full overflow-hidden border-2 border-white shadow-md">
  <Image
    src={tutor.photo || "/imgs/tutor-pic.png"}
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
  <span>📚 {tutor.course_count ?? 0} Courses</span>
</div>

                    </div>
                    <Link href={`/tutee/tutor-profile/${tutor.id}`}>
                      <button className="bg-[#E8B14F] text-black font-bold px-4 py-2 text-xs rounded-full shadow">
                        Schedule
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-base text-black">
                  You don’t have any Tutor yet!<br />
                  Find a Tutor and a Course and get started now!
                </p>
              )}
              <Link href="tutee/find-tutor">
                <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                  Find A Tutor
                </button>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
              <p className="text-lg font-semibold text-black">Your Courses:</p>
              {courses.length ? (
                <div className="flex flex-wrap gap-2">
                  {courses.map((course, idx) => (
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
                  You don’t have any courses yet!<br />
                  Find a Tutor and a Course and get started now!
                </p>
              )}
              <Link href="/find-course">
                <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                  Find A Course
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
