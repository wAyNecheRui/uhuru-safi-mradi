import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ContractorBidding from '@/components/ContractorBidding';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const ContractorBiddingPage = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Project Bidding' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <ContractorBidding />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorBiddingPage;