'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ShoppingCart,
} from 'lucide-react';
import MenuDescTooltip from '@/components/MenuDescTooltip';

export default function MenuItem({
  item,
  isEditMode,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onLevelChange,
  onMoveOrder,
  onAddItem,
  onDeleteItem,
  onRenameItem,
  dragHandleProps,
  draggableSnapshot,
  isGuideTarget = false,
  forceShowDescTooltip = false,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(item.title);
  const isDragging = draggableSnapshot?.isDragging;
  const SHOW_MOVE_BUTTONS = false;

  const getLevelColor = (level) => {
    switch (level) {
      case 1:
        return 'bg-white border-slate-300 text-slate-800 font-bold shadow-sm ring-1 ring-slate-100';
      case 2:
        return 'bg-white border-slate-200 text-slate-700 shadow-sm';
      case 3:
        return 'bg-white border-slate-100 text-slate-600 shadow-sm';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const handleRenameSubmit = () => {
    if (tempName.trim()) {
      onRenameItem(item.id, tempName.trim());
      setIsEditingName(false);
    }
  };

  const isLevel1 = item.level === 1;
  const isLevel2 = item.level === 2;
  const isLevel3 = item.level === 3;

  return (
    <div className="flex items-center gap-2 group/row">
      {isEditMode && (
        <div
          className={`shrink-0 w-14 h-14 rounded-xl border-2 transition-all flex items-center justify-center relative ${
            isLevel3
              ? 'bg-slate-50 border-transparent text-slate-200 cursor-not-allowed'
              : 'bg-white border-slate-100 text-slate-300'
          }`}
          title={isLevel3 ? '하위 메뉴를 가질 수 없습니다' : '하위 메뉴 이동은 같은 레벨 목록으로 드래그하세요'}
        >
          {!isLevel3 && <ShoppingCart size={24} />}
        </div>
      )}

      <div
        className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${getLevelColor(item.level)} ${
          isDragging ? 'shadow-lg z-50 scale-[1.02] border-blue-400' : ''
        } ${isGuideTarget ? 'guide-drag-card relative z-[9015] outline-2 outline-offset-4 outline-[#004f91] shadow-[0_0_0_8px_rgba(0,79,145,0.12)]' : ''}`}
        data-guide-id={isGuideTarget ? 'list-menu-row' : undefined}
        data-guide-target={isGuideTarget ? 'list-menu-row' : undefined}
        style={{
          marginLeft: `${(item.level - 1) * 32}px`,
        }}
      >
        {isEditMode && (
          <>
            <button
              {...dragHandleProps}
              data-guide-id={isGuideTarget ? 'drag-handle' : undefined}
              data-guide-target={isGuideTarget ? 'list-drag-handle' : undefined}
              className={`p-1 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing text-slate-400 ${isGuideTarget ? 'guide-handle-focus text-[#004f91]' : ''}`}
              title="드래그"
              type="button"
            >
              <GripVertical size={18} />
            </button>
          </>
        )}

        <button
          onClick={() => onToggleExpand(item.id)}
          className={`p-1 rounded hover:bg-slate-100 transition-colors ${!hasChildren ? 'invisible' : ''}`}
          title={isExpanded ? '접기' : '펼치기'}
          type="button"
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="w-full px-2 py-1 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-400"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              />
              <button onClick={handleRenameSubmit} className="p-1 text-green-600 hover:bg-green-100 rounded-lg" title="확인" type="button">
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setTempName(item.title);
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded-lg"
                title="취소"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2"
              data-guide-id={isGuideTarget ? 'menu-title-with-desc' : undefined}
              data-guide-target={isGuideTarget ? 'menu-tooltip' : undefined}
            >
              <MenuDescTooltip desc={item.desc} disabled={isDragging} forceVisible={forceShowDescTooltip} className="flex-1">
                <span className={`${isLevel1 ? 'text-lg font-black text-slate-900' : 'text-sm font-semibold'} truncate`}>
                  {item.title}
                </span>
              </MenuDescTooltip>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                isLevel1 ? 'bg-blue-100 text-blue-700' :
                isLevel2 ? 'bg-green-100 text-green-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                L{item.level}
              </span>
            </div>
          )}
        </div>

        {isEditMode && (
          <div
            data-guide-id={isGuideTarget ? 'item-action-buttons' : undefined}
            data-guide-target={isGuideTarget ? 'item-actions' : undefined}
            className={`flex items-center gap-1 transition-opacity bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-sm ${isGuideTarget ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}
          >
            {SHOW_MOVE_BUTTONS && !isLevel1 && (
              <div className="flex border-r border-slate-200 pr-1 mr-1">
                <button onClick={() => onMoveOrder(item.id, -1)} className="p-1.5 hover:bg-white rounded text-slate-600" title="순서 정렬: 위" type="button">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => onMoveOrder(item.id, 1)} className="p-1.5 hover:bg-white rounded text-slate-600" title="순서 정렬: 아래" type="button">
                  <ArrowDown size={14} />
                </button>
              </div>
            )}

            {!isLevel1 && (
              <div className="flex border-r border-slate-200 pr-1 mr-1">
                <button
                  onClick={() => onLevelChange(item.id, -1)}
                  className={`p-1.5 hover:bg-white rounded text-slate-600 ${isLevel2 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="상위 분류로 올리기"
                  disabled={isLevel2}
                  type="button"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  onClick={() => onLevelChange(item.id, 1)}
                  className={`p-1.5 hover:bg-white rounded text-slate-600 ${isLevel3 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="하위 분류로 내리기"
                  disabled={isLevel3}
                  type="button"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <button onClick={() => setIsEditingName(true)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded" title="이름 변경" type="button">
              <Edit3 size={14} />
            </button>

            {!isLevel3 && (
              <button onClick={() => onAddItem(item.id)} className="p-1.5 hover:bg-green-100 text-green-600 rounded" title="하위 메뉴 추가" type="button">
                <Plus size={14} />
              </button>
            )}

            <button onClick={() => onDeleteItem(item.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded" title="삭제" type="button">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
