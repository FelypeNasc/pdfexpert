import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'pdfexpert_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  const { password: input } = await req.json();

  if (input !== password) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, password, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return res;
}
