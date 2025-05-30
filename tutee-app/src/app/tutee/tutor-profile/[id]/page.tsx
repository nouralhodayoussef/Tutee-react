'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TuteeHeader from '@/components/layout/TuteeHeader';
import dynamic from 'next/dynamic';
import RoleProtected from "@/components/security/RoleProtected";

const ScheduleModal = dynamic(() => import('@/components/tutee/ScheduleModal'), { ssr: false });

interface Course {
  id: number;
  course_code: string;
  course_name: string;
}

interface Review {
  reviewer: string;
  comment: string;
  rating: number;
  course_code: string;
  photo?: string | null;
}

interface Tutor {
  id: number;
  name: string;
  photo: string;
  bio: string;
  avg_rating: string;
  tutee_count: number;
  course_count: number;
  price_per_hour: number;
  skills: string[];
  courses: Course[];
  reviews?: Review[];
}

export default function TuteeTutorProfile() {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showModal, setShowModal] = useState(false);
  const searchParams = useSearchParams();
  const [skillsToShow, setSkillsToShow] = useState(10);

  useEffect(() => {
    const fetchTutor = async () => {
      const id = window.location.pathname.split('/').pop();
      const tutorId = parseInt(id || '0');

      try {
        const res = await fetch(`http://localhost:4000/tutee/tutor-profile/${tutorId}`);
        const data = await res.json();

        if (data.error) {
          console.error('API error:', data.error);
          return;
        }

        const queryCode = searchParams.get('selectedCourse');

        const safeCourses = Array.isArray(data.courses) ? data.courses : [];
        const safeSkills = Array.isArray(data.skills) ? data.skills : [];
        const safeReviews = Array.isArray(data.reviews) ? data.reviews : [];

        if (queryCode && safeCourses.length > 0) {
          const match = safeCourses.find((c: Course) => c.course_code === queryCode);
          if (match) setSelectedCourse(match);
        }

        setTutor({
          ...data,
          id: tutorId,
          courses: safeCourses,
          skills: safeSkills,
          reviews: safeReviews,
        });
      } catch (err) {
        console.error('Error fetching tutor profile:', err);
      }
    };

    fetchTutor();
  }, []);

  const uniqueCourses: Course[] = Array.isArray(tutor?.courses)
    ? tutor!.courses.filter(
      (course, idx, arr) =>
        arr.findIndex(c => c.course_code === course.course_code) === idx
    )
    : [];

  const filteredReviews = selectedCourse
    ? tutor?.reviews?.filter(r => r.course_code === selectedCourse.course_code)
    : [];
  const avgCourseRating = (filteredReviews ?? []).length
    ? ((filteredReviews ?? []).reduce((sum, r) => sum + r.rating, 0) / (filteredReviews ?? []).length).toFixed(1)
    : 'N/A';
  const getStarsCount = (level: number): number => {
    if (!Array.isArray(filteredReviews)) return 0;
    return filteredReviews.filter((r) => r.rating === level).length;
  };

  return (
    <RoleProtected requiredRoles={['tutee']}>
      <main className="bg-[#F5F5EF] min-h-screen font-montserrat relative z-0">
        <TuteeHeader />

        {/* Banner */}
        <section className="w-full px-4 md:px-24 py-10">
          <div className="w-full max-w-[1139px] mx-auto relative bg-gradient-to-r from-gray-400 to-gray-300 rounded-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center gap-6 p-6">
              <div className="flex-shrink-0 w-[180px] h-[180px] md:w-[224px] md:h-[224px] rounded-full bg-white flex items-center justify-center">
                <div className="w-[160px] h-[160px] md:w-[202px] md:h-[211px] rounded-full overflow-hidden bg-[#E39797]">
                  {tutor?.photo && (
                    <img src={tutor.photo} alt="Tutor" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>

              <div className="flex-1 bg-white/80 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-medium text-black">{tutor?.name}</h2>
                    <p className="text-sm text-[#2D3436] mt-2">{tutor?.bio}</p>
                  </div>
                  <button
                    disabled={!selectedCourse}
                    onClick={() => setShowModal(true)}
                    className={`${selectedCourse
                      ? 'bg-[#E8B14F] text-white'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                      } px-6 py-2 rounded-xl font-bold text-sm shadow`}
                  >
                    Schedule
                  </button>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-black/70">
                  <p>
                    ⭐ {Number(tutor?.avg_rating) > 0
                      ? Number(tutor?.avg_rating).toFixed(1)
                      : 'N/A'} Instructor Rating
                  </p>
                  <p>👤 {tutor?.tutee_count || 0} Tutee</p>
                  <p>📚 {tutor?.course_count || 0} Course</p>
                  <p>💰 ${Number(tutor?.price_per_hour).toFixed(2)} / hour</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Courses + Skills */}
        <section className="w-full px-4 md:px-24 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold mb-6">Courses</h2>
            <div className="flex flex-wrap gap-4 mb-12">
              {uniqueCourses.map((course) => (
                <button
                  key={course.course_code}
                  onClick={() => setSelectedCourse(course)}
                  title={course.course_name}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition shadow whitespace-nowrap ${selectedCourse?.course_code === course.course_code
                    ? 'bg-[#E8B14F] text-white'
                    : 'bg-black/10 text-black'
                    }`}
                >
                  {course.course_code}
                </button>
              ))}
            </div>

            <h2 className="text-3xl font-bold mb-6">Skills</h2>
            <div className="flex flex-wrap gap-4">
              {Array.isArray(tutor?.skills) &&
                tutor.skills.slice(0, skillsToShow).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-6 py-2 rounded-xl bg-black/10 text-black text-sm font-bold shadow whitespace-nowrap"
                  >
                    {skill}
                  </span>
                ))}
            </div>
            {Array.isArray(tutor?.skills) && tutor.skills.length > 10 && (
              <div className="mt-4">
                <button
                  className="bg-[#E8B14F] hover:bg-yellow-500 text-white px-6 py-2 rounded-full font-bold text-sm"
                  onClick={() => setSkillsToShow(skillsToShow === 10 ? tutor.skills.length : 10)}
                >
                  {skillsToShow === 10 ? 'Show More' : 'Show Less'}
                </button>
              </div>
            )}
          </div>

          <div className="w-full bg-white rounded-2xl shadow p-8 text-center h-fit">
            <p className="text-lg text-black mb-6">
              {selectedCourse
                ? `Are you ready to request a ${selectedCourse.course_code} course session with ${tutor?.name}?`
                : `Select a course to take with ${tutor?.name || 'this tutor'}.`}
            </p>
            <button
              disabled={!selectedCourse}
              onClick={() => setShowModal(true)}
              className={`${selectedCourse
                ? 'bg-[#E8B14F] hover:bg-yellow-500'
                : 'bg-gray-400 cursor-not-allowed'
                } px-6 py-3 rounded-full text-white font-bold text-sm`}
            >
              Continue to Scheduling
            </button>
          </div>
        </section>

        {/* Reviews */}
        <section className="w-full px-6 md:px-24 py-10">
          <h2 className="text-[36px] font-bold mb-8 text-black">Reviews</h2>

          <div className="bg-[#E8B14F4D] rounded-2xl p-6 drop-shadow-md w-full max-w-[730px] lg:ml-0">
            <div className="flex flex-col lg:flex-row mb-8">
              <div className="bg-white rounded-2xl w-full max-w-[198px] h-[150px] flex flex-col items-center justify-center mr-0 lg:mr-6 mb-6 lg:mb-0">
                <p className="text-[24px] text-black/60 font-semibold">
                  {avgCourseRating} out of 5
                </p>
                <p className="text-[#FDB022] text-lg">
                  {'⭐'.repeat(Math.round(Number(avgCourseRating)))}
                </p>
                <p className="text-sm text-black/60">
                  {selectedCourse ? `Rating for ${selectedCourse.course_code}` : 'Overall Rating'}
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2">
                {[5, 4, 3, 2, 1].map((level) => {
                  const count = getStarsCount(level);
                  const total = filteredReviews?.length || 0;
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <span className="w-[60px] text-sm text-black/60">{level} Stars</span>
                      <div className="flex-1 h-[6px] bg-white rounded">
                        <div
                          className="h-full bg-[#E8B14F] rounded"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {Array.isArray(filteredReviews) && filteredReviews.length > 0 ? (
              <div className="space-y-6">
                {filteredReviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start shadow-sm"
                  >
                    <div className="w-[54px] h-[54px] rounded-full overflow-hidden bg-gray-300">
                      {review.photo ? (
                        <img
                          src={review.photo}
                          alt={review.reviewer}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white bg-gray-400 text-sm font-bold">
                          {review.reviewer
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-black mb-1">{review.reviewer}</p>
                      <p className="text-[#FDB022] text-sm">{'⭐'.repeat(review.rating)}</p>
                      <p className="text-sm text-black mt-2 leading-snug">
                        {review.comment.length > 200
                          ? `${review.comment.slice(0, 200)}...`
                          : review.comment}
                      </p>
                      <hr className="my-3 border-[#ccc]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reviews for this course yet.</p>
            )}
          </div>
        </section>

        {showModal && tutor && selectedCourse && (
          <ScheduleModal
            onClose={() => setShowModal(false)}
            tutorId={tutor.id}
            courseId={selectedCourse.id}
            tutorName={tutor.name}
            courseCode={selectedCourse.course_code}
          />
        )}
      </main>
    </RoleProtected>
  );
}
