'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TuteeHeader from '@/components/layout/TuteeHeader';
import Link from 'next/link';

export default function TuteeFindCourse() {
  const [majors, setMajors] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [showMajors, setShowMajors] = useState(false);
  const [showUniversities, setShowUniversities] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/findcourse/options', { credentials: 'include' });
        const data = await res.json();
        setMajors(data.majors);
        setUniversities(data.universities);
        if (data.selectedMajor) setSelectedMajor(data.selectedMajor);
        if (data.selectedUniversity) setSelectedUniversity(data.selectedUniversity);
      } catch (err) {
        console.error('❌ Fetch error:', err);
      }
    };

    fetchData();
  }, []);

  const fetchCourses = async () => {
    if (!selectedMajor || !selectedUniversity) return;

    try {
      const res = await fetch(
        `http://localhost:4000/findcourse/courses?major=${selectedMajor}&university=${selectedUniversity}&search=${encodeURIComponent(searchTerm)}`
      );
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
    }
  };

  useEffect(() => {
    if (searchTerm === '') {
      fetchCourses();
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [selectedMajor, selectedUniversity]);

  const renderStars = (rating: number) => {
    const fullStars = Math.round(rating || 0);
    return (
      <div className="flex gap-1 mt-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>{i < fullStars ? '⭐' : '☆'}</span>
        ))}
      </div>
    );
  };

  return (
    <>
      <TuteeHeader />
      <section className="w-full flex justify-center py-10 bg-[#f5f5ef] font-poppins">
        <div className="w-full max-w-[1057px] px-4">
          {/* Banner */}
          <div
            className="w-full rounded-[15px] shadow-lg bg-cover bg-center px-6 pt-8 pb-24"
            style={{ backgroundImage: "url('/imgs/Findacourseillustration.png')" }}
          >
            {/* Search Box */}
            <div className="flex w-full justify-between items-center bg-white rounded-[10px] h-[60px] px-6 mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a course"
                className="flex-1 bg-transparent text-[18px] text-[#83839A] focus:outline-none"
              />
              <button
                className="ml-4 bg-[#E8B14F] hover:bg-[#f0c15c] text-white px-6 py-2 rounded-[12px] font-semibold text-[18px] cursor-pointer transition-colors duration-200"
                onClick={fetchCourses}
              >
                Search
              </button>
            </div>

            {/* Dropdown Filters */}
            <div className="flex gap-4 relative z-10">
              {/* Major */}
              <div className="relative w-[150px]">
                <button
                  onClick={() => setShowMajors(!showMajors)}
                  className="w-full h-[55px] bg-white rounded-[10px] px-4 text-[16px] text-left text-black shadow-md truncate"
                >
                  {selectedMajor ?? 'Major'} <span className="absolute right-4 top-1/2 -translate-y-1/2">▾</span>
                </button>
                {showMajors && (
                  <div className="absolute mt-1 w-full max-h-[200px] overflow-y-auto bg-white rounded-[10px] shadow-md z-50">
                    {majors.map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMajor(m.major_name);
                          setShowMajors(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer truncate"
                      >
                        {m.major_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* University */}
              <div className="relative w-[190px]">
                <button
                  onClick={() => setShowUniversities(!showUniversities)}
                  className="w-full h-[55px] bg-white rounded-[10px] px-4 text-[16px] text-left text-black shadow-md truncate"
                >
                  {selectedUniversity ?? 'University'} <span className="absolute right-4 top-1/2 -translate-y-1/2">▾</span>
                </button>
                {showUniversities && (
                  <div className="absolute mt-1 w-full max-h-[200px] overflow-y-auto bg-white rounded-[10px] shadow-md z-50">
                    {universities.map((u: any) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUniversity(u.university_name);
                          setShowUniversities(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer truncate"
                      >
                        {u.university_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filtered Courses Section */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Available Courses</h2>

            {courses.length === 0 ? (
              <p className="text-gray-500">No courses found for the selected filters.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {courses.map((course: any, index) => (
                  <Link
                    key={index}
                    href={`/tutee/tutor-profile/${course.tutor_id}?selectedCourse=${encodeURIComponent(course.course_code)}&courseName=${encodeURIComponent(course.course_name)}`}
                    className="bg-white rounded-2xl p-5 shadow-md w-[272px] h-[291px] flex flex-col justify-between hover:shadow-lg transition"
                  >
                    <div className="text-[#696984] text-sm">
                      {selectedMajor} · {selectedUniversity}
                    </div>

                    <div className="mt-3">
                      <h3 className="font-semibold text-black text-lg mb-1">{course.course_code}</h3>
                      <p className="text-[#696984] text-sm">{course.course_name}</p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium mb-1">
                        Tutor: {course.tutor_first} {course.tutor_last}
                      </p>
                      {renderStars(course.avg_rating)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
