
import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import SkillsRegistration from '@/components/SkillsRegistration';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const CitizenSkillsRegistration = () => {
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');

  const handleCountyChange = (county: string) => {
    console.log('Citizen Skills Registration - County changed to:', county);
    setSelectedCounty(county);
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Skills Registration' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header 
        selectedCounty={selectedCounty}
        onCountyChange={handleCountyChange}
      />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <SkillsRegistration />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenSkillsRegistration;
