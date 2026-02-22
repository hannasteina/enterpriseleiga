import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface BulkEmailPayload {
  recipients: { email: string; name: string; fyrirtaeki?: string }[];
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

function buildGolfEmailHtml(recipientName: string, recipientEmail: string, fyrirtaeki: string, baseUrl: string): string {
  const year = new Date().getFullYear();
  const regUrl = `${baseUrl}/golfmot/skraning?nafn=${encodeURIComponent(recipientName)}&netfang=${encodeURIComponent(recipientEmail)}&fyrirtaeki=${encodeURIComponent(fyrirtaeki)}`;

  return `
<!DOCTYPE html>
<html lang="is">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.1);">

          <!-- Golf hero header with gradient -->
          <tr>
            <td style="background: linear-gradient(160deg, #064e3b 0%, #065f46 30%, #047857 60%, #059669 100%); padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 36px 40px 20px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Enterprise Bílaleiga býður þér á</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 0 40px;">
                    <span style="font-size: 52px; line-height: 1;">⛳</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 40px 12px; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">Golfmót Enterprise</h1>
                    <h2 style="margin: 6px 0 0; font-size: 40px; color: #6ee7b7; font-weight: 800;">${year}</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 40px 36px; text-align: center;">
                    <!-- Decorative line -->
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="width: 40px; height: 2px; background: rgba(110,231,183,0.3);"></td>
                        <td style="width: 8px;"></td>
                        <td style="width: 8px; height: 8px; border-radius: 50%; background: #6ee7b7;"></td>
                        <td style="width: 8px;"></td>
                        <td style="width: 40px; height: 2px; background: rgba(110,231,183,0.3);"></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 36px 40px 0;">
              <p style="margin: 0; font-size: 17px; color: #1f2937; line-height: 1.7;">
                Kæri/kær <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 16px 0 0; font-size: 15px; color: #4b5563; line-height: 1.7;">
                Okkur þykir vænt um að bjóða þér í árlegt golfmót Enterprise Bílaleigu!
                Þetta er frábært tækifæri til að njóta góðs dags á vellinum, hitta samstarfsaðila og skemmta sér vel.
              </p>
            </td>
          </tr>

          <!-- Event details cards -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="background: #f9fafb; padding: 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="padding: 8px; text-align: center; vertical-align: top;">
                          <p style="margin: 0; font-size: 22px;">📅</p>
                          <p style="margin: 6px 0 2px; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Dagsetning</p>
                          <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 700;">15. júní ${year}</p>
                        </td>
                        <td width="33%" style="padding: 8px; text-align: center; vertical-align: top; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 22px;">📍</p>
                          <p style="margin: 6px 0 2px; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Staðsetning</p>
                          <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 700;">Grafarholtsvöllur</p>
                        </td>
                        <td width="33%" style="padding: 8px; text-align: center; vertical-align: top;">
                          <p style="margin: 0; font-size: 22px;">🏌️</p>
                          <p style="margin: 6px 0 2px; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Snið</p>
                          <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 700;">Best ball, 4 manna</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Schedule -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <h3 style="margin: 0 0 16px; font-size: 16px; color: #111827; font-weight: 700;">Dagskrá dagsins</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="65" style="font-size: 13px; color: #059669; font-weight: 700; font-family: monospace;">08:30</td>
                        <td style="font-size: 14px; color: #4b5563;">Skráning og morgunverður</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="65" style="font-size: 13px; color: #059669; font-weight: 700; font-family: monospace;">09:30</td>
                        <td style="font-size: 14px; color: #4b5563;">Kynning á nýjum bílalínum Enterprise</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="65" style="font-size: 13px; color: #059669; font-weight: 700; font-family: monospace;">10:00</td>
                        <td style="font-size: 14px; color: #4b5563;">⛳ <strong>Mótið hefst</strong> — Best ball, 4 manna teymi</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="65" style="font-size: 13px; color: #059669; font-weight: 700; font-family: monospace;">15:00</td>
                        <td style="font-size: 14px; color: #4b5563;">Hádegisverður og verðlaunaafhending</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="65" style="font-size: 13px; color: #059669; font-weight: 700; font-family: monospace;">16:30</td>
                        <td style="font-size: 14px; color: #4b5563;">Netþing og sýning á rafbílum 🚗</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info box -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 1.6;">
                      ✅ Keppnisgjald er <strong>innifalið</strong><br/>
                      ✅ Við sjáum um <strong>allan búnað</strong> ef þörf er á<br/>
                      ✅ Morgunverður og hádegisverður <strong>fylgir</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">
                Skráðu þig með því að smella á hnappinn hér að neðan:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 14px; box-shadow: 0 4px 14px rgba(5,150,105,0.4);">
                    <a href="${regUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; letter-spacing: 0.3px;">
                      🏌️ &nbsp;Skrá mig á golfmótið
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">
                Skráningarfrestur: 1. júní ${year}
              </p>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.7;">
                Við hlökkum til að sjá þig á vellinum!
              </p>
              <p style="margin: 16px 0 0; font-size: 15px; color: #4b5563; line-height: 1.7;">
                Bestu kveðjur,<br/>
                <strong>Enterprise Bílaleiga</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; font-weight: 600;">Enterprise Bílaleiga</p>
              <p style="margin: 0; font-size: 11px; color: #d1d5db;">
                Vatnsmýrarvegur 10, 101 Reykjavík &middot; Sími: 519-9330 &middot; eleiga@eleiga.is
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    for (const recipient of data.recipients) {
      const html = data.templateId === 'golfmot'
        ? buildGolfEmailHtml(recipient.name, recipient.email, recipient.fyrirtaeki ?? '', baseUrl)
        : buildEmailHtml(recipient.name, data.subject, data.body);
      const subject = data.templateId === 'golfmot'
        ? `Boð í Golfmót Enterprise Bílaleigu ${new Date().getFullYear()}`
        : data.subject;
      try {
        await transporter.sendMail({
          from: `"Enterprise Bílaleiga" <${fromEmail}>`,
          to: recipient.email,
          subject,
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
