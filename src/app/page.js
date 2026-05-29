'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import jjstarLogo from '@/data/jjstarLogo.png';
import AdminDashboard from '@/components/AdminDashboard';
import GuideOverlay from '@/components/GuideOverlay';
import MenuBoard from '@/components/MenuBoard';
import EditToolbar from '@/components/EditToolbar';
import PreviewModal from '@/components/PreviewModal';
import { LayoutGrid, Info, ArrowRight, CheckCircle, LogOut, Send, Eye } from 'lucide-react';
import { initialMenu } from '@/data/initialMenu';
import { createDetailedChangeLog } from '@/lib/changeLog';
import { validateTree } from '@/lib/menuUtils';

const ADMIN_CODE = 'JJ201562004';

const STORAGE_KEYS = {
  code: 'jjstar_auth_code',
  userName: 'jjstar_user_name',
  label: 'jjstar_auth_label',
  role: 'jjstar_auth_role',
};

const HISTORY_LIMIT = 20;
const AUTO_SAVE_INTERVAL_MS = 30000;
const DEFAULT_USER_NAME = '메뉴 배치 테스트 참여자';
const GUIDE_STEPS = [
  {
    id: 'start-edit',
    target: 'edit-button',
    title: '메뉴 편집 시작',
    body: '메뉴를 바꾸려면 먼저 "메뉴 편집하기" 버튼을 직접 눌러 주세요.',
    requireAction: true,
    completeWhen: 'editModeOn',
    actionHint: '강조된 버튼을 눌러 편집 모드로 들어가 보세요.',
    doneHint: '좋아요. 편집 모드로 들어왔습니다.',
  },
  {
    id: 'edit-ui',
    target: 'edit-ui',
    title: '편집 화면 기본 UI',
    body: '편집 화면에서는 리스트 편집과 화면에서 편집 모드를 오가며 메뉴를 조정할 수 있어요. 초기화 버튼은 현재 배치를 처음 상태로 되돌립니다.',
  },
  {
    id: 'top-actions',
    target: 'top-actions',
    title: '상단 우측 버튼',
    body: '상단 우측 버튼으로 작업을 저장하거나, 현재 메뉴 구성을 미리보고, 최종 제출 단계로 이동할 수 있어요.',
    details: [
      '임시저장: 작업 내용 임시 저장',
      '미리보기: 현재 구성을 실제 화면처럼 확인',
      '최종제출: 의견 추가 및 제출',
    ],
  },
  {
    id: 'edit-tools',
    target: 'edit-tools',
    title: '우측 편집 도구',
    body: '우측 편집 도구에서는 대분류 추가, 대분류 순서 변경, 되돌리기/다시실행, 표시 레벨 조절을 할 수 있어요. 사용 방법 보기를 누르면 이 가이드를 다시 볼 수 있습니다.',
  },
  {
    id: 'drag-handle',
    target: 'drag-handle',
    title: '핸들을 잡고 드래그',
    body: '왼쪽 점 모양 핸들을 눌러 위아래로 드래그하면 메뉴 순서를 바꿀 수 있어요.',
    note: '아이템 전체가 아니라 이 핸들을 잡는 동작을 기억해 주세요.',
    requireAction: true,
    completeOn: 'pointerdown',
    actionHint: '강조된 핸들을 한 번 눌러보세요. 실제 이동하지 않아도 됩니다.',
    doneHint: '좋아요. 이 핸들을 잡고 움직이면 됩니다.',
    demo: 'drag-handle',
    placement: 'top',
  },
  {
    id: 'item-actions',
    target: 'item-actions',
    title: '아이템별 편집 버튼',
    body: '오른쪽 아이콘 버튼으로 메뉴를 이동하거나 수정, 추가, 삭제할 수 있어요.',
    details: [
      '(←) 이전 이동: 현재 메뉴를 앞쪽으로 이동합니다.',
      '(→) 다음 이동: 현재 메뉴를 뒤쪽으로 이동합니다.',
      '(연필) 이름 수정: 메뉴 이름을 변경합니다.',
      '(＋) 하위 메뉴 추가: 현재 메뉴 아래에 새 하위 메뉴를 추가합니다.',
      '(휴지통) 삭제: 현재 메뉴를 삭제합니다.',
    ],
    note: '각 아이콘 위에 마우스를 올리면 기능 이름도 확인할 수 있어요.',
    requireAction: true,
    completeOn: 'hover',
    actionHint: '강조된 아이콘 영역에 마우스를 올려보세요.',
    doneHint: '좋아요. 각 아이콘 위에 올리면 기능 이름도 확인할 수 있습니다.',
    placement: 'right',
  },
  {
    id: 'menu-tooltip',
    target: 'menu-tooltip',
    title: '메뉴 설명 확인',
    body: '메뉴명이 헷갈릴 때는 이름 위에 마우스를 올려 설명 툴팁을 확인해 보세요.',
    requireAction: true,
    completeOn: 'hover',
    actionHint: '강조된 메뉴명에 마우스를 올려보세요.',
    doneHint: '좋아요. 어려운 메뉴는 이렇게 설명을 확인하면 됩니다.',
    demo: 'tooltip',
    placement: 'top',
  },
  {
    id: 'visual-mode',
    target: 'visual-mode-tab',
    title: '화면에서 편집',
    body: '"화면에서 편집"을 직접 눌러 비주얼모드로 전환해 보세요.',
    requireAction: true,
    completeWhen: 'visualModeOn',
    actionHint: '강조된 "화면에서 편집" 탭을 눌러보세요.',
    doneHint: '좋아요. 실제 화면처럼 보면서 편집할 수 있습니다.',
  },
  {
    id: 'visual-handle',
    target: 'visual-handle',
    title: '비주얼모드 편집',
    body: '비주얼모드에서도 점 모양 핸들을 잡고 원하는 위치에 놓으면 됩니다.',
    note: '대분류는 상단 탭 순서, 중분류와 소분류는 허용된 계층 안에서 이동할 수 있습니다.',
    demo: 'drag-handle',
  },
  {
    id: 'final-submit-entry',
    target: 'final-submit-button',
    title: '최종 제출 화면으로 이동',
    body: '이제 "최종 제출" 버튼을 눌러 제출 확인 화면으로 이동해 보세요. 실제 제출은 아직 진행하지 않습니다.',
    requireAction: true,
    completeWhen: 'submitFormOpen',
    actionHint: '강조된 최종 제출 버튼을 눌러 확인 화면으로 이동해 보세요.',
    doneHint: '제출 확인 화면으로 이동했습니다.',
  },
  {
    id: 'submit-intention',
    target: 'submit-intention',
    title: '최종 제출 화면',
    body: '여기에는 왜 이렇게 메뉴를 배치했는지 간단히 적어 주세요. 현재 메뉴 구성과 변경 로그가 함께 제출됩니다.',
    requireAction: true,
    completeOn: 'input',
    actionHint: '입력칸을 클릭하거나 한 글자 이상 입력해 보세요.',
    doneHint: '좋아요. 이 내용은 최종 제출 시 함께 저장됩니다.',
  },
  {
    id: 'submit-actions',
    target: 'submit-actions',
    title: '취소와 제출',
    body: '취소를 누르면 편집 화면으로 돌아가고, 제출을 누르면 현재 메뉴 배치가 최종 저장됩니다.',
    details: [
      '취소: 제출하지 않고 이전 화면으로 돌아갑니다.',
      '제출: 현재 메뉴 배치를 최종 제출합니다.',
    ],
  },
];

const isSameMenuState = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const getHideGuideKey = (code) => `hideGuide:${code}`;

const isGuideHidden = (code) => {
  if (!code || typeof window === 'undefined') return false;
  return localStorage.getItem(getHideGuideKey(code)) === 'true';
};

const formatDraftTime = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
  const [isDirty, setIsDirty] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState('');
  const [draftStatus, setDraftStatus] = useState('idle');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [completedGuideSteps, setCompletedGuideSteps] = useState(() => new Set());

  const menuTreeRef = useRef(initialMenu);
  const changeLogRef = useRef([]);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const submitIntentionRef = useRef('');

  useEffect(() => {
    menuTreeRef.current = menuTree;
  }, [menuTree]);

  useEffect(() => {
    undoStackRef.current = undoStack;
  }, [undoStack]);

  useEffect(() => {
    redoStackRef.current = redoStack;
  }, [redoStack]);

  useEffect(() => {
    changeLogRef.current = changeLog;
  }, [changeLog]);

  useEffect(() => {
    submitIntentionRef.current = submitIntention;
  }, [submitIntention]);

  const addChangeLog = (type, message) => {
    setChangeLog((prev) => {
      const logItem = typeof type === 'object'
        ? type
        : {
            type,
            message,
            createdAt: new Date().toISOString(),
          };
      const next = [
        ...prev,
        logItem,
      ];
      changeLogRef.current = next;
      return next;
    });
  };

  const appendChangeLogOnly = (logItem) => {
    setChangeLog((prev) => {
      const next = [
        ...prev,
        {
          ...logItem,
          createdAt: logItem.createdAt || new Date().toISOString(),
        },
      ];
      changeLogRef.current = next;
      return next;
    });
    setIsDirty(true);
    setDraftStatus('dirty');
  };

  const createUndoLog = (targetLog) => ({
    type: 'undo',
    message: targetLog?.message
      ? `사용자가 "${targetLog.message}" 작업을 되돌렸습니다.`
      : '사용자가 마지막 작업을 되돌렸습니다.',
    targetLogType: targetLog?.type || null,
    targetMessage: targetLog?.message || null,
    createdAt: new Date().toISOString(),
  });

  const createRedoLog = (targetLog) => ({
    type: 'redo',
    message: targetLog?.message
      ? `사용자가 "${targetLog.message}" 작업을 다시 실행했습니다.`
      : '사용자가 되돌린 작업을 다시 실행했습니다.',
    targetLogType: targetLog?.type || null,
    targetMessage: targetLog?.message || null,
    createdAt: new Date().toISOString(),
  });

  const showActionToast = (message) => {
    setLastAction(message);
    setTimeout(() => setLastAction(null), 5000);
  };

  const applyMenuTree = (nextTree) => {
    menuTreeRef.current = nextTree;
    setMenuTree(nextTree);
  };

  const applyLoadedDraft = useCallback((draft) => {
    const nextMenuTree = draft?.menu_data || initialMenu;
    const nextChangeLog = Array.isArray(draft?.change_log) ? draft.change_log : [];
    const nextUndoStack = Array.isArray(draft?.undo_stack) ? draft.undo_stack : [];
    const nextRedoStack = Array.isArray(draft?.redo_stack) ? draft.redo_stack : [];
    const nextIntention = String(draft?.intention || '');

    menuTreeRef.current = nextMenuTree;
    changeLogRef.current = nextChangeLog;
    undoStackRef.current = nextUndoStack;
    redoStackRef.current = nextRedoStack;
    submitIntentionRef.current = nextIntention;

    setMenuTree(nextMenuTree);
    setChangeLog(nextChangeLog);
    setUndoStack(nextUndoStack);
    setRedoStack(nextRedoStack);
    setSubmitIntention(nextIntention);
    setIsDirty(false);
    setLastDraftSavedAt(draft?.updated_at || '');
    setDraftStatus(draft ? 'saved' : 'idle');
  }, []);

  const updateGuideForDraft = useCallback((code, draft) => {
    const shouldShow = !draft && !isGuideHidden(code);
    setShowGuide(shouldShow);
    if (shouldShow) {
      setGuideStep(0);
      setCompletedGuideSteps(new Set());
    }
  }, []);

  const loadDraftByAuthCode = useCallback(async (code) => {
    const res = await fetch(`/api/drafts?authCode=${encodeURIComponent(code)}`);
    const result = await res.json();

    if (!res.ok || !result.ok) {
      throw new Error(result.message || 'Could not load draft.');
    }

    return result.draft || null;
  }, []);

  const saveDraft = useCallback(async ({ silent = false } = {}) => {
    if (!authCode || isSavingDraft || submitStep === 'submitted') return false;

    setIsSavingDraft(true);
    setDraftStatus('saving');

    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authCode,
          menuData: menuTreeRef.current,
          changeLog: changeLogRef.current,
          undoStack: undoStackRef.current,
          redoStack: redoStackRef.current,
          intention: submitIntentionRef.current,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.message || 'Could not save draft.');
      }

      const savedAt = result.draft?.updated_at || new Date().toISOString();
      setLastDraftSavedAt(savedAt);
      setIsDirty(false);
      setDraftStatus('saved');

      if (!silent) {
        showActionToast('임시저장되었습니다.');
      }

      return true;
    } catch (error) {
      console.error('[draft] save failed:', error);
      setDraftStatus('error');

      if (!silent) {
        showActionToast('임시저장 중 오류가 발생했습니다.');
      }

      return false;
    } finally {
      setIsSavingDraft(false);
    }
  }, [authCode, isSavingDraft, submitStep]);

  useEffect(() => {
    let isActive = true;
    const timeout = setTimeout(() => {
      const restoreSession = async () => {
        const savedCode = sessionStorage.getItem(STORAGE_KEYS.code) || '';
        const savedUserName = sessionStorage.getItem(STORAGE_KEYS.userName) || DEFAULT_USER_NAME;
        const savedLabel = sessionStorage.getItem(STORAGE_KEYS.label) || '';

        if (savedCode) {
          try {
            if (!isActive) return;

            setAuthCode(savedCode);
            setUserName(savedUserName);
            setAuthLabel(savedLabel);
            if (sessionStorage.getItem(STORAGE_KEYS.role) === 'admin' || savedCode === ADMIN_CODE) {
              setIsAdminMode(true);
            } else {
              const draft = await loadDraftByAuthCode(savedCode);
              if (!isActive) return;
              applyLoadedDraft(draft);
              updateGuideForDraft(savedCode, draft);
            }
            setIsStarted(true);
          } catch (error) {
            console.error('[draft] session restore failed:', error);
            if (!isActive) return;

            setAuthCode(savedCode);
            setUserName(savedUserName);
            setAuthLabel(savedLabel);
            applyLoadedDraft(null);
            updateGuideForDraft(savedCode, null);
            setIsStarted(true);
          }
        }

        if (isActive) setMounted(true);
      };

      restoreSession();
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [applyLoadedDraft, loadDraftByAuthCode, updateGuideForDraft]);

  useEffect(() => {
    if (isAdminMode || !isStarted || !authCode || submitStep === 'submitted' || isLoading) return undefined;

    const interval = setInterval(() => {
      if (!isDirty || isSavingDraft) return;
      saveDraft({ silent: true });
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [authCode, isAdminMode, isDirty, isLoading, isSavingDraft, isStarted, saveDraft, submitStep]);

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
    addChangeLog(createDetailedChangeLog(currentTree, nextTree, message));
    setIsDirty(true);
    setDraftStatus('dirty');
    showActionToast(message);
  };

  const handleUndo = () => {
    const currentUndoStack = undoStackRef.current;
    if (currentUndoStack.length === 0) return;

    const currentTree = menuTreeRef.current;
    const previousTree = currentUndoStack[currentUndoStack.length - 1];
    const nextUndoStack = currentUndoStack.slice(0, -1);
    const nextRedoStack = [...redoStackRef.current, currentTree].slice(-HISTORY_LIMIT);
    const targetLog = createDetailedChangeLog(previousTree, currentTree);

    undoStackRef.current = nextUndoStack;
    redoStackRef.current = nextRedoStack;

    setUndoStack(nextUndoStack);
    setRedoStack(nextRedoStack);
    applyMenuTree(previousTree);
    appendChangeLogOnly(createUndoLog(targetLog));
    showActionToast('작업이 취소되었습니다.');
  };

  const handleRedo = () => {
    const currentRedoStack = redoStackRef.current;
    if (currentRedoStack.length === 0) return;

    const currentTree = menuTreeRef.current;
    const nextTree = currentRedoStack[currentRedoStack.length - 1];
    const nextRedoStack = currentRedoStack.slice(0, -1);
    const nextUndoStack = [...undoStackRef.current, currentTree].slice(-HISTORY_LIMIT);
    const targetLog = createDetailedChangeLog(currentTree, nextTree);

    undoStackRef.current = nextUndoStack;
    redoStackRef.current = nextRedoStack;

    setUndoStack(nextUndoStack);
    setRedoStack(nextRedoStack);
    applyMenuTree(nextTree);
    appendChangeLogOnly(createRedoLog(targetLog));
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
      if (code === ADMIN_CODE) {
        sessionStorage.setItem(STORAGE_KEYS.code, code);
        sessionStorage.setItem(STORAGE_KEYS.userName, '관리자');
        sessionStorage.setItem(STORAGE_KEYS.label, '관리자');
        sessionStorage.setItem(STORAGE_KEYS.role, 'admin');
        setAuthCode(code);
        setUserName('관리자');
        setAuthLabel('관리자');
        setIsAdminMode(true);
        setIsStarted(true);
        return;
      }

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
      sessionStorage.removeItem(STORAGE_KEYS.role);

      let draft = null;
      try {
        draft = await loadDraftByAuthCode(code);
      } catch (error) {
        console.error('[draft] login load failed:', error);
      }

      setAuthCode(code);
      setUserName(DEFAULT_USER_NAME);
      setAuthLabel(result.label || '');
      applyLoadedDraft(draft);
      updateGuideForDraft(code, draft);
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
      setIsDirty(true);
      setDraftStatus('dirty');
      if (!isGuideHidden(authCode)) {
        setGuideStep(1);
        setShowGuide(true);
      }
      showActionToast('초기 상태로 복원되었습니다.');
    }
  };

  const handleSubmit = () => {
    const { errors, warnings } = validateTree(menuTree);

    if (errors.length > 0) {
      setSubmitError(`제출할 수 없습니다. ${errors.join(' / ')}`);
      setSubmitStep('submitForm');
      if (showGuide && GUIDE_STEPS[guideStep]?.id === 'final-submit-entry') {
        markGuideStepComplete('final-submit-entry');
        setGuideStep(10);
      }
      return;
    }

    setSubmitError(warnings.length > 0 ? `확인할 안내가 있습니다. ${warnings.join(' / ')}` : '');
    setSubmitStep('submitForm');
    if (showGuide && GUIDE_STEPS[guideStep]?.id === 'final-submit-entry') {
      markGuideStepComplete('final-submit-entry');
      setGuideStep(10);
    }
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

      fetch(`/api/drafts?authCode=${encodeURIComponent(authCode)}`, {
        method: 'DELETE',
      }).catch((error) => {
        console.error('[draft] cleanup failed:', error);
      });

      changeLogRef.current = finalLog;
      setChangeLog(finalLog);
      setIsDirty(false);
      setDraftStatus('idle');
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
    sessionStorage.removeItem(STORAGE_KEYS.role);
    setIsStarted(false);
    setIsAdminMode(false);
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
    setIsDirty(false);
    setIsSavingDraft(false);
    setLastDraftSavedAt('');
    setDraftStatus('idle');
    setShowGuide(false);
    changeLogRef.current = [];
    undoStackRef.current = [];
    redoStackRef.current = [];
    submitIntentionRef.current = '';
    applyMenuTree(initialMenu);
  };

  const handleVisualMenuChange = (nextTree) => {
    commitMenuChange(nextTree, '화면에서 메뉴 구조가 변경되었습니다.');
  };

  const handleTypeChange = (type) => {
    setEditModeType(type);
    if (type === 'visual') {
      setIsPreviewOpen(true);
      if (showGuide && GUIDE_STEPS[guideStep]?.id === 'visual-mode') {
        markGuideStepComplete('visual-mode');
        setGuideStep(8);
      }
    }
  };

  const handleToggleEdit = () => {
    const nextValue = !isEditMode;
    setIsEditMode(nextValue);
    if (nextValue && showGuide) {
      setEditModeType('list');
      if (GUIDE_STEPS[guideStep]?.id === 'start-edit') {
        markGuideStepComplete('start-edit');
        setGuideStep(1);
      }
      return;
    }
    if (nextValue && editModeType === 'visual') {
      setIsPreviewOpen(true);
    }
  };

  const handleDontShowGuideAgain = () => {
    if (authCode) {
      localStorage.setItem(getHideGuideKey(authCode), 'true');
    }
    setShowGuide(false);
    setGuideStep(0);
  };

  const startFullGuide = () => {
    setCompletedGuideSteps(new Set());
    setGuideStep(0);
    setSubmitStep('edit');
    setIsPreviewOpen(false);
    setEditModeType('list');
    setIsEditMode(false);
    setShowGuide(true);
  };

  const closeGuide = () => {
    setShowGuide(false);
    setGuideStep(0);
  };

  const finishGuide = () => {
    setShowGuide(false);
    setGuideStep(0);
    setSubmitStep('edit');
    setIsPreviewOpen(false);
    setEditModeType('list');
    setIsEditMode(false);
  };

  const markGuideStepComplete = useCallback((stepId) => {
    setCompletedGuideSteps((prev) => {
      if (prev.has(stepId)) return prev;
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  }, []);

  const currentGuideStep = GUIDE_STEPS[guideStep];
  const isCurrentGuideStepComplete = !currentGuideStep?.requireAction || completedGuideSteps.has(currentGuideStep.id);
  const isSubmitGuideStep = currentGuideStep?.id === 'submit-intention' || currentGuideStep?.id === 'submit-actions';

  const prepareGuideStep = (step) => {
    if (!step) return;

    if (step.id === 'top-actions') {
      setIsPreviewOpen(false);
    }

    if (['edit-ui', 'top-actions', 'edit-tools', 'drag-handle', 'item-actions', 'menu-tooltip', 'visual-mode'].includes(step.id)) {
      setSubmitStep('edit');
      setIsPreviewOpen(false);
      setIsEditMode(true);
      setEditModeType('list');
    }

    if (step.id === 'final-submit-entry') {
      setSubmitStep('edit');
      setIsPreviewOpen(false);
      setEditModeType('list');
    }
  };

  const goToNextGuideStep = () => {
    if (!currentGuideStep) return;
    if (currentGuideStep.requireAction && !completedGuideSteps.has(currentGuideStep.id)) return;
    if (guideStep >= GUIDE_STEPS.length - 1) {
      finishGuide();
      return;
    }
    const nextStep = Math.min(GUIDE_STEPS.length - 1, guideStep + 1);
    prepareGuideStep(GUIDE_STEPS[nextStep]);
    setGuideStep(nextStep);
  };

  const goToPreviousGuideStep = () => {
    const previousStep = Math.max(0, guideStep - 1);
    prepareGuideStep(GUIDE_STEPS[previousStep]);
    setGuideStep(previousStep);
  };

  const draftStatusLabel = (() => {
    if (draftStatus === 'saving') return '저장 중...';
    if (draftStatus === 'error') return '저장 실패';
    if (isDirty) return '저장되지 않은 변경사항';
    if (lastDraftSavedAt) return `마지막 임시저장: ${formatDraftTime(lastDraftSavedAt)}`;
    return '임시저장 없음';
  })();

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
          인증코드는 테스터별 진행 데이터 임시저장 목적으로만 사용합니다.
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
          onSaveDraft={() => saveDraft({ silent: false })}
          isSavingDraft={isSavingDraft}
          draftStatusLabel={draftStatusLabel}
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
          showGuide={showGuide && isEditMode && editModeType === 'list'}
          onShowGuide={() => {
            startFullGuide();
          }}
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
      {showGuide && currentGuideStep && (
        <GuideOverlay
          step={currentGuideStep}
          stepIndex={guideStep}
          totalSteps={GUIDE_STEPS.length}
          isStepComplete={isCurrentGuideStepComplete}
          onActionComplete={markGuideStepComplete}
          onPrevious={goToPreviousGuideStep}
          onNext={goToNextGuideStep}
          onClose={closeGuide}
          onDontShowAgain={handleDontShowGuideAgain}
        />
      )}
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

          <div className="mt-6" data-guide-id="submit-intention" data-guide-target="submit-intention">
            <label className="block text-base font-black text-slate-800">
              메뉴 구성 의도가 어떻게 되나요?
            </label>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                ex) 학교 다니면서 수강과 연관되서 제가 많이 사용했던 메뉴들은 학사정보로 모았고 부가적인 학교 서비스는 대학생활로 모았습니다. 특히 나의메뉴는 정말 &apos;내 졸업을 위한 정보&apos;처럼 나와 직접 연관되는 메뉴들로 구성해봤어요.
            </p>
            <textarea
              value={submitIntention}
              onChange={(event) => {
                const nextValue = event.target.value;
                submitIntentionRef.current = nextValue;
                setSubmitIntention(nextValue);
                setIsDirty(true);
                setDraftStatus('dirty');
              }}
              placeholder="답변을 입력해주세요."
              className="mt-3 min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-[#004f91] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2" data-guide-id="submit-actions" data-guide-target="submit-actions">
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
      {showGuide && currentGuideStep && isSubmitGuideStep && (
        <GuideOverlay
          step={currentGuideStep}
          stepIndex={guideStep}
          totalSteps={GUIDE_STEPS.length}
          isStepComplete={isCurrentGuideStepComplete}
          onActionComplete={markGuideStepComplete}
          onPrevious={goToPreviousGuideStep}
          onNext={goToNextGuideStep}
          onClose={closeGuide}
          onDontShowAgain={handleDontShowGuideAgain}
        />
      )}
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
          ? isAdminMode
            ? <AdminDashboard onLogout={handleLogout} />
            : submitStep === 'submitForm'
              ? submitFormScreen
              : submitStep === 'submitted'
                ? submittedScreen
                : editorScreen
          : loginScreen
      ) : null}
    </div>
  );
}
