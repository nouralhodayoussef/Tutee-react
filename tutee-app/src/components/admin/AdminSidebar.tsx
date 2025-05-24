/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, BookOpen, MessageCircle, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CropModal from "@/components/CropModal";

function useLockBodyScroll(lock: boolean) {
  useEffect(() => {
    if (lock) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lock]);
}

export default function AdminSidebar({
  minimized = false,
  setMinimized,
  active = "Insights",
  feedbackCount,
}: {
  minimized: boolean;
  setMinimized: (val: boolean) => void;
  active?: string;
  feedbackCount?: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [photo, setPhoto] = useState("/imgs/adminlogo.png");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useLockBodyScroll(mobileOpen);

 useEffect(() => {
  fetch("http://localhost:4000/admin/info", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      console.log("✅ admin.photo:", data.photo); // <-- Log the exact URL
      if (data.photo) setPhoto(data.photo);
    })
    .catch(err => console.error("Failed to load admin info:", err));
}, []);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4000/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCropModalOpen(true);
    }
  };

  const handleCropUpload = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("profilePhoto", blob);
    try {
      const res = await fetch("http://localhost:4000/admin/upload-profile", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setPhoto(data.photo);
        setCropModalOpen(false);
      } else {
        alert("❌ Upload failed: " + data.error);
      }
    } catch (err) {
      alert("❌ Upload error");
    }
  };

  const links = [
    { icon: <BarChart2 size={22} />, text: "Insights", href: "/admin" },
    { icon: <BookOpen size={22} />, text: "Current Data", href: "/admin/data" },
    { icon: <MessageCircle size={22} />, text: "Feedbacks", href: "/admin/feedback", badge: feedbackCount ? String(feedbackCount) : undefined },
  ];

  const MobileSidebar = (
    <motion.div
      className="fixed inset-0 z-[1002] bg-black/40 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.13 }}
      onClick={() => setMobileOpen(false)}
    >
      <motion.aside
        className="relative w-[88vw] max-w-[340px] h-full bg-black text-white flex flex-col shadow-2xl"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        exit={{ x: -300 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-[64px] flex items-center border-b border-zinc-800">
          <img
            src="/imgs/adminlogo.png"
            alt="Tutee Logo"
            className="w-[120px] h-[44px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_6px_white] object-contain"
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          >
            <X size={32} />
          </button>
        </div>

        <div className="flex items-center gap-4 px-4 mt-4">
          <img
            src={photo}
            alt="Admin"
            className="w-10 h-10 rounded-full border border-[#E8B14F] object-cover"
            onError={() => setPhoto("/imgs/adminlogo.png")}
          />
          <label className="text-sm underline cursor-pointer">
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            Update Photo
          </label>
        </div>

        <nav className="flex flex-col py-7 px-4 gap-2">
          {links.map((l, i) => (
            <SidebarLink
              key={l.text}
              {...l}
              active={active === l.text}
              mobile
              onClick={() => setMobileOpen(false)}
            />
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 text-base px-3 py-4 rounded-xl font-semibold text-red-400 hover:bg-red-500/20 transition-all"
          >
            <X size={22} />
            <span>Logout</span>
          </button>
        </nav>
        <div className="mt-auto py-6 px-6 text-xs text-gray-400">
          © {new Date().getFullYear()} – Tutee. All rights reserved
        </div>
      </motion.aside>
    </motion.div>
  );

  const DesktopSidebar = (
    <motion.aside
      className="fixed z-40 w-60 min-h-screen bg-black flex flex-col justify-between shadow-2xl hidden md:flex"
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div>
        <div className="flex items-center gap-3 h-[72px] pl-4 pr-2 border-b border-zinc-800 justify-between">
          <img src="/imgs/adminlogo.png" alt="Tutee Logo" className="w-24 h-auto" />
          <button
            className="text-gray-300"
            aria-label="Minimize sidebar"
            onClick={() => setMinimized(true)}
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex items-center gap-4 px-6 mt-6">
          <img
            src={photo}
            alt="Admin"
            className="w-10 h-10 rounded-full border border-[#E8B14F] object-cover"
            onError={() => setPhoto("/imgs/adminlogo.png")}
          />
          <label className="text-xs underline cursor-pointer text-white">
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            Update Photo
          </label>
        </div>

        <nav className="flex flex-col gap-1 mt-6">
          {links.map(l => (
            <SidebarLink key={l.text} {...l} active={active === l.text} />
          ))}
          <button
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-4 px-6 py-3 mt-10 text-sm font-medium rounded-l-full text-red-400 hover:bg-red-500/20 transition-all"
          >
            <X size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      <div className="p-4 text-xs text-gray-400">
        © {new Date().getFullYear()} – Tutee. All rights reserved
      </div>
    </motion.aside>
  );

  return (
    <>
      <AnimatePresence initial={false}>
        {!minimized && DesktopSidebar}
        {minimized && (
          <motion.button
            className="fixed top-4 left-4 z-50 bg-[#E8B14F] text-black p-2 rounded-full shadow-md hidden md:block"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMinimized(false)}
            aria-label="Expand sidebar"
          >
            <Menu size={28} />
          </motion.button>
        )}
      </AnimatePresence>
      {!mobileOpen && (
        <div className="w-full md:hidden flex items-center bg-black px-4 py-3 fixed top-0 left-0 z-[101]">
          <img src="/imgs/adminlogo.png" alt="Tutee Logo" className="h-7 w-auto" />
          <button
            className="ml-auto text-white"
            aria-label="Open sidebar"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={30} />
          </button>
        </div>
      )}
      <AnimatePresence>{mobileOpen && MobileSidebar}</AnimatePresence>
      {cropModalOpen && previewUrl && (
        <CropModal
          imageSrc={previewUrl}
          open={cropModalOpen}
          onCropComplete={handleCropUpload}
          onClose={() => {
            setCropModalOpen(false);
            setPreviewUrl(null);
          }}
        />
      )}
    </>
  );
}

function SidebarLink({
  icon,
  text,
  href,
  active = false,
  badge,
  mobile = false,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  href: string;
  active?: boolean;
  badge?: string;
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-4
        ${mobile
          ? "text-base px-3 py-4 rounded-xl font-semibold"
          : "px-6 py-3 text-sm font-medium rounded-l-full"}
        hover:bg-[#E8B14F]/20 transition-all relative
        ${active ? "bg-[#E8B14F]/80 text-black" : "text-gray-200"}
      `}
    >
      <span>{icon}</span>
      <span>{text}</span>
      {badge && (
        <span className="ml-auto bg-[#E8B14F] text-black rounded-full px-2 py-0.5 text-xs font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}
