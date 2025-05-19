"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tutor = {
  id: number;
  name: string;
  subject: string | null;
  image: string;
  rating: number;
  reviews: number;
};

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  return (
    <div className="flex gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <span key={i}>⭐</span>
      ))}
      {halfStar && <span>⭐</span>}
    </div>
  );
};

const TutorsSection = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev

  useEffect(() => {
    fetch("http://localhost:4000/api/visitor/top-tutors")
      .then((res) => res.json())
      .then((data) => {
        setTutors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % tutors.length);
  };
  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + tutors.length) % tutors.length);
  };

  if (loading)
    return (
      <section className="py-20">
        <div className="text-center text-gray-600">Loading tutors...</div>
      </section>
    );
  if (!tutors.length)
    return (
      <section className="py-20 text-center text-gray-600">No tutors found.</section>
    );

  return (
    <motion.section
      className="w-full bg-[#F5F5EF] px-6 md:px-24 py-20 overflow-hidden"
      id="tutors"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Header and Intro */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-12">
        {/* Left: OUR HEROES + Arrow + MEET THE TUTORS */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-5">
            <h2 className="text-3xl font-bold text-black">OUR HEROES</h2>
            <svg
              width="120"
              height="20"
              viewBox="0 0 120 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
            >
              <line x1="0" y1="10" x2="100" y2="10" stroke="#E8B14F" strokeWidth="5" strokeLinecap="round" />
              <polygon points="100,2 120,10 100,18" fill="#E8B14F" />
            </svg>
          </div>
          <p className="text-2xl font-light text-black">MEET THE TUTORS</p>
        </div>
        {/* Right: Intro paragraph */}
        <div className="max-w-2xl mt-4 md:mt-0">
          <p className="text-sm text-black">
            Our tutors are top-performing students and graduates from leading universities around the world. They excel in their fields and are eager to share their expertise with others. From mathematics and science to business and humanities, our tutors cover a wide range of subjects to meet your academic needs.
          </p>
        </div>
      </div>

      {/* Sub-header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl md:text-3xl font-bold">
          Our Top Tutors At <span className="text-[#E8B14F]">TUTEE</span>
        </h3>
        <p className="text-sm md:text-base text-black mt-2">
          Meet our tutors today and discover how they can help you achieve academic success!
        </p>
      </div>

      {/* Mobile Slider with animation */}
      <div className="md:hidden flex flex-col items-center gap-4">
        <div className="w-full max-w-xs bg-white p-4 rounded-xl shadow-md min-h-[390px] flex items-center justify-center relative">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ x: direction > 0 ? 120 : -120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -120 : 120, opacity: 0 }}
              transition={{ duration: 0.36, ease: "easeInOut" }}
              className="absolute left-0 top-0 w-full h-full flex flex-col items-center"
            >
              <Image
                src={tutors[currentIndex].image ? tutors[currentIndex].image.trim() : "/imgs/tutors/fallback.png"}
                alt={tutors[currentIndex].name}
                width={300}
                height={300}
                className="rounded-lg object-cover w-full h-[300px]"
              />
              <h4 className="text-lg font-semibold mt-4">{tutors[currentIndex].name}</h4>
              <p className="text-sm text-gray-600">
                {tutors[currentIndex].subject && tutors[currentIndex].subject !== "null"
                  ? tutors[currentIndex].subject
                  : "—"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={tutors[currentIndex].rating} />
                <span className="text-xs text-gray-500">({tutors[currentIndex].reviews})</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex gap-6">
          <button
            onClick={prev}
            className="bg-[#E8B14F] p-2 rounded-full shadow hover:bg-yellow-500 transition"
            aria-label="Previous tutor"
          >
            <ChevronLeft className="text-white w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="bg-[#E8B14F] p-2 rounded-full shadow hover:bg-yellow-500 transition"
            aria-label="Next tutor"
          >
            <ChevronRight className="text-white w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Grid */}
      <motion.div
        className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.13 } },
        }}
      >
        {tutors.map((tutor, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Image
              src={tutor.image ? tutor.image.trim() : "/imgs/tutors/fallback.png"}
              alt={tutor.name}
              width={300}
              height={300}
              className="rounded-lg object-cover w-full h-[300px]"
            />
            <h4 className="text-lg font-semibold mt-4">{tutor.name}</h4>
            <p className="text-sm text-gray-600">
              {tutor.subject && tutor.subject !== "null" ? tutor.subject : "—"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={tutor.rating} />
              <span className="text-xs text-gray-500">({tutor.reviews})</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};

export default TutorsSection;
