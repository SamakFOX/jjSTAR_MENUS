import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const TESTER_CODE_EXPIRES_AT = '2026-12-31T23:59:00+09:00';

function isUniqueViolation(error) {
  return error?.code === '23505' || String(error?.message || '').toLowerCase().includes('duplicate');
}

async function findExistingCodeByHakb(hakb) {
  const { data, error } = await supabaseAdmin
    .from('auth_codes')
    .select('code, label, hakb')
    .eq('hakb', hakb)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nickname = String(body.nickname || body.name || '').trim();
    const hakb = String(body.hakb || '').trim();

    if (!nickname || !hakb) {
      return NextResponse.json(
        { ok: false, message: '닉네임과 학번을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (hakb.length > 10) {
      return NextResponse.json(
        { ok: false, message: '학번은 10자 이하로 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(hakb)) {
      return NextResponse.json(
        { ok: false, message: '학번은 숫자만 입력해주세요.' },
        { status: 400 }
      );
    }

    const existingCode = await findExistingCodeByHakb(hakb);

    if (existingCode) {
      return NextResponse.json({
        ok: true,
        code: existingCode.code,
        alreadyIssued: true,
      });
    }

    const testerCode = `JJ${hakb}`;
    const { error: insertError } = await supabaseAdmin
      .from('auth_codes')
      .insert({
        code: testerCode,
        label: nickname,
        hakb,
        is_active: true,
        expires_at: TESTER_CODE_EXPIRES_AT,
        max_submit_count: 999,
        submit_count: 0,
        memo: null,
      });

    if (insertError) {
      const duplicateHakb = await findExistingCodeByHakb(hakb);
      if (duplicateHakb) {
        return NextResponse.json({
          ok: true,
          code: duplicateHakb.code,
          alreadyIssued: true,
        });
      }

      if (!isUniqueViolation(insertError)) {
        console.error('[request-tester-code] insert error:', insertError);
      }

      return NextResponse.json(
        { ok: false, message: '테스터 코드 발급 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      code: testerCode,
      alreadyIssued: false,
    });
  } catch (error) {
    console.error('[request-tester-code] error:', error);

    return NextResponse.json(
      { ok: false, message: '테스터 코드 발급 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
