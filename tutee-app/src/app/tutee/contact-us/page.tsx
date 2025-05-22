'use client';

import TuteeHeader from '@/components/layout/TuteeHeader';
import ContactUsSection from '@/components/pages/Visitor/sections/ContactUsSection';
import RoleProtected from '@/components/security/RoleProtected';

export default function ContactUsPage() {
  return (
    <RoleProtected requiredRoles={['tutee', 'tutor', 'admin']}>
      <main className="min-h-screen bg-neutral-50">
        <TuteeHeader />
        <ContactUsSection />
      </main>
    </RoleProtected>
  );
}
