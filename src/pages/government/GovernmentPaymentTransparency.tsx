import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import PaymentTransparency from '@/components/PaymentTransparency';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentPaymentTransparency = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Payment Transparency' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
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