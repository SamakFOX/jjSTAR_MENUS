'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { X, Search, Bell, Settings, User, Grid, Calendar, List, ChevronRight, LayoutGrid, Monitor, BookOpen, GraduationCap, Users, Heart, Award, HelpCircle, GripVertical } from 'lucide-react';
import profileJeyJey from '@/data/Profile_JeyJey.png';
import MenuDescTooltip from '@/components/MenuDescTooltip';
import { unflattenMenu, flattenMenu } from '@/lib/menuUtils';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const previewCopy = {
  schoolName: '전주대학교',
  searchPlaceholder: '검색어를 입력하세요',
  noSubMenus: '하위 메뉴가 없습니다.',
  editGuide: '카테고리 제목 옆의 핸들을 드래그하면 순서를 변경할 수 있습니다. 하위 메뉴들이 함께 이동합니다.',
  close: '닫기',
  profileName: '제이제이',
  department: '슈퍼스타학과',
  myMenu: '나의 메뉴',
  edit: '편집',
  menu: (index) => `메뉴 ${index + 1}`,
  oneStop: 'One-Stop 서비스',
  semester: '2026학년도 1학기',
  realtime: '실시간 데이터 연결됨',
  date: '05.13(수)',
  weekdays: ['일', '월', '화', '수', '목', '금', '토'],
  more: '더보기',
  strongTest: 'STRONG 검사',
  pending: '진행 예정',
  roadmap: '진로로드맵 완성도',
  notice: '공지사항',
  noticeText: '전주대학교 2026학년도 1학기 수강바구니 및 수강신청 안내',
  footer: '이 화면은 현재 메뉴 배치를 기준으로 생성된 미리보기입니다.',
};

const TAB_SWITCH_DELAY = 200;
const SAFE_TAB_INSET_X = 8;
const SAFE_TAB_INSET_Y = 4;

// ============================================================
// Visual Mode Validation Helpers
// List Mode 로직에 영향을 주지 않는 Visual Editor 전용 함수들
// ============================================================

/**
 * dragLevel 항목이 targetLevel 항목의 하위로 들어갈 수 있는지 검사.
 * Level 2 → Level 1, Level 3 → Level 2 만 허용.
 */
function getDragMode(dragInfo) {
  if (dragInfo?.level === 1) return 'LEVEL_1_SORT';
  if (dragInfo?.level === 2) return 'LEVEL_2_SORT';
  if (dragInfo?.level === 3) return 'LEVEL_3_SORT';
  return null;
}

function canVisualDropAsChild(dragInfo, targetInfo) {
  if (!dragInfo || !targetInfo) return false;
  if (dragInfo.level === 2) return targetInfo.level === 1;
  if (dragInfo.level === 3) return targetInfo.level === 2;
  return false;
}

/**
 * 같은 레벨 항목 사이 정렬을 허용.
 * Level 2/3은 다른 부모의 같은 레벨 목록으로도 이동할 수 있다.
 */
function canVisualReorder(dragInfo, targetInfo) {
  if (!dragInfo || !targetInfo) return false;
  return dragInfo.level === targetInfo.level;
}

function getVisualDropType(dragInfo, targetInfo) {
  const mode = getDragMode(dragInfo);
  if (!mode || !targetInfo || dragInfo.id === targetInfo.id) return null;

  if (mode === 'LEVEL_1_SORT') {
    return targetInfo.level === 1 ? 'reorder' : null;
  }

  if (mode === 'LEVEL_2_SORT') {
    if (canVisualReorder(dragInfo, targetInfo)) return 'reorder';
    if (canVisualDropAsChild(dragInfo, targetInfo)) return 'child';
    return null;
  }

  if (mode === 'LEVEL_3_SORT') {
    if (canVisualReorder(dragInfo, targetInfo)) return 'reorder';
    if (canVisualDropAsChild(dragInfo, targetInfo)) return 'child';
    return null;
  }

  return null;
}

/**
 * drop 이후 전체 트리 검증. Level 4 이상이 없는지, 각 레벨 부모 관계가 올바른지 확인.
 */
function validateVisualTree(nodes, level = 1) {
  for (const node of nodes) {
    if (level > 3) return false;
    if (node.children && node.children.length > 0) {
      if (!validateVisualTree(node.children, level + 1)) return false;
    }
  }
  return true;
}

/**
 * 트리에서 id → { id, level, parentId } 형태의 flat lookup map 생성.
 */
function buildFlatLookup(nodes, level = 1, parentId = null) {
  const result = {};
  nodes.forEach((node, index) => {
    result[node.id] = { id: node.id, title: node.title, level, parentId, index };
    if (node.children && node.children.length > 0) {
      Object.assign(result, buildFlatLookup(node.children, level + 1, node.id));
    }
  });
  return result;
}

/**
 * id로 노드를 찾아 반환.
 */
function findNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getChildrenListByParentId(tree, parentId) {
  if (!parentId) return tree;
  return findNodeById(tree, parentId)?.children || null;
}

function getListLengthByParentId(tree, parentId) {
  return getChildrenListByParentId(tree, parentId)?.length || 0;
}

function getDropInsertIndex(event, targetIndex) {
  const targetRect = event.over?.rect;
  const activeRect = event.active?.rect?.current?.translated || event.active?.rect?.current?.initial;

  if (!targetRect || !activeRect) return targetIndex;

  const activeCenterX = activeRect.left + activeRect.width / 2;
  const activeCenterY = activeRect.top + activeRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const useHorizontal = targetRect.width >= targetRect.height;
  const isAfter = useHorizontal
    ? activeCenterX >= targetCenterX
    : activeCenterY >= targetCenterY;

  return targetIndex + (isAfter ? 1 : 0);
}

function clampIndex(index, listLength) {
  return Math.max(0, Math.min(index, listLength));
}

function getPointerPosition(event) {
  const activatorEvent = event.activatorEvent;
  const delta = event.delta || { x: 0, y: 0 };

  if (
    activatorEvent &&
    typeof activatorEvent.clientX === 'number' &&
    typeof activatorEvent.clientY === 'number'
  ) {
    return {
      x: activatorEvent.clientX + delta.x,
      y: activatorEvent.clientY + delta.y,
    };
  }

  const translatedRect = event.active?.rect?.current?.translated;
  if (!translatedRect) return null;

  return {
    x: translatedRect.left + translatedRect.width / 2,
    y: translatedRect.top + translatedRect.height / 2,
  };
}

function isPointerInsideElement(pointer, element, insetX = 0, insetY = 0) {
  if (!pointer || !element) return false;
  const rect = element.getBoundingClientRect();

  return (
    pointer.x >= rect.left + insetX &&
    pointer.x <= rect.right - insetX &&
    pointer.y >= rect.top + insetY &&
    pointer.y <= rect.bottom - insetY
  );
}

function getInsertIndexFromElements(pointer, elements, axis = 'x') {
  if (!pointer) return 0;
  if (elements.length === 0) return 0;

  if (axis === 'flow') {
    const rows = [];

    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      let row = rows.find((item) => Math.abs(item.centerY - centerY) < Math.max(12, rect.height / 2));

      if (!row) {
        row = { centerY, items: [] };
        rows.push(row);
      }

      row.items.push({ index, rect });
      row.centerY = row.items.reduce((sum, item) => sum + item.rect.top + item.rect.height / 2, 0) / row.items.length;
    });

    rows.sort((a, b) => a.centerY - b.centerY);

    let selectedRow = rows[rows.length - 1];
    for (const row of rows) {
      if (pointer.y <= row.centerY) {
        selectedRow = row;
        break;
      }
    }

    selectedRow.items.sort((a, b) => a.rect.left - b.rect.left);

    for (const item of selectedRow.items) {
      if (pointer.x < item.rect.left + item.rect.width / 2) return item.index;
    }

    return selectedRow.items[selectedRow.items.length - 1].index + 1;
  }

  for (let i = 0; i < elements.length; i++) {
    const rect = elements[i].getBoundingClientRect();
    const center = axis === 'x'
      ? rect.left + rect.width / 2
      : rect.top + rect.height / 2;
    const pointerValue = axis === 'x' ? pointer.x : pointer.y;

    if (pointerValue < center) {
      return i;
    }
  }

  return elements.length;
}

function moveNodeToParentIndex(tree, itemId, targetParentId, targetIndex) {
  const nextTree = JSON.parse(JSON.stringify(tree));
  const sourceLookup = buildFlatLookup(nextTree);
  const sourceInfo = sourceLookup[itemId];
  const movingNode = removeNodeById(nextTree, itemId);

  if (!movingNode || !sourceInfo) return null;

  const targetList = getChildrenListByParentId(nextTree, targetParentId);
  if (!targetList) return null;

  const adjustedIndex = sourceInfo.parentId === targetParentId && sourceInfo.index < targetIndex
    ? targetIndex - 1
    : targetIndex;

  targetList.splice(clampIndex(adjustedIndex, targetList.length), 0, movingNode);
  return nextTree;
}

/**
 * id로 노드를 트리에서 제거하고 반환 (트리 직접 변경).
 */
function removeNodeById(nodes, id) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return nodes.splice(i, 1)[0];
    if (nodes[i].children) {
      const removed = removeNodeById(nodes[i].children, id);
      if (removed) return removed;
    }
  }
  return null;
}

// ============================================================
// Sub-components for DnD
// ============================================================

function SortableTab({ id, title, desc, isActive, onMouseEnter, isEditable, getDropValidity, isAnyDragging, registerTabRef }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const handleNodeRef = useCallback((node) => {
    setNodeRef(node);
    registerTabRef?.(id, node);
  }, [id, registerTabRef, setNodeRef]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const isValidDrop = isAnyDragging && isOver && getDropValidity(id) === 'valid' && false;

  return (
    <div
      ref={handleNodeRef}
      style={style}
      className={`relative group transition-all ${isValidDrop ? 'ring-2 ring-amber-400 ring-inset rounded' : ''}`}
    >
      <button
        onMouseEnter={onMouseEnter}
        className={`min-h-11 px-5 py-2 text-sm font-bold leading-none whitespace-nowrap transition-all border-b-4 flex items-center gap-2 ${
          isActive ? 'border-amber-400 bg-white/10' : 'border-transparent hover:bg-white/5'
        } ${isValidDrop ? 'bg-white/20' : ''}`}
      >
        {isEditable && (
          <div
            {...attributes}
            {...listeners}
            data-guide-target="visual-handle"
            className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60"
          >
            <GripVertical size={14} />
          </div>
        )}
        <MenuDescTooltip desc={desc} disabled>
          <span>{title}</span>
        </MenuDescTooltip>
      </button>
      {isEditable && isValidDrop && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-black px-1 rounded pointer-events-none bg-amber-400 text-[#004f91] opacity-100">
          이동
        </div>
      )}
    </div>
  );
}

function SortableItem({ id, title, desc, isEditable, getDropValidity, isAnyDragging, registerItemRef }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const isValidDrop = isAnyDragging && isOver && getDropValidity(id) === 'valid' && false;

  const handleNodeRef = useCallback((node) => {
    setNodeRef(node);
    registerItemRef?.(id, node);
  }, [id, registerItemRef, setNodeRef]);

  return (
    <li
      ref={handleNodeRef}
      style={style}
      className={`rounded transition-all ${isValidDrop ? 'bg-blue-50' : ''}`}
    >
      <button
        className={`text-sm flex items-center gap-1 group/item w-full text-left p-1 transition-colors ${
          isValidDrop
            ? 'text-[#0070c0] font-bold'
            : 'text-slate-500 hover:text-[#0070c0] hover:underline'
        }`}
      >
        {isEditable && (
          <div
            {...attributes}
            {...listeners}
            data-guide-id="visual-handle"
            data-guide-target="visual-handle"
            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-[#0070c0] p-0.5"
          >
            <GripVertical size={10} />
          </div>
        )}
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-200 group-hover/item:bg-[#0070c0]"></span>
        <MenuDescTooltip desc={desc} disabled={isAnyDragging} className="flex-1">
          <span className="block truncate">{title}</span>
        </MenuDescTooltip>
      </button>
    </li>
  );
}

function SortableCategory({
  id,
  title,
  desc,
  items,
  isEditable,
  getDropValidity,
  isAnyDragging,
  registerCategoryRef,
  registerLevel3TrackRef,
  registerLevel3ItemRef,
  guideStepId,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const isValidDrop = isAnyDragging && isOver && getDropValidity(id) === 'valid' && false;

  const handleNodeRef = useCallback((node) => {
    setNodeRef(node);
    registerCategoryRef?.(id, node);
  }, [id, registerCategoryRef, setNodeRef]);

  const handleLevel3TrackRef = useCallback((node) => {
    registerLevel3TrackRef?.(id, node);
  }, [id, registerLevel3TrackRef]);

  return (
    <div
      ref={handleNodeRef}
      style={style}
      data-guide-id={guideStepId === 'visual-handle' && id === 'L03REGI' ? 'visual-sample-l2-register' : undefined}
      className={`space-y-4 group p-3 rounded-xl transition-all ${
        isValidDrop ? 'bg-amber-50 ring-2 ring-amber-200 shadow-inner' : ''
      } ${guideStepId === 'visual-handle' && id === 'L03REGI' ? 'guide-drag-card relative z-[9015] bg-white shadow-[0_0_0_8px_rgba(0,79,145,0.12)] outline-2 outline-offset-4 outline-[#004f91]' : ''
      }`}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 relative">
        {isEditable && (
          <div
            {...attributes}
            {...listeners}
            data-guide-id={guideStepId === 'visual-handle' && id === 'L03REGI' ? 'visual-sample-l2-register-handle' : 'visual-handle'}
            data-guide-target="visual-handle"
            className={`cursor-grab active:cursor-grabbing text-slate-300 hover:text-[#004f91] ${guideStepId === 'visual-handle' && id === 'L03REGI' ? 'guide-handle-focus text-[#004f91]' : ''}`}
          >
            <GripVertical size={16} />
          </div>
        )}
        <MenuDescTooltip desc={desc} disabled={isAnyDragging} className="flex-1">
          <h3 className="font-bold truncate text-[#004f91]">{title}</h3>
        </MenuDescTooltip>
        {isEditable && isValidDrop && (
          <div className="absolute -top-4 left-0 text-[8px] font-black px-1 rounded bg-[#004f91] text-white opacity-100">
            이동
          </div>
        )}
      </div>
      <SortableContext items={(items || []).map(c => c.id)} strategy={verticalListSortingStrategy}>
        <ul ref={handleLevel3TrackRef} className="space-y-2 min-h-[20px]">
          {items?.map(item => (
            <SortableItem
              key={item.id}
              id={item.id}
              title={item.title}
              desc={item.desc}
              isEditable={isEditable}
              getDropValidity={getDropValidity}
              isAnyDragging={isAnyDragging}
              registerItemRef={registerLevel3ItemRef}
            />
          ))}
          {items?.length === 0 && isEditable && (
            <div className="text-[10px] text-slate-300 italic py-2">빈 메뉴</div>
          )}
        </ul>
      </SortableContext>
    </div>
  );
}

// ============================================================
// Main Modal
// ============================================================

export default function PreviewModal({ isOpen, onClose, items: menuTree, setItems: setMenuTree, isEditable, guideStepId = '' }) {
  const [activeTab, setActiveTab] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [visualDragState, setVisualDragState] = useState(null);
  const tabRefs = useRef(new Map());
  const level1TrackRef = useRef(null);
  const level2TrackRef = useRef(null);
  const level2ItemRefs = useRef(new Map());
  const level3TrackRefs = useRef(new Map());
  const level3ItemRefs = useRef(new Map());
  const level1SwitchTimerRef = useRef(null);
  const pendingLevel1SwitchRef = useRef(null);
  const pointerRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Build flat lookup map whenever menuTree changes
  const flatLookup = useMemo(() => buildFlatLookup(menuTree), [menuTree]);
  const previewTree = useMemo(() => {
    if (!visualDragState?.previewParentId && visualDragState?.previewParentId !== null) return menuTree;

    const nextTree = moveNodeToParentIndex(
      menuTree,
      visualDragState.activeId,
      visualDragState.previewParentId,
      visualDragState.previewIndex
    );

    return nextTree || menuTree;
  }, [menuTree, visualDragState]);
  const previewLookup = useMemo(() => buildFlatLookup(previewTree), [previewTree]);

  useEffect(() => {
    if (!isOpen || !isEditable || guideStepId !== 'visual-handle') return;

    const registrationParent = menuTree.find((level1Item) =>
      level1Item.children?.some((level2Item) => level2Item.id === 'L03REGI')
    );

    const timeout = window.setTimeout(() => {
      if (!registrationParent) return;
      setActiveTab(registrationParent.id);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [guideStepId, isEditable, isOpen, menuTree]);

  const cancelLevel1Switch = useCallback(() => {
    if (level1SwitchTimerRef.current) {
      clearTimeout(level1SwitchTimerRef.current);
      level1SwitchTimerRef.current = null;
    }
    pendingLevel1SwitchRef.current = null;
  }, []);

  const registerTabRef = useCallback((id, node) => {
    if (node) {
      tabRefs.current.set(id, node);
    } else {
      tabRefs.current.delete(id);
    }
  }, []);

  const registerLevel2ItemRef = useCallback((id, node) => {
    if (node) {
      level2ItemRefs.current.set(id, node);
    } else {
      level2ItemRefs.current.delete(id);
    }
  }, []);

  const registerLevel3TrackRef = useCallback((id, node) => {
    if (node) {
      level3TrackRefs.current.set(id, node);
    } else {
      level3TrackRefs.current.delete(id);
    }
  }, []);

  const registerLevel3ItemRef = useCallback((id, node) => {
    if (node) {
      level3ItemRefs.current.set(id, node);
    } else {
      level3ItemRefs.current.delete(id);
    }
  }, []);

  const getLevel1TabUnderPointer = useCallback((pointer) => {
    for (const [level1Id, element] of tabRefs.current.entries()) {
      if (isPointerInsideElement(pointer, element, SAFE_TAB_INSET_X, SAFE_TAB_INSET_Y)) {
        return level1Id;
      }
    }
    return null;
  }, []);

  const scheduleLevel1Switch = useCallback((targetLevel1Id) => {
    if (!targetLevel1Id || targetLevel1Id === activeTab) {
      cancelLevel1Switch();
      return;
    }

    if (pendingLevel1SwitchRef.current === targetLevel1Id) return;

    cancelLevel1Switch();
    pendingLevel1SwitchRef.current = targetLevel1Id;
    level1SwitchTimerRef.current = setTimeout(() => {
      setActiveTab(targetLevel1Id);
      setVisualDragState((prev) => {
        if (!prev) return prev;

        if (prev.dragMode === 'LEVEL_2_SORT') {
          return {
            ...prev,
            previewParentId: targetLevel1Id,
            previewIndex: getListLengthByParentId(menuTree, targetLevel1Id),
          };
        }

        if (prev.dragMode === 'LEVEL_3_SORT') {
          const firstLevel2 = menuTree.find((item) => item.id === targetLevel1Id)?.children?.[0];
          if (!firstLevel2) return prev;

          return {
            ...prev,
            previewParentId: firstLevel2.id,
            previewIndex: getListLengthByParentId(menuTree, firstLevel2.id),
          };
        }

        return {
          ...prev,
        };
      });
      level1SwitchTimerRef.current = null;
      pendingLevel1SwitchRef.current = null;
    }, TAB_SWITCH_DELAY);
  }, [activeTab, cancelLevel1Switch, menuTree]);

  const updatePreviewFromTrackPointer = useCallback((pointer) => {
    if (!pointer || !visualDragState) return false;

    let previewParentId = null;
    let previewIndex = 0;

    if (visualDragState.dragMode === 'LEVEL_1_SORT') {
      if (!isPointerInsideElement(pointer, level1TrackRef.current)) return false;
      const elements = previewTree
        .map((item) => tabRefs.current.get(item.id))
        .filter(Boolean);

      previewIndex = getInsertIndexFromElements(pointer, elements, 'x');
    } else if (visualDragState.dragMode === 'LEVEL_2_SORT') {
      if (!activeTab || !isPointerInsideElement(pointer, level2TrackRef.current)) return false;
      previewParentId = activeTab;

      const level2Items = previewTree.find((item) => item.id === activeTab)?.children || [];
      const elements = level2Items
        .map((item) => level2ItemRefs.current.get(item.id))
        .filter(Boolean);

      previewIndex = getInsertIndexFromElements(pointer, elements, 'flow');
      cancelLevel1Switch();
    } else if (visualDragState.dragMode === 'LEVEL_3_SORT') {
      let targetLevel2Id = null;

      for (const [level2Id, element] of level3TrackRefs.current.entries()) {
        if (isPointerInsideElement(pointer, element)) {
          targetLevel2Id = level2Id;
          break;
        }
      }

      if (!targetLevel2Id) {
        for (const [level2Id, element] of level2ItemRefs.current.entries()) {
          if (isPointerInsideElement(pointer, element)) {
            targetLevel2Id = level2Id;
            break;
          }
        }
      }

      if (!targetLevel2Id) return false;

      previewParentId = targetLevel2Id;
      const level3Items = findNodeById(previewTree, targetLevel2Id)?.children || [];
      const elements = level3Items
        .map((item) => level3ItemRefs.current.get(item.id))
        .filter(Boolean);

      previewIndex = getInsertIndexFromElements(pointer, elements, 'y');
      cancelLevel1Switch();
    } else {
      return false;
    }

    setVisualDragState((prev) => {
      if (!prev) return prev;
      if (prev.previewParentId === previewParentId && prev.previewIndex === previewIndex) return prev;
      return { ...prev, previewParentId, previewIndex };
    });

    return true;
  }, [activeTab, cancelLevel1Switch, previewTree, visualDragState]);

  useEffect(() => () => cancelLevel1Switch(), [cancelLevel1Switch]);

  useEffect(() => {
    if (!isOpen || !isEditable || activeTab) return undefined;
    const firstMenuWithChildren = menuTree.find((menu) => menu.children?.length > 0);
    if (!firstMenuWithChildren) return undefined;

    const timer = setTimeout(() => {
      setActiveTab(firstMenuWithChildren.id);
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab, isEditable, isOpen, menuTree]);

  /**
   * Visual Editor 전용 drop 유효성 계산.
   * List Mode에서는 이 함수를 사용하지 않음.
   */
  const getDropValidity = useCallback((targetId) => {
    if (!activeId || !isEditable) return null;
    const dragInfo = flatLookup[activeId];
    const targetInfo = previewLookup[targetId];
    return getVisualDropType(dragInfo, targetInfo) ? 'valid' : null;
  }, [activeId, flatLookup, isEditable, previewLookup]);

  const handleDragStart = (event) => {
    cancelLevel1Switch();
    const nextActiveId = String(event.active.id);
    const dragInfo = flatLookup[nextActiveId];
    const dragMode = getDragMode(dragInfo);

    setActiveId(nextActiveId);
    if (!dragInfo || !dragMode) {
      setVisualDragState(null);
      return;
    }

    setVisualDragState({
      activeId: nextActiveId,
      dragInfo,
      dragMode,
      sourceParentId: dragInfo.parentId,
      sourceIndex: dragInfo.index,
      previewParentId: dragInfo.parentId,
      previewIndex: dragInfo.index,
    });
  };

  const handleDragCancel = () => {
    cancelLevel1Switch();
    pointerRef.current = null;
    setActiveId(null);
    setVisualDragState(null);
  };

  const handleDragMove = useCallback((event) => {
    const pointer = getPointerPosition(event);
    pointerRef.current = pointer;

    if (updatePreviewFromTrackPointer(pointer)) {
      return;
    }

    if (
      visualDragState?.dragMode !== 'LEVEL_2_SORT' &&
      visualDragState?.dragMode !== 'LEVEL_3_SORT'
    ) {
      cancelLevel1Switch();
      return;
    }

    const targetLevel1Id = getLevel1TabUnderPointer(pointerRef.current);
    scheduleLevel1Switch(targetLevel1Id);
  }, [cancelLevel1Switch, getLevel1TabUnderPointer, scheduleLevel1Switch, updatePreviewFromTrackPointer, visualDragState]);

  const updateVisualPreview = useCallback((event) => {
    const pointer = getPointerPosition(event);
    if (updatePreviewFromTrackPointer(pointer)) {
      return;
    }

    const { over } = event;
    if (!over || !visualDragState) {
      if (
        visualDragState?.dragMode !== 'LEVEL_2_SORT' &&
        visualDragState?.dragMode !== 'LEVEL_3_SORT'
      ) {
        cancelLevel1Switch();
      }
      return;
    }

    const targetId = String(over.id);
    const targetInfo = previewLookup[targetId];
    if (!targetInfo || targetId === visualDragState.activeId) {
      if (
        visualDragState.dragMode !== 'LEVEL_2_SORT' &&
        visualDragState.dragMode !== 'LEVEL_3_SORT'
      ) {
        cancelLevel1Switch();
      }
      return;
    }

    let previewParentId = null;
    let previewIndex = 0;

    if (visualDragState.dragMode === 'LEVEL_1_SORT') {
      cancelLevel1Switch();
      if (targetInfo.level !== 1) return;
      previewParentId = null;
      previewIndex = getDropInsertIndex(event, targetInfo.index);
    } else if (visualDragState.dragMode === 'LEVEL_2_SORT') {
      if (targetInfo.level === 1) {
        return;
      } else if (targetInfo.level === 2) {
        cancelLevel1Switch();
        previewParentId = targetInfo.parentId;
        previewIndex = getDropInsertIndex(event, targetInfo.index);
      } else {
        cancelLevel1Switch();
        return;
      }
    } else if (visualDragState.dragMode === 'LEVEL_3_SORT') {
      if (targetInfo.level === 2) {
        cancelLevel1Switch();
        previewParentId = targetInfo.id;
        previewIndex = getListLengthByParentId(menuTree, targetInfo.id);
      } else if (targetInfo.level === 3) {
        cancelLevel1Switch();
        previewParentId = targetInfo.parentId;
        previewIndex = getDropInsertIndex(event, targetInfo.index);
      } else {
        return;
      }
    } else {
      cancelLevel1Switch();
      return;
    }

    setVisualDragState((prev) => {
      if (!prev) return prev;
      if (prev.previewParentId === previewParentId && prev.previewIndex === previewIndex) return prev;
      return { ...prev, previewParentId, previewIndex };
    });
  }, [cancelLevel1Switch, menuTree, previewLookup, updatePreviewFromTrackPointer, visualDragState]);

  const handleTabMouseEnter = useCallback((menuId) => {
    if (!activeId) {
      setActiveTab(menuId);
    }
  }, [activeId]);

  if (!isOpen) return null;

  const topLevelMenus = previewTree;

  /**
   * Visual Editor Mode 전용 drop 처리.
   * 유효하지 않은 drop은 상태 변경 전에 차단.
   * List Mode에서는 이 함수를 사용하지 않음.
   */
  const handleDragEnd = (event) => {
    const { active } = event;
    const dragState = visualDragState;
    cancelLevel1Switch();
    pointerRef.current = null;
    setActiveId(null);
    setVisualDragState(null);

    if (guideStepId === 'visual-handle') return;
    if (!dragState || String(active.id) !== dragState.activeId) return;

    const newTree = moveNodeToParentIndex(
      menuTree,
      dragState.activeId,
      dragState.previewParentId,
      dragState.previewIndex
    );

    if (!newTree) return;

    if (!validateVisualTree(newTree)) {
      console.warn('[Visual Mode] Tree validation failed after drop. Changes rolled back.');
      return;
    }

    setMenuTree(newTree);
  };
  const isAnyDragging = !!activeId;
  const activeDragItem = activeId ? findNodeById(menuTree, activeId) : null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={updateVisualPreview}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={`bg-[#f5f6fb] w-full h-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border-4 transition-colors ${isEditable ? 'border-amber-400 animate-pulse-border' : 'border-transparent'}`}>

          {/* Editor Badge */}
          {isEditable && (
            <div
              data-guide-target="visual-guide"
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-400 text-[#004f91] px-6 py-1 rounded-b-xl font-black text-sm z-[115] shadow-lg flex items-center gap-2"
            >
              <LayoutGrid size={16} />
              화면에서 편집
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[160] p-2 bg-white/80 hover:bg-white rounded-full shadow-lg text-slate-600 transition-all hover:scale-110"
          >
            <X size={24} />
          </button>

          {/* Top Header */}
          <header className="relative z-[120] bg-[#004f91] text-white">
            <div className="px-6 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#004f91] font-bold">JJ</div>
                  <span className="font-bold text-lg tracking-tight">{previewCopy.schoolName}</span>
                </div>
                <div className="relative hidden md:block">
                  <input
                    type="text"
                    placeholder={previewCopy.searchPlaceholder}
                    className="bg-white/10 border border-white/20 rounded-md py-1.5 pl-4 pr-10 text-sm w-80 focus:outline-none focus:bg-white/20 transition-all"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60" size={16} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Grid size={20} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><HelpCircle size={20} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Settings size={20} /></button>
                <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center overflow-hidden">
                  <Image src={profileJeyJey} alt="profile" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            {/* Navigation Tabs (L1) */}
            <nav
              ref={level1TrackRef}
              data-guide-id="visual-range"
              data-guide-target="visual-range"
              className="relative z-[130] min-h-11 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar bg-[#0070c0]"
            >
              <SortableContext items={topLevelMenus.map(m => m.id)} strategy={horizontalListSortingStrategy}>
                {topLevelMenus.map((menu) => (
                  <SortableTab
                    key={menu.id}
                    id={menu.id}
                    title={menu.title}
                    desc={menu.desc}
                    isActive={activeTab === menu.id}
                    onMouseEnter={() => handleTabMouseEnter(menu.id)}
                    isEditable={isEditable}
                    getDropValidity={getDropValidity}
                    isAnyDragging={isAnyDragging}
                    registerTabRef={registerTabRef}
                  />
                ))}
              </SortableContext>

              <div className="ml-auto flex items-center gap-4 pl-4 border-l border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="opacity-70">on</span>
                  <div className="w-8 h-4 bg-amber-400 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-full"><List size={18} /></button>
              </div>
            </nav>
          </header>

          {/* Mega Menu Overlay (L2 & L3) */}
          {activeTab && (
            <div
              className={`absolute top-[104px] left-0 right-0 bg-white shadow-2xl border-b border-slate-200 z-[90] animate-in fade-in slide-in-from-top-2 duration-200 ${isEditable ? 'ring-4 ring-amber-400/20' : ''}`}
              onMouseLeave={() => !isEditable && setActiveTab(null)}
            >
              <div className="max-w-7xl mx-auto px-10 py-10">
                <SortableContext
                  items={(topLevelMenus.find(m => m.id === activeTab)?.children || []).map(c => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div ref={level2TrackRef} className={`grid grid-cols-5 gap-8 ${isAnyDragging ? 'p-2 -m-2' : ''}`}>
                    {topLevelMenus.find(m => m.id === activeTab)?.children?.map(category => (
                      <SortableCategory
                        key={category.id}
                        id={category.id}
                        title={category.title}
                        desc={category.desc}
                        items={category.children}
                        isEditable={isEditable}
                        getDropValidity={getDropValidity}
                        isAnyDragging={isAnyDragging}
                        registerCategoryRef={registerLevel2ItemRef}
                        registerLevel3TrackRef={registerLevel3TrackRef}
                        registerLevel3ItemRef={registerLevel3ItemRef}
                        guideStepId={guideStepId}
                      />
                    ))}
                  </div>
                </SortableContext>

                {(!topLevelMenus.find(m => m.id === activeTab)?.children || topLevelMenus.find(m => m.id === activeTab)?.children.length === 0) && (
                  <div className="py-10 text-center text-slate-400 italic">
                    {previewCopy.noSubMenus}
                  </div>
                )}
              </div>

              {isEditable && (
                <div
                  data-guide-target="visual-range"
                  className="bg-amber-50 px-10 py-2 text-[10px] font-bold text-amber-700 flex justify-between items-center"
                >
                  <span>{previewCopy.editGuide}</span>
                  <button onClick={() => setActiveTab(null)} className="hover:underline">{previewCopy.close}</button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-[#004f91] text-white flex flex-col p-6 space-y-8 overflow-y-auto">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    <Image src={profileJeyJey} alt="profile" className="h-full w-full object-cover" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{previewCopy.profileName}</h2>
                  <p className="text-sm text-blue-200">{previewCopy.department}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><Settings size={16} /></button>
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><Monitor size={16} /></button>
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><User size={16} /></button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-bold text-sm">{previewCopy.myMenu}</h3>
                  <button className="text-[10px] bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">{previewCopy.edit}</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(11)].map((_, i) => (
                    <div key={i} className="aspect-square bg-white rounded-lg flex flex-col items-center justify-center p-1 text-center shadow-sm">
                      <div className="w-6 h-6 text-slate-400 mb-1">
                        {i % 4 === 0 ? <Calendar size={18} /> : i % 4 === 1 ? <BookOpen size={18} /> : i % 4 === 2 ? <GraduationCap size={18} /> : <Users size={18} />}
                      </div>
                      <span className="text-[10px] text-slate-600 font-medium leading-tight">{previewCopy.menu(i)}</span>
                    </div>
                  ))}
                  <div className="aspect-square border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 cursor-pointer transition-all">
                    <X size={20} className="rotate-45" />
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 bg-[#f5f6fb] overflow-y-auto p-8">
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-[#1a3a5f] rounded-lg p-4 flex items-center justify-between text-white shadow-md">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold border-r border-white/20 pr-4">{previewCopy.oneStop}</h2>
                    <span className="text-sm opacity-80">{previewCopy.semester}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">{previewCopy.realtime}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={18} className="text-amber-500" />
                        SCHEDULE
                      </h3>
                      <span className="text-xs text-slate-400">{previewCopy.date}</span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col items-center justify-center space-y-4">
                      <div className="text-4xl font-black text-slate-200">2026.05</div>
                      <div className="grid grid-cols-7 gap-2 w-full max-w-sm text-center">
                        {previewCopy.weekdays.map(d => <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>)}
                        {[...Array(31)].map((_, i) => (
                          <div key={i} className={`text-xs py-2 rounded-md ${i + 1 === 13 ? 'bg-[#004f91] text-white font-bold' : 'text-slate-600'}`}>
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <h3 className="font-bold text-slate-800">MY VALUE</h3>
                      <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center">{previewCopy.more}<ChevronRight size={12} /></button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">MBTI</span>
                        <span className="text-sm font-black text-[#004f91]">ENTJ</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">{previewCopy.strongTest}</span>
                        <span className="text-sm text-slate-400">{previewCopy.pending}</span>
                      </div>
                      <div className="pt-4 space-y-2">
                        <p className="text-xs text-slate-400">{previewCopy.roadmap}</p>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-amber-400"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell size={18} className="text-[#004f91]" />
                    <h3 className="font-bold text-slate-800">{previewCopy.notice}</h3>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                        <span className="text-slate-600 truncate mr-4">{previewCopy.noticeText}</span>
                        <span className="text-slate-400 text-xs shrink-0">2026-05-13</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* Footer info */}
          <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Monitor size={10} /> 데스크톱 모드</span>
              <span className="flex items-center gap-1 opacity-60">미리보기 버전 1.0</span>
            </div>
            <p className="font-medium">{previewCopy.footer}</p>
          </div>
        </div>
        <DragOverlay zIndex={200}>
          {activeDragItem ? (
            <div className="rounded-xl bg-white px-4 py-3 shadow-2xl ring-2 ring-[#004f91] border border-slate-200 scale-105">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <GripVertical size={16} className="text-slate-400" />
                <span>{activeDragItem.title}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
