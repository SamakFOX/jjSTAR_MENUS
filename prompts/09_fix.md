# 행 영역 순서정렬 오판 오류 수정 요청

## 1. 현재 문제

현재 Level 2 메뉴를 같은 Level 1 그룹 안에서 순서정렬하려고 했는데 다음 경고가 뜹니다.

```txt
행 영역 드래그는 같은 그룹 내 순서 변경만 가능합니다.
다른 그룹 하위로 이동하려면 왼쪽 장바구니 아이콘으로 드래그하세요.
````

하지만 실제 동작은 다른 그룹으로 이동하려는 것이 아니라, **같은 Level 1 내부의 Level 2끼리 순서를 바꾸는 동작**입니다.

예시:

```txt
대학생활 L1
  공동체 L2
  해외봉사 L2
  기타 학사 관리 L2
  수상내역 L2
  해외연수 L2
  학생증 L2
```

`해외연수 L2`를 `학생증 L2` 주변으로 드래그하는 것은 같은 `대학생활 L1` 안의 Level 2 순서정렬이므로 허용되어야 합니다.

---

## 2. 정상 규칙

장바구니가 아닌 일반 행 영역에 드롭하면 **순서정렬만** 처리합니다.

```txt
sort:{menuId}
→ 순서정렬 전용

drop-into:{menuId}
→ 하위 이동 / 통합 전용
```

행 영역에서는 부모 변경을 시도하지 않습니다.

---

## 3. Level 2 sort 규칙

Level 2 행 영역 정렬은 같은 Level 1 안에서만 허용합니다.

```txt
dragged.level === 2
target.level === 2
dragged.parentId === target.parentId
→ sort 허용
```

즉, 같은 Level 1의 `children` 배열 안에서만 순서 변경합니다.

---

## 4. Level 3 sort 규칙

Level 3 행 영역 정렬은 같은 Level 2 안에서만 허용합니다.

```txt
dragged.level === 3
target.level === 3
dragged.parentId === target.parentId
→ sort 허용
```

즉, 같은 Level 2의 `children` 배열 안에서만 순서 변경합니다.

---

## 5. 금지되는 sort

다음 경우만 행 영역 sort에서 금지합니다.

```txt
Level 2를 다른 Level 1의 Level 2 주변으로 정렬하려는 경우
→ parentId가 다르므로 금지

Level 3을 다른 Level 2의 Level 3 주변으로 정렬하려는 경우
→ parentId가 다르므로 금지

Level 2를 Level 3 행 영역에 정렬하려는 경우
→ level이 다르므로 금지

Level 3을 Level 2 행 영역에 정렬하려는 경우
→ level이 다르므로 금지
```

다른 그룹으로 이동하려면 반드시 왼쪽 장바구니 `drop-into`를 사용해야 합니다.

---

## 6. 수정 요청

현재 같은 Level 1 안의 Level 2끼리 정렬하는 경우에도 다른 그룹 이동으로 오판하고 있습니다.

정렬 가능 여부를 화면상 위치나 접힘 상태로 판단하지 말고, **tree 기준 parentId**로 판단해 주세요.

권장 조건:

```js
function canSortInRowArea(draggedNode, targetNode) {
  if (draggedNode.level !== targetNode.level) {
    return false;
  }

  if (draggedNode.parentId !== targetNode.parentId) {
    return false;
  }

  return true;
}
```

또는 tree 구조에서 실제 부모 node를 찾아 비교합니다.

```js
const draggedParent = findParentNode(menuTree, draggedNode.id);
const targetParent = findParentNode(menuTree, targetNode.id);

if (draggedParent?.id !== targetParent?.id) {
  return false;
}
```

---

## 7. 중요한 점

접힘/펼침 상태, 현재 화면에 보이는 리스트, 인덱스 위치로 부모를 추론하지 마세요.

반드시 원본 `menuTree` 기준으로 부모를 찾고 비교해야 합니다.

```txt
잘못된 방식:
visibleItems 기준 인덱스로 부모 추론

올바른 방식:
menuTree에서 draggedNode와 targetNode의 실제 parentId 비교
```

---

## 8. 기대 동작

같은 Level 1 내부의 Level 2끼리는 행 영역 드래그로 순서변경 가능해야 합니다.

예시:

```txt
대학생활 L1
  공동체 L2
  해외봉사 L2
  기타 학사 관리 L2
  수상내역 L2
  해외연수 L2
  학생증 L2
```

`해외연수 L2`를 `학생증 L2` 위나 아래로 드래그하면 원하는 위치로 순서정렬되어야 합니다.

이때 경고 팝업이 뜨면 안 됩니다.

---

## 9. 핵심 요약

```txt
행 영역 드래그 = 순서정렬
순서정렬 가능 여부 = 같은 level + 같은 parentId
장바구니 드래그 = 하위 이동/통합
```

따라서 `해외연수 L2`와 `학생증 L2`가 둘 다 `대학생활 L1`의 children이면 행 영역 드래그로 순서정렬이 가능해야 합니다.

```