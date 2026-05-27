'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import jjstarLogo from '@/data/jjstarLogo.png';
import MenuBoard from '@/components/MenuBoard';
import EditToolbar from '@/components/EditToolbar';
import PreviewModal from '@/components/PreviewModal';
import { LayoutGrid, Info, ArrowRight, CheckCircle, LogOut, Send, Eye } from 'lucide-react';
import { initialMenu } from '@/data/initialMenu';
import { validateTree } from '@/lib/menuUtils';

const STORAGE_KEYS = {
  code: 'jjstar_auth_code',
  userName: 'jjstar_user_name',
  label: 'jjstar_auth_label',
};

const HISTORY_LIMIT = 20;
const DEFAULT_USER_NAME = '메뉴 배치 테스트 참여자';

const isSameMenuState = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const toKoreanError = (message) => {
  const messages = {
    'Enter an auth code.': '인증코드를 입력해주세요.',
    'Enter both an auth code and a name.': '인증코드를 입력해주세요.',
    'This auth code is not valid.': '유효하지 않은 인증코드입니다.',
    'This auth code is inactive.': '비활성화된 인증코드입니다.',
    'This auth code has expired.': '만료된 인증코드입니다.',
    'This auth code has reached its submit limit.': '제출 가능 횟수를 초과한 인증코드입니다.',
    'Verification failed. Please try again.': '인증 처리 중 오류가 발생했습니다.',
    'Submit data is incomplete.': '제출 정보가 부족합니다.',
    'Could not save the submission.': '제출 저장 중 오류가 발생했습니다.',
    'Submit failed. Please try again.': '제출 처리 중 오류가 발생했습니다.',
  };

  return messages[message] || message;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editModeType, setEditModeType] = useState('list');
  const [isStarted, setIsStarted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [menuTree, setMenuTree] = useState(initialMenu);
  const [authCode, setAuthCode] = useState('');
  const [userName, setUserName] = useState(DEFAULT_USER_NAME);
  const [authLabel, setAuthLabel] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [changeLog, setChangeLog] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [submitStep, setSubmitStep] = useState('edit');
  const [submitIntention, setSubmitIntention] = useState('');
  const [submitError, setSubmitError] = useState('');

  const menuTreeRef = useRef(initialMenu);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const savedCode = sessionStorage.getItem(STORAGE_KEYS.code) || '';
      const savedUserName = sessionStorage.getItem(STORAGE_KEYS.userName) || DEFAULT_USER_NAME;
      const savedLabel = sessionStorage.getItem(STORAGE_KEYS.label) || '';

      if (savedCode) {
        setAuthCode(savedCode);
        setUserName(savedUserName);
        setAuthLabel(savedLabel);
        setIsStarted(true);
      }

      setMounted(true);
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    menuTreeRef.current = menuTree;
  }, [menuTree]);

  useEffect(() => {
    undoStackRef.current = undoStack;
  }, [undoStack]);

  useEffect(() => {
    redoStackRef.current = redoStack;
  }, [redoStack]);

  const addChangeLog = (type, message) => {
    setChangeLog((prev) => [
      ...prev,
      {
        type,
        message,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const showActionToast = (message) => {
    setLastAction(message);
    setTimeout(() => setLastAction(null), 5000);
  };

  const applyMenuTree = (nextTree) => {
    menuTreeRef.current = nextTree;
    setMenuTree(nextTree);
  };

  const commitMenuChange = (nextTree, message, previousTree) => {
    const currentTree = previousTree || menuTreeRef.current;

    if (isSameMenuState(currentTree, nextTree)) {
      return;
    }

    const nextUndoStack = [...undoStackRef.current, currentTree].slice(-HISTORY_LIMIT);
    undoStackRef.current = nextUndoStack;
    redoStackRef.current = [];

    setUndoStack(nextUndoStack);
    setRedoStack([]);
    applyMenuTree(nextTree);
    addChangeLog('edit', message);
    showActionToast(message);
  };

  const handleUndo = () => {
    const currentUndoStack = undoStackRef.current;
    if (currentUndoStack.length === 0) return;

    const previousTree = currentUndoStack[currentUndoStack.length - 1];
    const nextUndoStack = currentUndoStack.slice(0, -1);
    const nextRedoStack = [...redoStackRef.current, menuTreeRef.current].slice(-HISTORY_LIMIT);

    undoStackRef.current = nextUndoStack;
    redoStackRef.current = nextRedoStack;

    setUndoStack(nextUndoStack);
    setRedoStack(nextRedoStack);
    applyMenuTree(previousTree);
    showActionToast('작업이 취소되었습니다.');
  };

  const handleRedo = () => {
    const currentRedoStack = redoStackRef.current;
    if (currentRedoStack.length === 0) return;

    const nextTree = currentRedoStack[currentRedoStack.length - 1];
    const nextRedoStack = currentRedoStack.slice(0, -1);
    const nextUndoStack = [...undoStackRef.current, menuTreeRef.current].slice(-HISTORY_LIMIT);

    undoStackRef.current = nextUndoStack;
    redoStackRef.current = nextRedoStack;

    setUndoStack(nextUndoStack);
    setRedoStack(nextRedoStack);
    applyMenuTree(nextTree);
    showActionToast('작업을 다시 실행하였습니다.');
  };

  const handleStart = async () => {
    if (isLoading) return;

    const code = loginCode.trim().toUpperCase();

    if (!code) {
      setLoginError('인증코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await res.json();

      if (!result.ok) {
        setLoginError(toKoreanError(result.message) || '유효하지 않은 인증코드입니다.');
        return;
      }

      sessionStorage.setItem(STORAGE_KEYS.code, code);
      sessionStorage.setItem(STORAGE_KEYS.userName, DEFAULT_USER_NAME);
      sessionStorage.setItem(STORAGE_KEYS.label, result.label || '');

      setAuthCode(code);
      setUserName(DEFAULT_USER_NAME);
      setAuthLabel(result.label || '');
      applyMenuTree(initialMenu);
      setChangeLog([]);
      setUndoStack([]);
      setRedoStack([]);
      undoStackRef.current = [];
      redoStackRef.current = [];
      setIsStarted(true);
    } catch (error) {
      console.error('Verification error:', error);
      setLoginError('인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    handleStart();
  };

  const handleReset = () => {
    if (confirm('메뉴를 초기 상태로 되돌리시겠습니까?')) {
      undoStackRef.current = [];
      redoStackRef.current = [];
      setUndoStack([]);
      setRedoStack([]);
      applyMenuTree(initialMenu);
      showActionToast('초기 상태로 복원되었습니다.');
    }
  };

  const handleSubmit = () => {
    const { errors, warnings } = validateTree(menuTree);

    if (errors.length > 0) {
      setSubmitError(`제출할 수 없습니다. ${errors.join(' / ')}`);
      setSubmitStep('submitForm');
      return;
    }

    setSubmitError(warnings.length > 0 ? `확인할 안내가 있습니다. ${warnings.join(' / ')}` : '');
    setSubmitStep('submitForm');
  };

  const handleSubmitForm = async () => {
    if (isLoading) return;

    const intention = submitIntention.trim();

    if (!intention) {
      setSubmitError('메뉴 구성 의도를 입력해주세요.');
      return;
    }

    if (!authCode) {
      setSubmitError('로그인이 필요합니다.');
      setIsStarted(false);
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      const submittedAt = new Date().toISOString();
      const finalLog = [
        ...changeLog,
        {
          type: 'submit',
          message: '최종 제출되었습니다.',
          intention,
          submittedAt,
          createdAt: submittedAt,
        },
      ];
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: authCode,
          userName,
          menuData: menuTree,
          changeLog: finalLog,
          intention,
          submittedAt,
        }),
      });
      const result = await res.json();

      if (!result.ok) {
        setSubmitError(toKoreanError(result.message) || '제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      setChangeLog(finalLog);
      setIsEditMode(false);
      setEditModeType('list');
      setSubmitStep('submitted');
    } catch (error) {
      setSubmitError('제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEYS.code);
    sessionStorage.removeItem(STORAGE_KEYS.userName);
    sessionStorage.removeItem(STORAGE_KEYS.label);
    setIsStarted(false);
    setAuthCode('');
    setUserName(DEFAULT_USER_NAME);
    setAuthLabel('');
    setLoginCode('');
    setChangeLog([]);
    setUndoStack([]);
    setRedoStack([]);
    setSubmitStep('edit');
    setSubmitIntention('');
    setSubmitError('');
    undoStackRef.current = [];
    redoStackRef.current = [];
    applyMenuTree(initialMenu);
  };

  const handleVisualMenuChange = (nextTree) => {
    commitMenuChange(nextTree, '화면에서 메뉴 구조가 변경되었습니다.');
  };

  const handleTypeChange = (type) => {
    setEditModeType(type);
    if (type === 'visual') {
      setIsPreviewOpen(true);
    }
  };

  const handleToggleEdit = () => {
    const nextValue = !isEditMode;
    setIsEditMode(nextValue);
    if (nextValue && editModeType === 'visual') {
      setIsPreviewOpen(true);
    }
  };

  const sidePanelContent = (
    <>
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Info className="text-[#004f91]" size={18} />
          안내
        </h3>
        <ul className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <li className="flex gap-2">
            <span className="text-[#004f91] font-bold">1.</span>
            편집 모드에서 메뉴 순서 변경, 이동, 추가, 이름 변경, 삭제를 할 수 있습니다.
          </li>
          <li className="flex gap-2">
            <span className="text-[#004f91] font-bold">2.</span>
            화면에서 편집 모드는 미리보기 화면에서 메뉴를 직접 이동할 수 있습니다.
          </li>
          <li className="flex gap-2">
            <span className="text-[#004f91] font-bold">3.</span>
            메뉴 배치가 완료되면 상단의 최종 제출 버튼을 눌러주세요.
          </li>
        </ul>
      </div>

      <div className="p-6 bg-[#004f91] text-white rounded-xl shadow-xl">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <CheckCircle size={18} className="text-[#f3d129]" />
          제출 안내
        </h3>
        <p className="text-sm text-blue-100 leading-relaxed">
          최종 제출 시 현재 메뉴 구조 전체와 변경 로그가 서버를 통해 저장됩니다.
        </p>
      </div>
    </>
  );

  const loginScreen = (
    <main className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-[#004f91] rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-blue-100">
        <LayoutGrid size={40} />
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
        JJSTAR 메뉴 배치 테스트
      </h1>

      <p className="text-xl text-slate-600 mb-10 max-w-4xl leading-relaxed">
        실 사용자인 학생분들이 가장 편하게 느끼는 메뉴 배치를 적용하기 위해 테스터분들을 대상으로 직접 메뉴를 구성해보고 최적의 메뉴를 제출할 수 있도록 제작한 사이트입니다
      </p>

      <form onSubmit={handleLoginSubmit} className="flex w-full flex-col items-center">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-blue-50/50 mb-10">
        <label className="block text-sm font-bold text-slate-700 mb-3 text-left">
          인증코드
        </label>
        <input
          type="text"
          value={loginCode}
          onChange={(event) => setLoginCode(event.target.value.toUpperCase())}
          placeholder="인증코드를 입력해주세요"
          className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#004f91] focus:bg-white outline-none transition-all text-lg font-sans tracking-normal placeholder:tracking-normal placeholder:font-sans"
          autoFocus
        />

        {loginError && (
          <p className="mt-4 text-sm font-bold text-red-600 text-left">{loginError}</p>
        )}

        <p className="mt-4 text-xs text-slate-400 text-left">
          인증코드는 테스트 참여 확인 용도로만 사용합니다.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="group flex items-center gap-3 px-10 py-5 bg-[#004f91] text-white text-xl font-bold rounded-2xl hover:bg-[#003d70] disabled:bg-slate-300 transition-all shadow-2xl shadow-blue-200/50 hover:-translate-y-1 active:translate-y-0"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            입장하기
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
      </form>
    </main>
  );

  const editorScreen = (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#004f91] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <Image src={jjstarLogo} alt="jjSTAR" className="h-7 w-auto object-contain" />
              </h1>
              <p className="text-xs text-blue-200 opacity-80">메뉴 배치 사용자 테스트</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="font-mono">{authCode}</span>
              </div>
              <span className="text-[10px] text-blue-200/60 flex items-center gap-1">
                <CheckCircle size={10} /> {authLabel || '인증 완료'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {lastAction && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{lastAction}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        <EditToolbar
          isEditMode={isEditMode}
          editModeType={editModeType}
          onTypeChange={handleTypeChange}
          onToggleEdit={handleToggleEdit}
          onReset={handleReset}
          onSubmit={handleSubmit}
          onPreview={() => setIsPreviewOpen(true)}
        />

        <MenuBoard
          key={authCode}
          isEditMode={isEditMode}
          menuTree={menuTree}
          setMenuTree={setMenuTree}
          onCommitMenuChange={commitMenuChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          undoCount={undoStack.length}
          redoCount={redoStack.length}
          sidePanelContent={sidePanelContent}
        />
      </main>

      <footer className="py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>© 2026 JEONJU UNIVERSITY. ALL RIGHTS RESERVED.</p>
      </footer>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setEditModeType('list');
        }}
        items={menuTree}
        setItems={handleVisualMenuChange}
        isEditable={isEditMode && editModeType === 'visual'}
      />
    </div>
  );

  const submitFormScreen = (
    <div className="min-h-screen bg-[#f5f6fb]">
      <header className="bg-[#004f91] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Image src={jjstarLogo} alt="jjSTAR" className="h-7 w-auto object-contain" />
          <p className="mt-1 text-xs text-blue-200">최종 제출 확인</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-900">이 상태로 제출하시겠습니까?</h1>
            <p className="mt-2 text-sm text-slate-500">
              현재 구성한 메뉴 배치와 변경 로그가 최종 제출됩니다.
            </p>
          </div>

          {submitError && (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {submitError}
            </div>
          )}

          <div className="mt-6">
            <label className="block text-base font-black text-slate-800">
              메뉴 구성 의도가 어떻게 되나요?
            </label>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                ex) 학교 다니면서 수강과 연관되서 제가 많이 사용했던 메뉴들은 학사정보로 모았고 부가적인 학교 서비스는 대학생활로 모았습니다. 특히 나의메뉴는 정말 &apos;내 졸업을 위한 정보&apos;처럼 나와 직접 연관되는 메뉴들로 구성해봤어요.
            </p>
            <textarea
              value={submitIntention}
              onChange={(event) => setSubmitIntention(event.target.value)}
              placeholder="답변을 입력해주세요."
              className="mt-3 min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-[#004f91] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setSubmitError('');
                setSubmitStep('edit');
              }}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 bg-white px-8 py-3 text-base font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmitForm}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#004f91] bg-[#004f91] px-8 py-3 text-base font-black text-white shadow-lg transition hover:bg-[#003d70] disabled:border-slate-300 disabled:bg-slate-300"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send size={18} />
              )}
              {isLoading ? '제출 중...' : '제출'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
  const submittedScreen = (
    <div className="min-h-screen bg-[#f5f6fb]">
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#004f91] text-white shadow-2xl shadow-blue-100">
          <CheckCircle size={42} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">참여해주셔서 감사합니다.</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-500">
          제출하신 메뉴 배치와 의견이 정상적으로 저장되었습니다.
          소중한 의견은 JJSTAR 메뉴 개선을 위해 참고하겠습니다.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#004f91] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#003d70]"
          >
            <Eye size={18} />
            미리보기 확인
          </button>
          <button
            type="button"
            onClick={() => setSubmitStep('edit')}
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            다른 응답 제출하기
          </button>
        </div>
      </main>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        items={menuTree}
        setItems={handleVisualMenuChange}
        isEditable={false}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fb]">
      {mounted ? (
        isStarted
          ? submitStep === 'submitForm'
            ? submitFormScreen
            : submitStep === 'submitted'
              ? submittedScreen
              : editorScreen
          : loginScreen
      ) : null}
    </div>
  );
}
