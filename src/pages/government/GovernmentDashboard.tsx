
import React from 'react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import GovernmentDashboard from '@/components/GovernmentDashboard';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentDashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">

      
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
