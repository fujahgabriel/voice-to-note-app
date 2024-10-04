import { NextRequest, NextResponse } from 'next/server'
import formidable from 'formidable';
import OpenAI from 'openai'
import path from "path";
import { writeFile } from "fs/promises";
import fs from "fs";
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const file = formData.get('file') as Blob | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  try {
    console.log(`FileType: ${(file as File).type}`)

    const audioFile = new File([file], (file as File).name, { type: (file as File).type });
   console.log(audioFile)
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
