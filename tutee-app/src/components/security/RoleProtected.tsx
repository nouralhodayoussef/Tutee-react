'use client';

import { useEffect, useState } from 'react';

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
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setChecked(true);
      }
    };
    checkAuth();
  }, [requiredRole]);

  // while loading, render nothing (avoids flicker)
  if (!checked) return null;

  // if not authorized, show a blank “File not found” page
  if (!authorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-xl font-semibold">File not found</span>
      </div>
    );
  }

  // authorized → render children
  return <>{children}</>;
}
