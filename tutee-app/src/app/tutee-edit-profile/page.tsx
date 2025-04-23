'use client';

import TuteeHeader from '@/components/layout/TuteeHeader';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TuteeEditProfile() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photo, setPhoto] = useState('/imgs/tutee-profile.png');

  const [majors, setMajors] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [showMajors, setShowMajors] = useState(false);
  const [showUniversities, setShowUniversities] = useState(false);

  const [inputFirstName, setInputFirstName] = useState('');
  const [inputLastName, setInputLastName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    const fetchTuteeInfo = async () => {
      try {
        const res = await fetch('http://localhost:4000/tutee/info', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) {
          setFirstName(data.first_name);
          setLastName(data.last_name);
          if (data.photo?.includes('drive.google.com')) {
            const match = data.photo.match(/[-\w]{25,}/);
            const fileId = match ? match[0] : '';
            setPhoto(`https://drive.google.com/uc?export=view&id=${fileId}`);
          } else if (data.photo) {
            setPhoto(data.photo);
          }
        }
      } catch (err) {
        console.error('Error fetching tutee info:', err);
      }
    };

    const fetchDropdownOptions = async () => {
      try {
        const res = await fetch('http://localhost:4000/findcourse/options', {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          setMajors(data.majors);
          setUniversities(data.universities);
          setSelectedMajor(data.selectedMajor);
          setSelectedUniversity(data.selectedUniversity);
        }
      } catch (err) {
        console.error('❌ Error fetching dropdown options:', err);
      }
    };

    fetchTuteeInfo();
    fetchDropdownOptions();
  }, []);

  const validateInputs = () => {
    let valid = true;
    const nameRegex = /^[A-Za-z\s'-]+$/;

    if (inputFirstName && (inputFirstName.length < 2 || inputFirstName.length > 25 || !nameRegex.test(inputFirstName))) {
      setFirstNameError('First name must be 2–25 letters and no special characters.');
      valid = false;
    } else {
      setFirstNameError('');
    }

    if (inputLastName && (inputLastName.length < 2 || inputLastName.length > 30 || !nameRegex.test(inputLastName))) {
      setLastNameError('Last name must be 2–30 letters and no special characters.');
      valid = false;
    } else {
      setLastNameError('');
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const res = await fetch('http://localhost:4000/update-tutee', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: inputFirstName,
          lastName: inputLastName,
          selectedMajor,
          selectedUniversity,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => location.reload(), 1500);
      } else {
        const data = await res.json();
        alert(`❌ Failed to update: ${data.error}`);
      }
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      alert('❌ Something went wrong');
    }
  };

  return (
    <>
      <TuteeHeader />
      <div className="min-h-screen bg-[#FAFAF5] font-poppins px-6 py-12">
        <div className="max-w-[1354px] min-h-[659px] bg-white mx-auto shadow-md rounded-[15px] px-12 pt-10 flex flex-col lg:flex-row justify-between">
          {/* Left Form Section */}
          <div className="w-full lg:w-[70%]">
            <h1 className="text-[46px] font-bold mb-10">Your Profile</h1>

            {/* Profile Top */}
            <div className="flex items-center justify-between mb-6 flex-col sm:flex-row gap-6 sm:gap-0">
              <div className="flex gap-4 items-center">
                <Image
                  src={photo}
                  alt="Profile"
                  width={69}
                  height={67}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-[16px]">{firstName} {lastName}</p>
                 
                </div>
              </div>
              <div className="flex gap-3">
                <button className="bg-[#E8B14F] text-white rounded-full px-6 py-2 text-[16px] hover:opacity-90">
                  Update Photo
                </button>
                <button className="bg-[#8C94A3] text-white rounded-full px-6 py-2 text-[16px] hover:opacity-90">
                  Delete
                </button>
              </div>
            </div>

            <hr className="border-[#D0D0D0] mb-6" />

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Name Row */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full">
                  <label className="block font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={inputFirstName}
                    onChange={(e) => setInputFirstName(e.target.value)}
                    placeholder={firstName}
                    className="w-full border border-[#E8B14F] rounded-full px-6 py-2 text-[15px] placeholder-gray-400"
                  />
                  {firstNameError && (
                    <p className="text-red-600 text-sm mt-1">{firstNameError}</p>
                  )}
                </div>
                <div className="w-full">
                  <label className="block font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={inputLastName}
                    onChange={(e) => setInputLastName(e.target.value)}
                    placeholder={lastName}
                    className="w-full border border-[#E8B14F] rounded-full px-6 py-2 text-[15px] placeholder-gray-400"
                  />
                  {lastNameError && (
                    <p className="text-red-600 text-sm mt-1">{lastNameError}</p>
                  )}
                </div>
              </div>

              {/* Dropdowns and Account Privacy */}
              <div className="flex flex-col sm:flex-row gap-12 mt-10">
                <div className="flex flex-col gap-10 w-full sm:w-[350px]">
                  {/* University Dropdown */}
                  <div className="relative w-full">
                    <label className="block font-medium mb-1">University</label>
                    <button
                      type="button"
                      onClick={() => setShowUniversities(!showUniversities)}
                      className="w-full border border-[#E8B14F] rounded-full px-6 py-2 text-[15px] text-left bg-white"
                    >
                      {selectedUniversity || 'Select university'} <span className="float-right">▾</span>
                    </button>
                    {showUniversities && (
                      <div className="absolute top-full mt-1 w-full z-50 bg-white shadow-md rounded-[10px] max-h-[180px] overflow-y-auto">
                        {universities.map((uni: any) => (
                          <div
                            key={uni.id}
                            onClick={() => {
                              setSelectedUniversity(uni.university_name);
                              setShowUniversities(false);
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {uni.university_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Major Dropdown */}
                  <div className="relative w-full">
                    <label className="block font-medium mb-1">Major</label>
                    <button
                      type="button"
                      onClick={() => setShowMajors(!showMajors)}
                      className="w-full border border-[#E8B14F] rounded-full px-6 py-2 text-[15px] text-left bg-white"
                    >
                      {selectedMajor || 'Select major'} <span className="float-right">▾</span>
                    </button>
                    {showMajors && (
                      <div className="absolute top-full mt-1 w-full z-50 bg-white shadow-md rounded-[10px] max-h-[180px] overflow-y-auto">
                        {majors.map((m: any) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedMajor(m.major_name);
                              setShowMajors(false);
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {m.major_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Privacy Section */}
                <div className="mt-1 sm:mt-[10px]">
                  <p className="text-[#E8B14F] font-bold text-[16px] mb-2">Account Privacy</p>
                  <p
                    onClick={() => router.push('/change-password')}
                    className="text-black font-semibold text-sm sm:text-base cursor-pointer hover:underline"
                  >
                    Change your password
                  </p>
                </div>
              </div>

              {/* Update Button + Success Message */}
              <div className="mt-10 mb-5">
                <button
                  type="submit"
                  className="bg-[#E8B14F] text-white rounded-full px-8 py-2 text-[16px] font-medium hover:opacity-90"
                >
                  Update Profile
                </button>
                {successMsg && (
                  <p className="text-green-600 font-medium mt-3">{successMsg}</p>
                )}
              </div>
            </form>
          </div>

          {/* Right Empty Space */}
          <div className="hidden lg:block w-[25%] h-full"></div>
        </div>
      </div>
    </>
  );
}
