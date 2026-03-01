import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ error: 'no key' }, { status: 503 })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  )
  const data = await res.json()
  return NextResponse.json(data)
}
