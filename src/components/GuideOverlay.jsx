'use client';

import React, { useEffect, useState } from 'react';
import { MousePointer2, X } from 'lucide-react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const findTarget = (target) => (
  document.querySelector(`[data-guide-id="${target}"]`) ||
  document.querySelector(`[data-guide-target="${target}"]`)
);

const getPlacement = (rect, cardWidth, cardHeight, preferredPlacement) => {
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
  const order = [
    preferredPlacement,
    'top',
    'bottom',
    'right',
    'left',
  ].filter(Boolean);
  const placements = [...new Set(order)].map((name) => ({ name, ...placementMap[name] }));

  return placements.find((placement) => placement.fits) || {
    name: 'bottom',
    left: clamp(rect.left + rect.width / 2 - cardWidth / 2, margin, viewportWidth - cardWidth - margin),
    top: clamp(rect.bottom + gap, margin, viewportHeight - cardHeight - margin),
  };
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
  const [cardStyle, setCardStyle] = useState({ left: 16, top: 16, width: 360 });

  useEffect(() => {
    if (!step) return undefined;

    let frameId = 0;

    const updatePosition = () => {
      const target = findTarget(step.target);
      const rect = target?.getBoundingClientRect();

      if (!rect) {
        setTargetRect(null);
        setCardStyle({
          left: clamp(window.innerWidth - 392, 16, Math.max(16, window.innerWidth - 336)),
          top: 92,
          width: Math.min(360, window.innerWidth - 32),
        });
        return;
      }

      if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        frameId = window.requestAnimationFrame(updatePosition);
        return;
      }

      const width = Math.min(380, window.innerWidth - 32);
      const height = step.details?.length ? 360 : 270;
      setTargetRect(rect);
      setCardStyle({ ...getPlacement(rect, width, height, step.placement), width });
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

    const target = findTarget(step.target);
    if (!target) return undefined;

    const complete = () => onActionComplete(step.id);

    if (step.completeOn === 'pointerdown') {
      target.addEventListener('pointerdown', complete);
      return () => target.removeEventListener('pointerdown', complete);
    }

    if (step.completeOn === 'hover') {
      target.addEventListener('mouseenter', complete);
      target.addEventListener('focusin', complete);
      return () => {
        target.removeEventListener('mouseenter', complete);
        target.removeEventListener('focusin', complete);
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

  if (!step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const nextDisabled = step.requireAction && !isStepComplete;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9000]">
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

      {targetRect && step.demo === 'drag-handle' && (
        <>
          <div
            className="guide-drop-placeholder fixed"
            style={{
              left: targetRect.left,
              top: targetRect.bottom + 14,
              width: Math.min(targetRect.width + 220, 520),
            }}
          />
          <div
            className="guide-pointer fixed"
            style={{
              left: targetRect.left + targetRect.width / 2 - 10,
              top: targetRect.top + targetRect.height / 2 - 10,
            }}
          >
            <MousePointer2 size={22} />
          </div>
        </>
      )}

      {targetRect && step.demo === 'tooltip' && (
        <>
          <div
            className="guide-pointer guide-pointer-hover fixed"
            style={{
              left: targetRect.left + Math.min(targetRect.width * 0.5, 120),
              top: targetRect.top + targetRect.height / 2 - 6,
            }}
          >
            <MousePointer2 size={22} />
          </div>
          <div
            className="guide-tooltip-demo fixed max-w-xs rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold leading-relaxed text-white shadow-2xl"
            style={{
              left: clamp(targetRect.left, 16, window.innerWidth - 280),
              top: targetRect.bottom + 12,
            }}
          >
            메뉴 위에 마우스를 올리면 기능 설명을 확인할 수 있습니다.
          </div>
        </>
      )}

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

        {step.details?.length > 0 && (
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
          <div className="mt-3 rounded-md border border-dashed border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-bold leading-relaxed text-[#004f91]">
            {!isStepComplete ? step.actionHint : step.doneHint}
          </div>
        )}

        <div className="guide-controls mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onDontShowAgain}
            className="rounded-md px-2 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
          >
            다시 보지 않기
          </button>
          <div className="flex items-center gap-2">
            {isFirst ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
              >
                건너뛰기
              </button>
            ) : (
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
    </div>
  );
}
