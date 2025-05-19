'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const footerLinks = [
  { label: 'ABOUT US', href: '#about' },
  { label: 'COURSES & UNIVERSITIES', href: '#courses' },
  { label: 'HOW IT WORKS', href: '#how-it-works' },
  { label: 'CONTACT US', href: '#contact' },
  { label: 'JOIN TUTEE', href: '/register' },
];

const supportLinks = [
  { label: 'F.A.Q', href: '/faq' },
  { label: 'CONDITIONS', href: '/conditions' },
  { label: 'LICENSES', href: '/licenses' },
];

const socialLinks = [
  { icon: 'fa-facebook', href: '#' },
  { icon: 'fa-twitter', href: '#' },
  { icon: 'fa-linkedin', href: '#' },
  { icon: 'fa-youtube', href: '#' },
  { icon: 'fa-instagram', href: '#' },
  { icon: 'fa-pinterest', href: '#' },
];

export default function Footer() {
  const [homeHref, setHomeHref] = useState('/');

  useEffect(() => {
    // Check session on mount
    fetch('http://localhost:4000/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          if (data.role === 'tutee') setHomeHref('/tutee');
          else if (data.role === 'tutor') setHomeHref('/tutor');
          else if (data.role === 'admin') setHomeHref('/admin');
          else setHomeHref('/');
        } else {
          setHomeHref('/');
        }
      })
      .catch(() => setHomeHref('/'));
  }, []);

  return (
<footer className="w-full bg-[#F5F5EF] border-t-2 border-[#E8B14F]/60 mt-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Logo - dynamic link */}
          <Link href={homeHref}>
            <div className="flex flex-col items-center mb-8 lg:mb-0 cursor-pointer">
              <Image
                src="/imgs/logo.png"
                alt="TUTEE Logo"
                width={110}
                height={110}
                className="object-contain"
              />
            </div>
          </Link>
          {/* Main Links */}
          <div className="flex flex-col sm:flex-row items-center gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              {footerLinks.map((link) => (
                <Link key={link.label} href={link.href} className="font-bold text-sm text-black hover:text-[#E8B14F] transition">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="hidden sm:block w-px bg-black h-20 mx-6 opacity-20" />
            <div className="flex flex-col items-center gap-2">
              {supportLinks.map((link) => (
                <Link key={link.label} href={link.href} className="font-bold text-sm text-black hover:text-[#E8B14F] transition">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="hidden sm:block w-px bg-black h-20 mx-6 opacity-20" />
            {/* Social */}
            <div className="flex flex-col items-center gap-2">
              <span className="font-bold text-sm text-black mb-1">SOCIALIZE WITH TUTEE</span>
              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.icon}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E8B14F] text-white text-lg hover:bg-black hover:text-[#E8B14F] transition"
                  >
                    <i className={`fab ${social.icon}`} />
                  </a>
                ))}
              </div>
            </div>
            <div className="hidden sm:block w-px bg-black h-20 mx-6 opacity-20" />
            {/* Register Button */}
            <div className="flex flex-col items-center">
              <Link href="/register">
                <button className="w-48 h-12 bg-gradient-to-r from-[#E8B14F] to-[#e8b14f99] text-black font-bold rounded-full text-base shadow hover:scale-105 transition">
                  Register Now
                </button>
              </Link>
            </div>
          </div>
        </div>

        <hr className="border-[#E8B14F] opacity-80" />

        <div className="text-center text-xs md:text-sm font-bold text-black opacity-80 pt-3">
          2025 © TUTEE - BY Nour Alhoda Youssef & Joelle Sarkis - ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  );
}
