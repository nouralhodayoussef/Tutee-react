"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import HeaderDropdown from "./headerdropdown"; // 🔁 Reuse the same dropdown used in TuteeHeader

const TutorHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('/imgs/tutor-profile.png');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutor/info', {
          credentials: 'include',
        });
        const data = await res.json();

        if (res.ok) {
          setName(data.first_name);
          if (data.photo?.includes("drive.google.com")) {
            const match = data.photo.match(/[-\w]{25,}/);
            const fileId = match ? match[0] : '';
            setPhoto(`https://drive.google.com/uc?export=view&id=${fileId}`);
          } else if (data.photo) {
            setPhoto(data.photo);
          }
        }
      } catch (err) {
        console.error("❌ Failed to fetch tutor info", err);
      }
    };

    fetchTutor();

    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="w-full px-6 py-5 flex items-center justify-between shadow-md bg-white relative z-50">
      {/* Logo */}
      <Link href="/tutor">
        <img src="/imgs/logo.png" alt="Tutee Logo" className="w-20 h-auto cursor-pointer" />
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-10 text-sm font-semibold text-black">
        <Link href="/tutor">DASHBOARD</Link>
        <Link href="/tutor/scheduling">SCHEDULING</Link>
        <Link href="/tutor/requests">TUTEE’S REQUESTS</Link>
      </nav>

      {/* Avatar & Dropdown */}
      <div className="relative hidden md:flex items-center gap-2 cursor-pointer" ref={dropdownRef}>
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2"
        >
          <img
            src={photo}
            alt="Tutor"
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
          <span className="font-semibold text-sm md:text-base">{name || '...'}</span>
          <span className="text-lg font-bold">▾</span>
        </div>

        {dropdownOpen && (
          <>
            <div className="absolute right-6 top-full mt-1 w-3 h-3 bg-[#F5F5F5] rotate-45 z-40" />
            <HeaderDropdown />
          </>
        )}
      </div>

      {/* Mobile Toggle */}
      <div className="md:hidden">
        {mobileOpen ? (
          <X onClick={() => setMobileOpen(false)} className="w-6 h-6 cursor-pointer" />
        ) : (
          <Menu onClick={() => setMobileOpen(true)} className="w-6 h-6 cursor-pointer" />
        )}
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md md:hidden z-40 border-t border-gray-200">
          <div className="flex flex-col divide-y divide-gray-200">
            {["/tutor", "/tutor/scheduling", "/tutor/requests"].map((path, i) => {
              const label = ["DASHBOARD", "SCHEDULING", "TUTEE’S REQUESTS"][i];
              return (
                <Link
                  key={path}
                  href={path}
                  onClick={() => setMobileOpen(false)}
                  className="px-10 py-3 text-sm font-semibold hover:underline"
                >
                  {label}
                </Link>
              );
            })}

            <hr className="border-t border-black/10 my-2" />

            {/* Profile Info */}
            <div className="flex items-center gap-2 px-6 py-3">
              <img
                src={photo}
                alt="Tutor"
                className="w-10 h-10 rounded-full object-cover border border-gray-300"
              />
              <p className="text-sm font-medium">{name || '...'}</p>
            </div>

            {/* Profile Actions */}
            <div className="flex justify-center gap-4 px-6 py-3">
              <Link
                href="/tutor/edit-profile"
                className="bg-[#E8B14F] text-white text-sm font-semibold px-4 py-2 rounded-full shadow hover:bg-black-800"
                onClick={() => setMobileOpen(false)}
              >
                Edit Profile
              </Link>
              <button
                onClick={() => {
                  fetch('http://localhost:4000/logout', {
                    method: 'POST',
                    credentials: 'include',
                  }).then(() => {
                    window.location.href = '/login';
                  });
                }}
                className="bg-[#8C94A3] text-white text-sm font-semibold px-4 py-2 rounded-full shadow transition duration-200 hover:bg-[#7b828f] cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default TutorHeader;
