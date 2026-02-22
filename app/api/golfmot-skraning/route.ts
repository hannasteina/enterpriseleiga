import { NextRequest, NextResponse } from 'next/server';

export interface GolfmotSkraning {
  nafn: string;
  netfang: string;
  simi: string;
  fyrirtaeki: string;
  forgjof?: number;
  athugasemdir?: string;
  dagsetning: string;
}

const skraningar: GolfmotSkraning[] = [];

export async function POST(req: NextRequest) {
  try {
    const data: GolfmotSkraning = await req.json();

    if (!data.nafn?.trim() || !data.netfang?.trim() || !data.fyrirtaeki?.trim()) {
      return NextResponse.json(
        { error: 'Nafn, netfang og fyrirtæki eru nauðsynleg' },
        { status: 400 }
      );
    }

    const existing = skraningar.find(
      (s) => s.netfang.toLowerCase() === data.netfang.toLowerCase()
    );
    if (existing) {
      return NextResponse.json(
        { error: 'Þetta netfang er þegar skráð' },
        { status: 409 }
      );
    }

    skraningar.push({
      nafn: data.nafn.trim(),
      netfang: data.netfang.trim(),
      simi: data.simi?.trim() ?? '',
      fyrirtaeki: data.fyrirtaeki.trim(),
      forgjof: data.forgjof,
      athugasemdir: data.athugasemdir?.trim(),
      dagsetning: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Takk ${data.nafn}! Þú ert skráð/ur á Golfmót Enterprise ${new Date().getFullYear()}`,
      count: skraningar.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Villa við skráningu' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    count: skraningar.length,
    skraningar,
  });
}
