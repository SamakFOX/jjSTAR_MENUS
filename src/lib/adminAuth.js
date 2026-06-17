export const isAdminHakb = (value) => String(value || '').trim().toLowerCase() === 'admin';

export async function verifyAdminCode(supabase, code) {
  const normalizedCode = String(code || '').trim();
  if (!normalizedCode) return false;

  const { data, error } = await supabase
    .from('auth_codes')
    .select('code, hakb, is_active, expires_at')
    .eq('code', normalizedCode)
    .maybeSingle();

  if (error || !data) return false;
  if (!isAdminHakb(data.hakb)) return false;
  if (data.is_active !== true) return false;

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return false;
  }

  return true;
}

export async function verifyAdminRequest(request, supabase) {
  return verifyAdminCode(supabase, request.headers.get('x-admin-code'));
}

export async function getAdminCodeSet(supabase) {
  const { data, error } = await supabase
    .from('auth_codes')
    .select('code, hakb');

  if (error) {
    console.error('[admin] admin code query error:', error);
    return new Set();
  }

  return new Set(
    (data || [])
      .filter((item) => isAdminHakb(item.hakb))
      .map((item) => String(item.code || '').trim())
      .filter(Boolean)
  );
}
