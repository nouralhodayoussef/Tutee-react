'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RoleProtectedProps {
  requiredRole: 'tutee' | 'tutor' | 'admin';
  children: React.ReactNode;
}

export default function RoleProtected({
  requiredRole,
  children,
}: RoleProtectedProps) {
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);
  const [userInfo, setUserInfo] = useState<{ id: number | null; role: string | null }>({
    id: null,
    role: null,
  });
  const [phase, setPhase] = useState<'notFound' | 'redirecting' | 'done'>('notFound');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:4000/check-session', {
          credentials: 'include',
        });
        if (!res.ok) {
          setChecked(true);
          return;
        }

        const data = await res.json();
        if (data.role === requiredRole) {
          setAuthorized(true);
        } else {
          setUserInfo({ id: data.id, role: data.role });
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setChecked(true);
      }
    };

    checkAuth();
  }, [requiredRole]);

  useEffect(() => {
    if (checked && !authorized) {
      const notFoundTimer = setTimeout(() => setPhase('redirecting'), 1000);
      const redirectTimer = setTimeout(() => {
        setPhase('done');

        if (!userInfo.id) {
          router.push('/login');
        } else if (userInfo.role === 'tutor') {
          router.push('/tutor');
        } else if (userInfo.role === 'tutee') {
          router.push('/tutee');
        } else if (userInfo.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/login');
        }
      }, 2000);

      return () => {
        clearTimeout(notFoundTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [checked, authorized, userInfo, router]);

  if (!checked) return null;

  if (!authorized) {
    if (phase === 'notFound') {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <div className="flex items-center gap-4 border-l border-gray-600 pl-4">
            <span className="text-3xl font-bold text-white">404</span>
            <span className="text-lg text-white">This page could not be found.</span>
          </div>
        </div>
      );
    }

    if (phase === 'redirecting') {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-white">Redirecting...</span>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
