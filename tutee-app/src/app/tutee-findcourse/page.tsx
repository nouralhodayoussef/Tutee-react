/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import TuteeHeader from "@/components/layout/TuteeHeader";
import Link from "next/link";
import RoleProtected from "@/components/security/RoleProtected";
import { motion, AnimatePresence } from "framer-motion";

type Major = {
  id: number;
  major_name: string;
};

type University = {
  id: number;
  university_name: string;
};

export default function TuteeFindCourse() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [filteredMajors, setFilteredMajors] = useState<Major[]>([]);
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>("0");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMajors, setShowMajors] = useState(false);
  const [showUniversities, setShowUniversities] = useState(false);
  const [majorInput, setMajorInput] = useState("");
  const [universityInput, setUniversityInput] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:4000/findcourse/options", {
          credentials: "include",
        });
        const data = await res.json();
        setMajors(data.majors);
        setFilteredMajors(data.majors);
        setUniversities(data.universities);
        setFilteredUniversities(data.universities);
        setSelectedMajor(data.selectedMajor?.toString() || "0");
        setSelectedUniversity(data.selectedUniversity?.toString() || "0");

        const selectedMajorObj = data.majors.find((m: Major) => m.id === data.selectedMajor);
        const selectedUniObj = data.universities.find((u: University) => u.id === data.selectedUniversity);

        setMajorInput(selectedMajorObj?.major_name || "");
        setUniversityInput(selectedUniObj?.university_name || "");
      } catch (err) {
        console.error("❌ Fetch error:", err);
      }
    };
    fetchData();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const majorParam = selectedMajor !== "0" ? selectedMajor : "";
      const universityParam = selectedUniversity !== "0" ? selectedUniversity : "";

      const res = await fetch(
        `http://localhost:4000/findcourse/tutors?major=${majorParam}&university=${universityParam}&search=${encodeURIComponent(searchTerm)}`
      );
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching courses:", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [selectedMajor, selectedUniversity]);

  const renderStars = (rating: number | null | undefined) => {
    const parsedRating = typeof rating === "number" ? rating : parseFloat(rating as any);
    const safeRating = isNaN(parsedRating) ? 0 : parsedRating;

    const fullStars = Math.floor(safeRating);
    const remainder = safeRating - fullStars;

    let halfStar = false;
    let adjustedFullStars = fullStars;

    if (remainder >= 0.75) {
      adjustedFullStars += 1;
    } else if (remainder >= 0.25) {
      halfStar = true;
    }

    const emptyStars = 5 - adjustedFullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5 text-[18px]">
          {Array.from({ length: adjustedFullStars }).map((_, i) => (
            <span key={`full-${i}`} className="text-yellow-400">★</span>
          ))}
          {halfStar && <span className="text-yellow-400">⯪</span>}
          {Array.from({ length: emptyStars }).map((_, i) => (
            <span key={`empty-${i}`} className="text-gray-300">☆</span>
          ))}
        </div>
        <span className="text-sm text-gray-600">({safeRating.toFixed(1)})</span>
      </div>
    );
  };

  const fadeGrow = {
    hidden: { opacity: 0, scale: 0.95, y: 6 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, y: 6, transition: { duration: 0.13 } },
  };

  return (
    <RoleProtected requiredRoles={["tutee"]}>
      <TuteeHeader />
      <section className="w-full flex justify-center py-10 bg-[#f5f5ef] font-poppins">
        <div className="w-full max-w-[1057px] px-4">
          {/* Banner */}
          <motion.div
            className="w-full rounded-[15px] shadow-lg bg-cover bg-center px-6 pt-8 pb-24"
            style={{ backgroundImage: "url('/imgs/Findacourseillustration.png')" }}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring", stiffness: 80 }}
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
              {/* Major Dropdown */}
              <div className="relative w-[180px]">
                <input
                  type="text"
                  placeholder="Select Major"
                  className="w-full h-[55px] bg-white rounded-[10px] px-4 text-[16px] text-black shadow-md"
                  value={majorInput}
                  onFocus={() => setShowMajors(true)}
                  onChange={(e) => {
                    const input = e.target.value.toLowerCase();
                    setMajorInput(e.target.value);
                    setFilteredMajors(
                      majors.filter((m) => m.major_name.toLowerCase().includes(input))
                    );
                  }}
                />
                <AnimatePresence>
                  {showMajors && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={fadeGrow}
                      className="absolute mt-1 w-full max-h-[200px] overflow-y-auto bg-white rounded-[10px] shadow-md z-50"
                    >
                      {filteredMajors.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMajor(m.id.toString());
                            setMajorInput(m.major_name);
                            setShowMajors(false);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer truncate"
                        >
                          {m.major_name}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* University Dropdown */}
              <div className="relative w-[200px]">
                <input
                  type="text"
                  placeholder="Select University"
                  className="w-full h-[55px] bg-white rounded-[10px] px-4 text-[16px] text-black shadow-md"
                  value={universityInput}
                  onFocus={() => setShowUniversities(true)}
                  onChange={(e) => {
                    const input = e.target.value.toLowerCase();
                    setUniversityInput(e.target.value);
                    setFilteredUniversities(
                      universities.filter((u) =>
                        u.university_name.toLowerCase().includes(input)
                      )
                    );
                  }}
                />
                <AnimatePresence>
                  {showUniversities && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={fadeGrow}
                      className="absolute mt-1 w-full max-h-[200px] overflow-y-auto bg-white rounded-[10px] shadow-md z-50"
                    >
                      {filteredUniversities.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUniversity(u.id.toString());
                            setUniversityInput(u.university_name);
                            setShowUniversities(false);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer truncate"
                        >
                          {u.university_name}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Filtered Courses Section */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, type: "spring", stiffness: 70 }}
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Available Courses</h2>
            {loading ? (
              <p className="text-gray-500">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="text-gray-500">No courses found for the selected filters.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {courses.map((course, index) => (
                  <Link
                    key={index}
                    href={`/tutee/tutor-profile/${course.tutor_id}?selectedCourse=${encodeURIComponent(course.course_code)}&courseName=${encodeURIComponent(course.course_name)}`}
                    className="bg-white rounded-2xl p-5 shadow-md w-[272px] h-[291px] flex flex-col justify-between hover:shadow-lg transition"
                  >
                    <div className="text-[#696984] text-sm">
                      {course.major_name} · {course.university_name}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-semibold text-black text-lg mb-1">{course.course_code}</h3>
                      <p className="text-[#696984] text-sm">{course.course_name}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <img
                        src={course.photo || "/imgs/default-profile.png"}
                        alt={`${course.first_name} ${course.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex flex-col text-sm">
                        <p className="font-medium">{course.first_name} {course.last_name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[#696984]">Course:</span>
                          {renderStars(course.course_rating)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#696984]">Overall:</span>
                          {renderStars(course.overall_rating)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </RoleProtected>
  );
}
