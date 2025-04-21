'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeaderDropdown() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await fetch('http://localhost:4000/dropdowninfo', {
          credentials: 'include',
        });

        const data = await res.json();
        console.log('📬 /dropdowninfo response:', data);

        if (res.ok && data.email) {
          setEmail(data.email);
        } else {
          setEmail('');
        }
      } catch (err) {
        console.error('❌ Failed to fetch email:', err);
        setEmail('');
      }
    };

    fetchEmail();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:4000/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error('❌ Logout request failed:', err);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-72 sm:w-96 bg-[#F5F5F5] rounded-[15px] shadow-md z-50 p-6">
      {/* Email Section */}
      <div className="mb-5 border-b border-gray-300 pb-3">
        <p className="text-[#E8B14F] font-bold text-sm sm:text-base font-montserrat mb-1">
          Email Address
        </p>
        <p className="text-black font-medium text-sm sm:text-base font-montserrat">
          {email || 'No email found'}
        </p>
      </div>

      {/* Change Password Section */}
      <div className="mb-5 border-b border-gray-300 pb-3">
        <p className="text-[#E8B14F] font-bold text-sm sm:text-base font-montserrat mb-1">
          Account Privacy
        </p>
        <p
          onClick={() => router.push('/change-password')}
          className="text-black font-semibold text-sm sm:text-base font-montserrat cursor-pointer hover:underline"
        >
          Change your password
        </p>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-[98px] h-[49px] bg-[#8C94A3] rounded-full text-white text-sm sm:text-base font-poppins"
      >
        Log out
      </button>
    </div>
  );
}
