'use client';

import { useEffect, useState } from 'react';
import TuteeHeader from '@/components/layout/TuteeHeader';

export default function TuteeFindCourse() {
  const [majors, setMajors] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMajors, setShowMajors] = useState(false);
  const [showUniversities, setShowUniversities] = useState(false);

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

  return (
    <>
      <TuteeHeader />
      <section className="w-full flex justify-center items-center py-10 bg-[#f5f5ef] font-poppins">
        <div
          className="relative w-[1057px] rounded-[15px] shadow-lg bg-cover bg-center px-6 pt-8 pb-24 overflow-visible"
          style={{ backgroundImage: "url('/imgs/Findacourseillustration.png')" }}
        >
          <div className="flex w-full justify-between items-center bg-white rounded-[10px] h-[60px] px-6 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a course"
              className="flex-1 bg-transparent text-[18px] text-[#83839A] focus:outline-none"
            />
            <button className="ml-4 bg-[#E8B14F] text-white px-6 py-2 rounded-[12px] font-semibold text-[18px]">
              Search
            </button>
          </div>

          <div className="flex gap-4 relative z-10">
            {/* Major Dropdown */}
            <div className="relative w-[150px]">
              <button
                onClick={() => setShowMajors(!showMajors)}
                className="w-full h-[55px] bg-white rounded-[10px] px-4 text-[16px] text-left text-black shadow-md relative overflow-hidden truncate"
              >
                {selectedMajor ?? 'Major'}
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">▾</span>
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
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                    >
                      {m.major_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* University Dropdown */}
            <div className="relative w-[190px]">
              <button
                onClick={() => setShowUniversities(!showUniversities)}
                className="w-full h-[55px] bg-white rounded-[10px] px-4 text-[16px] text-left text-black shadow-md relative overflow-hidden truncate"
              >
                {selectedUniversity ?? 'University'}
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">▾</span>
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
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                    >
                      {u.university_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
