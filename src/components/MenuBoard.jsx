'use client';

import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import { CheckCircle2, ListOrdered, PlusCircle, RotateCcw, Redo2 } from 'lucide-react';
import MenuItem from './MenuItem';
import {
  cloneTree,
  flattenTree,
  generateId,
} from '@/lib/menuUtils';

const MAX_LEVEL = 3;

const copy = {
  structureError: '구조 오류',
  changeCanceled: '변경사항이 취소되었습니다.',
  maxDepth: `최대 분류(${MAX_LEVEL})를 초과하는 메뉴가 있습니다.`,
  mergeConfirm: (title, target) => `"${title}" 메뉴를 "${target}" 메뉴로 통합하시겠습니까?`,
  merged: (title, target) => `"${title}" 메뉴가 "${target}"로 통합되었습니다.`,
  moveChildConfirm: (title, target) => `"${title}" 메뉴를 "${target}" 하위로 이동하시겠습니까?`,
  movedChild: (title, target) => `"${title}" 메뉴가 "${target}" 하위로 이동되었습니다.`,
  level1ChildBlocked: '대분류 메뉴는 다른 메뉴의 하위로 들어갈 수 없습니다.',
  level3PlacementBlocked: '소분류 메뉴는 중분류 하위에만 배치할 수 있습니다.',
  level3ChildBlocked: '소분류 메뉴는 하위 메뉴를 가질 수 없습니다.',
  rootMoveBlocked: (level) => `${level} 메뉴는 최상위로 이동할 수 없습니다. 대분류 하위로 넣으려면 왼쪽 장바구니 아이콘으로 드래그하세요.`,
  l1SortBlocked: "대분류 순서 변경은 '대분류 순서변경' 버튼을 클릭해야 가능합니다.",
  l1RootOnly: '대분류 메뉴는 최상위에만 존재해야 합니다.',
  sameGroupOnly: '행 영역 드래그는 같은 그룹 안의 순서 변경만 가능합니다.\n다른 그룹 하위로 이동하려면 왼쪽 장바구니 아이콘으로 드래그하세요.',
  sameLevelOnly: '행 영역 드래그는 같은 분류 수준에서 순서 변경이 가능합니다.',
  reordered: (title) => `"${title}" 순서가 변경되었습니다.`,
  level3HasChildren: (title) => `"${title}"에는 하위 메뉴가 있어 소분류로 변경할 수 없습니다.\n먼저 하위 메뉴를 이동하거나 삭제해주세요.`,
  changedLevel3: (title) => `"${title}" 메뉴가 소분류로 변경되었습니다.`,
  noLevel3Target: '이 메뉴를 소분류로 변경할 수 없습니다.\n같은 소분류 안에 이동할 대상 중분류가 없습니다.',
  changedLevel2: (title) => `"${title}" 메뉴가 중분류로 변경되었습니다.`,
  levelChangeBlocked: '현재 분류 수준에서는 더 이상 변경할 수 없습니다.',
  renamed: '메뉴 이름이 변경되었습니다.',
  deleted: (title) => `"${title}" 메뉴가 삭제되었습니다.`,
  deletePrompt: (title) => `"${title}" 메뉴에는 하위 메뉴가 있습니다.\n1. 모두 삭제\n2. 하위 메뉴만 다른 곳으로 이동 후 삭제\n(번호를 입력하세요)`,
  deletedWithChildren: (title) => `"${title}" 및 하위 메뉴가 삭제되었습니다.`,
  moveChildrenFirst: '하위 메뉴를 드래그해서 이동한 뒤 다시 삭제해주세요.',
  newRootTitle: '새 대분류 메뉴',
  newRootAdded: '새 대분류가 추가되었습니다.',
  newChildTitle: '새 하위 메뉴',
  newChildAdded: '새 하위 메뉴가 추가되었습니다.',
  l1SortDone: '대분류 순서 변경이 완료되었습니다.',
};

export default function MenuBoard({
  isEditMode,
  menuTree,
  setMenuTree,
  onCommitMenuChange,
  onUndo,
  onRedo,
  undoCount,
  redoCount,
  sidePanelContent,
  showGuide = false,
  guideStepId = '',
  onShowGuide,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [isL1ReorderMode, setIsL1ReorderMode] = useState(false);
  const [l1SortSnapshot, setL1SortSnapshot] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const level2DragExpandSnapshotRef = useRef(null);

  useEffect(() => {
    if (!isEditMode && isL1ReorderMode) {
      const timeout = setTimeout(() => {
        setIsL1ReorderMode(false);
        setL1SortSnapshot(null);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isEditMode, isL1ReorderMode]);

  useEffect(() => {
    if (menuTree.length > 0 && !isInitialized) {
      const ids = new Set();
      const traverse = (nodes) => {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            ids.add(node.id);
            traverse(node.children);
          }
        });
      };
      traverse(menuTree);
      const timeout = setTimeout(() => {
        setExpandedIds(ids);
        setIsInitialized(true);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [menuTree, isInitialized]);

  const findNode = (tree, id) => {
    for (const node of tree) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const removeNode = (tree, id) => {
    for (let i = 0; i < tree.length; i++) {
      if (tree[i].id === id) return tree.splice(i, 1)[0];
      if (tree[i].children) {
        const removed = removeNode(tree[i].children, id);
        if (removed) return removed;
      }
    }
    return null;
  };

  const findParent = (tree, id, parent = null) => {
    for (const node of tree) {
      if (node.id === id) return parent;
      if (node.children) {
        const found = findParent(node.children, id, node);
        if (found) return found;
      }
    }
    return null;
  };

  const checkTreeIntegrity = (nodes, level = 1) => {
    for (const node of nodes) {
      if (level > MAX_LEVEL) return copy.maxDepth;
      if (node.children?.length > 0) {
        const error = checkTreeIntegrity(node.children, level + 1);
        if (error) return error;
      }
    }
    return null;
  };

  const commitTree = (nextTree, message, previousTree = menuTree) => {
    const integrityError = checkTreeIntegrity(nextTree);
    if (integrityError) {
      alert(`[${copy.structureError}] ${integrityError}\n${copy.changeCanceled}`);
      return;
    }

    onCommitMenuChange(nextTree, message, previousTree);
  };

  const getChildrenByDroppableId = (tree, droppableId) => {
    if (droppableId === 'level-1-root') return tree;

    const level2ParentPrefix = 'level-2-parent-';
    const level3ParentPrefix = 'level-3-parent-';
    const parentId = droppableId.startsWith(level2ParentPrefix)
      ? droppableId.slice(level2ParentPrefix.length)
      : droppableId.startsWith(level3ParentPrefix)
        ? droppableId.slice(level3ParentPrefix.length)
        : null;

    if (!parentId) return null;
    const parent = findNode(tree, parentId);
    if (!parent) return null;

    parent.children = parent.children || [];
    return parent.children;
  };

  const getParentIdFromDroppableId = (droppableId) => {
    if (droppableId === 'level-1-root') return 'root';
    if (droppableId.startsWith('level-2-parent-')) return droppableId.slice('level-2-parent-'.length);
    if (droppableId.startsWith('level-3-parent-')) return droppableId.slice('level-3-parent-'.length);
    return null;
  };

  const handleListBeforeCapture = (result) => {
    const dragItem = flattenTree(menuTree).find((node) => node.id === result.draggableId);
    if (dragItem?.level !== 2) return;

    flushSync(() => {
      setExpandedIds((prev) => {
        level2DragExpandSnapshotRef.current = new Set(prev);
        const next = new Set();
        menuTree.forEach((level1Item) => {
          if (prev.has(level1Item.id)) next.add(level1Item.id);
        });
        return next;
      });
    });
  };

  const restoreLevel2DragExpansion = () => {
    if (!level2DragExpandSnapshotRef.current) return;

    setExpandedIds(level2DragExpandSnapshotRef.current);
    level2DragExpandSnapshotRef.current = null;
  };

  const handleListDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;

    try {
      if (showGuide && guideStepId === 'drag-handle') return;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      if (type === 'LEVEL_1' && !isL1ReorderMode) {
        alert(copy.l1SortBlocked);
        return;
      }

      const flatBefore = flattenTree(menuTree);
      const movingNodeInfo = flatBefore.find((node) => node.id === draggableId);
      if (!movingNodeInfo) return;

      const newTree = cloneTree(menuTree);
      const sourceList = getChildrenByDroppableId(newTree, source.droppableId);
      const destinationList = getChildrenByDroppableId(newTree, destination.droppableId);

      if (!sourceList || !destinationList) return;

      const [movingNode] = sourceList.splice(source.index, 1);
      if (!movingNode || movingNode.id !== draggableId) return;

      destinationList.splice(destination.index, 0, movingNode);

      const nextParentId = getParentIdFromDroppableId(destination.droppableId);
      const changedParent = nextParentId !== null && nextParentId !== (movingNodeInfo.parentId || 'root');

      if (changedParent && nextParentId !== 'root') {
        setExpandedIds((prev) => new Set([...prev, nextParentId]));
      }

      if (isL1ReorderMode) {
        setMenuTree(newTree);
        return;
      }

      commitTree(newTree, changedParent ? copy.movedChild(movingNode.title, findNode(menuTree, nextParentId)?.title || '') : copy.reordered(movingNode.title));
    } finally {
      restoreLevel2DragExpansion();
    }
  };

  const handleLevelChange = (id, delta) => {
    const newTree = cloneTree(menuTree);
    const node = findNode(newTree, id);
    const parent = findParent(newTree, id);
    const siblings = parent ? parent.children : newTree;
    const idx = siblings.findIndex((item) => item.id === id);
    const nodeInfo = flattenTree(menuTree).find((item) => item.id === id);
    if (!nodeInfo) return;

    if (nodeInfo.level === 2 && delta === 1) {
      if (node.children?.length > 0) {
        alert(copy.level3HasChildren(node.title));
        return;
      }

      let targetL2 = null;
      if (idx < siblings.length - 1) {
        targetL2 = siblings[idx + 1];
        removeNode(newTree, id);
        targetL2.children = [node, ...(targetL2.children || [])];
      } else if (idx > 0) {
        targetL2 = siblings[idx - 1];
        removeNode(newTree, id);
        targetL2.children = [...(targetL2.children || []), node];
      }

      if (targetL2) {
        commitTree(newTree, copy.changedLevel3(node.title));
        setExpandedIds((prev) => new Set([...prev, targetL2.id]));
      } else {
        alert(copy.noLevel3Target);
      }
      return;
    }

    if (nodeInfo.level === 3 && delta === -1) {
      const grandParent = findParent(newTree, parent.id);
      const gpSiblings = grandParent ? grandParent.children : newTree;
      const parentIndex = gpSiblings.findIndex((item) => item.id === parent.id);
      removeNode(newTree, id);
      gpSiblings.splice(parentIndex, 0, node);
      commitTree(newTree, copy.changedLevel2(node.title));
      return;
    }

    alert(copy.levelChangeBlocked);
  };

  const handleMoveOrder = (id, direction) => {
    const newTree = cloneTree(menuTree);
    const parent = findParent(newTree, id);
    const siblings = parent ? parent.children : newTree;
    const idx = siblings.findIndex((item) => item.id === id);

    if ((direction === -1 && idx > 0) || (direction === 1 && idx < siblings.length - 1)) {
      const moved = siblings.splice(idx, 1)[0];
      siblings.splice(idx + direction, 0, moved);
      commitTree(newTree, copy.reordered(moved.title));
    }
  };

  const handleRenameItem = (id, newTitle) => {
    const newTree = cloneTree(menuTree);
    const node = findNode(newTree, id);
    node.title = newTitle;
    commitTree(newTree, copy.renamed);
  };

  const handleDeleteItem = (id) => {
    const node = findNode(menuTree, id);
    if (!node.children || node.children.length === 0) {
      const newTree = cloneTree(menuTree);
      removeNode(newTree, id);
      commitTree(newTree, copy.deleted(node.title));
      return;
    }

    const mode = window.prompt(copy.deletePrompt(node.title), '1');

    if (mode === '1') {
      const newTree = cloneTree(menuTree);
      removeNode(newTree, id);
      commitTree(newTree, copy.deletedWithChildren(node.title));
    } else if (mode === '2') {
      alert(copy.moveChildrenFirst);
    }
  };

  const handleAddL1 = () => {
    const newTree = cloneTree(menuTree);
    newTree.push({ id: generateId(), title: copy.newRootTitle, children: [] });
    commitTree(newTree, copy.newRootAdded);
  };

  const handleAddItem = (parentId) => {
    const newTree = cloneTree(menuTree);
    const parent = findNode(newTree, parentId);
    parent.children = [...(parent.children || []), { id: generateId(), title: copy.newChildTitle, children: [] }];
    commitTree(newTree, copy.newChildAdded);
    setExpandedIds((prev) => new Set([...prev, parentId]));
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartL1Sort = () => {
    setL1SortSnapshot({ tree: cloneTree(menuTree), expanded: new Set(expandedIds) });
    setIsL1ReorderMode(true);
  };

  const handleFinishL1Sort = () => {
    commitTree(menuTree, copy.l1SortDone, l1SortSnapshot?.tree || menuTree);
    setIsL1ReorderMode(false);
    if (l1SortSnapshot) {
      setExpandedIds(l1SortSnapshot.expanded);
      setL1SortSnapshot(null);
    }
  };

  const handleCancelL1Sort = () => {
    if (l1SortSnapshot) {
      setMenuTree(l1SortSnapshot.tree);
      setExpandedIds(l1SortSnapshot.expanded);
      setL1SortSnapshot(null);
    }
    setIsL1ReorderMode(false);
  };

  const showL1Only = () => setExpandedIds(new Set());
  const showUpToL2 = () => {
    const ids = new Set();
    menuTree.forEach((node) => {
      if (node.children?.length > 0) ids.add(node.id);
    });
    setExpandedIds(ids);
  };
  const showAll = () => {
    const ids = new Set();
    const traverse = (nodes) => {
      nodes.forEach((node) => {
        if (node.children?.length > 0) {
          ids.add(node.id);
          traverse(node.children);
        }
      });
    };
    traverse(menuTree);
    setExpandedIds(ids);
  };

  const getItemMeta = (item, level, parentId = null) => ({
    ...item,
    level,
    parentId,
    hasChildren: item.children?.length > 0,
  });

  const shouldHighlightMenuItem = ['drag-handle', 'item-actions', 'menu-tooltip'].includes(guideStepId);
  const guideTargetId = showGuide && shouldHighlightMenuItem
    ? menuTree.find((level1Item) => level1Item.children?.length > 0)?.children?.[0]?.id
    : null;

  const renderMenuItem = (item, dragHandleProps, snapshot) => (
    <MenuItem
      item={item}
      isEditMode={isEditMode}
      hasChildren={item.hasChildren}
      isExpanded={expandedIds.has(item.id)}
      onToggleExpand={toggleExpand}
      onLevelChange={handleLevelChange}
      onMoveOrder={handleMoveOrder}
      onAddItem={handleAddItem}
      onDeleteItem={handleDeleteItem}
      onRenameItem={handleRenameItem}
      dragHandleProps={dragHandleProps}
      draggableSnapshot={snapshot}
      isGuideTarget={item.id === guideTargetId}
    />
  );

  const renderDraggableShell = (provided, className, children) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={className}
      style={provided.draggableProps.style}
    >
      {children}
    </div>
  );

  const renderLevel3List = (level2Item) => {
    const children = level2Item.children || [];
    const shouldShow = expandedIds.has(level2Item.id) || (isEditMode && children.length === 0);
    if (!shouldShow) return null;

    return (
      <Droppable droppableId={`level-3-parent-${level2Item.id}`} type="LEVEL_3">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${children.length === 0 ? 'min-h-3' : ''} ${
              snapshot.isDraggingOver ? 'rounded-xl bg-amber-50/70 py-1' : ''
            }`}
          >
            {children.map((level3Item, index) => {
              const item = getItemMeta(level3Item, 3, level2Item.id);
              return (
                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!isEditMode}>
                  {(provided, snapshot) => renderDraggableShell(
                    provided,
                    'space-y-2',
                    renderMenuItem(item, provided.dragHandleProps, snapshot)
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  const renderLevel2List = (level1Item) => {
    const children = level1Item.children || [];
    const shouldShow = !isL1ReorderMode && (expandedIds.has(level1Item.id) || (isEditMode && children.length === 0));
    if (!shouldShow) return null;

    return (
      <Droppable droppableId={`level-2-parent-${level1Item.id}`} type="LEVEL_2">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${children.length === 0 ? 'min-h-3' : ''} ${
              snapshot.isDraggingOver ? 'rounded-xl bg-blue-50/70 py-1' : ''
            }`}
          >
            {children.map((level2Item, index) => {
              const item = getItemMeta(level2Item, 2, level1Item.id);
              return (
                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!isEditMode}>
                  {(provided, snapshot) => renderDraggableShell(
                    provided,
                    'space-y-2',
                    <>
                      {renderMenuItem(item, provided.dragHandleProps, snapshot)}
                      {renderLevel3List(level2Item)}
                    </>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  const historyToolBox = (
    <div className="p-5 bg-white rounded-xl shadow-sm border border-slate-200 space-y-4" data-guide-id="right-edit-tools" data-guide-target="edit-tools">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <ListOrdered className="text-[#004f91]" size={18} />
        편집 도구
      </h3>

      {isEditMode && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddL1}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-bold text-xs"
            >
              <PlusCircle size={16} /> 대분류 추가
            </button>

            {isL1ReorderMode ? (
              <button
                onClick={handleFinishL1Sort}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#004f91] text-white rounded-lg hover:bg-blue-800 transition-all font-bold text-xs shadow-md"
              >
                <CheckCircle2 size={16} /> 순서변경 완료
              </button>
            ) : (
              <button
                onClick={handleStartL1Sort}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-bold text-xs"
              >
                <ListOrdered size={16} /> 대분류 순서변경
              </button>
            )}
          </div>

          {isL1ReorderMode && (
            <button
              onClick={handleCancelL1Sort}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all font-bold text-xs"
            >
              <RotateCcw size={16} /> 순서변경 취소
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onUndo}
              disabled={undoCount === 0}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all font-bold text-xs ${undoCount > 0
                  ? 'bg-slate-800 text-white hover:bg-black shadow-md active:scale-95'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
            >
              <RotateCcw size={16} /> 되돌리기 ({undoCount})
            </button>

            <button
              onClick={onRedo}
              disabled={redoCount === 0}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all font-bold text-xs ${redoCount > 0
                  ? 'bg-slate-800 text-white hover:bg-black shadow-md active:scale-95'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
            >
              <Redo2 size={16} /> 다시실행 ({redoCount})
            </button>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
        <button onClick={showL1Only} className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-[#004f91] hover:bg-white rounded transition-all">대분류만 보기</button>
        <button onClick={showUpToL2} className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-[#004f91] hover:bg-white rounded transition-all">중분류까지 보기</button>
        <button onClick={showAll} className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-[#004f91] hover:bg-white rounded transition-all">소분류까지 보기</button>
      </div>

      <p className="text-xs font-medium text-slate-500 leading-relaxed">
        최근 20회의 편집 이력을 되돌리거나 다시 실행할 수 있습니다.
      </p>
      {isEditMode && (
        <button
          type="button"
          onClick={onShowGuide}
          className="w-full rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-[#004f91] transition hover:bg-blue-100"
        >
          사용 방법 보기
        </button>
      )}
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_348px] gap-8 items-start">
      <section className="min-w-0">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] relative">
        {isL1ReorderMode && (
          <div className="absolute inset-0 bg-amber-50/10 z-10 pointer-events-none flex items-start justify-center pt-6">
            <div className="bg-amber-400 text-[#004f91] px-6 py-2 rounded-full font-black shadow-xl animate-bounce flex items-center gap-2 pointer-events-auto">
              <ListOrdered size={20} /> 대분류 순서 변경 중
            </div>
          </div>
        )}

        <div className="p-6">
          <DragDropContext
            onBeforeCapture={handleListBeforeCapture}
            onDragEnd={handleListDragEnd}
            onDragCancel={restoreLevel2DragExpansion}
          >
            <Droppable droppableId="level-1-root" type="LEVEL_1">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 ${snapshot.isDraggingOver ? 'rounded-xl bg-slate-50 py-1' : ''}`}
                >
                  {menuTree.map((level1Item, index) => {
                    const item = getItemMeta(level1Item, 1);
                    return (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={!isEditMode || !isL1ReorderMode}
                      >
                        {(provided, snapshot) => renderDraggableShell(
                          provided,
                          'space-y-2',
                          <>
                            {renderMenuItem(item, provided.dragHandleProps, snapshot)}
                            {renderLevel2List(level1Item)}
                          </>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
      </section>

      <aside className="space-y-6 lg:sticky lg:top-24 self-start">
        {historyToolBox}
        {sidePanelContent}
      </aside>
    </div>
  );
}
