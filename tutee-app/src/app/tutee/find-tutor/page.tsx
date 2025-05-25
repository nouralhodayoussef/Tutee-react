/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TuteeHeader from '@/components/layout/TuteeHeader';
import RoleProtected from '@/components/security/RoleProtected';
import { motion } from 'framer-motion';

export default function FindTutorPage() {
  const [majors, setMajors] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<number | null>(null);
  const [ratingSort, setRatingSort] = useState<'asc' | 'desc'>('desc');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [allTutors, setAllTutors] = useState<any[]>([]);
  const [visibleTutors, setVisibleTutors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCount, setShowCount] = useState(15);

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  useEffect(() => {
    fetch('http://localhost:4000/findcourse/options', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setMajors(data.majors);
        setUniversities(data.universities);
        setSelectedMajor(data.selectedMajor);
        setSelectedUniversity(data.selectedUniversity);
        fetchTutors(data.selectedMajor, data.selectedUniversity, ratingSort, '', null, null);
      });
  }, []);

  useEffect(() => {
    if (selectedMajor !== null && selectedUniversity !== null) {
      fetchTutors(selectedMajor, selectedUniversity, ratingSort, searchTerm, minPrice, maxPrice);
    }
  }, [selectedMajor, selectedUniversity, ratingSort, minPrice, maxPrice]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (selectedMajor !== null && selectedUniversity !== null) {
        fetchTutors(selectedMajor, selectedUniversity, ratingSort, searchTerm, minPrice, maxPrice);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchTutors = (
    major: number | null,
    university: number | null,
    ratingSort: 'asc' | 'desc',
    search: string,
    minPrice: number | null,
    maxPrice: number | null
  ) => {
    const query = new URLSearchParams();
    if (major !== null) query.append('major', String(major));
    if (university !== null) query.append('university', String(university));
    if (ratingSort) query.append('ratingSort', ratingSort);
    if (search) query.append('search', search);
    if (minPrice !== null) query.append('minPrice', String(minPrice));
    if (maxPrice !== null) query.append('maxPrice', String(maxPrice));

    fetch(`http://localhost:4000/tutors/search?${query.toString()}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAllTutors(data);
        setVisibleTutors(data.slice(0, 15));
        setShowCount(15);
      });
  };

  const handleShowMore = () => {
    const nextCount = showCount + 15;
    setShowCount(nextCount);
    setVisibleTutors(allTutors.slice(0, nextCount));
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex gap-0.5 mt-1 text-[18px] justify-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">⯪</span>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">☆</span>
        ))}
      </div>
    );
  };

  return (
    <RoleProtected requiredRoles={['tutee']}>
      <div className="min-h-screen bg-[#f5f5ef] pb-10">
        <TuteeHeader />
        <div className="w-full flex justify-center py-10 font-poppins px-4">
          <div className="w-full max-w-[1057px]">
            <div
              className="w-full rounded-[15px] shadow-lg bg-cover bg-center px-6 pt-8 pb-24 relative"
              style={{ backgroundImage: "url('/imgs/Findacourseillustration.png')" }}
            >
              <div className="absolute inset-0 bg-[#00000020] rounded-[15px]"></div>
              <div className="relative z-10 flex w-full justify-between items-center bg-white rounded-[10px] h-[60px] px-6 mb-6 max-w-[1050px] mx-auto">
                <input
                  type="text"
                  placeholder="Search by first name, last name, or skill"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-[18px] text-[#83839A] focus:outline-none"
                />
              </div>
              <div className="relative z-10 flex gap-4 flex-wrap justify-center max-w-[1050px] mx-auto">
                <select
                  className="bg-white px-5 py-3 rounded-[10px] shadow-md text-[16px] text-black w-[220px]"
                  value={selectedMajor ?? ''}
                  onChange={e => setSelectedMajor(Number(e.target.value))}
                >
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>{m.major_name}</option>
                  ))}
                </select>
                <select
                  className="bg-white px-5 py-3 rounded-[10px] shadow-md text-[16px] text-black w-[270px]"
                  value={selectedUniversity ?? ''}
                  onChange={e => setSelectedUniversity(Number(e.target.value))}
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>{u.university_name}</option>
                  ))}
                </select>
                <select
                  className="bg-white px-5 py-3 rounded-[10px] shadow-md text-[16px] text-black w-[220px]"
                  value={ratingSort}
                  onChange={e => setRatingSort(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Rating: High to Low</option>
                  <option value="asc">Rating: Low to High</option>
                </select>
                <input
                  type="number"
                  placeholder="Min $"
                  min={0}
                  className="bg-white px-4 py-3 rounded-[10px] shadow-md text-black w-[100px]"
                  value={minPrice ?? ''}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)}
                />
                <input
                  type="number"
                  placeholder="Max $"
                  min={0}
                  className="bg-white px-4 py-3 rounded-[10px] shadow-md text-black w-[100px]"
                  value={maxPrice ?? ''}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            <h2 className="mt-20 text-3xl font-bold text-black mb-6">Tutors</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {visibleTutors.map((tutor) => (
                <motion.div
                  key={tutor.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white rounded-[18px] shadow-md overflow-hidden w-[220px] mx-auto text-center transition hover:shadow-lg hover:scale-[1.02]"
                >
                  <Link href={`/tutee/tutor-profile/${tutor.id}`}>
                    <div>
                      <img
                        src={tutor.photo}
                        alt={tutor.first_name}
                        className="w-[120px] h-[120px] object-cover rounded-full mx-auto mt-4"
                      />
                      <div className="p-4">
                        <h2 className="text-[18px] font-semibold text-[#333]">
                          {tutor.first_name} {tutor.last_name}
                        </h2>
                        <p className="text-[#A3A3A3] text-sm mt-1 leading-tight">
                          {tutor.university_name} – {tutor.major_name}
                        </p>
                        {!isNaN(Number(tutor.avg_rating)) && renderStars(Number(tutor.avg_rating))}
                        <p className="text-sm text-[#444] mt-2 font-medium">
                          ${tutor.price_per_hour} / session
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {visibleTutors.length < allTutors.length && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleShowMore}
                  className="bg-[#E8B14F] text-white px-6 py-2 rounded-full font-medium hover:opacity-90"
                >
                  Show More
                </button>
              </div>
            )}

            <p className="text-center text-gray-600 mt-4">
              You are seeing {visibleTutors.length} / {allTutors.length} tutors
            </p>
          </div>
        </div>
      </div>
    </RoleProtected>
  );
}
