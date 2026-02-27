import { NextRequest, NextResponse } from 'next/server';
import { listNotes, createNote } from '@/lib/github';
import type { NoteCategory, NoteStatus } from '@/types/note';

// GET /api/notes?category=learning
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') as NoteCategory | null;
  try {
    const notes = await listNotes(category ?? undefined);
    return NextResponse.json(notes);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, content = '' } = body as {
      category: NoteCategory;
      title: string;
      content?: string;
    };

    if (!category || !title) {
      return NextResponse.json({ error: 'category and title are required' }, { status: 400 });
    }

    const id = `${Date.now()}-${title
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u9fff]+/g, '-')
      .slice(0, 40)}`;

    const now = new Date().toISOString();
    const frontmatter = {
      title,
      status: 'raw' as NoteStatus,
      category,
      ai_review: false,
      createdAt: now,
      updatedAt: now,
    };

    const note = await createNote(category, id, frontmatter, content);
    return NextResponse.json(note, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
