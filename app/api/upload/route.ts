import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/libs/pdf';
import { createVectorStoreFromText } from '@/libs/chroma';
import { generateCollectionName, generateGreeting } from '@/libs/rag';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { text, pageCount } = await extractText(buffer, file.name);

    const collectionName = await generateCollectionName(file.name, text);

    await createVectorStoreFromText(text, collectionName, {
      filename: file.name,
      pageCount,
      uploadDate: new Date().toISOString(),
    });

    const greeting = await generateGreeting(collectionName);

    return NextResponse.json({
      message: 'Document processed and indexed',
      collectionName,
      greeting,
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Error processing document' },
      { status: 500 }
    );
  }
}
