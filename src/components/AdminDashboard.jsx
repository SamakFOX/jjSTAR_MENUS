'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, LogOut, RefreshCw } from 'lucide-react';
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

const emptySummary = {
  total: 0,
  submitted: 0,
  draft: 0,
  notStarted: 0,
};

export default function AdminDashboard({ onLogout }) {
  const [summary, setSummary] = useState(emptySummary);
  const [participants, setParticipants] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [previewItems, setPreviewItems] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const loadParticipants = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await fetchJson('/api/admin/participants');
      setSummary(result.summary || emptySummary);
      setParticipants(result.participants || []);
      setRecentActivity(result.recentActivity || []);
    } catch (loadError) {
      console.error('[admin] participants load failed:', loadError);
      setError('관리자 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchJson]);

  const loadDetail = async (authCode) => {
    setIsLoading(true);
    setError('');
    setSelectedCode(authCode);

    try {
      const result = await fetchJson(`/api/admin/participant?authCode=${encodeURIComponent(authCode)}`);
      setSelectedDetail(result);
    } catch (loadError) {
      console.error('[admin] participant load failed:', loadError);
      setError('참여자 상세 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadParticipants();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadParticipants]);

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

  return (
    <div className="min-h-screen bg-[#f5f6fb]">
      <header className="sticky top-0 z-40 bg-[#004f91] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-black">관리자 대시보드</h1>
            <p className="mt-1 text-xs text-blue-100">코드별 임시저장, 최종 제출, 변경 로그 조회</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectedCode ? () => loadDetail(selectedCode) : loadParticipants}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold transition hover:bg-white/20"
            >
              <RefreshCw size={16} />
              새로고침
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
        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {!selectedCode ? (
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
                    <div key={`${item.authCode}-${item.lastActivityAt}`} className="flex items-center justify-between py-3 text-sm">
                      <div className="font-bold text-slate-800">{item.authCode}</div>
                      <div className="text-slate-500">{item.statusLabel}</div>
                      <div className="text-slate-400">{formatDateTime(item.lastActivityAt)}</div>
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
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black text-slate-500">
                    <tr>
                      <th className="px-5 py-3">인증코드</th>
                      <th className="px-5 py-3">상태</th>
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
                        <td className="px-5 py-3 font-mono font-bold text-slate-900">{item.authCode}</td>
                        <td className="px-5 py-3 font-bold text-slate-700">{item.statusLabel}</td>
                        <td className="px-5 py-3 text-slate-500">{formatDateTime(item.lastDraftAt)}</td>
                        <td className="px-5 py-3 text-slate-500">{formatDateTime(item.submittedAt)}</td>
                        <td className="px-5 py-3 text-slate-500">{item.hasIntention ? '입력됨' : '-'}</td>
                        <td className="px-5 py-3 text-slate-500">{item.changeLogCount}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => loadDetail(item.authCode)}
                            className="rounded-md bg-[#004f91] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#003d70]"
                          >
                            보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
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

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedCode} 상세</h2>
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
