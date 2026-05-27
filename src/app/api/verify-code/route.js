import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const code = String(body.code || '').trim();

    if (!code) {
      return NextResponse.json(
        { ok: false, message: 'Enter an auth code.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('auth_codes')
      .select('code, label, is_active, expires_at, submit_count, max_submit_count')
      .eq('code', code)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, message: 'This auth code is not valid.' },
        { status: 401 }
      );
    }

    if (!data.is_active) {
      return NextResponse.json(
        { ok: false, message: 'This auth code is inactive.' },
        { status: 403 }
      );
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { ok: false, message: 'This auth code has expired.' },
        { status: 403 }
      );
    }

    const submitCount = Number(data.submit_count || 0);
    const maxSubmitCount = Number(data.max_submit_count || 0);

    if (maxSubmitCount > 0 && submitCount >= maxSubmitCount) {
      return NextResponse.json(
        { ok: false, message: 'This auth code has reached its submit limit.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Verified.',
      code: data.code,
      label: data.label || '',
    });
  } catch (error) {
    console.error('[verify-code] error:', error);

    return NextResponse.json(
      { ok: false, message: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
