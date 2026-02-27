import { NextRequest, NextResponse } from 'next/server';
import { getNote, updateNote, deleteNote } from '@/lib/github';
import { auth } from '@/lib/auth';
import type { NoteCategory, NoteStatus } from '@/types/note';

type Params = { params: Promise<{ category: string; id: string }> };

// GET /api/notes/:category/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const token = session?.accessToken;
  const { category, id } = await params;
  const note = await getNote(category as NoteCategory, id, token);
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(note);
}

// PATCH /api/notes/:category/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  const token = session?.accessToken;
  const { category, id } = await params;
  try {
    const body = await req.json();
    const { title, content, status, ai_review, sha } = body as {
      title?: string;
      content?: string;
      status?: NoteStatus;
      ai_review?: boolean;
      sha: string;
    };

    const existing = await getNote(category as NoteCategory, id, token);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await updateNote(
      category as NoteCategory,
      id,
      {
        ...existing,
        title: title ?? existing.title,
        status: status ?? existing.status,
        ai_review: ai_review ?? existing.ai_review,
        updatedAt: new Date().toISOString(),
      },
      content ?? existing.content,
      sha ?? existing.sha!,
      token
    );
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/notes/:category/:id
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  const token = session?.accessToken;
  const { category, id } = await params;
  try {
    const { sha } = await req.json();
    await deleteNote(category as NoteCategory, id, sha, token);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
