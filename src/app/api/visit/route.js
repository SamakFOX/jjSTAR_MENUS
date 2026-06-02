import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const normalizeAuthCode = (value) => {
  const code = String(value || '').trim().toUpperCase();
  return code || null;
};

const normalizeEventType = (value) => {
  const eventType = String(value || '').trim();
  return eventType || 'visit';
};

const truncate = (value, maxLength) => {
  const text = String(value || '').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
};

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const fallbackUserAgent = request.headers.get('user-agent') || '';

    const { error } = await supabaseAdmin
      .from('access_logs')
      .insert({
        auth_code: normalizeAuthCode(body.authCode),
        event_type: normalizeEventType(body.eventType),
        path: truncate(body.path, 300) || null,
        referrer: truncate(body.referrer, 500) || null,
        user_agent: truncate(body.userAgent || fallbackUserAgent, 1000) || null,
      });

    if (error) {
      console.error('[visit] access log insert error:', error);
    }
  } catch (error) {
    console.error('[visit] access log failed:', error);
  }

  return NextResponse.json({ ok: true });
}
