import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface CarInfoPayload {
  toEmail: string;
  toName: string;
  carNumber: string;
  carType: string;
  carYear: number;
  carColor: string;
  carMileage: number;
  carTransmission: string;
  carCategory: string;
  carPriceFrom: number;
  carStatus: string;
  nextService: string;
  lastService: string;
  imageUrl?: string;
  leaseInfo?: {
    company: string;
    monthlyRate: number;
    startDate: string;
    endDate: string;
    insurancePackage: string;
    kmPerMonth: number;
  };
  personalMessage?: string;
  senderName: string;
}

const INNIFALID_I_LEIGU = [
  'Bifreiðagjöld',
  'Umsaminn akstur (1.000-1.300 km/mán)',
  'Þjónustuskoðanir',
  'Ábyrgðartrygging',
  'Kaskótrygging',
  'Smurþjónusta',
  'Dekk og dekkjaskipti',
  'Hefðbundið viðhald',
  'Virðisaukaskattur',
];

const TRYGGINGAPAKKAR = [
  { nafn: 'Enterprise', sjalfsabyrgd: '250.000 kr.', lysing: 'Innifalin grunntryggging' },
  { nafn: 'Plús', sjalfsabyrgd: '150.000 kr.', lysing: 'Lækkuð sjálfsábyrgð + framrúðuvernd' },
  { nafn: 'Úrvals', sjalfsabyrgd: '75.000 kr.', lysing: 'Lægsta sjálfsábyrgð + framrúðuvernd' },
];

function formatCurrency(amount: number): string {
  return amount.toLocaleString('is-IS') + ' kr.';
}

function buildEmailHtml(data: CarInfoPayload): string {
  const leaseSection = data.leaseInfo
    ? `
      <tr>
        <td style="padding: 24px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
            <tr>
              <td style="padding: 20px 24px;">
                <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Leiguupplýsingar</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #374151;" width="50%">Fyrirtæki</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #111; font-weight: 600;" width="50%">${data.leaseInfo.company}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #374151;">Mánaðarverð</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #111; font-weight: 600;">${formatCurrency(data.leaseInfo.monthlyRate)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #374151;">Tímabil</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #111;">${data.leaseInfo.startDate} – ${data.leaseInfo.endDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #374151;">Tryggingar</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #111;">${data.leaseInfo.insurancePackage}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #374151;">Akstur/mán</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #111;">${data.leaseInfo.kmPerMonth.toLocaleString('is-IS')} km</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : '';

  const messageSection = data.personalMessage
    ? `
      <tr>
        <td style="padding: 24px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border-radius: 12px; border-left: 4px solid #3b82f6;">
            <tr>
              <td style="padding: 16px 20px;">
                <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #1e40af;">Skilaboð frá ${data.senderName}</p>
                <p style="margin: 0; font-size: 14px; color: #1e3a5f; line-height: 1.6;">${data.personalMessage.replace(/\n/g, '<br/>')}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : '';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const fullImageUrl = data.imageUrl?.startsWith('/')
    ? `${baseUrl}${data.imageUrl}`
    : data.imageUrl;

  const imageSection = fullImageUrl
    ? `
      <tr>
        <td style="padding: 24px 32px 0; text-align: center;">
          <img src="${fullImageUrl}" alt="${data.carType}" width="480" style="display: inline-block; max-width: 480px; width: 100%; max-height: 280px; object-fit: contain;" />
        </td>
      </tr>
    `
    : '';

  const includedItemsHtml = INNIFALID_I_LEIGU.map(item =>
    `<tr>
      <td style="padding: 5px 0; font-size: 13px; color: #374151; line-height: 1.4;">
        <span style="color: #22c55e; font-weight: bold; margin-right: 6px;">✓</span>${item}
      </td>
    </tr>`
  ).join('');

  const insuranceHtml = TRYGGINGAPAKKAR.map(pkg =>
    `<tr>
      <td style="padding: 8px 12px; font-size: 13px; color: #111827; font-weight: 600; border-bottom: 1px solid #e5e7eb;" width="30%">${pkg.nafn}</td>
      <td style="padding: 8px 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #e5e7eb;" width="30%">Sjálfsáb. ${pkg.sjalfsabyrgd}</td>
      <td style="padding: 8px 12px; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;" width="40%">${pkg.lysing}</td>
    </tr>`
  ).join('');

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
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px;">Enterprise Bílaleiga</p>
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 700;">${data.carType}</h1>
              <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255,255,255,0.85);">${data.carNumber} · ${data.carYear}</p>
            </td>
          </tr>

          <!-- Car Image -->
          ${imageSection}

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 32px 0;">
              <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.5;">
                Hæ${data.toName ? ' ' + data.toName.split(' ')[0] : ''},
              </p>
              <p style="margin: 8px 0 0; font-size: 15px; color: #6b7280; line-height: 1.5;">
                Hér eru upplýsingar um bíl sem við teljum henta þínum þörfum.
              </p>
            </td>
          </tr>

          <!-- Car specs -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Tæknilýsing</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;" width="40%">Tegund</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;" width="60%">${data.carType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Árgerð</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${data.carYear}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Litur</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${data.carColor}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Skiptigerð</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${data.carTransmission}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Flokkur</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${data.carCategory}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Akstur</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${data.carMileage.toLocaleString('is-IS')} km</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Price highlight -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%); border-radius: 12px;">
                <tr>
                  <td style="padding: 20px 24px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px;">Verð frá</p>
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">${formatCurrency(data.carPriceFrom)}<span style="font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.7);">/mán</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Innifalið í verði -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Innifalið í mánaðarverði</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${includedItemsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tryggingapakkar -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Tryggingapakkar</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <tr style="background: #e5e7eb;">
                        <td style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase;" width="30%">Pakki</td>
                        <td style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase;" width="30%">Sjálfsábyrgð</td>
                        <td style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase;" width="40%">Lýsing</td>
                      </tr>
                      ${insuranceHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Samningsskilmálar -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">Samningsskilmálar</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #374151;">
                          <strong style="color: #1e40af;">Samningslengd:</strong> 12–36 mánuðir
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #374151;">
                          <strong style="color: #1e40af;">Akstursmörk:</strong> 1.000–1.300 km/mán (samkvæmt samningi)
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #374151;">
                          <strong style="color: #1e40af;">Umframakstur:</strong> Verð á km samkvæmt samningi
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #374151;">
                          <strong style="color: #1e40af;">Uppsagnarfrestur:</strong> 3 mánuðir
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #374151;">
                          <strong style="color: #1e40af;">Afhending:</strong> Á höfuðborgarsvæðinu, einnig hægt að sækja á skrifstofu
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Service info -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 14px 16px; text-align: center;">
                          <p style="margin: 0 0 2px; font-size: 11px; color: #9ca3af; text-transform: uppercase;">Næsta þjónusta</p>
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${data.nextService || '—'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 14px 16px; text-align: center;">
                          <p style="margin: 0 0 2px; font-size: 11px; color: #9ca3af; text-transform: uppercase;">Síðasta þjónusta</p>
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${data.lastService || '—'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${leaseSection}
          ${messageSection}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 28px 32px 0; text-align: center;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 10px;">
                    <a href="mailto:eleiga@eleiga.is?subject=Fyrirspurn%20um%20${encodeURIComponent(data.carType)}%20(${data.carNumber})" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none;">
                      Hafa samband – Fá tilboð
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 10px 0 0; font-size: 12px; color: #9ca3af;">eða hringdu í 519-9330</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #9ca3af;">
                Sent af ${data.senderName} hjá Enterprise Bílaleigu
              </p>
              <p style="margin: 0; font-size: 12px; color: #d1d5db;">
                Vatnsmýrarvegur 10, 101 Reykjavík · Sími: 519-9330
              </p>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 11px; color: #d1d5db;">
                  Þessi tölvupóstur var sendur úr Enterprise CRM kerfinu.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
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
    const data: CarInfoPayload = await req.json();

    if (!data.toEmail) {
      return NextResponse.json({ error: 'Netfang vantar' }, { status: 400 });
    }

    const fromEmail = process.env.SMTP_USER;
    const html = buildEmailHtml(data);

    if (!fromEmail || !process.env.SMTP_HOST) {
      return NextResponse.json({
        success: true,
        method: 'mock',
        message: `Upplýsingar um ${data.carType} (${data.carNumber}) sendar á ${data.toEmail} (SMTP ekki stillt — mock mode)`,
      });
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Enterprise Bílaleiga" <${fromEmail}>`,
      to: data.toEmail,
      subject: `Bílaupplýsingar: ${data.carType} (${data.carNumber})`,
      html,
    });

    return NextResponse.json({
      success: true,
      method: 'email',
      message: `Tölvupóstur sendur á ${data.toEmail}`,
    });
  } catch (error) {
    console.error('Send car info error:', error);
    return NextResponse.json(
      { error: 'Villa við sendingu tölvupósts' },
      { status: 500 }
    );
  }
}
