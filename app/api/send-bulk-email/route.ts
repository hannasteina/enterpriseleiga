import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface BulkEmailPayload {
  recipients: { email: string; name: string }[];
  subject: string;
  body: string;
  templateId?: string;
}

function buildEmailHtml(recipientName: string, subject: string, bodyText: string): string {
  const personalizedBody = bodyText.replace(/\{\{nafn\}\}/g, recipientName);
  const htmlBody = personalizedBody.replace(/\n/g, '<br/>');

  return `
<!DOCTYPE html>
<html lang="is">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 28px 32px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px;">Enterprise Bílaleiga</p>
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700;">${subject}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <div style="font-size: 15px; color: #374151; line-height: 1.7;">
                ${htmlBody}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 10px;">
                    <a href="mailto:eleiga@eleiga.is" style="display: inline-block; padding: 12px 28px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                      Hafa samband
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af;">Enterprise Bílaleiga</p>
              <p style="margin: 0; font-size: 11px; color: #d1d5db;">
                Vatnsmýrarvegur 10, 101 Reykjavík &middot; Sími: 519-9330
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (Number(process.env.SMTP_PORT) || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const data: BulkEmailPayload = await req.json();

    if (!data.recipients?.length) {
      return NextResponse.json({ error: 'Engir viðtakendur' }, { status: 400 });
    }
    if (!data.subject?.trim()) {
      return NextResponse.json({ error: 'Efni vantar' }, { status: 400 });
    }

    const fromEmail = process.env.SMTP_USER;

    if (!fromEmail || !process.env.SMTP_HOST) {
      return NextResponse.json({
        success: true,
        method: 'mock',
        sent: data.recipients.length,
        message: `Tölvupóstur sendur á ${data.recipients.length} tengiliði (SMTP ekki stillt — mock mode)`,
      });
    }

    const transporter = getTransporter();
    let sent = 0;

    for (const recipient of data.recipients) {
      const html = buildEmailHtml(recipient.name, data.subject, data.body);
      try {
        await transporter.sendMail({
          from: `"Enterprise Bílaleiga" <${fromEmail}>`,
          to: recipient.email,
          subject: data.subject,
          html,
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${recipient.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      method: 'email',
      sent,
      total: data.recipients.length,
      message: `Tölvupóstur sendur á ${sent} af ${data.recipients.length} tengiliðum`,
    });
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { error: 'Villa við sendingu tölvupósta' },
      { status: 500 }
    );
  }
}
