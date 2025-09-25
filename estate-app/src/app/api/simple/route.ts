import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Simple API route working',
    timestamp: new Date().toISOString(),
    data: {
      customers: 1,
      units: 2,
      partners: 2,
      contracts: 0,
      safes: 1
    }
  });
}