import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Schema & Markup Validator | Beacon',
  description: 'Inspect JSON-LD structured data and semantic markup readiness for LLM web crawlers and Google AI Overviews.',
};

export default function SchemaToolsPage() {
  // Temporarily hidden per user request
  redirect('/dashboard');
}
