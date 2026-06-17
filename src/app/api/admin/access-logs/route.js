import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  if (!(await verifyAdminRequest(request, supabaseAdmin))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized', message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const authCode = String(searchParams.get('authCode') || '').trim().toUpperCase();

    let query = supabaseAdmin
      .from('access_logs')
      .select('id, auth_code, event_type, user_agent, path, referrer, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (authCode) {
      query = query.eq('auth_code', authCode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[admin] access logs query error:', error);
      return NextResponse.json(
        { ok: false, message: 'Could not load access logs.' },
        { status: 500 }
      );
    }

    const logs = data || [];
    const codeSet = [...new Set(logs.map((item) => item.auth_code).filter(Boolean))];
    let labelByCode = new Map();

    if (codeSet.length > 0) {
      const authResult = await supabaseAdmin
        .from('auth_codes')
        .select('code, label')
        .in('code', codeSet);

      if (authResult.error) {
        console.error('[admin] access log labels query error:', authResult.error);
      } else {
        labelByCode = new Map(
          (authResult.data || []).map((item) => [item.code, item.label || ''])
        );
      }
    }

    return NextResponse.json({
      ok: true,
      logs: logs.map((item) => ({
        ...item,
        label: labelByCode.get(item.auth_code) || '',
      })),
    });
  } catch (error) {
    console.error('[admin] access logs failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Could not load access logs.' },
      { status: 500 }
    );
  }
}
