
import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import USSDIntegration from '@/components/USSDIntegration';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const CitizenUSSD = () => {
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');

  const handleCountyChange = (county: string) => {
    console.log('Citizen USSD - County changed to:', county);
    setSelectedCounty(county);
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'USSD Services' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header 
        selectedCounty={selectedCounty}
        onCountyChange={handleCountyChange}
      />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <USSDIntegration />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenUSSD;
