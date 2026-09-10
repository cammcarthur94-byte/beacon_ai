import { redirect } from 'next/navigation';

export default function LeaderboardPage() {
  redirect('/brand-insights?metric=overview');
}
