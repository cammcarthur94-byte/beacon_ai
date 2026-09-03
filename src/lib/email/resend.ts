import { Resend } from 'resend';

export interface VisibilityDropAlertPayload {
  toEmail: string;
  brandName: string;
  queryText: string;
  engine: string;
  previousScore: number;
  newScore: number;
  promptId: string;
}

export async function sendVisibilityDropAlert(payload: VisibilityDropAlertPayload) {
  const {
    toEmail,
    brandName,
    queryText,
    engine,
    previousScore,
    newScore,
    promptId,
  } = payload;

  const dropPercent = previousScore - newScore;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const deepDiveUrl = `${appUrl}/audits/${promptId}`;

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log(`[Resend Alert Simulated] Visibility drop of -${dropPercent}% detected for "${queryText}" on ${engine}. Target: ${toEmail}. Deep dive: ${deepDiveUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: 'Beacon Alerts <alerts@beacon-geo.com>',
      to: toEmail,
      subject: `⚠️ [Alert] Visibility Drop (-${dropPercent}%) detected for "${brandName}" on ${engine}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #09090b; color: #f4f4f5; padding: 32px; border-radius: 12px; border: 1px solid #27272a;">
          <div style="display: flex; align-items: center; margin-bottom: 24px;">
            <div style="background: #ffffff; color: #09090b; font-weight: bold; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 12px;">
              B
            </div>
            <h2 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">Beacon GEO Alert</h2>
          </div>

          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #f87171; font-weight: 600; font-size: 14px;">
              Visibility Drop Alert: -${dropPercent}%
            </p>
            <p style="margin: 6px 0 0 0; color: #fca5a5; font-size: 13px;">
              Your brand's prominence score dropped significantly on <strong>${engine}</strong> during the latest automated audit.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">Audited Query:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: 500; border-bottom: 1px solid #27272a; text-align: right;">"${queryText}"</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">Answer Engine:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: 500; border-bottom: 1px solid #27272a; text-align: right; text-transform: capitalize;">${engine}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">Previous Score:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: 500; border-bottom: 1px solid #27272a; text-align: right;">${previousScore}%</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">New Score:</td>
              <td style="padding: 8px 0; color: #ef4444; font-weight: 700; border-bottom: 1px solid #27272a; text-align: right;">${newScore}%</td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${deepDiveUrl}" style="background: #ffffff; color: #09090b; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block;">
              View Historical Audit & AI Recommendations &rarr;
            </a>
          </div>

          <p style="margin-top: 32px; font-size: 11px; color: #71717a; text-align: center;">
            Beacon GEO Platform &bull; Automated Answer Engine Observability
          </p>
        </div>
      `,
    });

    return { success: true, data: emailResponse };
  } catch (error) {
    console.error('Failed to send Resend email alert:', error);
    return { success: false, error };
  }
}
