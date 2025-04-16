"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="w-full px-6 md:px-24 py-20 overflow-hidden">
      {/* Row 1: ABOUT + logo + subtitle + arrow + paragraph */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-16">
        {/* Left: ABOUT + logo + subtitle + arrow */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-black">ABOUT</h2>
            <Image
              src="/imgs/logo.png"
              alt="Tutee Logo"
              width={80}
              height={32}
              className="object-contain"
            />
          </div>

          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-light text-black">OUR MISSION & VISION</h3>
            <ArrowRight className="text-[#E8B14F] w-6 h-6" />
          </div>
        </div>

        {/* Right: Paragraph */}
        <p className="text-[16px] leading-[20px] text-black max-w-3xl">
          Tutee is more than just a tutoring platform—it’s a community of learners and educators who believe in the power of peer-to-peer learning. We connect students seeking academic support with qualified tutors who are passionate about sharing their knowledge. Whether you're struggling with a challenging course or looking to help others succeed, Tutee is your go-to platform for personalized, interactive, and affordable learning.
        </p>
      </div>

      {/* Row 2: Image left + mission and vision text right */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
        {/* Left: Illustration with background box */}
        <div className="relative w-full max-w-[440px] h-[420px] mx-auto lg:mx-0">
          <div className="relative w-[500px] h-[430px] bg-black/10 rounded-[100px_100px_100px_240px] transform scale-x-[-1] -left-6 top-6" />
          <Image
            src="/imgs/about-illustration.png"
            alt="About Tutee Illustration"
            fill
            className="object-contain z-10"
          />
        </div>

        {/* Right: Mission and Vision Text */}
        <div className="flex-1 space-y-8 max-w-2xl">
          <div>
            <h4 className="text-[#E8B14F] text-2xl font-bold mb-1">Our Mission</h4>
            <p className="text-black text-[16px] leading-[20px]">
              At Tutee, our mission is to empower students by providing access to high-quality, personalized tutoring in a collaborative and supportive environment. We aim to break down barriers to education by making academic support accessible, affordable, and effective for everyone.
            </p>
          </div>

          <div>
            <h4 className="text-[#E8B14F] text-2xl font-bold mb-1">Our Vision</h4>
            <p className="text-black text-[16px] leading-[20px]">
              We envision a world where every student has the tools and resources they need to achieve their academic goals. By fostering a culture of shared knowledge and continuous learning, we strive to create a global community where students and tutors grow together, unlocking their full potential.
            </p>
          </div>

          <button className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E8B14F] text-black font-bold text-xs shadow hover:bg-yellow-500 transition">
            Contact Us and Learn More <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
