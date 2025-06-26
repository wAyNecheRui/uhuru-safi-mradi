
import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ContractorDatabase from '@/components/ContractorDatabase';

const ContractorDatabasePage = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor Database' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header 
        currentLanguage="en"
        onLanguageChange={() => {}}
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
        getText={(en: string) => en}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        <ContractorDatabase />
      </main>
    </div>
  );
};

export default ContractorDatabasePage;
