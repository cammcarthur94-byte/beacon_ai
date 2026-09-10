import * as React from 'react';
import { redirect } from 'next/navigation';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { BrandInsightsClient } from '@/components/brand-insights/brand-insights-client';
import { loadDashboardData } from '@/lib/dashboard-data';

export const metadata = {
  title: 'Brand Insights | Beacon',
  description: 'AI search engine perception, brand mention rates, and visibility scores for your brand.',
};

export default async function BrandInsightsPage() {
  const dashboardData = await loadDashboardData();

  if (!dashboardData) {
    redirect('/onboarding');
  }

  return (
    <AppSidebarLayout project={dashboardData.project}>
      <React.Suspense fallback={<div className="p-8 animate-pulse text-slate-400">Loading Brand Insights...</div>}>
        <BrandInsightsClient
          project={dashboardData.project}
          runs={dashboardData.runs}
          dashboardData={dashboardData}
        />
      </React.Suspense>
    </AppSidebarLayout>
  );
}
