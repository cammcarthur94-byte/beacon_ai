import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Schema & Markup Validator | Beacon',
  description: 'Inspect website code and structured data readiness for AI search tools and Google AI Overviews.',
};

export default function SchemaToolsPage() {
  // Temporarily hidden per user request
  redirect('/dashboard');
}
