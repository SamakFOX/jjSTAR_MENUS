import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ADMIN_CODE = 'JJ201562004';

const statusLabel = {
  submitted: '최종 제출 완료',
  draft: '임시저장 중',
  not_started: '미참여',
};

const normalizeAuthCode = (value) => String(value || '').trim().toUpperCase();
const isAdminRequest = (request) => request.headers.get('x-admin-code') === ADMIN_CODE;

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Forbidden.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const authCode = normalizeAuthCode(searchParams.get('authCode'));

    if (!authCode || authCode === ADMIN_CODE) {
      return NextResponse.json(
        { ok: false, message: 'Auth code is required.' },
        { status: 400 }
      );
    }

    const [submissionResult, draftResult] = await Promise.all([
      supabaseAdmin
        .from('submissions')
        .select('code, menu_data, change_log, intention, submitted_at')
        .eq('code', authCode)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('drafts')
        .select('auth_code, menu_data, change_log, intention, updated_at')
        .eq('auth_code', authCode)
        .maybeSingle(),
    ]);

    if (submissionResult.error) throw submissionResult.error;
    if (draftResult.error) throw draftResult.error;

    const submission = submissionResult.data || null;
    const draft = draftResult.data || null;
    const status = submission ? 'submitted' : draft ? 'draft' : 'not_started';
    const viewSource = submission ? 'submission' : draft ? 'draft' : null;
    const viewMenuData = submission?.menu_data || draft?.menu_data || null;

    return NextResponse.json({
      ok: true,
      authCode,
      status,
      statusLabel: statusLabel[status],
      submission,
      draft,
      viewSource,
      viewMenuData,
    });
  } catch (error) {
    console.error('[admin] participant detail failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Could not load participant.' },
      { status: 500 }
    );
  }
}
