'use client';

import Image from 'next/image';

const universities = [
  { src: '/imgs/LIU.png', alt: 'LIU', width: 269, height: 270 },
  { src: '/imgs/LU.png', alt: 'LU', width: 252, height: 252 },
  { src: '/imgs/BAU.png', alt: 'BAU', width: 236, height: 255 },
  { src: '/imgs/LAU.png', alt: 'LAU', width: 282, height: 282 },
];

const CoursesAndUniversitiesSection = () => {
  return (
    <section
      id="courses"
      className="relative w-full overflow-hidden bg-[#F5F5EF] pt-24 pb-40 px-6 md:px-24"
    >
      {/* Purple Mask */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1278px] h-[303px] bg-[#211E2E] rounded-[160px] z-10 shadow-lg" />

      {/* Background Illustration behind everything */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/imgs/tutee-learning.png"
          alt="Background"
          fill
          className="object-cover"
          style={{
            opacity: 0.6,
            background: 'rgba(200,157,80,0.58)',
          }}
        />
      </div>

      {/* Titles */}
      <div className="relative z-20 text-center mt-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white">COURSES AND UNIVERSITIES</h2>
        <h3 className="text-3xl font-light text-white mt-2">ON TUTEE</h3>
      </div>

      {/* Chevron Button */}
      <div className="relative z-20 mt-10 flex justify-center items-center">
        <div className="w-[100px] h-[100px] bg-black/30 rounded-full flex items-center justify-center">
          <div className="w-[70px] h-[70px] bg-gradient-to-r from-[#C89D50] to-[#E8B14F] rounded-full flex items-center justify-center">
            <div className="w-[60px] h-[60px] border-4 border-white rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* University Logos */}
      <div className="relative z-20 mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
        {universities.map((uni, idx) => (
          <div key={idx} className="drop-shadow-md">
            <Image
              src={uni.src}
              alt={uni.alt}
              width={uni.width}
              height={uni.height}
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CoursesAndUniversitiesSection;
