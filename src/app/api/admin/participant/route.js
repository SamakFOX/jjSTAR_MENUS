import { NextResponse } from 'next/server';
import { isAdminHakb, verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const statusLabel = {
  submitted: '최종 제출 완료',
  draft: '임시저장 중',
  not_started: '미참여',
};

const normalizeAuthCode = (value) => String(value || '').trim().toUpperCase();

export async function GET(request) {
  if (!(await verifyAdminRequest(request, supabaseAdmin))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized', message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const authCode = normalizeAuthCode(searchParams.get('authCode'));

    if (!authCode) {
      return NextResponse.json(
        { ok: false, message: 'Auth code is required.' },
        { status: 400 }
      );
    }

    const [authResult, submissionResult, draftResult] = await Promise.all([
      supabaseAdmin
        .from('auth_codes')
        .select('code, label, hakb')
        .eq('code', authCode)
        .maybeSingle(),
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

    if (authResult.error) console.error('[admin] participant auth code query error:', authResult.error);
    if (submissionResult.error) throw submissionResult.error;
    if (draftResult.error) throw draftResult.error;

    const authCodeRecord = authResult.data || null;

    if (isAdminHakb(authCodeRecord?.hakb)) {
      return NextResponse.json(
        { ok: false, message: 'Auth code is required.' },
        { status: 400 }
      );
    }

    const submission = submissionResult.data || null;
    const draft = draftResult.data || null;
    const status = submission ? 'submitted' : draft ? 'draft' : 'not_started';
    const viewSource = submission ? 'submission' : draft ? 'draft' : null;
    const viewMenuData = submission?.menu_data || draft?.menu_data || null;

    return NextResponse.json({
      ok: true,
      authCode,
      label: authCodeRecord?.label || '',
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
