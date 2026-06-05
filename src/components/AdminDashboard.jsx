'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, LogOut, RefreshCw, X } from 'lucide-react';
import PreviewModal from '@/components/PreviewModal';

const ADMIN_CODE = 'JJ201562004';

const formatDateTime = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTime = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const summarizeUserAgent = (value) => {
  const userAgent = String(value || '');
  if (!userAgent) return '-';

  const device = /iPhone|iPad|iPod/i.test(userAgent)
    ? 'iPhone'
    : /Android/i.test(userAgent)
      ? 'Android'
      : /Windows/i.test(userAgent)
        ? 'Windows'
        : /Mac OS X|Macintosh/i.test(userAgent)
          ? 'Mac'
          : /Linux/i.test(userAgent)
            ? 'Linux'
            : '기타';

  const browser = /Edg\//i.test(userAgent)
    ? 'Edge'
    : /Chrome|CriOS/i.test(userAgent)
      ? /Mobile|Android|iPhone/i.test(userAgent) ? 'Mobile Chrome' : 'Chrome'
      : /Safari/i.test(userAgent)
        ? 'Safari'
        : /Firefox/i.test(userAgent)
          ? 'Firefox'
          : 'Browser';

  return `${browser} / ${device}`;
};

const emptySummary = {
  total: 0,
  submitted: 0,
  draft: 0,
  notStarted: 0,
};

const emptyTrends = {
  summary: {
    analyzedUserCount: 0,
    submittedCount: 0,
    draftCount: 0,
  },
  topMovedMenus: [],
  topCategoryMoves: [],
  addedMenus: [],
  deletedMenus: [],
};

const emptyFinalOverview = {
  summary: {
    analyzedUserCount: 0,
    submittedCount: 0,
    draftCount: 0,
    movedMenuCount: 0,
    deletedMenuCount: 0,
    addedMenuCount: 0,
  },
  baseMenuTree: [],
  movedMenusByKey: {},
  deletedMenusByKey: {},
  addedMenusByPath: {},
};

const adminTabs = [
  { id: 'participants', label: '참여자 목록' },
  { id: 'trends', label: '경향 분석' },
  { id: 'finalMenus', label: '전체 최종 메뉴' },
];

const getMaxCount = (items, key) => Math.max(1, ...items.map((item) => Number(item[key]) || 0));

function TrendBarList({ items, valueKey, labelKey, emptyText }) {
  if (!items.length) {
    return <p className="rounded-lg bg-slate-50 p-4 text-sm font-bold text-slate-400">{emptyText}</p>;
  }

  const maxValue = getMaxCount(items, valueKey);

  return (
    <div className="space-y-3 rounded-lg bg-slate-50 p-4">
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = `${Math.max(8, Math.round((value / maxValue) * 100))}%`;

        return (
          <div key={`${item[labelKey]}-${value}`} className="grid gap-2 sm:grid-cols-[180px_1fr_48px] sm:items-center">
            <p className="truncate text-sm font-bold text-slate-700" title={item[labelKey]}>{item[labelKey]}</p>
            <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
              <div className="h-full rounded-full bg-[#004f91]" style={{ width }} />
            </div>
            <p className="text-right text-sm font-black text-slate-800">{value}</p>
          </div>
        );
      })}
    </div>
  );
}

const getMenuKey = (node, pathTitles) => {
  if (node?.code) return `code:${node.code}`;
  if (node?.id) return `id:${node.id}`;
  return `path:${String(node?.title || '').trim()}::${pathTitles.join(' > ')}`;
};

function UserChips({ users = [] }) {
  const visibleUsers = users.slice(0, 10);
  const hiddenCount = Math.max(0, users.length - visibleUsers.length);

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {visibleUsers.map((user) => (
        <span key={user.authCode} className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
          {user.authCode}{user.label ? ` ${user.label}` : ''}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500">
          외 {hiddenCount}명
        </span>
      )}
    </div>
  );
}

function ChangePopover({ type, data }) {
  if (!data) return null;

  const titleMap = {
    moved: '이동된 메뉴입니다.',
    deleted: '삭제된 메뉴입니다.',
    added: '사용자가 새로 추가한 메뉴입니다.',
  };

  return (
    <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-[min(420px,calc(100vw-4rem))] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-2xl group-hover:block">
      <p className="text-sm font-black text-slate-900">{titleMap[type]}</p>
      {data.originalPath && (
        <div className="mt-3">
          <p className="text-[11px] font-black uppercase text-slate-400">원래 위치</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">{data.originalPath}</p>
        </div>
      )}
      {type === 'moved' && (
        <div className="mt-3">
          <p className="text-[11px] font-black uppercase text-slate-400">이동된 위치 TOP</p>
          <div className="mt-1 space-y-1">
            {(data.finalPaths || []).slice(0, 5).map((item, index) => (
              <p key={item.path} className="text-xs font-semibold leading-relaxed text-slate-600">
                {index + 1}. {item.path} · {item.count}명
              </p>
            ))}
          </div>
        </div>
      )}
      {type === 'added' && (
        <>
          <div className="mt-3">
            <p className="text-[11px] font-black uppercase text-slate-400">추가 위치</p>
            {(data.addedPaths || []).map((item) => (
              <p key={item.path} className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                {item.path} · {item.count}명
              </p>
            ))}
          </div>
          {(data.childrenTitles || []).length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-black uppercase text-slate-400">하위 메뉴</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">{data.childrenTitles.join(', ')}</p>
            </div>
          )}
        </>
      )}
      <div className="mt-3">
        <p className="text-[11px] font-black uppercase text-slate-400">
          {type === 'moved' ? '이동한 사용자' : type === 'deleted' ? '삭제한 사용자' : '추가한 사용자'}
        </p>
        <UserChips users={data.users || []} />
      </div>
      {type === 'deleted' && (
        <p className="mt-3 text-xs font-black text-red-600">삭제 건수: {data.deletedCount}명</p>
      )}
    </div>
  );
}

function ChangeBadge({ type, count }) {
  const classes = {
    moved: 'bg-orange-400 text-white',
    deleted: 'bg-red-500 text-white',
    added: 'bg-lime-500 text-white',
  };
  const labels = {
    moved: '이동',
    deleted: '삭제',
    added: '추가',
  };

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-black ${classes[type]}`}>
      {labels[type]}{count ? ` ${count}` : ''}
    </span>
  );
}

function AddedChildrenTree({ nodes = [], depth = 0 }) {
  if (!nodes.length) return null;

  return (
    <ul className="mt-2 space-y-1">
      {nodes.map((child, index) => (
        <li key={`${child.title}-${index}`} className="text-xs font-semibold text-lime-800" style={{ paddingLeft: `${depth * 12}px` }}>
          <span className="mr-1 text-lime-500">-</span>
          {child.title}
          <AddedChildrenTree nodes={child.children || []} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

function AddedMenuBox({ title, items }) {
  if (!items?.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-lime-200 bg-lime-50 p-3">
      <p className="text-xs font-black text-lime-700">사용자 추가 메뉴 · {title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item.addedKey} className="group relative rounded-md border border-lime-200 bg-white px-3 py-2">
            <ChangePopover type="added" data={item} />
            <div className="flex flex-wrap items-center gap-2">
              <ChangeBadge type="added" count={item.addedCount} />
              <span className="text-sm font-black text-slate-900">{item.title}</span>
            </div>
            <AddedChildrenTree nodes={item.children || []} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalMenuNode({ node, pathTitles = [], overview, filter }) {
  const nextPathTitles = [...pathTitles, String(node?.title || '').trim()];
  const key = getMenuKey(node, nextPathTitles);
  const pathText = nextPathTitles.join(' > ');
  const moved = overview.movedMenusByKey[key];
  const deleted = overview.deletedMenusByKey[key];
  const addedItems = overview.addedMenusByPath[pathText] || [];
  const hasOwnChange = Boolean(moved || deleted);
  const hasAdded = addedItems.length > 0;
  const children = Array.isArray(node.children) ? node.children : [];
  const shouldDim = filter !== 'all'
    && !((filter === 'moved' && moved) || (filter === 'deleted' && deleted) || (filter === 'added' && hasAdded));
  const itemClass = deleted
    ? 'border-red-300 bg-red-50 text-red-700 opacity-80'
    : moved
      ? 'border-orange-300 bg-orange-50 text-orange-700'
      : 'border-slate-200 bg-white text-slate-800';

  return (
    <li className={shouldDim ? 'opacity-35' : ''}>
      <div className={`group relative flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 ${itemClass}`}>
        {moved && <ChangePopover type="moved" data={moved} />}
        {deleted && <ChangePopover type="deleted" data={deleted} />}
        {moved && <ChangeBadge type="moved" count={moved.movedCount} />}
        {deleted && <ChangeBadge type="deleted" count={deleted.deletedCount} />}
        <span className={`text-sm ${hasOwnChange ? 'font-black' : 'font-bold'}`}>{node.title}</span>
      </div>
      {hasAdded && (filter === 'all' || filter === 'added') && (
        <AddedMenuBox title={pathText} items={addedItems} />
      )}
      {children.length > 0 && (
        <ul className="mt-2 space-y-2 border-l border-slate-200 pl-4">
          {children.map((child) => (
            <FinalMenuNode
              key={getMenuKey(child, nextPathTitles.concat(String(child?.title || '').trim()))}
              node={child}
              pathTitles={nextPathTitles}
              overview={overview}
              filter={filter}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [summary, setSummary] = useState(emptySummary);
  const [participants, setParticipants] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [previewItems, setPreviewItems] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [refreshError, setRefreshError] = useState('');
  const [error, setError] = useState('');
  const [isAccessLogOpen, setIsAccessLogOpen] = useState(false);
  const [accessLogs, setAccessLogs] = useState([]);
  const [accessLogFilter, setAccessLogFilter] = useState('');
  const [isAccessLogLoading, setIsAccessLogLoading] = useState(false);
  const [accessLogError, setAccessLogError] = useState('');
  const [activeTab, setActiveTab] = useState('participants');
  const [trends, setTrends] = useState(emptyTrends);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState('');
  const [hasLoadedTrends, setHasLoadedTrends] = useState(false);
  const [finalOverview, setFinalOverview] = useState(emptyFinalOverview);
  const [isFinalOverviewLoading, setIsFinalOverviewLoading] = useState(false);
  const [finalOverviewError, setFinalOverviewError] = useState('');
  const [hasLoadedFinalOverview, setHasLoadedFinalOverview] = useState(false);
  const [finalOverviewFilter, setFinalOverviewFilter] = useState('all');

  const selectedLog = useMemo(() => {
    const record = selectedDetail?.submission || selectedDetail?.draft;
    return Array.isArray(record?.change_log) ? record.change_log.slice().reverse() : [];
  }, [selectedDetail]);

  const selectedIntention = selectedDetail?.submission?.intention || selectedDetail?.draft?.intention || '';

  const fetchJson = useCallback(async (url) => {
    const res = await fetch(url, {
      headers: {
        'x-admin-code': ADMIN_CODE,
      },
    });
    const result = await res.json();

    if (!res.ok || !result.ok) {
      throw new Error(result.message || '관리자 데이터를 불러오지 못했습니다.');
    }

    return result;
  }, []);

  const loadParticipants = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) {
      setIsRefreshing(true);
      setRefreshError('');
    } else {
      setIsLoading(true);
      setError('');
    }

    try {
      const result = await fetchJson('/api/admin/participants');
      setSummary(result.summary || emptySummary);
      setParticipants(result.participants || []);
      setRecentActivity(result.recentActivity || []);
      setLastRefreshedAt(new Date());
    } catch (loadError) {
      console.error('[admin] participants load failed:', loadError);
      if (refresh) {
        setRefreshError('새로고침 실패');
      } else {
        setError('관리자 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [fetchJson]);

  const loadDetail = useCallback(async (authCode, { refresh = false } = {}) => {
    if (refresh) {
      setIsRefreshing(true);
      setRefreshError('');
    } else {
      setIsLoading(true);
      setError('');
    }
    setSelectedCode(authCode);

    try {
      const result = await fetchJson(`/api/admin/participant?authCode=${encodeURIComponent(authCode)}`);
      setSelectedDetail(result);
      setLastRefreshedAt(new Date());
    } catch (loadError) {
      console.error('[admin] participant load failed:', loadError);
      if (refresh) {
        setRefreshError('새로고침 실패');
      } else {
        setError('참여자 상세 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [fetchJson]);

  const loadTrends = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) {
      setIsRefreshing(true);
      setRefreshError('');
    } else {
      setIsTrendsLoading(true);
      setTrendsError('');
    }

    try {
      const result = await fetchJson('/api/admin/trends');
      setTrends({
        summary: result.summary || emptyTrends.summary,
        topMovedMenus: result.topMovedMenus || [],
        topCategoryMoves: result.topCategoryMoves || [],
        addedMenus: result.addedMenus || [],
        deletedMenus: result.deletedMenus || [],
      });
      setHasLoadedTrends(true);
      setLastRefreshedAt(new Date());
    } catch (loadError) {
      console.error('[admin] trends load failed:', loadError);
      if (refresh) {
        setRefreshError('새로고침 실패');
      } else {
        setTrendsError('경향 분석 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsTrendsLoading(false);
      }
    }
  }, [fetchJson]);

  const loadFinalOverview = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) {
      setIsRefreshing(true);
      setRefreshError('');
    } else {
      setIsFinalOverviewLoading(true);
      setFinalOverviewError('');
    }

    try {
      const result = await fetchJson('/api/admin/final-menu-overview');
      setFinalOverview({
        summary: result.summary || emptyFinalOverview.summary,
        baseMenuTree: result.baseMenuTree || [],
        movedMenusByKey: result.movedMenusByKey || {},
        deletedMenusByKey: result.deletedMenusByKey || {},
        addedMenusByPath: result.addedMenusByPath || {},
      });
      setHasLoadedFinalOverview(true);
      setLastRefreshedAt(new Date());
    } catch (loadError) {
      console.error('[admin] final menu overview load failed:', loadError);
      if (refresh) {
        setRefreshError('새로고침 실패');
      } else {
        setFinalOverviewError('전체 최종 메뉴 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsFinalOverviewLoading(false);
      }
    }
  }, [fetchJson]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadParticipants();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadParticipants]);

  const handleRefresh = () => {
    if (selectedCode) {
      loadDetail(selectedCode, { refresh: true });
    } else if (activeTab === 'trends') {
      loadTrends({ refresh: true });
    } else if (activeTab === 'finalMenus') {
      loadFinalOverview({ refresh: true });
    } else {
      loadParticipants({ refresh: true });
    }
  };

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'trends' && !hasLoadedTrends) {
      loadTrends();
    }
    if (tabId === 'finalMenus' && !hasLoadedFinalOverview) {
      loadFinalOverview();
    }
  };

  const openAccessLogs = async (authCode = '') => {
    setIsAccessLogOpen(true);
    setAccessLogFilter(authCode);
    setAccessLogs([]);
    setAccessLogError('');
    setIsAccessLogLoading(true);

    try {
      const suffix = authCode ? `?authCode=${encodeURIComponent(authCode)}` : '';
      const result = await fetchJson(`/api/admin/access-logs${suffix}`);
      setAccessLogs(result.logs || []);
    } catch (loadError) {
      console.error('[admin] access logs load failed:', loadError);
      setAccessLogError('접속 로그를 불러오지 못했습니다.');
    } finally {
      setIsAccessLogLoading(false);
    }
  };

  const openPreview = () => {
    if (!selectedDetail?.viewMenuData) return;
    setPreviewItems(selectedDetail.viewMenuData);
    setIsPreviewOpen(true);
  };

  const returnToList = () => {
    setSelectedCode(null);
    setSelectedDetail(null);
    setPreviewItems(null);
    setIsPreviewOpen(false);
  };

  const refreshLabel = isRefreshing ? '새로고침 중...' : '새로고침';
  const hasAnyTrendData = trends.summary.analyzedUserCount > 0;
  const hasAnyFinalOverviewData = finalOverview.summary.analyzedUserCount > 0;
  const trendSummaryItems = [
    ['분석 사용자 수', trends.summary.analyzedUserCount],
    ['최종 제출 기준', trends.summary.submittedCount],
    ['임시저장 기준', trends.summary.draftCount],
  ];
  const finalOverviewSummaryItems = [
    ['분석 사용자 수', finalOverview.summary.analyzedUserCount],
    ['이동된 메뉴', finalOverview.summary.movedMenuCount],
    ['삭제된 메뉴', finalOverview.summary.deletedMenuCount],
    ['추가된 메뉴', finalOverview.summary.addedMenuCount],
  ];
  const finalOverviewFilters = [
    { id: 'all', label: '전체' },
    { id: 'moved', label: '이동만' },
    { id: 'deleted', label: '삭제만' },
    { id: 'added', label: '추가만' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fb]">
      <header className="sticky top-0 z-40 bg-[#004f91] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-black">관리자 대시보드</h1>
            <p className="mt-1 text-xs text-blue-100">코드별 임시저장, 최종 제출, 변경 로그 조회</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold transition hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {refreshLabel}
            </button>
            <button
              type="button"
              onClick={() => openAccessLogs()}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold transition hover:bg-white/20"
            >
              접속 로그
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold transition hover:bg-white/20"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 flex min-h-6 flex-wrap items-center gap-3 text-xs font-bold">
          {lastRefreshedAt && (
            <span className="rounded-full bg-white px-3 py-1 text-slate-500 shadow-sm ring-1 ring-slate-200">
              마지막 업데이트: {formatTime(lastRefreshedAt)}
            </span>
          )}
          {refreshError && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-red-600 ring-1 ring-red-100">
              {refreshError}
            </span>
          )}
          {isLoading && (
            <span className="rounded-full bg-white px-3 py-1 text-slate-400 shadow-sm ring-1 ring-slate-200">
              데이터 불러오는 중...
            </span>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {!selectedCode && (
          <nav className="mb-6 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`rounded-md px-4 py-2 text-sm font-black transition ${
                  activeTab === tab.id
                    ? 'bg-[#004f91] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {!selectedCode ? (
          activeTab === 'participants' ? (
            <div className="space-y-6">
            <section className="grid gap-3 md:grid-cols-4">
              {[
                ['전체 코드', summary.total],
                ['최종 제출', summary.submitted],
                ['임시저장', summary.draft],
                ['미참여', summary.notStarted],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900">최근 활동</h2>
              <div className="mt-4 divide-y divide-slate-100">
                {recentActivity.length === 0 ? (
                  <p className="py-4 text-sm text-slate-400">최근 활동이 없습니다.</p>
                ) : (
                  recentActivity.map((item) => (
                    <div key={`${item.authCode}-${item.lastActivityAt}`} className="grid gap-2 py-3 text-sm sm:grid-cols-3">
                      <div className="flex flex-wrap items-center gap-2 font-bold text-slate-800">
                        <span>{item.authCode}</span>
                        {item.label && (
                          <span className="text-xs font-bold text-slate-500">{item.label}</span>
                        )}
                      </div>
                      <div className="text-slate-500">{item.statusLabel}</div>
                      <div className="text-slate-400 sm:text-right">{formatDateTime(item.lastActivityAt)}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-black text-slate-900">참여자 목록</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black text-slate-500">
                    <tr>
                      <th className="px-5 py-3">인증코드</th>
                      <th className="px-5 py-3">상태</th>
                      <th className="px-5 py-3">마지막 접속</th>
                      <th className="px-5 py-3">접속 횟수</th>
                      <th className="px-5 py-3">마지막 임시저장</th>
                      <th className="px-5 py-3">최종 제출</th>
                      <th className="px-5 py-3">의도</th>
                      <th className="px-5 py-3">변경 로그</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participants.map((item) => (
                      <tr key={item.authCode} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{item.authCode}</span>
                            {item.label && (
                              <span className="text-xs font-bold text-slate-500">{item.label}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-700">{item.statusLabel}</td>
                        <td className="px-5 py-3 text-slate-500">{formatDateTime(item.lastAccessAt)}</td>
                        <td className="px-5 py-3 text-slate-500">{item.accessCount || 0}</td>
                        <td className="px-5 py-3 text-slate-500">{formatDateTime(item.lastDraftAt)}</td>
                        <td className="px-5 py-3 text-slate-500">{formatDateTime(item.submittedAt)}</td>
                        <td className="px-5 py-3 text-slate-500">{item.hasIntention ? '입력됨' : '-'}</td>
                        <td className="px-5 py-3 text-slate-500">{item.changeLogCount}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openAccessLogs(item.authCode)}
                              className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-200"
                            >
                              접속
                            </button>
                            <button
                              type="button"
                              onClick={() => loadDetail(item.authCode)}
                              className="rounded-md bg-[#004f91] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#003d70]"
                            >
                              보기
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          ) : activeTab === 'trends' ? (
            <div className="space-y-6">
              {trendsError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {trendsError}
                </div>
              )}

              <section className="grid gap-3 md:grid-cols-3">
                {trendSummaryItems.map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                  </div>
                ))}
              </section>

              {isTrendsLoading ? (
                <section className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400 shadow-sm">
                  경향 분석 데이터를 불러오는 중...
                </section>
              ) : !hasAnyTrendData ? (
                <section className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400 shadow-sm">
                  아직 분석할 저장 데이터가 없습니다.
                </section>
              ) : (
                <>
                  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-black text-slate-900">많이 이동된 메뉴 TOP 10</h2>
                    <div className="mt-4">
                      <TrendBarList
                        items={trends.topMovedMenus}
                        valueKey="moveCount"
                        labelKey="menuTitle"
                        emptyText="많이 이동된 메뉴가 없습니다."
                      />
                    </div>
                    {trends.topMovedMenus.length > 0 && (
                      <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs font-black text-slate-500">
                            <tr>
                              <th className="px-4 py-3">순위</th>
                              <th className="px-4 py-3">메뉴명</th>
                              <th className="px-4 py-3 text-right">이동 횟수</th>
                              <th className="px-4 py-3">원래 위치</th>
                              <th className="px-4 py-3">가장 많이 이동된 위치</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {trends.topMovedMenus.map((item, index) => (
                              <tr key={item.menuCode || item.menuTitle}>
                                <td className="px-4 py-3 font-black text-slate-500">{index + 1}</td>
                                <td className="px-4 py-3 font-bold text-slate-900">{item.menuTitle}</td>
                                <td className="px-4 py-3 text-right font-black text-slate-800">{item.moveCount}</td>
                                <td className="px-4 py-3 text-slate-500">{item.originalPath}</td>
                                <td className="px-4 py-3 text-slate-500">{item.mostCommonFinalPath}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-black text-slate-900">대분류 이동 경향</h2>
                    <div className="mt-4">
                      <TrendBarList
                        items={trends.topCategoryMoves}
                        valueKey="moveCount"
                        labelKey="targetTopCategoryTitle"
                        emptyText="대분류를 이동한 메뉴가 없습니다."
                      />
                    </div>
                    {trends.topCategoryMoves.length > 0 && (
                      <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs font-black text-slate-500">
                            <tr>
                              <th className="px-4 py-3">이동 대상 대분류</th>
                              <th className="px-4 py-3 text-right">이동된 메뉴 수</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {trends.topCategoryMoves.map((item) => (
                              <tr key={item.targetTopCategoryTitle}>
                                <td className="px-4 py-3 font-bold text-slate-900">{item.targetTopCategoryTitle}</td>
                                <td className="px-4 py-3 text-right font-black text-slate-800">{item.moveCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h2 className="text-base font-black text-slate-900">사용자 추가 메뉴</h2>
                    </div>
                    {trends.addedMenus.length === 0 ? (
                      <p className="p-5 text-sm font-bold text-slate-400">사용자 추가 메뉴가 없습니다.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {trends.addedMenus.map((item) => (
                          <details key={`${item.menuTitle}-${item.menuId}`} className="group">
                            <summary className="grid cursor-pointer gap-3 px-5 py-4 text-sm hover:bg-slate-50 sm:grid-cols-[1.2fr_120px_1.6fr_1.5fr]">
                              <span className="font-bold text-slate-900">{item.menuTitle}</span>
                              <span className="font-black text-slate-800 sm:text-right">{item.addedCount}명</span>
                              <span className="text-slate-500">{item.addedPaths?.join(', ') || '-'}</span>
                              <span className="text-slate-500">{item.childrenTitles?.join(', ') || '-'}</span>
                            </summary>
                            <div className="bg-slate-50 px-5 py-4">
                              <p className="text-xs font-black text-slate-400">추가 사용자</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(item.addedBy || []).map((user) => (
                                  <span key={`${item.menuTitle}-${user.authCode}`} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                                    {user.authCode}{user.label ? ` ${user.label}` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h2 className="text-base font-black text-slate-900">삭제된 메뉴</h2>
                    </div>
                    {trends.deletedMenus.length === 0 ? (
                      <p className="p-5 text-sm font-bold text-slate-400">삭제된 메뉴가 없습니다.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {trends.deletedMenus.map((item, index) => (
                          <details key={item.menuCode || `${item.menuTitle}-${index}`} className="group">
                            <summary className="grid cursor-pointer gap-3 px-5 py-4 text-sm hover:bg-slate-50 sm:grid-cols-[60px_1fr_120px_2fr]">
                              <span className="font-black text-slate-400">{index + 1}</span>
                              <span className="font-bold text-slate-900">{item.menuTitle}</span>
                              <span className="font-black text-slate-800 sm:text-right">{item.deleteCount}회</span>
                              <span className="text-slate-500">{item.originalPath}</span>
                            </summary>
                            <div className="bg-slate-50 px-5 py-4">
                              <p className="text-xs font-black text-slate-400">삭제 사용자</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(item.deletedBy || []).map((user) => (
                                  <span key={`${item.menuCode}-${user.authCode}`} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                                    {user.authCode}{user.label ? ` ${user.label}` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {finalOverviewError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {finalOverviewError}
                </div>
              )}

              <section className="grid gap-3 md:grid-cols-4">
                {finalOverviewSummaryItems.map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">전체 최종 메뉴</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700 ring-1 ring-orange-200">주황: 이동된 메뉴</span>
                      <span className="rounded-full bg-red-50 px-3 py-1 text-red-700 ring-1 ring-red-200">빨강: 삭제된 메뉴</span>
                      <span className="rounded-full bg-lime-50 px-3 py-1 text-lime-700 ring-1 ring-lime-200">초록: 사용자 추가 메뉴</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1">
                    {finalOverviewFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setFinalOverviewFilter(filter.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-black transition ${
                          finalOverviewFilter === filter.id
                            ? 'bg-white text-[#004f91] shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {isFinalOverviewLoading ? (
                <section className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400 shadow-sm">
                  전체 최종 메뉴 데이터를 불러오는 중...
                </section>
              ) : !hasAnyFinalOverviewData ? (
                <section className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400 shadow-sm">
                  아직 비교할 최종 메뉴 데이터가 없습니다.
                </section>
              ) : (
                <div className="space-y-4">
                  {(finalOverview.baseMenuTree || []).map((topNode) => (
                    <section key={getMenuKey(topNode, [String(topNode?.title || '').trim()])} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900">{topNode.title}</h3>
                      <ul className="mt-4 space-y-2">
                        {(topNode.children || []).map((child) => (
                          <FinalMenuNode
                            key={getMenuKey(child, [String(topNode?.title || '').trim(), String(child?.title || '').trim()])}
                            node={child}
                            pathTitles={[String(topNode?.title || '').trim()]}
                            overview={finalOverview}
                            filter={finalOverviewFilter}
                          />
                        ))}
                      </ul>
                      {(finalOverview.addedMenusByPath?.[String(topNode?.title || '').trim()] || []).length > 0 && (
                        <AddedMenuBox
                          title={String(topNode?.title || '').trim()}
                          items={finalOverview.addedMenusByPath[String(topNode?.title || '').trim()]}
                        />
                      )}
                    </section>
                  ))}
                  {(finalOverview.addedMenusByPath?.['대분류 추가'] || []).length > 0 && (
                    <section className="rounded-lg border border-lime-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900">대분류 추가</h3>
                      <AddedMenuBox title="대분류 추가" items={finalOverview.addedMenusByPath['대분류 추가']} />
                    </section>
                  )}
                </div>
              )}
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={returnToList}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                목록으로 돌아가기
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openAccessLogs(selectedCode)}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  접속 로그
                </button>
                <button
                  type="button"
                  onClick={openPreview}
                  disabled={!selectedDetail?.viewMenuData}
                  className="flex items-center gap-2 rounded-lg bg-[#004f91] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#003d70] disabled:bg-slate-300"
                >
                  <Eye size={16} />
                  미리보기 보기
                </button>
              </div>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900">{selectedCode} 상세</h2>
                    {selectedDetail?.label && (
                      <span className="text-sm font-bold text-slate-500">{selectedDetail.label}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#004f91]">{selectedDetail?.statusLabel || '-'}</p>
                </div>
                {isLoading && <p className="text-sm font-bold text-slate-400">불러오는 중...</p>}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">제출 시각</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">{formatDateTime(selectedDetail?.submission?.submitted_at)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">마지막 임시저장</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">{formatDateTime(selectedDetail?.draft?.updated_at)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">미리보기 기준</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {selectedDetail?.viewSource === 'submission' ? '최종 제출본' : selectedDetail?.viewSource === 'draft' ? '임시저장본' : '-'}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-black text-slate-900">메뉴 구성 의도</h3>
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                  {selectedIntention || '입력된 메뉴 구성 의도가 없습니다.'}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-black text-slate-900">변경 로그</h3>
                <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {selectedLog.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400">변경 로그가 없습니다.</p>
                  ) : (
                    selectedLog.map((log, index) => (
                      <div key={`${log.createdAt}-${index}`} className="p-4">
                        <p className="text-xs font-bold text-slate-400">{formatDateTime(log.createdAt || log.submittedAt)}</p>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{log.message || JSON.stringify(log)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {isAccessLogOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <section className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">접속 로그</h2>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {accessLogFilter ? `${accessLogFilter} 기준 최근 100건` : '전체 최근 100건'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAccessLogOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-auto p-5">
              {accessLogError && (
                <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {accessLogError}
                </div>
              )}

              {isAccessLogLoading ? (
                <p className="py-10 text-center text-sm font-bold text-slate-400">접속 로그 불러오는 중...</p>
              ) : accessLogs.length === 0 ? (
                <p className="py-10 text-center text-sm font-bold text-slate-400">접속 로그가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-black text-slate-500">
                      <tr>
                        <th className="px-4 py-3">접속 시각</th>
                        <th className="px-4 py-3">인증코드</th>
                        <th className="px-4 py-3">이름</th>
                        <th className="px-4 py-3">이벤트</th>
                        <th className="px-4 py-3">경로</th>
                        <th className="px-4 py-3">브라우저</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accessLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-3 text-slate-500">{formatDateTime(log.created_at)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{log.auth_code || '-'}</td>
                          <td className="px-4 py-3 text-slate-500">{log.label || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{log.event_type || '-'}</td>
                          <td className="px-4 py-3 text-slate-500">{log.path || '-'}</td>
                          <td className="px-4 py-3 text-slate-500" title={log.user_agent || ''}>
                            {summarizeUserAgent(log.user_agent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        items={previewItems || []}
        setItems={() => {}}
        isEditable={false}
      />
    </div>
  );
}
