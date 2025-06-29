
import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ContractorVerificationSystem from '@/components/ContractorVerificationSystem';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const ContractorVerification = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Verification System' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header 
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
      />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <ContractorVerificationSystem />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorVerification;
