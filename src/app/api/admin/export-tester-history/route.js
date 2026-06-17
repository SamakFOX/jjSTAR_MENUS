import ExcelJS from 'exceljs';

import { getAdminCodeSet, isAdminHakb, verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const PAGE_SIZE = 1000;
const SHEET_NAME = '테스터별 이력';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const columns = [
  { header: '인증코드', key: 'authCode', width: 16 },
  { header: '닉네임', key: 'label', width: 16 },
  { header: '학번', key: 'hakb', width: 14 },
  { header: '참여상태', key: 'status', width: 12 },
  { header: '최초접속시각', key: 'firstAccessAt', width: 22 },
  { header: '마지막접속시각', key: 'lastAccessAt', width: 22 },
  { header: '접속횟수', key: 'accessCount', width: 10 },
  { header: '제출시각', key: 'submittedAt', width: 22 },
  { header: '작성의도', key: 'intention', width: 40 },
  { header: '변경이력수', key: 'changeLogCount', width: 12 },
  { header: '변경이력', key: 'changeLog', width: 80 },
  { header: '접속로그', key: 'accessLog', width: 60 },
];

const getKstParts = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

const formatKstDateTime = (value) => {
  if (!value) return '-';

  const parts = getKstParts(value);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const formatKstFileTimestamp = () => {
  const parts = getKstParts();
  return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}`;
};

const normalizeCode = (value) => String(value || '').trim().toUpperCase();

const getLatestByCode = (rows, codeKey, dateKey) => {
  const map = new Map();

  (rows || []).forEach((row) => {
    const code = normalizeCode(row[codeKey]);
    if (!code) return;

    const current = map.get(code);
    if (!current || new Date(row[dateKey] || 0) > new Date(current[dateKey] || 0)) {
      map.set(code, row);
    }
  });

  return map;
};

const getLogTime = (log) => log?.createdAt || log?.created_at || log?.submittedAt || log?.submitted_at || '';

const summarizeChangeLog = (logs) => (
  (Array.isArray(logs) ? logs : [])
    .map((log) => {
      const time = formatKstDateTime(getLogTime(log));
      const message = log?.message || JSON.stringify(log);
      return `${time} ${message}`;
    })
    .join('\n')
);

const summarizeAccessLog = (logs) => (
  (Array.isArray(logs) ? logs : [])
    .map((log) => {
      const eventText = [log.event_type, log.path].filter(Boolean).join(' ');
      return `${formatKstDateTime(log.created_at)} ${eventText || '-'}`;
    })
    .join('\n')
);

const groupAccessLogs = (logs) => {
  const map = new Map();

  (logs || []).forEach((log) => {
    const code = normalizeCode(log.auth_code);
    if (!code) return;

    const bucket = map.get(code) || [];
    bucket.push(log);
    map.set(code, bucket);
  });

  map.forEach((bucket) => {
    bucket.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  });

  return map;
};

async function selectAll(table, columnsToSelect, orderBy) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabaseAdmin
      .from(table)
      .select(columnsToSelect)
      .range(from, from + PAGE_SIZE - 1);

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    const { data, error } = await query;
    if (error) throw error;

    rows.push(...(data || []));

    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

const getParticipationStatus = ({ submission, draft, accessLogs }) => {
  if (submission) return '최종제출';
  if (draft) return '임시저장';
  if ((accessLogs || []).length > 0) return '접속만';
  return '미참여';
};

const createRows = ({ authCodes, submissions, drafts, accessLogs, adminCodeSet, authCodeFilter = '' }) => {
  const submissionsByCode = getLatestByCode(submissions, 'code', 'submitted_at');
  const draftsByCode = getLatestByCode(drafts, 'auth_code', 'updated_at');
  const accessLogsByCode = groupAccessLogs(accessLogs);
  const normalizedFilter = normalizeCode(authCodeFilter);

  const codeSet = new Set([
    ...(authCodes || []).map((item) => normalizeCode(item.code)),
    ...submissionsByCode.keys(),
    ...draftsByCode.keys(),
    ...accessLogsByCode.keys(),
  ]);

  return [...codeSet]
    .filter((code) => code && !adminCodeSet.has(code))
    .filter((code) => !normalizedFilter || code === normalizedFilter)
    .sort()
    .map((code) => {
      const authCode = (authCodes || []).find((item) => normalizeCode(item.code) === code) || {};
      const submission = submissionsByCode.get(code) || null;
      const draft = draftsByCode.get(code) || null;
      const activeRecord = submission || draft;
      const logs = accessLogsByCode.get(code) || [];
      const changeLog = Array.isArray(activeRecord?.change_log) ? activeRecord.change_log : [];
      const firstAccessAt = logs[0]?.created_at || null;
      const lastAccessAt = logs[logs.length - 1]?.created_at || null;

      return {
        authCode: code,
        label: authCode.label || submission?.user_name || '',
        hakb: authCode.hakb || '',
        status: getParticipationStatus({ submission, draft, accessLogs: logs }),
        firstAccessAt: formatKstDateTime(firstAccessAt),
        lastAccessAt: formatKstDateTime(lastAccessAt),
        accessCount: logs.length,
        submittedAt: formatKstDateTime(submission?.submitted_at),
        intention: submission?.intention || draft?.intention || '-',
        changeLogCount: changeLog.length,
        changeLog: summarizeChangeLog(changeLog) || '-',
        accessLog: summarizeAccessLog(logs) || '-',
      };
    });
};

const styleWorksheet = (worksheet) => {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FF1F2937' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5F0FA' },
  };

  worksheet.eachRow((row, rowNumber) => {
    row.alignment = {
      vertical: 'top',
      wrapText: rowNumber > 1,
    };

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  });
};

export async function GET(request) {
  if (!(await verifyAdminRequest(request, supabaseAdmin))) {
    return Response.json({ ok: false, error: 'Unauthorized', message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const authCodeFilter = normalizeCode(searchParams.get('authCode'));
    const [authCodes, submissions, drafts, accessLogs, adminCodeSet] = await Promise.all([
      selectAll('auth_codes', 'code, label, hakb', { column: 'code', ascending: true }),
      selectAll('submissions', 'code, user_name, change_log, intention, submitted_at', {
        column: 'submitted_at',
        ascending: false,
      }),
      selectAll('drafts', 'auth_code, change_log, intention, updated_at', {
        column: 'updated_at',
        ascending: false,
      }),
      selectAll('access_logs', 'auth_code, event_type, path, created_at', {
        column: 'created_at',
        ascending: true,
      }),
      getAdminCodeSet(supabaseAdmin),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'JJSTAR MENUS';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(SHEET_NAME);
    worksheet.columns = columns;
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
    worksheet.addRows(createRows({
      authCodes: authCodes.filter((item) => !isAdminHakb(item.hakb)),
      submissions,
      drafts,
      accessLogs,
      adminCodeSet,
      authCodeFilter,
    }));
    styleWorksheet(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const filenamePrefix = authCodeFilter ? `테스터이력_${authCodeFilter}` : '테스터이력';
    const filename = `${filenamePrefix}_${formatKstFileTimestamp()}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error('[admin] tester history export failed:', error);
    return Response.json(
      { ok: false, message: 'Could not export tester history.' },
      { status: 500 }
    );
  }
}
