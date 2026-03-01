import { NextRequest, NextResponse } from 'next/server';
import { getNote, updateNote, deleteNote } from '@/lib/notes';
import { auth } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { NoteCategory, NoteStatus, AiOutcome, AiEditRecord } from '@/types/note';

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
    const { title, content, status, ai_outcome, ai_reviewed, ai_edits, sha, createdAt } = body as {
      title: string;
      content: string;
      status: NoteStatus;
      ai_outcome: AiOutcome;
      ai_reviewed?: boolean;
      ai_edits?: AiEditRecord[];
      sha: string;
      createdAt?: string;
    };

    if (!sha) return NextResponse.json({ error: 'sha is required' }, { status: 400 });

    const updated = await updateNote(
      category as NoteCategory,
      id,
      {
        title,
        status,
        category: category as NoteCategory,
        ai_outcome: ai_outcome ?? 'none',
        ai_reviewed: ai_reviewed ?? false,
        ...(ai_edits !== undefined && { ai_edits }),
        createdAt: createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      content,
      sha,
      token
    );
    revalidatePath('/', 'layout');
    revalidateTag('notes');
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
    revalidatePath('/', 'layout');
    revalidateTag('notes');
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
