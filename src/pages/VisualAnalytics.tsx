import React from 'react';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { ModernDashboard } from '@/components/dashboard/ModernDashboard';

const VisualAnalytics = () => {
    return (
        <div className="min-h-screen bg-background">
            <main>
                <ResponsiveContainer className="py-5 sm:py-8">
                    <BreadcrumbNav />

                    <div className="mb-6">
                        <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">System Visuals</h1>
                        <p className="text-sm text-muted-foreground mt-1">Detailed performance charts, graphs, and system activity feed.</p>
                    </div>

                    <ModernDashboard />
                </ResponsiveContainer>
            </main>
        </div>
    );
};

export default VisualAnalytics;
