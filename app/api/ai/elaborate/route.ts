import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 503 })
  }

  const { title, content, status, reason } = (await req.json()) as {
    title: string
    content: string
    status: string
    reason: string
  }

  const prompt = `あなたはメモを育てるパーソナルコーチAIです。

以下のノートをレビューし、次の判断をしました：
- ノートタイトル: ${title}
- 現在のステータス: ${status}
- レビュー判断: ${reason}

ノート本文:
${content.slice(0, 800)}${content.length > 800 ? '\n...(省略)' : ''}

この判断理由をもとに、このノートの具体的な強みと改善の余地を詳しく説明してください。
- どの部分が良いか
- どのような観点・視点を加えるとより深まるか
- このテーマでさらに広げられそうなアイデアの方向性

3〜5文で日本語で述べてください。
「〜してください」「〜すべき」などの命令形や指示は使わず、あくまで「〜という視点も面白いかも」「〜を考えると深まりそう」のような柔らかいヒントとして返答してください。
テキストのみで返答してください（JSONは不要）。`

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    return NextResponse.json({ detail: result.response.text().trim() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('AI elaborate error:', msg)
    return NextResponse.json({ error: `詳細生成に失敗しました: ${msg}` }, { status: 500 })
  }
}
