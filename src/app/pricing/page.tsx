import type { Metadata } from 'next';
import { PricingTable } from '@/components/pricing/pricing-table';

export const metadata: Metadata = {
  title: 'Pricing | Beacon',
  description:
    'Beacon plans for solo founders, small agencies, and enterprise teams. Basic, Starter, and Pro tiers with strict monthly usage quotas.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <PricingTable />
    </main>
  );
}
