import { redirect } from 'next/navigation';

export default function SettingsBillingPage() {
  redirect('/settings?tab=billing');
}
