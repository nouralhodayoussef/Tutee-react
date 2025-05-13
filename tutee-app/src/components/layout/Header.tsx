"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[#F5F5EF] px-6 md:px-24 py-4 flex items-center justify-between relative z-50">
      {/* Logo */}
      <div className="w-32 h-auto relative">
        <Image
          src="/imgs/logo.png"
          alt="Tutee Logo"
          width={128}
          height={61}
          priority
        />
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-[12px] font-bold text-black">
        <Link href="#about" className="hover:text-[#E8B14F]">ABOUT US</Link>
        <Link href="#tutors" className="hover:text-[#E8B14F]">OUR TUTORS</Link>
        <Link href="#courses" className="hover:text-[#E8B14F]">COURSES & UNIVERSITIES</Link>
        <Link href="#how-it-works" className="hover:text-[#E8B14F]">HOW IT WORKS</Link>
      </nav>

      {/* Desktop Buttons */}
      <div className="hidden md:flex items-center gap-4">
        <Link
          href="/login"
          className="border-2 border-black text-[#E8B14F] font-bold rounded-full px-6 py-2 text-sm hover:bg-yellow-100"
        >
          LOG IN
        </Link>
        <Link
          href="/register"
          className="bg-[#E8B14F] hover:bg-yellow-500 text-black font-bold rounded-full px-6 py-2 text-sm shadow"
        >
          JOIN TUTEE
        </Link>
      </div>

      {/* Mobile Hamburger Icon */}
      <button
        className="md:hidden text-black"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#F5F5EF] shadow-md rounded-b-xl py-4 px-6 flex flex-col gap-4 text-sm font-semibold text-black md:hidden">
          <Link href="#about" onClick={() => setMobileMenuOpen(false)}>ABOUT US</Link>
          <Link href="#tutors" onClick={() => setMobileMenuOpen(false)}>OUR TUTORS</Link>
          <Link href="#courses" onClick={() => setMobileMenuOpen(false)}>COURSES & UNIVERSITIES</Link>
          <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>HOW IT WORKS</Link>

          <hr className="border-t border-black/10" />

          <Link
            href="#login"
            className="text-[#E8B14F] border border-black rounded-full py-2 text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            LOG IN
          </Link>
          <Link
            href="#signup"
            className="bg-[#E8B14F] text-black font-bold rounded-full py-2 text-center shadow hover:bg-yellow-500"
            onClick={() => setMobileMenuOpen(false)}
          >
            JOIN TUTEE
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
