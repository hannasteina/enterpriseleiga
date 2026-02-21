import nodemailer from 'nodemailer';

interface WelcomeEmailParams {
  email: string;
  displayName?: string;
  password?: string;
  tools: string[];
  sentInvite: boolean;
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

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const { email, displayName, password, tools, sentInvite } = params;
  const fromName = process.env.SMTP_FROM_NAME || 'HannaSteina';
  const fromEmail = process.env.SMTP_USER;

  const greeting = displayName ? `Hæ ${displayName}` : 'Hæ';
  const toolList = tools.map((t) => `<li>${t}</li>`).join('');

  const loginInfo = sentInvite
    ? '<p>Þú hefur fengið boðspóst frá kerfinu til að setja lykilorðið þitt.</p>'
    : `<p><strong>Netfang:</strong> ${email}</p><p><strong>Lykilorð:</strong> ${password}</p>`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; border-bottom: 2px solid #d4a843; padding-bottom: 10px;">
        Velkomin á HannaSteina
      </h1>
      <p>${greeting},</p>
      <p>Aðgangur þinn hefur verið stofnaður. Hér eru innskráningarupplýsingarnar þínar:</p>
      ${loginInfo}
      <h3>Þín verkfæri:</h3>
      <ul>${toolList}</ul>
      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://hannasteina.vercel.app' : 'http://localhost:3000'}/login"
           style="background: #d4a843; color: #1a1a2e; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Skrá inn
        </a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        Þessi póstur var sendur sjálfkrafa frá HannaSteina kerfinu.
      </p>
    </div>
  `;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: 'Velkomin á HannaSteina',
    html,
  });
}
