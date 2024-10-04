import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { remark } from 'remark'
import html from 'remark-html'
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const { text, format } = await request.json()

  if (!text || !format) {
    return NextResponse.json({ error: 'Missing text or format' }, { status: 400 })
  }

  const promptMap = {
    journal: "Convert the following text into a beautiful journal entry:",
    article: "Rewrite the following text as a short blog article:",
    note: "Summarize the following text as a concise note:",
    tweet: "Condense the following text into a tweet (280 characters max):",
    todo: "Extract action items from the following text and create a well detailed to-do list:",
  }

  const prompt = `${promptMap[format as keyof typeof promptMap]} "${text}"; output in markdown, Properly formatted and styled with headings, paragraphs, lists, and other elements.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    })

    const convertedText = completion.choices[0].message.content || ''
    const processedContent =  await remark()
    .use(html)
    .process(convertedText);
  const contentHtml = processedContent.toString();
    return NextResponse.json({ convertedText:contentHtml })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 })
  }
}
