import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 503 })
  }

  const { title, content, category } = (await req.json()) as {
    title: string
    content: string
    category: string
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'コンテンツが空です' }, { status: 400 })
  }

  const prompt = `あなたはノートの「思考を増幅させる庭師」AIです。
以下のノートを読み、独立した新規ノートとして展開する価値がある「芽（テーマ・疑問・概念）」を3〜5つ抽出してください。

タイトル: ${title}
カテゴリ: ${category}
内容:
${content.slice(0, 800)}${content.length > 800 ? '\n...(省略)' : ''}

抽出の基準：
- それ自体が一つのノートのタイトルになれるもの
- 元のノートとは独立して深掘りする価値があるもの
- 疑問・概念・手法・事例 のいずれかとして切り出せるもの
- 元のノートの「次の一手」になりえるもの

回答はJSON形式のみ（余分なテキストなし）：
{
  "sprouts": [
    {
      "title": "簡潔なタイトル（25文字以内）",
      "summary": "なぜこれが独立して深掘りする価値があるか（40文字以内）"
    }
  ]
}`

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response format')

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('AI sprouts error:', msg)
    return NextResponse.json({ error: `芽吹き候補の抽出に失敗しました: ${msg}` }, { status: 500 })
  }
}
