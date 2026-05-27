import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const normalizeAuthCode = (value) => String(value || '').trim().toUpperCase();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authCode = normalizeAuthCode(searchParams.get('authCode'));

    if (!authCode) {
      return NextResponse.json(
        { ok: false, message: 'Auth code is required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('drafts')
      .select('auth_code, menu_data, change_log, undo_stack, redo_stack, intention, updated_at')
      .eq('auth_code', authCode)
      .maybeSingle();

    if (error) {
      console.error('[drafts] get error:', error);
      return NextResponse.json(
        { ok: false, message: 'Could not load draft.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, draft: data || null });
  } catch (error) {
    console.error('[drafts] get failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Could not load draft.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const authCode = normalizeAuthCode(body.authCode);
    const menuData = body.menuData;
    const changeLog = Array.isArray(body.changeLog) ? body.changeLog : [];
    const undoStack = Array.isArray(body.undoStack) ? body.undoStack : [];
    const redoStack = Array.isArray(body.redoStack) ? body.redoStack : [];
    const intention = String(body.intention || '');
    const updatedAt = new Date().toISOString();

    if (!authCode || !menuData) {
      return NextResponse.json(
        { ok: false, message: 'Draft data is incomplete.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('drafts')
      .upsert(
        {
          auth_code: authCode,
          menu_data: menuData,
          change_log: changeLog,
          undo_stack: undoStack,
          redo_stack: redoStack,
          intention,
          updated_at: updatedAt,
        },
        { onConflict: 'auth_code' }
      )
      .select('auth_code, updated_at')
      .single();

    if (error) {
      console.error('[drafts] save error:', error);
      return NextResponse.json(
        { ok: false, message: 'Could not save draft.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, draft: data });
  } catch (error) {
    console.error('[drafts] save failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Could not save draft.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authCode = normalizeAuthCode(searchParams.get('authCode'));

    if (!authCode) {
      return NextResponse.json(
        { ok: false, message: 'Auth code is required.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('drafts')
      .delete()
      .eq('auth_code', authCode);

    if (error) {
      console.error('[drafts] delete error:', error);
      return NextResponse.json(
        { ok: false, message: 'Could not delete draft.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[drafts] delete failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Could not delete draft.' },
      { status: 500 }
    );
  }
}
