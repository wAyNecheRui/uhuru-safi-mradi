
import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import PaymentTransparency from '@/components/PaymentTransparency';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentPaymentTransparency = () => {
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');

  const handleCountyChange = (county: string) => {
    console.log('Government Payment Transparency - County changed to:', county);
    setSelectedCounty(county);
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Payment Transparency' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header 
        selectedCounty={selectedCounty}
        onCountyChange={handleCountyChange}
      />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <PaymentTransparency />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentPaymentTransparency;
