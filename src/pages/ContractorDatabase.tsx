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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        <ContractorDatabase />
      </main>
    </div>
  );
};

export default ContractorDatabasePage;