import { NextRequest, NextResponse } from 'next/server';
import { getNote, updateNote, deleteNote } from '@/lib/github';
import type { NoteCategory, NoteStatus } from '@/types/note';

type Params = { params: Promise<{ category: string; id: string }> };

// GET /api/notes/:category/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { category, id } = await params;
  const note = await getNote(category as NoteCategory, id);
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(note);
}

// PATCH /api/notes/:category/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const { category, id } = await params;
  try {
    const body = await req.json();
    const { title, content, status, sha } = body as {
      title?: string;
      content?: string;
      status?: NoteStatus;
      sha: string;
    };

    const existing = await getNote(category as NoteCategory, id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await updateNote(
      category as NoteCategory,
      id,
      {
        ...existing,
        title: title ?? existing.title,
        status: status ?? existing.status,
        updatedAt: new Date().toISOString(),
      },
      content ?? existing.content,
      sha ?? existing.sha!
    );
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/notes/:category/:id
export async function DELETE(req: NextRequest, { params }: Params) {
  const { category, id } = await params;
  try {
    const { sha } = await req.json();
    await deleteNote(category as NoteCategory, id, sha);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
