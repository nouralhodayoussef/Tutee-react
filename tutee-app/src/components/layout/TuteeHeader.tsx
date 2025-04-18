"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const TuteeHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('/imgs/tutee-profile.png');

  useEffect(() => {
    const fetchTutee = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutee/info', {
          credentials: 'include'
        });

        const data = await res.json();
        console.log("📦 Received from backend:", data);

        if (res.ok) {
          setName(data.first_name);

          if (data.photo?.includes('drive.google.com')) {
            const match = data.photo.match(/[-\w]{25,}/);
            const fileId = match ? match[0] : '';
            const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            console.log("🔗 Transformed Drive URL:", driveUrl);
            setPhoto(driveUrl);
          } else if (data.photo) {
            console.log("🖼️ Using direct image link:", data.photo);
            setPhoto(data.photo);
          }
        } else {
          console.error("❌ Tutee info fetch failed");
        }
      } catch (err) {
        console.error("🚨 Error fetching tutee info:", err);
      }
    };

    fetchTutee();
  }, []);

  return (
    <header className="w-full bg-[#F5F5EF] px-6 md:px-24 py-4 flex items-center justify-between relative z-50">
      {/* Logo */}
      <Link href="/tutee">
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
        <Link href="/tutee" className="hover:text-[#E8B14F]">HOME</Link>
        <Link href="#scheduling" className="hover:text-[#E8B14F]">SCHEDULING</Link>
        <Link href="/tutee-findcourse" className="hover:text-[#E8B14F]">FIND A COURSE</Link>
        <Link href="#tutors" className="hover:text-[#E8B14F]">FIND A TUTOR</Link>
        <Link href="#contact" className="hover:text-[#E8B14F]">CONTACT US</Link>
      </nav>

      {/* Desktop Profile Section */}
      <div className="hidden md:flex items-center gap-2">
        <div className="w-[63px] h-[63px] rounded-full overflow-hidden">
          <img
            src={photo}
            alt="Tutee Profile"
            width={63}
            height={63}
            className="rounded-full object-cover"
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
          <Link href="/tutee" onClick={() => setMobileOpen(false)}>HOME</Link>
          <Link href="#scheduling" onClick={() => setMobileOpen(false)}>SCHEDULING</Link>
          <Link href="/tutee-findcourse" onClick={() => setMobileOpen(false)}>FIND A COURSE</Link>
          <Link href="#tutors" onClick={() => setMobileOpen(false)}>FIND A TUTOR</Link>
          <Link href="#contact" onClick={() => setMobileOpen(false)}>CONTACT US</Link>

          <hr className="border-t border-black/10 my-2" />

          <div className="flex items-center gap-2">
            <img
              src={photo}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <p className="text-sm font-medium">{name || '...'}</p>
          </div>
        </div>
      )}
    </header>
  );
};

export default TuteeHeader;