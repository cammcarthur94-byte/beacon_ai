import { redirect } from 'next/navigation';

export default function DashboardPage() {
  redirect('/brand-insights?metric=overview');
}
