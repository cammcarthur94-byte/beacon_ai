import { redirect } from 'next/navigation';

export default function ReportsPage() {
  // Temporarily hidden per user request
  redirect('/dashboard');
}
