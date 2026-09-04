import { getInvitationByToken } from '@/app/settings/team-actions';
import { InviteClient } from './invite-client';

export const metadata = {
  title: 'Accept Workspace Invitation | Beacon',
  description: 'Set up your credentials and join your authorized brand workspace.',
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { invitation, brandName, projectId } = await getInvitationByToken(token);

  return (
    <InviteClient
      token={token}
      invitation={invitation}
      brandName={brandName}
      projectId={projectId}
    />
  );
}
