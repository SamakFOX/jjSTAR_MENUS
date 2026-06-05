import { NextResponse } from 'next/server';
import { initialMenu } from '@/data/initialMenu';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ADMIN_CODE = 'JJ201562004';

const isAdminRequest = (request) => request.headers.get('x-admin-code') === ADMIN_CODE;

const getLatestByCode = (rows, codeKey, dateKey) => {
  const map = new Map();

  (rows || []).forEach((row) => {
    const code = row[codeKey];
    if (!code) return;

    const current = map.get(code);
    if (!current || new Date(row[dateKey] || 0) > new Date(current[dateKey] || 0)) {
      map.set(code, row);
    }
  });

  return map;
};

const normalizeMenuTree = (value) => (Array.isArray(value) ? value : null);

const getMenuKey = (node, pathTitles) => {
  if (node?.code) return `code:${node.code}`;
  if (node?.id) return `id:${node.id}`;
  return `path:${String(node?.title || '').trim()}::${pathTitles.join(' > ')}`;
};

const flattenMenuTree = (nodes, parentPath = []) => {
  const result = [];

  (nodes || []).forEach((node) => {
    const title = String(node?.title || '').trim();
    if (!title) return;

    const pathTitles = [...parentPath, title];
    const children = Array.isArray(node.children) ? node.children : [];

    result.push({
      id: node.id || null,
      code: node.code || null,
      title,
      level: pathTitles.length,
      pathTitles,
      path: pathTitles.join(' > '),
      topCategoryTitle: pathTitles[0] || '',
      parentTitle: parentPath[parentPath.length - 1] || '',
      children,
      key: getMenuKey(node, pathTitles),
    });

    result.push(...flattenMenuTree(children, pathTitles));
  });

  return result;
};

const increment = (map, key, create) => {
  if (!map.has(key)) map.set(key, create());
  return map.get(key);
};

const toSortedArray = (map, countKey) => (
  [...map.values()].sort((a, b) => b[countKey] - a[countKey] || a.menuTitle?.localeCompare(b.menuTitle || '', 'ko-KR') || 0)
);

const buildTrends = ({ submissionsByCode, draftsByCode, labelByCode }) => {
  const initialFlat = flattenMenuTree(initialMenu);
  const initialByKey = new Map(initialFlat.map((item) => [item.key, item]));
  const initialKeySet = new Set(initialByKey.keys());
  const movedMenus = new Map();
  const categoryMoves = new Map();
  const addedMenus = new Map();
  const deletedMenus = new Map();

  const codeSet = new Set([
    ...submissionsByCode.keys(),
    ...draftsByCode.keys(),
  ]);

  let analyzedUserCount = 0;
  let submittedCount = 0;
  let draftCount = 0;

  [...codeSet].forEach((authCode) => {
    const submission = submissionsByCode.get(authCode);
    const draft = draftsByCode.get(authCode);
    const source = submission ? 'submission' : 'draft';
    const record = submission || draft;
    const userMenu = normalizeMenuTree(record?.menu_data);

    if (!userMenu) return;

    const userFlat = flattenMenuTree(userMenu);
    if (userFlat.length === 0) return;

    analyzedUserCount += 1;
    if (source === 'submission') submittedCount += 1;
    if (source === 'draft') draftCount += 1;

    const userByKey = new Map(userFlat.map((item) => [item.key, item]));
    const userLabel = labelByCode.get(authCode) || '';
    const userRef = { authCode, label: userLabel };

    initialFlat.forEach((initialItem) => {
      const userItem = userByKey.get(initialItem.key);

      if (!userItem) {
        const deleted = increment(deletedMenus, initialItem.key, () => ({
          menuTitle: initialItem.title,
          menuCode: initialItem.code || initialItem.id || '',
          deleteCount: 0,
          originalPath: initialItem.path,
          deletedBy: [],
        }));

        deleted.deleteCount += 1;
        deleted.deletedBy.push(userRef);
        return;
      }

      if (initialItem.path !== userItem.path) {
        const moved = increment(movedMenus, initialItem.key, () => ({
          menuTitle: initialItem.title,
          menuCode: initialItem.code || initialItem.id || '',
          moveCount: 0,
          originalPath: initialItem.path,
          finalPathCounts: new Map(),
        }));

        moved.moveCount += 1;
        moved.finalPathCounts.set(userItem.path, (moved.finalPathCounts.get(userItem.path) || 0) + 1);

        if (initialItem.topCategoryTitle !== userItem.topCategoryTitle) {
          const targetKey = userItem.topCategoryTitle || '기타';
          const category = increment(categoryMoves, targetKey, () => ({
            targetTopCategoryTitle: targetKey,
            moveCount: 0,
          }));
          category.moveCount += 1;
        }
      }
    });

    userFlat.forEach((userItem) => {
      if (initialKeySet.has(userItem.key)) return;

      const childrenTitles = (userItem.children || [])
        .map((child) => String(child?.title || '').trim())
        .filter(Boolean);
      const addedKey = `${userItem.title}::${childrenTitles.join('|')}`;
      const added = increment(addedMenus, addedKey, () => ({
        menuTitle: userItem.title,
        menuId: userItem.id || userItem.code || '',
        addedCount: 0,
        addedPaths: new Set(),
        childrenTitles: new Set(),
        addedBy: [],
      }));

      added.addedCount += 1;
      added.addedPaths.add(userItem.parentTitle ? userItem.pathTitles.slice(0, -1).join(' > ') : '대분류 추가');
      childrenTitles.forEach((title) => added.childrenTitles.add(title));
      added.addedBy.push(userRef);
    });
  });

  const topMovedMenus = toSortedArray(movedMenus, 'moveCount')
    .slice(0, 10)
    .map((item) => {
      const mostCommonFinalPath = [...item.finalPathCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko-KR'))[0]?.[0] || '';

      return {
        menuTitle: item.menuTitle,
        menuCode: item.menuCode,
        moveCount: item.moveCount,
        originalPath: item.originalPath,
        mostCommonFinalPath,
      };
    });

  const topCategoryMoves = [...categoryMoves.values()]
    .sort((a, b) => b.moveCount - a.moveCount || a.targetTopCategoryTitle.localeCompare(b.targetTopCategoryTitle, 'ko-KR'));

  return {
    summary: {
      analyzedUserCount,
      submittedCount,
      draftCount,
    },
    topMovedMenus,
    topCategoryMoves,
    addedMenus: [...addedMenus.values()]
      .sort((a, b) => b.addedCount - a.addedCount || a.menuTitle.localeCompare(b.menuTitle, 'ko-KR'))
      .map((item) => ({
        menuTitle: item.menuTitle,
        menuId: item.menuId,
        addedCount: item.addedCount,
        addedPaths: [...item.addedPaths],
        childrenTitles: [...item.childrenTitles],
        addedBy: item.addedBy,
      })),
    deletedMenus: toSortedArray(deletedMenus, 'deleteCount').map((item) => ({
      menuTitle: item.menuTitle,
      menuCode: item.menuCode,
      deleteCount: item.deleteCount,
      originalPath: item.originalPath,
      deletedBy: item.deletedBy,
    })),
  };
};

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Forbidden.' }, { status: 403 });
  }

  try {
    const [authResult, submissionResult, draftResult] = await Promise.all([
      supabaseAdmin
        .from('auth_codes')
        .select('code, label')
        .like('code', 'JJST%'),
      supabaseAdmin
        .from('submissions')
        .select('code, menu_data, submitted_at')
        .order('submitted_at', { ascending: false }),
      supabaseAdmin
        .from('drafts')
        .select('auth_code, menu_data, updated_at')
        .order('updated_at', { ascending: false }),
    ]);

    if (authResult.error) console.error('[admin] trend auth code query error:', authResult.error);
    if (submissionResult.error) throw submissionResult.error;
    if (draftResult.error) throw draftResult.error;

    const labelByCode = new Map((authResult.data || []).map((item) => [item.code, item.label || '']));
    const submissionsByCode = getLatestByCode(submissionResult.data, 'code', 'submitted_at');
    const draftsByCode = getLatestByCode(draftResult.data, 'auth_code', 'updated_at');

    return NextResponse.json({
      ok: true,
      ...buildTrends({ submissionsByCode, draftsByCode, labelByCode }),
    });
  } catch (error) {
    console.error('[admin] trends failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Could not load trends.' },
      { status: 500 }
    );
  }
}
