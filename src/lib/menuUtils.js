/**
 * Flattens a nested tree structure into a flat array for rendering.
 * As per prompt 1.4, level and parentId are calculated during flattening.
 */
export function flattenTree(nodes, level = 1, parentId = null) {
  if (!nodes) return [];
  return nodes.flatMap((node) => [
    {
      ...node,
      level,
      parentId,
      hasChildren: node.children && node.children.length > 0
    },
    ...flattenTree(node.children, level + 1, node.id)
  ]);
}

/**
 * Legacy support or alias for flattenTree
 */
export const flattenMenu = (items) => {
  return flattenTree(items);
};

/**
 * Unflattens a flat array back into a nested structure based on levels and order.
 * Note: This is used for legacy compatibility if we ever have to process flat lists.
 */
export const unflattenMenu = (flatItems) => {
  const root = [];
  const stack = [{ level: 0, children: root }];

  flatItems.forEach((item) => {
    const newItem = { ...item, children: [] };
    // Remove transient properties if any
    delete newItem.level;
    delete newItem.parentId;
    delete newItem.hasChildren;

    while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    parent.children.push(newItem);
    stack.push(newItem);
  });

  return root;
};

/**
 * Deep clones a tree structure.
 */
export const cloneTree = (tree) => JSON.parse(JSON.stringify(tree));

/**
 * Generates a unique ID for new menu items.
 */
export const generateId = () => `menu-${Math.random().toString(36).substr(2, 9)}`;

export const getSortableDropPosition = ({ activeRect, overRect, axis = 'vertical' }) => {
  if (!activeRect || !overRect) return 'before';

  if (axis === 'horizontal') {
    const activeCenter = activeRect.left + activeRect.width / 2;
    const overCenter = overRect.left + overRect.width / 2;
    return activeCenter > overCenter ? 'after' : 'before';
  }

  const activeCenter = activeRect.top + activeRect.height / 2;
  const overCenter = overRect.top + overRect.height / 2;
  return activeCenter > overCenter ? 'after' : 'before';
};

export const getPointerCoordinates = (activatorEvent, delta = { x: 0, y: 0 }) => {
  const touch = activatorEvent?.touches?.[0] || activatorEvent?.changedTouches?.[0];
  const clientX = touch?.clientX ?? activatorEvent?.clientX;
  const clientY = touch?.clientY ?? activatorEvent?.clientY;

  if (typeof clientX !== 'number' || typeof clientY !== 'number') return null;

  return {
    x: clientX + (delta?.x || 0),
    y: clientY + (delta?.y || 0),
  };
};

export const getPointerDropPosition = ({ pointer, overRect, axis = 'vertical' }) => {
  if (!pointer || !overRect) return null;

  if (axis === 'horizontal') {
    return pointer.x < overRect.left + overRect.width / 2 ? 'before' : 'after';
  }

  return pointer.y < overRect.top + overRect.height / 2 ? 'before' : 'after';
};

export const getDropInsertIndex = (targetIndex, position) => {
  return position === 'after' ? targetIndex + 1 : targetIndex;
};

/**
 * Validates the entire tree structure based on strict rules.
 */
export const validateTree = (nodes, level = 1) => {
  const errors = [];
  const warnings = [];

  if (!nodes || nodes.length === 0) {
    errors.push("메뉴가 비어있습니다.");
    return { errors, warnings };
  }

  const seenTitles = new Set();

  nodes.forEach(node => {
    // 6. 빈 title 메뉴가 없는가
    if (!node.title || !node.title.trim()) {
      errors.push(`[L${level}] 제목이 비어있는 메뉴가 있습니다.`);
    }

    // 7. 중복 이름 경고 (같은 부모 안에서)
    if (seenTitles.has(node.title)) {
      warnings.push(`[L${level}] 같은 그룹 안에 동일한 메뉴명("${node.title}")이 있습니다.`);
    }
    seenTitles.add(node.title);

    // 4. Level 4 이상이 없는가
    if (level > 3) {
      errors.push(`[L${level}] 최대 레벨(3)을 초과하는 메뉴("${node.title}")가 있습니다.`);
    }

    if (node.children && node.children.length > 0) {
      const childResult = validateTree(node.children, level + 1);
      errors.push(...childResult.errors);
      warnings.push(...childResult.warnings);
    }
  });

  return { errors, warnings };
};
