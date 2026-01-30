import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import BlockchainTransparency from '@/components/BlockchainTransparency';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentBlockchain = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Blockchain Transparency' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <BlockchainTransparency />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentBlockchain;