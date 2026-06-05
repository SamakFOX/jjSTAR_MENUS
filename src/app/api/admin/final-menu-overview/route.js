import { NextResponse } from 'next/server';
import { initialMenu } from '@/data/initialMenu';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ADMIN_CODE = 'JJ201562004';
const PATH_SEPARATOR = ' > ';

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
  return `path:${String(node?.title || '').trim()}::${pathTitles.join(PATH_SEPARATOR)}`;
};

const flattenMenuTree = (nodes, parentPath = []) => {
  const result = [];

  (nodes || []).forEach((node) => {
    const title = String(node?.title || '').trim();
    if (!title) return;

    const pathTitles = [...parentPath, title];
    const children = Array.isArray(node.children) ? node.children : [];

    result.push({
      key: getMenuKey(node, pathTitles),
      id: node.id || null,
      code: node.code || null,
      title,
      level: pathTitles.length,
      pathTitles,
      pathText: pathTitles.join(PATH_SEPARATOR),
      topCategoryTitle: pathTitles[0] || '',
      parentTitle: parentPath[parentPath.length - 1] || '',
      children,
    });

    result.push(...flattenMenuTree(children, pathTitles));
  });

  return result;
};

const createUserRef = (authCode, labelByCode) => ({
  authCode,
  label: labelByCode.get(authCode) || '',
});

const addUserOnce = (users, user) => {
  if (users.some((item) => item.authCode === user.authCode)) return;
  users.push(user);
};

const addPathHit = (paths, pathText, user) => {
  let pathHit = paths.find((item) => item.path === pathText);

  if (!pathHit) {
    pathHit = {
      path: pathText,
      count: 0,
      users: [],
    };
    paths.push(pathHit);
  }

  pathHit.count += 1;
  addUserOnce(pathHit.users, user);
};

const sortUsers = (users) => (
  [...users].sort((a, b) => a.authCode.localeCompare(b.authCode, 'ko-KR'))
);

const sortPathHits = (paths) => (
  [...paths]
    .map((item) => ({
      ...item,
      users: sortUsers(item.users),
    }))
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path, 'ko-KR'))
);

const simplifyChildren = (nodes = []) => (
  nodes
    .map((node) => ({
      title: String(node?.title || '').trim(),
      children: simplifyChildren(Array.isArray(node?.children) ? node.children : []),
    }))
    .filter((node) => node.title)
);

const getTreeSignature = (nodes = []) => (
  simplifyChildren(nodes)
    .map((node) => `${node.title}(${getTreeSignature(node.children)})`)
    .join('|')
);

const buildFinalMenuOverview = ({ submissionsByCode, draftsByCode, labelByCode }) => {
  const baseFlat = flattenMenuTree(initialMenu);
  const baseByKey = new Map(baseFlat.map((item) => [item.key, item]));
  const baseKeySet = new Set(baseByKey.keys());
  const movedMenusByKey = {};
  const deletedMenusByKey = {};
  const addedMenusByPath = {};

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

    const user = createUserRef(authCode, labelByCode);
    const userByKey = new Map(userFlat.map((item) => [item.key, item]));
    const userKeySet = new Set(userByKey.keys());

    baseFlat.forEach((baseItem) => {
      const userItem = userByKey.get(baseItem.key);

      if (!userItem) {
        if (!deletedMenusByKey[baseItem.key]) {
          deletedMenusByKey[baseItem.key] = {
            key: baseItem.key,
            title: baseItem.title,
            originalPath: baseItem.pathText,
            deletedCount: 0,
            users: [],
          };
        }

        deletedMenusByKey[baseItem.key].deletedCount += 1;
        addUserOnce(deletedMenusByKey[baseItem.key].users, user);
        return;
      }

      if (baseItem.pathText !== userItem.pathText) {
        if (!movedMenusByKey[baseItem.key]) {
          movedMenusByKey[baseItem.key] = {
            key: baseItem.key,
            title: baseItem.title,
            originalPath: baseItem.pathText,
            movedCount: 0,
            finalPaths: [],
            users: [],
          };
        }

        movedMenusByKey[baseItem.key].movedCount += 1;
        addUserOnce(movedMenusByKey[baseItem.key].users, user);
        addPathHit(movedMenusByKey[baseItem.key].finalPaths, userItem.pathText, user);
      }
    });

    const addedKeySet = new Set();

    userFlat.forEach((userItem) => {
      if (!baseKeySet.has(userItem.key)) {
        addedKeySet.add(userItem.key);
      }
    });

    userFlat.forEach((userItem) => {
      if (!addedKeySet.has(userItem.key)) return;

      const parentPathTitles = userItem.pathTitles.slice(0, -1);
      const parentPath = parentPathTitles.join(PATH_SEPARATOR) || '대분류 추가';
      const hasAddedAncestor = userItem.pathTitles
        .slice(0, -1)
        .some((_, index) => {
          const ancestorPath = userItem.pathTitles.slice(0, index + 1);
          const ancestorKey = userFlat.find((item) => item.pathText === ancestorPath.join(PATH_SEPARATOR))?.key;
          return ancestorKey && addedKeySet.has(ancestorKey);
        });

      if (hasAddedAncestor) return;

      if (!addedMenusByPath[parentPath]) {
        addedMenusByPath[parentPath] = [];
      }

      const treeSignature = getTreeSignature(userItem.children);
      const addedKey = `${userItem.title}::${treeSignature}`;
      let added = addedMenusByPath[parentPath].find((item) => item.addedKey === addedKey);

      if (!added) {
        added = {
          addedKey,
          title: userItem.title,
          addedCount: 0,
          addedPaths: [],
          users: [],
          children: simplifyChildren(userItem.children),
          childrenTitles: simplifyChildren(userItem.children).map((child) => child.title),
        };
        addedMenusByPath[parentPath].push(added);
      }

      added.addedCount += 1;
      addUserOnce(added.users, user);
      addPathHit(added.addedPaths, parentPath, user);
    });
  });

  Object.values(movedMenusByKey).forEach((item) => {
    item.users = sortUsers(item.users);
    item.finalPaths = sortPathHits(item.finalPaths);
  });

  Object.values(deletedMenusByKey).forEach((item) => {
    item.users = sortUsers(item.users);
  });

  Object.keys(addedMenusByPath).forEach((path) => {
    addedMenusByPath[path] = addedMenusByPath[path]
      .map((item) => ({
        ...item,
        users: sortUsers(item.users),
        addedPaths: sortPathHits(item.addedPaths),
      }))
      .sort((a, b) => b.addedCount - a.addedCount || a.title.localeCompare(b.title, 'ko-KR'));
  });

  return {
    summary: {
      analyzedUserCount,
      submittedCount,
      draftCount,
      movedMenuCount: Object.keys(movedMenusByKey).length,
      deletedMenuCount: Object.keys(deletedMenusByKey).length,
      addedMenuCount: Object.values(addedMenusByPath).reduce((sum, items) => sum + items.length, 0),
    },
    baseMenuTree: initialMenu,
    movedMenusByKey,
    deletedMenusByKey,
    addedMenusByPath,
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

    if (authResult.error) console.error('[admin] final menu auth code query error:', authResult.error);
    if (submissionResult.error) throw submissionResult.error;
    if (draftResult.error) throw draftResult.error;

    const labelByCode = new Map((authResult.data || []).map((item) => [item.code, item.label || '']));
    const submissionsByCode = getLatestByCode(submissionResult.data, 'code', 'submitted_at');
    const draftsByCode = getLatestByCode(draftResult.data, 'auth_code', 'updated_at');

    return NextResponse.json({
      ok: true,
      ...buildFinalMenuOverview({ submissionsByCode, draftsByCode, labelByCode }),
    });
  } catch (error) {
    console.error('[admin] final menu overview failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Could not load final menu overview.' },
      { status: 500 }
    );
  }
}
