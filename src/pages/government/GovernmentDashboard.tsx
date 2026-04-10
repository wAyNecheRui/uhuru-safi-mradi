import React from 'react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import GovernmentDashboard from '@/components/GovernmentDashboard';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { ModernDashboard } from '@/components/dashboard/ModernDashboard';

const GovernmentDashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <ResponsiveContainer className="py-5 sm:py-8">
          <BreadcrumbNav />
          
          {/* Modern Dashboard with Charts */}
          <ModernDashboard />
          
          <GovernmentDashboard />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentDashboardPage;
