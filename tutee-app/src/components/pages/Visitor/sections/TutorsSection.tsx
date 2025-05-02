"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const tutors = [
  {
    name: "Rami Aasi",
    subject: "LIU - Computer Science",
    image: "/imgs/tutors/rami.png",
    rating: 5,
    reviews: 200,
  },
  {
    name: "Riham Surya",
    subject: "BAU - Bio Medical Science",
    image: "/imgs/tutors/riham.png",
    rating: 5,
    reviews: 200,
  },
  {
    name: "Lara Cahya",
    subject: "LU - Civil Engineering",
    image: "/imgs/tutors/lara.png",
    rating: 4.5,
    reviews: 200,
  },
];

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
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % tutors.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + tutors.length) % tutors.length);

  return (
    <section id="tutors" className="w-full bg-[#F5F5EF] px-6 md:px-24 py-20 overflow-hidden">
      {/* Header and Intro */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-12">
        <div>
          <h2 className="text-3xl font-bold text-black">OUR HEROES</h2>
          <p className="text-2xl font-light text-black">MEET THE TUTORS</p>
        </div>
        <div className="flex items-center gap-4 max-w-xl">
          <ArrowRight className="text-[#E8B14F] w-6 h-6" />
          <p className="text-sm text-black">
            Our tutors are top-performing students and graduates from leading universities around the world. They excel in their fields and are eager to share their expertise with others. From mathematics and science to business and humanities, our tutors cover a wide range of subjects to meet your academic needs.
          </p>
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-2xl md:text-3xl font-bold">
          Our Top Tutors At <span className="text-[#E8B14F]">TUTEE</span>
        </h3>
        <p className="text-sm md:text-base text-black mt-2">
          Meet our tutors today and discover how they can help you achieve academic success!
        </p>
      </div>

      {/* Mobile Slider */}
      <div className="md:hidden flex flex-col items-center gap-4">
        <div className="w-full max-w-xs bg-white p-4 rounded-xl shadow-md">
          <Image
            src={tutors[currentIndex].image}
            alt={tutors[currentIndex].name}
            width={300}
            height={300}
            className="rounded-lg object-cover w-full h-[300px]"
          />
          <h4 className="text-lg font-semibold mt-4">{tutors[currentIndex].name}</h4>
          <p className="text-sm text-gray-600">{tutors[currentIndex].subject}</p>
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={tutors[currentIndex].rating} />
            <span className="text-xs text-gray-500">({tutors[currentIndex].reviews})</span>
          </div>
        </div>

        <div className="flex gap-6">
          <button
            onClick={prev}
            className="bg-[#E8B14F] p-2 rounded-full shadow hover:bg-yellow-500 transition"
          >
            <ChevronLeft className="text-white w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="bg-[#E8B14F] p-2 rounded-full shadow hover:bg-yellow-500 transition"
          >
            <ChevronRight className="text-white w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {tutors.map((tutor, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center"
          >
            <Image
              src={tutor.image}
              alt={tutor.name}
              width={300}
              height={300}
              className="rounded-lg object-cover w-full h-[300px]"
            />
            <h4 className="text-lg font-semibold mt-4">{tutor.name}</h4>
            <p className="text-sm text-gray-600">{tutor.subject}</p>
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={tutor.rating} />
              <span className="text-xs text-gray-500">({tutor.reviews})</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TutorsSection;
