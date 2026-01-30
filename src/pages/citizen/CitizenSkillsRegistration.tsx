
import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ProfessionalSkillsRegistration from '@/components/ProfessionalSkillsRegistration';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const CitizenSkillsRegistration = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Skills Registration' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <ProfessionalSkillsRegistration />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenSkillsRegistration;
