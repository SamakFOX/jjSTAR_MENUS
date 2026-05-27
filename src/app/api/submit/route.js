import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const code = String(body.code || '').trim();
    const userName = String(body.userName || '').trim() || '메뉴 배치 테스트 참여자';
    const menuData = body.menuData;
    const changeLog = Array.isArray(body.changeLog) ? body.changeLog : [];
    const intention = String(body.intention || '').trim();

    if (!code || !menuData) {
      return NextResponse.json(
        { ok: false, message: 'Submit data is incomplete.' },
        { status: 400 }
      );
    }

    const { data: authCode, error: authError } = await supabaseAdmin
      .from('auth_codes')
      .select('code, is_active, expires_at, submit_count, max_submit_count')
      .eq('code', code)
      .single();

    if (authError || !authCode) {
      return NextResponse.json(
        { ok: false, message: 'This auth code is not valid.' },
        { status: 401 }
      );
    }

    if (!authCode.is_active) {
      return NextResponse.json(
        { ok: false, message: 'This auth code is inactive.' },
        { status: 403 }
      );
    }

    if (authCode.expires_at && new Date(authCode.expires_at) < new Date()) {
      return NextResponse.json(
        { ok: false, message: 'This auth code has expired.' },
        { status: 403 }
      );
    }

    const submitCount = Number(authCode.submit_count || 0);
    const maxSubmitCount = Number(authCode.max_submit_count || 0);

    if (maxSubmitCount > 0 && submitCount >= maxSubmitCount) {
      return NextResponse.json(
        { ok: false, message: 'This auth code has reached its submit limit.' },
        { status: 403 }
      );
    }

    const submittedAt = new Date().toISOString();
    const userAgent = request.headers.get('user-agent') || '';
    const finalChangeLog = [
      ...changeLog,
      {
        type: 'submit',
        message: 'Final menu submitted.',
        intention,
        createdAt: submittedAt,
      },
    ];

    const { error: insertError } = await supabaseAdmin.from('submissions').insert({
      code,
      user_name: userName,
      menu_data: menuData,
      change_log: finalChangeLog,
      submitted_at: submittedAt,
      user_agent: userAgent,
      intention,
    });

    if (insertError) {
      console.error('[submit] insert error:', insertError);

      return NextResponse.json(
        { ok: false, message: 'Could not save the submission.' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('auth_codes')
      .update({ submit_count: submitCount + 1 })
      .eq('code', code);

    if (updateError) {
      console.error('[submit] submit_count update error:', updateError);
    }

    return NextResponse.json({
      ok: true,
      message: 'Submitted.',
    });
  } catch (error) {
    console.error('[submit] error:', error);

    return NextResponse.json(
      { ok: false, message: 'Submit failed. Please try again.' },
      { status: 500 }
    );
  }
}
