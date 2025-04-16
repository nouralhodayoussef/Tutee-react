"use client";

import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const HeroBanner = () => {
  const contactItems = [
    {
      icon: <MapPin className="w-8 h-8 text-white" />,
      label: "Koura, North Lebanon, Lebanon",
    },
    {
      icon: <Phone className="w-8 h-8 text-white" />,
      label: "+961 712 345 678",
    },
    {
      icon: <Mail className="w-8 h-8 text-white" />,
      label: "Contact@tutee.com",
    },
  ];

  const [currentItem, setCurrentItem] = useState(0);

  const nextItem = () => setCurrentItem((prev) => (prev + 1) % contactItems.length);
  const prevItem = () => setCurrentItem((prev) => (prev - 1 + contactItems.length) % contactItems.length);

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full bg-[#F5F5EF] px-4 md:px-24 pt-10 pb-16 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Text */}
          <div className="max-w-xl w-full text-center lg:text-left space-y-6">
            <h1 className="text-[32px] sm:text-[36px] md:text-[46px] font-bold text-black leading-snug">
              Transforming <span className="text-[#E8B14F]">Education</span>
              <br className="hidden sm:block" />
              Through <span className="text-[#E8B14F]">Collaboration</span>
            </h1>
            <p className="text-black text-[15px] leading-relaxed">
              Tutee connects students with peer tutors for personalized,
              interactive learning sessions. Whether you're seeking academic
              support or looking to share your knowledge, Tutee is your platform
              for collaborative growth.
            </p>
            <div className="flex justify-center lg:justify-start">
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#E8B14F] text-black font-bold text-sm shadow hover:bg-yellow-500 transition">
                Start with Tutee <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative w-full max-w-[500px] h-[400px]">
            <div className="absolute top-0 left-0 w-full h-full rounded-[100px_100px_100px_240px] bg-black/10 z-0" />
            <Image
              src="/imgs/pexels-hero.png"
              alt="Hero students"
              fill
              className="object-cover rounded-[100px_100px_100px_240px] z-10"
            />
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="w-full px-4 md:px-24 pb-12">
        <div className="w-full max-w-7xl mx-auto bg-gradient-to-r from-[#E8B14F]/60 to-[#E8B14F] rounded-[60px] px-6 md:px-12 py-8 shadow-lg">
          {/* Mobile View */}
          <div className="md:hidden flex items-center justify-between">
            <button onClick={prevItem} className="bg-white/40 rounded-full p-2 hover:bg-white/60">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-3">
              {contactItems[currentItem].icon}
              <p className="text-black text-sm font-medium">
                {contactItems[currentItem].label}
              </p>
            </div>
            <button onClick={nextItem} className="bg-white/40 rounded-full p-2 hover:bg-white/60">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex justify-around items-center gap-8">
            {/* Address */}
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-black" />
              <div>
                <p className="font-bold text-black text-sm">Visit Us in Our Location</p>
                <p className="text-xs text-black/80">Koura, North Lebanon, Lebanon</p>
              </div>
            </div>
            {/* Phone */}
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-black" />
              <div>
                <p className="font-bold text-black text-sm">Give Us a Call</p>
                <p className="text-xs text-black/80">+961 712 345 678</p>
              </div>
            </div>
            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-black" />
              <div>
                <p className="font-bold text-black text-sm">Send Us a Message</p>
                <p className="text-xs text-black/80">Contact@tutee.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroBanner;
