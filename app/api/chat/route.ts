// api/chat/route.ts

import { askQuestion } from '@/libs/rag';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { question, collectionName } = await req.json();

  if (!question || !collectionName) {
    return NextResponse.json(
      { error: 'Question and collectionName are required' },
      { status: 400 }
    );
  }

  const answer = await askQuestion(question, collectionName);

  return NextResponse.json({ answer });
}
