import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import PaymentTransparency from '@/components/PaymentTransparency';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import LegacyPaymentBanner from '@/components/wallet/LegacyPaymentBanner';

const GovernmentPaymentTransparency = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Payment Transparency' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <LegacyPaymentBanner
            feature="Payment audit"
            replacement="The authoritative record of every transfer is now the wallet ledger. This page still aggregates legacy M-Pesa transactions for historical audits."
            showCta
          />
          <PaymentTransparency />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentPaymentTransparency;