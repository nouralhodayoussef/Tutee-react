'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OtpModal from '@/components/OtpModal';
import { useRouter } from 'next/navigation';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface University {
  id: number;
  university_name: string;
}

interface Major {
  major_id: number;
  major_name: string;
  university_id: number;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    university: '',
    major: '',
    dob: '',
    gender: '',
    password: '',
    confirmPassword: '',
    role: 'tutee',
  });

  const [errors, setErrors] = useState<any>({});
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpUserData, setOtpUserData] = useState<any>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [allMajors, setAllMajors] = useState<Major[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('http://localhost:4000/register/options')
      .then(res => res.json())
      .then(data => {
        setUniversities(data.universities);
        setAllMajors(data.majors);
      });
  }, []);

  useEffect(() => {
    if (form.university) {
      const university = universities.find(u => u.university_name === form.university);
      if (university) {
        const filteredMajors = allMajors.filter(m => m.university_id === university.id);
        setMajors(filteredMajors.map(m => m.major_name));
        if (!filteredMajors.some(m => m.major_name === form.major)) {
          setForm(prev => ({ ...prev, major: '' }));
        }
      }
    } else {
      setMajors([]);
      setForm(prev => ({ ...prev, major: '' }));
    }
  }, [form.university, universities, allMajors]);

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
  };

  const validateStepByStep = async () => {
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&_.!*])[A-Za-z\d@#$%&_.!*]{8,18}$/;

    if (form.firstName.length > 25) {
      setErrors({ firstName: 'First name must be at most 25 characters' });
      return false;
    }
    if (!/^[A-Za-z]+$/.test(form.firstName)) {
      setErrors({ firstName: 'First name must contain letters only' });
      return false;
    }
    if (form.firstName.length < 2) {
      setErrors({ firstName: 'First name must be at least 2 characters' });
      return false;
    }
    
    // Last Name Validation
    if (form.lastName.length > 30) {
      setErrors({ lastName: 'Last name must be at most 30 characters' });
      return false;
    }
    if (!/^[A-Za-z\s]+$/.test(form.lastName)) {
      setErrors({ lastName: 'Last name must contain letters only' });
      return false;
    }
    if (form.lastName.length < 2) {
      setErrors({ lastName: 'Last name must be at least 2 characters' });
      return false;
    }
    if (!form.lastName) {
      setErrors({ lastName: 'Last name is required' });
      return false;
    }
    if (!form.email) {
      setErrors({ email: 'Email is required' });
      return false;
    } else {
      try {
        const res = await fetch('http://localhost:4000/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (data.exists) {
          setErrors({ email: 'User already exists' });
          return false;
        }
      } catch {
        setErrors({ email: 'Server error. Please check your connection.' });
        return false;
      }
    }

    if (!form.university) {
      setErrors({ university: 'University is required' });
      return false;
    }
    if (!form.major) {
      setErrors({ major: 'Major is required' });
      return false;
    }
    if (!form.dob) {
      setErrors({ dob: 'Date of birth is required' });
      return false;
    }
    if (!form.gender) {
      setErrors({ gender: 'Gender is required' });
      return false;
    }
    if (!passwordRegex.test(form.password)) {
      setErrors({ password: 'Password must be 8–18 chars, include uppercase, lowercase, digit, and special (@#$%&_.!*)' });
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return false;
    }

    if (!form.role) {
      setErrors({ role: 'Please select your account type' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const isValid = await validateStepByStep();
    if (!isValid) return;

    const selectedUniversity = universities.find(u => u.university_name === form.university);
    const selectedMajor = allMajors.find(m => m.major_name === form.major && m.university_id === selectedUniversity?.id);

    const userDataWithIds = {
      ...form,
      universityId: selectedUniversity?.id || null,
      majorId: selectedMajor?.major_id || null,
    };

    setOtpUserData(userDataWithIds);
    setOtpModalVisible(true);
  };

  return (
    <main className="min-h-screen bg-[#f5f5ef] font-poppins flex items-center justify-center px-4">
      <div className="w-full max-w-[1200px] bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="md:w-1/2 p-8 hidden md:flex flex-col justify-center items-center bg-secondary-bg relative">
          <Image src="/imgs/logo.png" alt="Tutee Logo" width={128} height={61} className="absolute top-6 left-6" />
          <div className="mt-24">
            <Image src="/imgs/login-img.png" alt="Register Illustration" width={400} height={400} />
          </div>
        </div>

        {/* Right Panel */}
        <div className="md:w-1/2 w-full px-8 py-12 flex flex-col justify-center items-center gap-4 font-poppins">
          <h2 className="text-lg font-semibold text-center font-poppins">Welcome to Tutee!</h2>

          <div className="flex justify-center mb-6">
            <div className="flex bg-[#e8b14f82] rounded-full px-2 py-1 w-full max-w-[329px] h-[59px] items-center">
              <Link href="/login">
                <div className="text-white w-[146px] h-[40px] flex items-center justify-center text-[16px] cursor-pointer font-poppins">
                  Login
                </div>
              </Link>
              <div className="bg-[#E8B14F] text-white w-[146px] h-[40px] rounded-full flex items-center justify-center text-[16px] font-medium font-poppins">
                Register
              </div>
            </div>
          </div>

          {errors.email === 'User already exists' && (
            <p className="text-red-600 text-sm text-center -mt-4 font-poppins">{errors.email}</p>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 font-poppins">
            <div className="flex gap-4">
              <div className="w-full">
                <label className="text-[16px] text-black mb-1 block font-poppins">First Name</label>
                <input type="text" placeholder="Enter your First Name" className={`w-full px-4 py-3 rounded-full border font-poppins ${errors.firstName ? 'border-red-500' : 'border-yellow-400'}`} value={form.firstName} onChange={e => handleInputChange('firstName', e.target.value)} />
                {errors.firstName && <p className="text-red-600 text-sm font-poppins">{errors.firstName}</p>}
              </div>
              <div className="w-full">
                <label className="text-[16px] text-black mb-1 block font-poppins">Last Name</label>
                <input type="text" placeholder="Enter your Last Name" className={`w-full px-4 py-3 rounded-full border font-poppins ${errors.lastName ? 'border-red-500' : 'border-yellow-400'}`} value={form.lastName} onChange={e => handleInputChange('lastName', e.target.value)} />
                {errors.lastName && <p className="text-red-600 text-sm font-poppins">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="text-[16px] text-black mb-1 block font-poppins">Email Address</label>
              <input type="email" placeholder="Enter your Email" className={`w-full px-4 py-3 rounded-full border font-poppins ${errors.email ? 'border-red-500' : 'border-yellow-400'}`} value={form.email} onChange={e => handleInputChange('email', e.target.value)} />
              {errors.email && errors.email !== 'User already exists' && <p className="text-red-600 text-sm font-poppins">{errors.email}</p>}
            </div>

            <div className="flex gap-4">
              <div className="w-full">
                <label className="text-[16px] text-black mb-1 block font-poppins">University</label>
                <select className={`w-full px-4 py-3 rounded-full border font-poppins ${errors.university ? 'border-red-500' : 'border-yellow-400'}`} value={form.university} onChange={e => handleInputChange('university', e.target.value)}>
                  <option className="font-poppins" value="">Select University</option>
                  {universities.map(u => (<option key={u.id} value={u.university_name} className="font-poppins">{u.university_name}</option>))}
                </select>
                {errors.university && <p className="text-red-600 text-sm font-poppins">{errors.university}</p>}
              </div>
              <div className="w-full">
                <label className="text-[16px] text-black mb-1 block font-poppins">Major</label>
                <select className={`w-full px-4 py-3 rounded-full border font-poppins ${errors.major ? 'border-red-500' : 'border-yellow-400'}`} value={form.major} onChange={e => handleInputChange('major', e.target.value)}>
                  <option className="font-poppins" value="">Select Major</option>
                  {majors.map((m, i) => (<option key={i} value={m} className="font-poppins">{m}</option>))}
                </select>
                {errors.major && <p className="text-red-600 text-sm font-poppins">{errors.major}</p>}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-full">
                <label className="text-[16px] text-black mb-1 block font-poppins">Date of Birth</label>
                <input type="date" className={`w-full px-4 py-3 rounded-full border font-poppins ${errors.dob ? 'border-red-500' : 'border-yellow-400'}`} value={form.dob} onChange={e => handleInputChange('dob', e.target.value)} />
                {errors.dob && <p className="text-red-600 text-sm font-poppins">{errors.dob}</p>}
              </div>
              <div className="w-full">
                <label className="text-[16px] text-black mb-1 block font-poppins">Gender</label>
                <select className={`w-full px-4 py-3 rounded-full border font-poppins ${errors.gender ? 'border-red-500' : 'border-yellow-400'}`} value={form.gender} onChange={e => handleInputChange('gender', e.target.value)}>
                  <option className="font-poppins" value="">Gender</option>
                  <option className="font-poppins" value="male">Male</option>
                  <option className="font-poppins" value="female">Female</option>
                </select>
                {errors.gender && <p className="text-red-600 text-sm font-poppins">{errors.gender}</p>}
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your Password"
                className={`w-full px-4 py-3 pr-12 rounded-full border font-poppins ${errors.password ? 'border-red-500' : 'border-yellow-400'}`}
                value={form.password}
                onChange={e => handleInputChange('password', e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-lg text-gray-700">
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
              {errors.password && <p className="text-red-600 text-sm font-poppins mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-[16px] text-black mb-1 block font-poppins">Confirm Password</label>
              <input type="password" placeholder="Confirm your Password" className={`w-full px-4 py-3 rounded-full border font-poppins ${errors.confirmPassword ? 'border-red-500' : 'border-yellow-400'}`} value={form.confirmPassword} onChange={e => handleInputChange('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <p className="text-red-600 text-sm font-poppins">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="text-[16px] text-black mb-1 block font-poppins">Account Type</label>
              <div className="flex gap-6 items-center font-poppins">
                <label className="flex items-center gap-2 text-sm font-poppins">
                  <input type="radio" name="role" value="tutee" checked={form.role === 'tutee'} onChange={e => handleInputChange('role', e.target.value)} /> Tutee
                </label>
                <label className="flex items-center gap-2 text-sm font-poppins">
                  <input type="radio" name="role" value="tutor" checked={form.role === 'tutor'} onChange={e => handleInputChange('role', e.target.value)} /> Tutor
                </label>
              </div>
            </div>

            <button type="submit" className="w-full sm:w-2/3 mx-auto px-6 py-3 bg-[#E8B14F] text-white rounded-full font-semibold font-poppins">
              Register
            </button>
          </form>

          {otpModalVisible && otpUserData && (
            <OtpModal
              email={form.email}
              userData={otpUserData}
              onVerify={() => {
                
                console.log('✅ Verified successfully! Redirecting...');
              
              
                setTimeout(() => {
                  router.push('/login');
                }, 2000); 
              }}
             
              onClose={() => setOtpModalVisible(false)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
