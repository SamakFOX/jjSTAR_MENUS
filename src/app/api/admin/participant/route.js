import { NextResponse } from 'next/server';
import { isAdminHakb, verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const statusLabel = {
  submitted: '최종 제출 완료',
  draft: '임시저장 중',
  not_started: '미참여',
};

const normalizeAuthCode = (value) => String(value || '').trim().toUpperCase();

const getSubmissionKey = (submission) => (
  submission?.id || submission?.submitted_at || ''
);

const withSubmissionRounds = (submissions) => {
  const orderedAsc = [...(submissions || [])].sort(
    (a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0)
  );
  const roundByKey = new Map(
    orderedAsc.map((item, index) => [getSubmissionKey(item) || `submission-${index}`, index + 1])
  );

  return [...(submissions || [])]
    .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0))
    .map((item, index) => ({
      ...item,
      round: roundByKey.get(getSubmissionKey(item) || `submission-${index}`) || 1,
      changeLogCount: Array.isArray(item.change_log) ? item.change_log.length : 0,
      hasIntention: String(item.intention || '').trim().length > 0,
    }));
};

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
        .select('id, code, menu_data, change_log, intention, submitted_at')
        .eq('code', authCode)
        .order('submitted_at', { ascending: false })
        .limit(100),
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

    const submissions = withSubmissionRounds(submissionResult.data || []);
    const submission = submissions[0] || null;
    const draft = draftResult.data || null;
    const status = submission ? 'submitted' : draft ? 'draft' : 'not_started';
    const viewSource = submission ? 'submission' : draft ? 'draft' : null;
    const viewMenuData = submission?.menu_data || draft?.menu_data || null;

    return NextResponse.json({
      ok: true,
      authCode,
      label: authCodeRecord?.label || '',
      hakb: authCodeRecord?.hakb || '',
      status,
      statusLabel: statusLabel[status],
      submission,
      submissions,
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
