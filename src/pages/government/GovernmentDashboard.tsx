
import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import GovernmentDashboard from '@/components/GovernmentDashboard';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav />
          <GovernmentDashboard />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentDashboardPage;
