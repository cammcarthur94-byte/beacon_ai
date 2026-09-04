import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Outreach & PR CRM | Beacon',
  description: 'Manage digital PR pitches, journalist contacts, and review pipelines to displace competitor citations.',
};

export default async function OutreachPage() {
  // CRM function temporarily disabled while undergoing improvements
  redirect('/dashboard');
}
