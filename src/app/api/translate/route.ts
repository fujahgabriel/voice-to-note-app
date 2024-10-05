import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { remark } from 'remark'
import html from 'remark-html'
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const { text, lang } = await request.json()

  if (!text || !lang) {
    return NextResponse.json({ error: 'Missing text or lang' }, { status: 400 })
  }



  const prompt = `translate the following into this language "${lang}" text "${text}".`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    })

    const content = completion.choices[0].message.content || ''
  
    return NextResponse.json({ convertedText:content })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 })
  }
}
