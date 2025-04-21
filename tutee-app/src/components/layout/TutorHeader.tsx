"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const TutorHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('/imgs/tutor-profile.png');

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutor/info', {
          credentials: 'include',
        });

        const data = await res.json();
        console.log("📦 Tutor info:", data);

        if (res.ok) {
          setName(data.first_name);

          if (data.photo?.includes('drive.google.com')) {
            const match = data.photo.match(/[-\w]{25,}/);
            const fileId = match ? match[0] : '';
            const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            setPhoto(driveUrl);
          } else if (data.photo) {
            setPhoto(data.photo);
          }
        } else {
          console.error("❌ Failed to fetch tutor info");
        }
      } catch (err) {
        console.error("🚨 Tutor fetch error:", err);
      }
    };

    fetchTutor();
  }, []);

  return (
    <header className="w-full bg-[#F5F5EF] px-6 md:px-24 py-4 flex items-center justify-between relative z-50">
      {/* Logo */}
      <Link href="/tutor">
        <div className="w-32 h-auto relative cursor-pointer">
          <img
            src="/imgs/logo.png"
            alt="Tutee Logo"
            width={128}
            height={61}
          />
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-black">
        <Link href="/tutor" className="hover:text-[#E8B14F]">DASHBOARD</Link>
        <Link href="#scheduling" className="hover:text-[#E8B14F]">SCHEDULING</Link>
        <Link href="#requests" className="hover:text-[#E8B14F]">TUTEE’S REQUESTS</Link>
      </nav>

      {/* Desktop Profile Section */}
      <div className="hidden md:flex items-center gap-2">
        <div className="w-[63px] h-[63px] rounded-full overflow-hidden shrink-0">
          <img
            src={photo}
            alt="Tutor Profile"
            className="w-full h-full object-cover block"
          />
        </div>
        <p className="text-[18px] font-medium text-black">{name || '...'}</p>
        <span className="text-lg font-bold text-black">▾</span>
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden text-black"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 w-full bg-[#F5F5EF] shadow-md rounded-b-xl py-4 px-6 flex flex-col gap-4 text-sm font-semibold text-black md:hidden">
          <Link href="/tutor" onClick={() => setMobileOpen(false)}>DASHBOARD</Link>
          <Link href="#scheduling" onClick={() => setMobileOpen(false)}>SCHEDULING</Link>
          <Link href="#requests" onClick={() => setMobileOpen(false)}>TUTEE’S REQUESTS</Link>

          <hr className="border-t border-black/10 my-2" />

          <div className="flex items-center gap-2">
            <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0">
              <img
                src={photo}
                alt="Tutor Profile"
                className="w-full h-full object-cover block"
              />
            </div>
            <p className="text-sm font-medium">{name || '...'}</p>
          </div>
        </div>
      )}
    </header>
  );
};

export default TutorHeader;
