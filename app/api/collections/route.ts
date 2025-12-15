// api/collections/route.ts

import { NextResponse } from 'next/server';
import { listCollections } from '@/libs/chroma';

export async function GET() {
  const collections = await listCollections();
  return NextResponse.json({ collections });
}
