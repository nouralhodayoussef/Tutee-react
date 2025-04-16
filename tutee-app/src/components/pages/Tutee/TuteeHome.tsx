"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import TuteeHeader from "../../layout/TuteeHeader";

const TuteeHome = () => {
  return (
    <main className="min-h-screen bg-[#F5F5EF]">
      <TuteeHeader />

      <section className="w-full px-6 sm:px-10 md:px-24 py-12">
        {/* Welcome and Session Info */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col lg:flex-row justify-between items-center gap-8 mb-20">
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-black">Welcome, Nour!</h1>
            <p className="text-sm sm:text-base font-medium text-black">Your Booked Sessions</p>
            <p className="text-base sm:text-lg text-black">
              You don’t have any booked sessions yet!<br />
              Find a Tutor and a Course and get started now!
            </p>
            <div className="flex justify-center lg:justify-start items-center gap-3">
              <Link href="/schedule">
                <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                  Search & Schedule
                </button>
              </Link>
              <ArrowRight className="w-6 h-6 text-[#E8B14F]" />
            </div>
          </div>

          <div className="relative w-full max-w-[365px] h-[334px] hidden md:block">
            <Image
              src="/imgs/tutee-hero.png"
              alt="Tutee Hero Illustration"
              width={365}
              height={334}
              className="object-contain"
            />
          </div>
        </div>

        {/* Your Activity */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center lg:text-left">Your Activity:</h2>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-6">
              <p className="text-base sm:text-lg text-black">
                You don’t have any Tutor yet!<br />
                Find a Tutor and a Course and get started now!
              </p>
              <div className="flex items-center gap-3">
                <Link href="/find-tutor">
                  <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                    Find A Tutor
                  </button>
                </Link>
                <ArrowRight className="w-6 h-6 text-[#E8B14F]" />
              </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-6">
              <p className="text-base sm:text-lg text-black">
                You don’t have any courses yet!<br />
                Find a Tutor and a Course and get started now!
              </p>
              <div className="flex items-center gap-3">
                <Link href="/find-course">
                  <button className="bg-[#E8B14F] text-black font-bold px-6 py-3 text-sm rounded-full shadow">
                    Find A Course
                  </button>
                </Link>
                <ArrowRight className="w-6 h-6 text-[#E8B14F]" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-[#E8B14F]/60 to-[#E8B14F] rounded-[40px] md:rounded-[60px] p-6 sm:p-10 md:p-12 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Contact Us</h2>
          <p className="text-base sm:text-lg font-light text-center mb-10">Let’s Enhance Your Experience</p>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="First Name" className="border-2 border-black rounded-full px-6 py-4 text-sm w-full" />
            <input type="text" placeholder="Last Name" className="border-2 border-black rounded-full px-6 py-4 text-sm w-full" />
            <input type="email" placeholder="Email" className="border-2 border-black rounded-full px-6 py-4 text-sm col-span-1 md:col-span-2 w-full" />
            <input type="text" placeholder="Phone Number" className="border-2 border-black rounded-full px-6 py-4 text-sm col-span-1 md:col-span-2 w-full" />
            <input type="text" placeholder="University Name" className="border-2 border-black rounded-full px-6 py-4 text-sm col-span-1 md:col-span-2 w-full" />
            <textarea placeholder="Write your feedback.." className="border-2 border-black rounded-3xl px-6 py-4 text-sm col-span-1 md:col-span-2 h-40 resize-none w-full" />
          </form>

          <div className="flex justify-center mt-8">
            <button className="bg-white px-8 py-3 rounded-full font-bold text-black text-sm">Send Feedback</button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default TuteeHome;
