const getItemCode = (item) => item?.code || item?.id || null;

const levelLabel = (level) => {
  if (level === 1) return '대분류';
  if (level === 2) return '중분류';
  if (level === 3) return '소분류';
  return `Level ${level}`;
};

const flattenForLog = (nodes, level = 1, parent = null, result = []) => {
  (nodes || []).forEach((node, index) => {
    result.push({
      id: node.id,
      code: getItemCode(node),
      title: node.title,
      level,
      parentId: parent?.id || null,
      parentTitle: parent?.title || null,
      index,
      childCount: node.children?.length || 0,
      node,
    });

    if (node.children?.length > 0) {
      flattenForLog(node.children, level + 1, node, result);
    }
  });

  return result;
};

const toMap = (items) => new Map(items.map((item) => [item.id, item]));

const buildMoveMessage = ({ item, fromParent, toParent, beforeItem, afterItem }) => {
  let positionText = '';

  if (!beforeItem && afterItem) {
    positionText = `"${toParent?.title || '최상위'}" 하위의 첫 번째 위치`;
  } else if (beforeItem) {
    positionText = `"${beforeItem.title}" 다음`;
  } else {
    positionText = `"${toParent?.title || '최상위'}" 하위의 마지막 위치`;
  }

  const parentText = fromParent?.id !== toParent?.id
    ? `"${fromParent?.title || '최상위'}" 하위에서 "${toParent?.title || '최상위'}" 하위의 `
    : '';

  return `"${item.title}" 메뉴가 ${parentText}${positionText}로 이동했습니다.`;
};

export function createDetailedChangeLog(previousTree, nextTree, fallbackMessage) {
  const createdAt = new Date().toISOString();
  const beforeFlat = flattenForLog(previousTree);
  const afterFlat = flattenForLog(nextTree);
  const beforeMap = toMap(beforeFlat);
  const afterMap = toMap(afterFlat);
  const beforeRoots = (previousTree || []).map((item) => item.id);
  const afterRoots = (nextTree || []).map((item) => item.id);
  const beforeRootSet = beforeRoots.slice().sort().join('|');
  const afterRootSet = afterRoots.slice().sort().join('|');

  if (
    beforeRootSet === afterRootSet &&
    beforeRoots.join('|') !== afterRoots.join('|')
  ) {
    const beforeOrderTitles = (previousTree || []).map((item) => item.title);
    const afterOrderTitles = (nextTree || []).map((item) => item.title);

    return {
      type: 'level1-order-change',
      message: `대분류 순서가 기존 [${beforeOrderTitles.join(' > ')}]에서 [${afterOrderTitles.join(' > ')}]로 변경되었습니다.`,
      beforeOrderCodes: (previousTree || []).map(getItemCode),
      afterOrderCodes: (nextTree || []).map(getItemCode),
      beforeOrderTitles,
      afterOrderTitles,
      createdAt,
    };
  }

  const added = afterFlat.filter((item) => !beforeMap.has(item.id));
  if (added.length === 1) {
    const item = added[0];
    return {
      type: 'add',
      message: `"${item.title}" 메뉴가 "${item.parentTitle || '최상위'}" 하위의 ${levelLabel(item.level)}로 추가되었습니다.`,
      itemTitle: item.title,
      itemCode: item.code,
      level: item.level,
      toParentTitle: item.parentTitle,
      toIndex: item.index,
      createdAt,
    };
  }

  const deleted = beforeFlat.filter((item) => !afterMap.has(item.id));
  if (deleted.length > 0) {
    const item = deleted[0];
    const childCount = Math.max(0, deleted.length - 1);
    return {
      type: 'delete',
      message: `"${item.title}" 메뉴가 삭제되었습니다.${childCount > 0 ? ` 하위 메뉴 ${childCount}개도 함께 삭제되었습니다.` : ''}`,
      itemTitle: item.title,
      itemCode: item.code,
      level: item.level,
      parentTitle: item.parentTitle,
      childCount,
      createdAt,
    };
  }

  const renamed = afterFlat.find((item) => {
    const before = beforeMap.get(item.id);
    return before && before.title !== item.title;
  });
  if (renamed) {
    const before = beforeMap.get(renamed.id);
    return {
      type: 'rename',
      message: `"${before.title}" 메뉴명이 "${renamed.title}"로 변경되었습니다.`,
      itemCode: renamed.code,
      beforeTitle: before.title,
      afterTitle: renamed.title,
      level: renamed.level,
      parentTitle: renamed.parentTitle,
      createdAt,
    };
  }

  const movedCandidates = afterFlat.filter((item) => {
    const before = beforeMap.get(item.id);
    return before && (
      before.parentId !== item.parentId ||
      before.index !== item.index ||
      before.level !== item.level
    );
  });
  const moved = movedCandidates.find((item) => fallbackMessage?.includes(item.title)) ||
    movedCandidates.find((item) => beforeMap.get(item.id)?.parentId !== item.parentId || beforeMap.get(item.id)?.level !== item.level) ||
    movedCandidates
      .slice()
      .sort((a, b) => Math.abs((beforeMap.get(b.id)?.index || 0) - b.index) - Math.abs((beforeMap.get(a.id)?.index || 0) - a.index))[0];

  if (moved) {
    const before = beforeMap.get(moved.id);
    const toSiblings = afterFlat
      .filter((item) => item.parentId === moved.parentId && item.level === moved.level)
      .sort((a, b) => a.index - b.index);
    const beforeItem = toSiblings[moved.index - 1] || null;
    const afterItem = toSiblings[moved.index + 1] || null;
    const fromParent = before.parentId ? beforeMap.get(before.parentId) : null;
    const toParent = moved.parentId ? afterMap.get(moved.parentId) : null;

    if (before.level !== moved.level) {
      return {
        type: 'level-change',
        message: `"${moved.title}" 메뉴가 ${levelLabel(before.level)}에서 ${levelLabel(moved.level)}로 변경되어 "${toParent?.title || '최상위'}" 하위로 이동했습니다.`,
        itemTitle: moved.title,
        itemCode: moved.code,
        fromLevel: before.level,
        toLevel: moved.level,
        fromParentTitle: before.parentTitle,
        toParentTitle: moved.parentTitle,
        fromIndex: before.index,
        toIndex: moved.index,
        createdAt,
      };
    }

    return {
      type: 'move',
      message: buildMoveMessage({
        item: moved,
        fromParent,
        toParent,
        beforeItem,
        afterItem,
      }),
      itemTitle: moved.title,
      itemCode: moved.code,
      level: moved.level,
      fromParentTitle: before.parentTitle,
      toParentTitle: moved.parentTitle,
      fromIndex: before.index,
      toIndex: moved.index,
      beforeTitle: beforeItem?.title || null,
      afterTitle: afterItem?.title || null,
      createdAt,
    };
  }

  return {
    type: 'edit',
    message: fallbackMessage || '메뉴 구성이 변경되었습니다.',
    createdAt,
  };
}
