import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import EscrowManagement from '@/components/EscrowManagement';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentEscrow = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Escrow Management' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <EscrowManagement />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentEscrow;