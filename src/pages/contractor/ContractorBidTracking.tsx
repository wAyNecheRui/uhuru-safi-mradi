import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import RealTimeBidTracking from '@/components/contractor/RealTimeBidTracking';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const ContractorBidTracking = () => {
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');

  const handleCountyChange = (county: string) => {
    console.log('Contractor Bid Tracking - County changed to:', county);
    setSelectedCounty(county);
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Bid Tracking' }
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
          <RealTimeBidTracking />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorBidTracking;