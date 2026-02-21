import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { notendur } from '@/lib/enterprise-demo-data';

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
    const { verkefniTitill, tilNotandaId, fraNafn, skilabod } = await req.json();

    const notandi = notendur.find((n) => n.id === tilNotandaId);
    if (!notandi) {
      return NextResponse.json({ error: 'Notandi fannst ekki' }, { status: 404 });
    }

    const fromEmail = process.env.SMTP_USER;
    if (!fromEmail || !process.env.SMTP_HOST) {
      return NextResponse.json({
        success: true,
        method: 'mock',
        message: `Tilkynning send til ${notandi.nafn} (SMTP ekki stillt, mock mode)`,
      });
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Ný tilkynning - Enterprise CRM
        </h2>
        <p>Hæ ${notandi.nafn.split(' ')[0]},</p>
        <p>${skilabod}</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <strong>Verkefni:</strong> ${verkefniTitill}<br/>
          <strong>Frá:</strong> ${fraNafn}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Þessi póstur var sendur sjálfkrafa frá Enterprise CRM kerfinu.
        </p>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Enterprise CRM" <${fromEmail}>`,
      to: notandi.netfang,
      subject: `Tilkynning: ${verkefniTitill}`,
      html,
    });

    return NextResponse.json({
      success: true,
      method: 'email',
      message: `Tölvupóstur sendur til ${notandi.nafn}`,
    });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Villa við sendingu tilkynningar' },
      { status: 500 }
    );
  }
}
