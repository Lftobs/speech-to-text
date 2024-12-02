import { TranscriptionService } from '@/app/lib/transcripition';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {

  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;
  const language = formData.get('language')?.toString() || 'en';


  if (!audioFile) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await audioFile.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const transcriptionService = new TranscriptionService();
    const result = await transcriptionService.transcribeAudio(buffer, language);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: error}, { status: 500 });
  }
}
