'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f5ef55] font-poppins flex items-center justify-center px-4">
      <div className="w-full max-w-[1200px] bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel (hidden on mobile) */}
        <div className="md:w-1/2 p-8 hidden md:flex flex-col justify-start items-center bg-secondary-bg relative">
          {/* Logo inside left panel (desktop only) */}
          <div className="absolute top-6 left-6">
            <Image src="/imgs/logo.png" alt="Tutee Logo" width={128} height={61} />
          </div>

          <div className="mt-24">
            <Image
              src="/imgs/login-img.png"
              alt="Login Illustration"
              width={400}
              height={350}
              className="rounded-[29px] object-cover"
            />
          </div>
        </div>

        {/* Right Panel (form) */}
        <div className="md:w-1/2 w-full p-6 sm:p-8 relative">
          {/* Logo for mobile (above everything) */}
          <div className="md:hidden mb-6">
            <Image src="/imgs/logo.png" alt="Tutee Logo" width={100} height={50} />
          </div>

          <h3 className="text-lg font-normal text-center text-black mb-6">
            Welcome to Tutee!
          </h3>

          {/* Toggle */}
          <div className="flex justify-center mb-6">
            <div className="flex bg-[#e8b14f82] rounded-full px-2 py-1 w-full max-w-[329px] h-[59px] items-center">
              <div className="bg-[#E8B14F] text-white w-[146px] h-[40px] rounded-full flex items-center justify-center text-[16px] font-medium">
                Login
              </div>
              <Link href="/register">
                <div className="text-white w-[146px] h-[40px] flex items-center justify-center text-[16px] cursor-pointer">
                  Register
                </div>
              </Link>
            </div>
          </div>

          <h4 className="text-sm text-[#5B5B5B] text-center mb-6">Welcome Back!</h4>

          {/* Form */}
          <form className="flex flex-col gap-6">
            <div>
              <label className="text-black text-[16px]">Email Address</label>
              <input
                type="email"
                placeholder="Enter your Email Address"
                className="w-full border border-[#E8B14F] rounded-full px-6 py-3 text-[15px] text-[#ACACAC] font-light mt-1"
              />
            </div>

            <div>
              <label className="text-black text-[16px]">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your Password"
                  className="w-full border border-[#E8B14F] rounded-full px-6 py-3 text-[15px] text-[#ACACAC] font-light pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 text-black text-[20px] focus:outline-none"
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-between text-[12px] text-black font-light flex-wrap gap-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-[15px] h-[15px]" />
                Remember me
              </label>
              <a href="#" className="hover:underline">Forgot Password?</a>
            </div>

            <button
              type="submit"
              className="w-full sm:w-[232px] h-[49px] bg-[#E8B14F] rounded-[36px] text-white text-[16px] mt-2 self-end"
            >
              Login
            </button>

            <p className="text-[12px] font-light text-right mt-4">
              Don’t have an account?{' '}
              <Link href="/register" className="text-[#E8B14F] hover:underline">
                Create one now!
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
