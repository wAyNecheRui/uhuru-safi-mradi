
import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import VerificationSystem from '@/components/VerificationSystem';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentVerification = () => {
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');

  const handleCountyChange = (county: string) => {
    console.log('Government Verification - County changed to:', county);
    setSelectedCounty(county);
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Verification System' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header 
        selectedCounty={selectedCounty}
        onCountyChange={handleCountyChange}
      />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <VerificationSystem />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentVerification;
