import { NextResponse } from 'next/server';
import { getAdminCodeSet, isAdminHakb, verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const fallbackCodes = ['JJST001', 'JJST002'];

const statusLabel = {
  submitted: '최종 제출 완료',
  draft: '임시저장 중',
  not_started: '미참여',
};

const getLatestByCode = (rows, codeKey, dateKey) => {
  const map = new Map();

  (rows || []).forEach((row) => {
    const code = row[codeKey];
    const current = map.get(code);
    if (!current || new Date(row[dateKey] || 0) > new Date(current[dateKey] || 0)) {
      map.set(code, row);
    }
  });

  return map;
};

export async function GET(request) {
  if (!(await verifyAdminRequest(request, supabaseAdmin))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized', message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const [authResult, submissionResult, draftResult, accessLogResult, adminCodeSet] = await Promise.all([
      supabaseAdmin
        .from('auth_codes')
        .select('code, label, hakb')
        .like('code', 'JJST%'),
      supabaseAdmin
        .from('submissions')
        .select('code, menu_data, change_log, intention, submitted_at')
        .order('submitted_at', { ascending: false }),
      supabaseAdmin
        .from('drafts')
        .select('auth_code, menu_data, change_log, intention, updated_at')
        .order('updated_at', { ascending: false }),
      supabaseAdmin
        .from('access_logs')
        .select('auth_code, created_at')
        .not('auth_code', 'is', null)
        .order('created_at', { ascending: false }),
      getAdminCodeSet(supabaseAdmin),
    ]);

    if (authResult.error) console.error('[admin] auth code query error:', authResult.error);
    if (submissionResult.error) throw submissionResult.error;
    if (draftResult.error) throw draftResult.error;
    if (accessLogResult.error) console.error('[admin] access log query error:', accessLogResult.error);

    const labelByCode = new Map(
      (authResult.data || [])
        .filter((item) => !isAdminHakb(item.hakb))
        .map((item) => [item.code, item.label || ''])
    );
    const submissionsByCode = getLatestByCode(submissionResult.data, 'code', 'submitted_at');
    const draftsByCode = getLatestByCode(draftResult.data, 'auth_code', 'updated_at');
    const accessByCode = new Map();

    if (!accessLogResult.error) {
      (accessLogResult.data || []).forEach((row) => {
        const code = row.auth_code;
        if (!code) return;

        const current = accessByCode.get(code) || {
          lastAccessAt: null,
          accessCount: 0,
        };

        current.accessCount += 1;
        if (!current.lastAccessAt || new Date(row.created_at || 0) > new Date(current.lastAccessAt || 0)) {
          current.lastAccessAt = row.created_at;
        }

        accessByCode.set(code, current);
      });
    }

    const codeSet = new Set([
      ...fallbackCodes,
      ...(authResult.data || []).filter((item) => !isAdminHakb(item.hakb)).map((item) => item.code),
      ...submissionsByCode.keys(),
      ...draftsByCode.keys(),
      ...accessByCode.keys(),
    ]);

    const participants = [...codeSet]
      .filter((code) => code && !adminCodeSet.has(code))
      .sort()
      .map((code) => {
        const submission = submissionsByCode.get(code) || null;
        const draft = draftsByCode.get(code) || null;
        const access = accessByCode.get(code) || null;
        const status = submission ? 'submitted' : draft ? 'draft' : 'not_started';
        const activeRecord = submission || draft;
        const changeLog = Array.isArray(activeRecord?.change_log) ? activeRecord.change_log : [];
        const intention = String(activeRecord?.intention || '');

        return {
          authCode: code,
          label: labelByCode.get(code) || '',
          status,
          statusLabel: statusLabel[status],
          lastDraftAt: draft?.updated_at || null,
          submittedAt: submission?.submitted_at || null,
          lastAccessAt: access?.lastAccessAt || null,
          accessCount: access?.accessCount || 0,
          lastActivityAt: submission?.submitted_at || draft?.updated_at || access?.lastAccessAt || null,
          changeLogCount: changeLog.length,
          hasIntention: intention.trim().length > 0,
        };
      });

    const summary = {
      total: participants.length,
      submitted: participants.filter((item) => item.status === 'submitted').length,
      draft: participants.filter((item) => item.status === 'draft').length,
      notStarted: participants.filter((item) => item.status === 'not_started').length,
    };

    const recentActivity = participants
      .filter((item) => item.lastActivityAt)
      .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt))
      .slice(0, 5);

    return NextResponse.json({
      ok: true,
      summary,
      recentActivity,
      participants,
    });
  } catch (error) {
    console.error('[admin] participants failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Could not load participants.' },
      { status: 500 }
    );
  }
}
