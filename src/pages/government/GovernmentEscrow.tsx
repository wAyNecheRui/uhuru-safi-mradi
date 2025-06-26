
import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import EscrowManagement from '@/components/EscrowManagement';

const GovernmentEscrow = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Escrow Management' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header 
        currentLanguage="en"
        onLanguageChange={() => {}}
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
        getText={(en: string) => en}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        <EscrowManagement />
      </main>
    </div>
  );
};

export default GovernmentEscrow;
