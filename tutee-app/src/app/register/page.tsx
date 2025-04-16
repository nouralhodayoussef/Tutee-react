'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f5ef55] font-poppins flex items-center justify-center px-4 mt-16 mb-16">
      <div className="w-full max-w-[1200px] bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="md:w-1/2 p-8 hidden md:flex flex-col justify-start items-center bg-secondary-bg relative">
          <div className="absolute top-6 left-6">
            <Image src="/imgs/logo.png" alt="Tutee Logo" width={128} height={61} />
          </div>
          <div className="mt-24">
            <Image
              src="/imgs/login-img.png"
              alt="Register Illustration"
              width={400}
              height={350}
              className="rounded-[29px] object-cover"
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="md:w-1/2 w-full p-6 sm:p-8 relative">
          <div className="md:hidden mb-6">
            <Image src="/imgs/logo.png" alt="Tutee Logo" width={100} height={50} />
          </div>

          <h3 className="text-lg font-normal text-center text-black mb-6">
            Welcome to Tutee!
          </h3>

          {/* Toggle */}
          <div className="flex justify-center mb-6">
            <div className="flex bg-[#e8b14f82] rounded-full px-2 py-1 w-full max-w-[329px] h-[59px] items-center">
              <Link href="/login">
                <div className="text-white w-[146px] h-[40px] flex items-center justify-center text-[16px] cursor-pointer">
                  Login
                </div>
              </Link>
              <div className="bg-[#E8B14F] text-white w-[146px] h-[40px] rounded-full flex items-center justify-center text-[16px] font-medium">
                Register
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-6">
            {/* Name */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full">
                <label className="text-black text-[16px]">First Name</label>
                <input
                  type="text"
                  placeholder="Enter your First Name"
                  className="w-full border border-[#E8B14F] rounded-full px-6 py-3 text-sm text-[#ACACAC] font-light mt-1"
                />
              </div>
              <div className="w-full">
                <label className="text-black text-[16px]">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter your Last Name"
                  className="w-full border border-[#E8B14F] rounded-full px-6 py-3 text-sm text-[#ACACAC] font-light mt-1"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-black text-[16px]">Email Address</label>
              <input
                type="email"
                placeholder="Enter your Email Address"
                className="w-full border border-[#E8B14F] rounded-full px-6 py-3 text-sm text-[#ACACAC] font-light mt-1"
              />
            </div>

            {/* University & Major */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full">
                <select className="w-full border border-[#E8B14F] rounded-full px-4 py-3 text-sm text-[#ACACAC] font-light appearance-none pr-10">
                  <option>University</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-sm">
                  ▼
                </div>
              </div>
              <div className="relative w-full">
                <select className="w-full border border-[#E8B14F] rounded-full px-4 py-3 text-sm text-[#ACACAC] font-light appearance-none pr-10">
                  <option>Major</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-sm">
                  ▼
                </div>
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="date"
                className="w-full border border-[#E8B14F] rounded-full px-6 py-3 text-sm text-[#ACACAC] font-light"
              />
              <div className="relative w-full">
                <select className="w-full border border-[#E8B14F] rounded-full px-4 py-3 text-sm text-[#ACACAC] font-light appearance-none pr-10">
                  <option>Gender</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-sm">
                  ▼
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-black text-[16px]">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your Password"
                  className="w-full border border-[#E8B14F] rounded-full px-6 py-3 text-sm text-[#ACACAC] font-light pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 text-black text-[20px]"
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-black text-[16px]">Confirm Password</label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your Password"
                  className="w-full border border-[#E8B14F] rounded-full px-6 py-3 text-sm text-[#ACACAC] font-light pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 text-black text-[20px]"
                >
                  <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            {/* Account Type */}
            <div>
              <label className="text-black text-[16px] mb-1 block">Account Type</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="accountType"
                    value="tutee"
                    defaultChecked
                    className="accent-[#E8B14F]"
                  />
                  Tutee
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="accountType"
                    value="tutor"
                    className="accent-[#E8B14F]"
                  />
                  Tutor
                </label>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full sm:w-[232px] h-[49px] bg-[#E8B14F] rounded-[36px] text-white text-[16px] self-end"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
