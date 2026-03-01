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
以下のノートを読み、**3つの異なる変換方向**を提案してください。それぞれ元の内容の本質は保ちつつ、明確に異なるアプローチで変換してください。

タイトル: ${title}
カテゴリ: ${category}
内容:
${content.slice(0, 800)}${content.length > 800 ? '\n...(省略)' : ''}

3つの方向性（必ずこの順序で）：
1. **構造化・整理**: 見出し・箇条書きで整理し、情報を体系化する。読みやすく、参照しやすい形に。
2. **問いの深掘り**: 内容から「次に考えるべき問い」や「未定義の概念」を中心に展開。思考の先を予測して付け加える。
3. **視点の転換**: 逆説・批判的視点や別の角度から内容を再構成。「もしこの前提が崩れたら？」という問いを仕込む。

各方向ごとに、元の内容をベースにした**完全な変換後のMarkdown本文**を出力してください。frontmatterは含めず本文のみ。

回答はJSON形式のみ（余分なテキストなし）：
{
  "choices": [
    {
      "id": "structure",
      "label": "構造化して整理する",
      "description": "見出しと箇条書きで思考を体系化",
      "content": "変換後のMarkdown本文"
    },
    {
      "id": "deepen",
      "label": "問いを深掘りする",
      "description": "内容から派生する問いと概念を展開",
      "content": "変換後のMarkdown本文"
    },
    {
      "id": "reframe",
      "label": "視点を転換する",
      "description": "逆説・別角度から再構成",
      "content": "変換後のMarkdown本文"
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
    console.error('AI choices error:', msg)
    return NextResponse.json({ error: `AI提案に失敗しました: ${msg}` }, { status: 500 })
  }
}
