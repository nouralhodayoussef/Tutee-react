/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from "react";
import Link from "next/link";
import { BarChart2, BookOpen, MessageCircle, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

    // Sidebar Links
    const links = [
        { icon: <BarChart2 size={22} />, text: "Insights", href: "/admin" },
        { icon: <BookOpen size={22} />, text: "Current Data", href: "#" },
        { icon: <MessageCircle size={22} />, text: "Feedbacks", href: "#", badge: feedbackCount ? String(feedbackCount) : undefined },
    ];

    // --- Mobile Sidebar ---
    const MobileSidebar = (
        <motion.div
            className="fixed inset-0 z-[90] bg-black/40 flex"
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
                {/* Header */}
                <div className="relative h-[64px] flex items-center border-b border-zinc-800">
                    {/* Centered Logo */}
                    <img
                        src="/imgs/adminlogo.png"
                        alt="Tutee Logo"
                        className="w-[110px] h-[44px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_6px_white] object-contain"
                    />
                    {/* Close Button, top right */}
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
                        aria-label="Close sidebar"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X size={32} />
                    </button>
                </div>
                {/* Links */}
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
                </nav>
                <div className="mt-auto py-6 px-6 text-xs text-gray-400">
                    © {new Date().getFullYear()} – Tutee. All rights reserved
                </div>
            </motion.aside>
        </motion.div>
    );

    // --- Desktop Sidebar ---
    const DesktopSidebar = (
        <motion.aside
            className="fixed z-40 w-60 min-h-screen bg-black flex flex-col justify-between shadow-2xl hidden md:flex"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            <div>
                {/* Logo + Minimize */}
                <div className="flex items-center gap-2 h-[72px] pl-4 pr-2 border-b border-zinc-800 justify-between">
                    <img src="/imgs/adminlogo.png" alt="Tutee Logo" className="w-24 h-auto" />
                    <button
                        className="text-gray-300"
                        aria-label="Minimize sidebar"
                        onClick={() => setMinimized(true)}
                    >
                        <X size={28} />
                    </button>
                </div>
                {/* Nav */}
                <nav className="flex flex-col gap-1 mt-8">
                    {links.map(l => (
                        <SidebarLink key={l.text} {...l} active={active === l.text} />
                    ))}
                </nav>
            </div>
            {/* Footer */}
            <div className="p-4 text-xs text-gray-400">
                © {new Date().getFullYear()} – Tutee. All rights reserved
            </div>
        </motion.aside>
    );

    return (
        <>
            {/* DESKTOP: Show sidebar */}
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
            {/* MOBILE: Header */}
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
            {/* MOBILE: Sidebar Overlay */}
            <AnimatePresence>
                {mobileOpen && MobileSidebar}
            </AnimatePresence>
        </>
    );
}

// SidebarLink: bigger on mobile, classic on desktop
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
        ${active
                    ? "bg-[#E8B14F]/80 text-black"
                    : "text-gray-200"}
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
