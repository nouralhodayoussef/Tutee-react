'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeaderDropdown() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('http://localhost:4000/dropdowninfo', {
          credentials: 'include',
        });

        const data = await res.json();
        if (res.ok && data.email && data.role) {
          setEmail(data.email);
          setRole(data.role);
        } else {
          setEmail('');
          setRole('');
        }
      } catch (err) {
        console.error('❌ Failed to fetch user info:', err);
        setEmail('');
        setRole('');
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await fetch('http://localhost:4000/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  };

  const handleEditProfile = () => {
    if (role === 'tutee') {
      router.push('/tutee-edit-profile');
    } else if (role === 'tutor') {
      router.push('/../tutor-edit-profile');
    } else {
      alert('🚫 User role not recognized. Please log in again.');
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-72 sm:w-96 bg-[#F5F5F5] rounded-[15px] shadow-md z-50 p-6">
      {/* Email Section */}
      <div className="mb-5 border-b border-gray-300 pb-3">
        <div>
          <p className="text-[#E8B14F] font-bold text-sm sm:text-base font-montserrat mb-1">
            Email Address
          </p>
          <p className="text-black font-medium text-sm sm:text-base font-montserrat break-all">
            {email || 'No email found'}
          </p>
        </div>
      </div>

      {/* Account Management */}
      <div className="mb-5 border-b border-gray-300 pb-3">
        <p className="text-[#E8B14F] font-bold text-sm sm:text-base font-montserrat mb-1">
          Account Management
        </p>
        <p
          onClick={handleEditProfile}
          className="text-black font-semibold text-sm sm:text-base font-montserrat cursor-pointer hover:underline"
        >
          Edit Your Profile
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-[98px] h-[49px] bg-[#8C94A3] rounded-full text-white text-sm sm:text-base font-poppins transition duration-200 hover:bg-[#7b828f] cursor-pointer"
      >
        Log out
      </button>
    </div>
  );
}
