'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit3,
  MousePointer2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const findTarget = (target) => (
  document.querySelector(`[data-guide-id="${target}"]`) ||
  document.querySelector(`[data-guide-target="${target}"]`)
);

const isOverlapping = (rectA, rectB) => !(
  rectA.right < rectB.left ||
  rectA.left > rectB.right ||
  rectA.bottom < rectB.top ||
  rectA.top > rectB.bottom
);

const expandRect = (rect, amount) => ({
  left: rect.left - amount,
  top: rect.top - amount,
  right: rect.right + amount,
  bottom: rect.bottom + amount,
});

const getPointerPathRect = (rect, step) => {
  if (!rect || step.demo !== 'drag-handle') return null;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  if (step.id === 'visual-handle') {
    return {
      left: centerX - 12,
      top: centerY - 12,
      right: centerX + 72,
      bottom: centerY + 32,
    };
  }

  return {
    left: centerX - 12,
    top: centerY - 12,
    right: centerX + 28,
    bottom: centerY + 72,
  };
};

const getPlacement = (rect, cardWidth, cardHeight, placementOrder = [], avoidRects = []) => {
  const gap = 16;
  const margin = 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const placementMap = {
    top: {
      fits: rect.top - cardHeight - gap > 0,
      left: clamp(rect.left + rect.width / 2 - cardWidth / 2, margin, viewportWidth - cardWidth - margin),
      top: rect.top - cardHeight - gap,
    },
    bottom: {
      fits: rect.bottom + cardHeight + gap < viewportHeight,
      left: clamp(rect.left + rect.width / 2 - cardWidth / 2, margin, viewportWidth - cardWidth - margin),
      top: rect.bottom + gap,
    },
    right: {
      fits: rect.right + cardWidth + gap < viewportWidth,
      left: rect.right + gap,
      top: clamp(rect.top + rect.height / 2 - cardHeight / 2, margin, viewportHeight - cardHeight - margin),
    },
    left: {
      fits: rect.left - cardWidth - gap > 0,
      left: rect.left - cardWidth - gap,
      top: clamp(rect.top + rect.height / 2 - cardHeight / 2, margin, viewportHeight - cardHeight - margin),
    },
  };
  const order = placementOrder.length ? placementOrder : ['top', 'bottom', 'right', 'left'];
  const placements = [...new Set(order)].map((name) => ({ name, ...placementMap[name] }));
  const toRect = (placement) => ({
    left: placement.left,
    top: placement.top,
    right: placement.left + cardWidth,
    bottom: placement.top + cardHeight,
  });

  return placements.find((placement) => (
    placement.fits &&
    !avoidRects.some((avoidRect) => isOverlapping(toRect(placement), expandRect(avoidRect, 10)))
  )) || placements.find((placement) => placement.fits) || {
    name: 'bottom',
    left: clamp(rect.left + rect.width / 2 - cardWidth / 2, margin, viewportWidth - cardWidth - margin),
    top: clamp(rect.bottom + gap, margin, viewportHeight - cardHeight - margin),
  };
};

const getPlacementOrder = (step) => {
  if (step.id === 'drag-handle' || step.id === 'visual-handle' || step.id === 'menu-tooltip') {
    return ['right', 'left', 'top', 'bottom'];
  }

  return [
    step.placement,
    'top',
    'bottom',
    'right',
    'left',
  ].filter(Boolean);
};

export default function GuideOverlay({
  step,
  stepIndex,
  totalSteps,
  isStepComplete,
  onActionComplete,
  onPrevious,
  onNext,
  onClose,
  onDontShowAgain,
}) {
  const [targetRect, setTargetRect] = useState(null);
  const [pointerRect, setPointerRect] = useState(null);
  const [cardStyle, setCardStyle] = useState({ left: 16, top: 16, width: 360 });
  const [isTooltipDemoVisible, setIsTooltipDemoVisible] = useState(false);
  const [isTooltipTargetHovered, setIsTooltipTargetHovered] = useState(false);

  useEffect(() => {
    if (!step) return undefined;

    let frameId = 0;

    const updatePosition = () => {
      const target = findTarget(step.target);
      const pointerTarget = findTarget(step.pointerTarget || step.target);
      const popoverTarget = findTarget(step.popoverTarget || step.target);
      const rect = target?.getBoundingClientRect();
      const nextPointerRect = pointerTarget?.getBoundingClientRect();
      const nextPopoverRect = popoverTarget?.getBoundingClientRect() || rect;

      if (!rect || !nextPopoverRect) {
        setTargetRect(null);
        setPointerRect(null);
        setCardStyle({
          left: clamp(window.innerWidth - 392, 16, Math.max(16, window.innerWidth - 336)),
          top: 92,
          width: Math.min(360, window.innerWidth - 32),
        });
        return;
      }

      if (nextPopoverRect.top < 80 || nextPopoverRect.bottom > window.innerHeight - 80) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        frameId = window.requestAnimationFrame(updatePosition);
        return;
      }

      const width = Math.min(380, window.innerWidth - 32);
      const height = step.details?.length ? 360 : 270;
      const avoidRects = [
        rect,
        getPointerPathRect(nextPointerRect, step),
      ].filter(Boolean);
      setTargetRect(rect);
      setPointerRect(nextPointerRect || rect);
      setCardStyle({ ...getPlacement(nextPopoverRect, width, height, getPlacementOrder(step), avoidRects), width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [step]);

  useEffect(() => {
    if (!step?.completeOn) return undefined;

    const target = findTarget(step.actionTarget || step.target);
    if (!target) return undefined;

    const complete = () => onActionComplete(step.id);

    if (step.completeOn === 'pointerdown') {
      target.addEventListener('pointerdown', complete);
      return () => target.removeEventListener('pointerdown', complete);
    }

    if (step.completeOn === 'hover') {
      const handleEnter = () => {
        if (step.id === 'menu-tooltip') setIsTooltipTargetHovered(true);
        complete();
      };
      const handleLeave = () => {
        if (step.id === 'menu-tooltip') setIsTooltipTargetHovered(false);
      };

      target.addEventListener('mouseenter', handleEnter);
      target.addEventListener('focusin', handleEnter);
      target.addEventListener('mouseleave', handleLeave);
      target.addEventListener('focusout', handleLeave);
      return () => {
        target.removeEventListener('mouseenter', handleEnter);
        target.removeEventListener('focusin', handleEnter);
        target.removeEventListener('mouseleave', handleLeave);
        target.removeEventListener('focusout', handleLeave);
      };
    }

    if (step.completeOn === 'input') {
      target.addEventListener('input', complete);
      target.addEventListener('focusin', complete);
      return () => {
        target.removeEventListener('input', complete);
        target.removeEventListener('focusin', complete);
      };
    }

    return undefined;
  }, [onActionComplete, step]);

  useEffect(() => {
    const resetTimeout = window.setTimeout(() => {
      setIsTooltipDemoVisible(false);
      setIsTooltipTargetHovered(false);
    }, 0);

    if (step?.id !== 'menu-tooltip') {
      return () => window.clearTimeout(resetTimeout);
    }

    const showDemo = () => {
      setIsTooltipDemoVisible(true);
      window.setTimeout(() => setIsTooltipDemoVisible(false), 1900);
    };

    const startTimeout = window.setTimeout(showDemo, 650);
    const interval = window.setInterval(showDemo, 3600);

    return () => {
      window.clearTimeout(resetTimeout);
      window.clearTimeout(startTimeout);
      window.clearInterval(interval);
    };
  }, [step]);

  if (!step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const nextDisabled = step.requireAction && !isStepComplete && !step.allowNextWithoutComplete;
  const shouldHideGuidePopover = false;
  const shouldShowGuideTooltip =
    step.id === 'menu-tooltip' &&
    (isTooltipDemoVisible || isTooltipTargetHovered);
  const itemActionDetails = [
    { icon: ArrowLeft, label: '이전 이동', text: '현재 메뉴를 앞쪽으로 이동합니다.' },
    { icon: ArrowRight, label: '다음 이동', text: '현재 메뉴를 뒤쪽으로 이동합니다.' },
    { icon: Edit3, label: '이름 수정', text: '메뉴 이름을 변경합니다.' },
    { icon: Plus, label: '하위 메뉴 추가', text: '현재 메뉴 아래에 하위 메뉴를 추가합니다.' },
    { icon: Trash2, label: '삭제', text: '현재 메뉴를 삭제합니다.' },
  ];
  const completeMessageByStep = {
    'drag-handle': '핸들 조작을 확인했어요.',
    'item-actions': '편집 버튼 기능을 확인했어요.',
    'menu-tooltip': '메뉴 설명을 확인했어요.',
    'visual-handle': '비주얼모드 조작 방식을 확인했어요.',
  };
  const completeMessage = completeMessageByStep[step.id] || '확인 완료';

  return (
    <div className="pointer-events-none fixed inset-0 z-[9040]">
      <div className="guide-dim absolute inset-0 bg-slate-950/10" />

      {targetRect && (
        <div
          className="guide-highlight fixed rounded-lg"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {pointerRect && step.demo === 'drag-handle' && (
        <>
          <div
            className="guide-drop-placeholder fixed"
            style={{
              left: pointerRect.left,
              top: pointerRect.bottom + 14,
              width: Math.min(pointerRect.width + 220, 520),
            }}
          />
          <div
            className={`guide-pointer fixed ${step.id === 'visual-handle' ? 'guide-pointer-horizontal' : ''}`}
            style={{
              left: pointerRect.left + pointerRect.width / 2 - 10,
              top: pointerRect.top + pointerRect.height / 2 - 10,
            }}
          >
            <MousePointer2 size={22} />
          </div>
        </>
      )}

      {pointerRect && step.demo === 'tooltip' && shouldShowGuideTooltip && (
        <>
          <div
            className="guide-pointer guide-pointer-hover fixed"
            style={{
              left: pointerRect.left + Math.min(pointerRect.width * 0.5, 120),
              top: pointerRect.top + pointerRect.height / 2 - 6,
            }}
          >
            <MousePointer2 size={22} />
          </div>
        </>
      )}

      {!shouldHideGuidePopover && (
      <section
        className="guide-popover pointer-events-auto fixed rounded-lg border border-blue-100 bg-white p-4 shadow-2xl"
        style={cardStyle}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#004f91]">
            <MousePointer2 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-[#004f91]">
                  {stepIndex + 1} / {totalSteps}
                </p>
                <h2 className="mt-1 text-sm font-black text-slate-900">{step.title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="guide-controls rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="가이드 닫기"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
          </div>
        </div>

        {step.id === 'item-actions' ? (
          <div className="mt-3 space-y-1.5 rounded-md bg-slate-50 px-3 py-2 text-xs font-medium leading-relaxed text-slate-700">
            {itemActionDetails.map(({ icon: Icon, label, text }) => (
              <div key={label} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white text-[#004f91] shadow-sm ring-1 ring-slate-200">
                  <Icon size={13} />
                </span>
                <span>
                  <strong className="font-black text-slate-800">{label}:</strong> {text}
                </span>
              </div>
            ))}
          </div>
        ) : step.details?.length > 0 && (
          <ul className="mt-3 space-y-1.5 rounded-md bg-slate-50 px-3 py-2 text-xs font-bold leading-relaxed text-slate-700">
            {step.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}

        {step.note && (
          <div className="mt-3 rounded-md border border-dashed border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-bold leading-relaxed text-[#004f91]">
            {step.note}
          </div>
        )}

        {step.requireAction && (
          isStepComplete ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#004f91] px-3 py-2.5 text-xs font-black leading-relaxed text-white shadow-md shadow-blue-900/10">
              <span>{completeMessage}</span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 size={16} />
              </span>
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-dashed border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-bold leading-relaxed text-[#004f91]">
              {step.actionHint}
            </div>
          )
        )}

        <div className="guide-controls mt-4 flex items-center justify-between gap-2">
          {isFirst ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={onDontShowAgain}
              className="rounded-md px-2 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
            >
              다시 보지 않기
            </button>
          )}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrevious}
                className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="rounded-md bg-[#004f91] px-4 py-2 text-xs font-black text-white transition hover:bg-[#003d70] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLast ? '완료' : '다음'}
            </button>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
