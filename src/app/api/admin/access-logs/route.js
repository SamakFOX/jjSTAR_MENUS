import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ADMIN_CODE = 'JJ201562004';
const isAdminRequest = (request) => request.headers.get('x-admin-code') === ADMIN_CODE;

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Forbidden.' }, { status: 403 });
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
