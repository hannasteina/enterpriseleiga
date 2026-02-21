import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { type, recipient, message, carInfo, serviceDate } = await req.json();

    if (!type || !recipient || !message) {
      return NextResponse.json(
        { error: 'Vantar tegund, móttakanda eða skilaboð' },
        { status: 400 }
      );
    }

    await new Promise(r => setTimeout(r, 300));

    const responses: Record<string, { method: string; detail: string }> = {
      email: {
        method: 'email',
        detail: `Tölvupóstur sendur til ${recipient} um ${carInfo ?? 'þjónustu'} (${serviceDate ?? ''})`,
      },
      sms: {
        method: 'sms',
        detail: `SMS sent á ${recipient} um ${carInfo ?? 'þjónustu'} (${serviceDate ?? ''})`,
      },
      innri: {
        method: 'innri',
        detail: `Innri áminning send til þjónustudeildar um ${carInfo ?? 'þjónustu'} (${serviceDate ?? ''})`,
      },
    };

    const result = responses[type] ?? { method: 'unknown', detail: 'Óþekkt tegund' };

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    return NextResponse.json(
      { error: 'Villa við sendingu áminningar' },
      { status: 500 }
    );
  }
}
