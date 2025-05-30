'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import HeaderDropdown from "./headerdropdown";
import { motion, AnimatePresence } from "framer-motion";

const TuteeHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('/imgs/tutee-profile.png');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTutee = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutee/info', {
          credentials: 'include',
        });
        const data = await res.json();

        if (res.ok) {
          setName(data.first_name);
          if (data.photo?.includes('drive.google.com')) {
            const match = data.photo.match(/[-\w]{25,}/);
            const fileId = match ? match[0] : '';
            setPhoto(`https://drive.google.com/uc?export=view&id=${fileId}`);
          } else if (data.photo) {
            setPhoto(data.photo);
          }
        }
      } catch (error) {
        console.error('Error fetching tutee info:', error);
      }
    };

    fetchTutee();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Animation variants for dropdown and mobile
  const dropdownVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 180, damping: 18 } },
    exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 17 } },
    exit: { opacity: 0, y: -40, transition: { duration: 0.18 } }
  };

  return (
    <header className="w-full px-6 py-5 flex items-center justify-between shadow-md bg-white relative z-50">
      {/* Logo */}
      <Link href="/tutee">
        <div className="flex items-center gap-2 cursor-pointer">
          <img src="/imgs/logo.png" alt="Tutee Logo" className="w-20 h-auto" />
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-10 text-sm font-semibold text-black">
        <Link href="/tutee">HOME</Link>
        <Link href="/../tutee/booked-sessions">BOOKED SESSIONS</Link>
        <Link href="/../tutee-findcourse">FIND A COURSE</Link>
        <Link href="/../tutee/find-tutor">FIND A TUTOR</Link>
        <Link href="/../tutee/contact-us">CONTACT US</Link>
      </nav>

      {/* Avatar & Dropdown */}
      <div className="relative hidden md:flex items-center gap-2 cursor-pointer" ref={dropdownRef}>
        <div onClick={() => setDropdownOpen(prev => !prev)} className="flex items-center gap-2">
          <img
            src={photo}
            alt="Tutee"
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
          <span className="font-semibold text-sm md:text-base">{name || '...'} ▾</span>
        </div>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.14 }}
                className="absolute right-6 top-full mt-1 w-3 h-3 bg-[#F5F5F5] rotate-45 z-40"
              />
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-full mt-4 z-50"
              >
                <HeaderDropdown />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden">
        {mobileOpen ? (
          <X onClick={() => setMobileOpen(false)} className="w-6 h-6 cursor-pointer" />
        ) : (
          <Menu onClick={() => setMobileOpen(true)} className="w-6 h-6 cursor-pointer" />
        )}
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobileMenu"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 w-full bg-white shadow-md md:hidden z-40 border-t border-gray-200"
          >
            <div className="flex flex-col divide-y divide-gray-200">
              {["/tutee", "/../tutee/booked-sessions", "/../tutee-findcourse", "/../tutee/find-tutor", "/../tutee/contact-us"].map((path, i) => {
                const label = ["HOME", "BOOKED SESSIONS", "FIND A COURSE", "FIND A TUTOR", "CONTACT US"][i];
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
                  alt="Tutee"
                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                />
                <p className="text-sm font-medium">{name || '...'}</p>
              </div>

              {/* Profile Actions */}
              <div className="flex justify-center gap-4 px-6 py-3">
                <Link
                  href="/../tutee-edit-profile"
                  className="bg-[#E8B14F] text-white text-sm font-semibold px-4 py-2 rounded-full shadow hover:bg-yellow-600"
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default TuteeHeader;
