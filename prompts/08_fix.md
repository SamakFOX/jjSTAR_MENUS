# 장바구니 drop-into 인식 오류 수정 요청

## 1. 현재 문제

왼쪽 장바구니 아이콘 위로 드래그해서 놓았는데도, 시스템이 장바구니 `drop-into` 영역이 아니라 메뉴 카드 `sort` 영역에 놓은 것으로 인식합니다.

그 결과 실제 의도는 다음과 같지만,

```txt
Level 2 메뉴를 Level 1의 장바구니 영역에 드롭
→ Level 2를 해당 Level 1 하위로 이동
````

현재는 아래 경고가 뜹니다.

```txt
Level 2 메뉴는 최상위(root)로 이동할 수 없습니다.
대분류 하위로 넣으려면 왼쪽 장바구니 아이콘으로 드래그하세요.
```

즉, 사용자는 장바구니 아이콘으로 드래그했는데도 시스템은 메뉴 카드 영역에 놓은 것으로 판단하고 있습니다.

---

## 2. 원인 추정

현재 DnD 충돌 판정이 `closestCenter` 또는 유사한 중심점 기준으로 동작하면서, 작은 장바구니 영역보다 큰 메뉴 카드 영역이 우선 잡히는 것으로 보입니다.

화면상으로는 장바구니 위에 올린 것처럼 보여도, 실제 `over.id`가 다음처럼 잡히는 상황입니다.

```txt
기대값:
drop-into:{targetMenuId}

실제값:
sort:{targetMenuId}
또는 메뉴 카드 영역 id
```

---

## 3. 수정 핵심

장바구니 영역과 메뉴 카드 정렬 영역을 DnD 레벨에서 완전히 분리해야 합니다.

```txt
장바구니 영역 = drop-into 전용
메뉴 카드 영역 = sort 전용
```

또한 포인터가 장바구니 droppable 박스 안에 있는 경우에는 항상 `drop-into:{menuId}`가 우선되어야 합니다.

---

## 4. drop-into와 sort ID 분리

장바구니 영역은 다음 ID를 사용합니다.

```txt
drop-into:{menuId}
```

메뉴 카드 정렬 영역은 다음 ID를 사용합니다.

```txt
sort:{menuId}
```

드래그 종료 시 `over.id`를 기준으로 반드시 분기합니다.

```js
function handleDragEnd(event) {
  const { active, over } = event;
  if (!over) return;

  const activeId = String(active.id);
  const overId = String(over.id);

  if (overId.startsWith('drop-into:')) {
    const targetId = overId.replace('drop-into:', '');
    handleDropInto(activeId, targetId);
    return;
  }

  if (overId.startsWith('sort:')) {
    const targetId = overId.replace('sort:', '');
    handleSort(activeId, targetId);
    return;
  }
}
```

---

## 5. 장바구니는 useDroppable, 메뉴 카드는 useSortable로 분리

장바구니 drop zone이 `SortableItem` 내부에 들어가면 안 됩니다.

### 권장 구조

```jsx
<div className="menu-row">
  <DropIntoZone id={`drop-into:${item.id}`} item={item} />
  <SortableMenuCard id={`sort:${item.id}`} item={item} />
</div>
```

### 금지 구조

```jsx
<SortableItem id={item.id}>
  <DropIntoZone />
  <MenuCard />
</SortableItem>
```

장바구니는 `useDroppable`, 메뉴 카드는 `useSortable`로 분리합니다.

---

## 6. collisionDetection 수정

현재 `closestCenter` 방식이면 작은 장바구니 영역보다 큰 메뉴 카드가 우선 잡힐 수 있습니다.

`pointerWithin`을 우선 사용하고, 포인터가 `drop-into:` 영역 안에 있으면 무조건 해당 `drop-into`를 over 대상으로 반환해야 합니다.

```js
import {
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core';

function customCollisionDetection(args) {
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    const dropIntoCollision = pointerCollisions.find(collision =>
      String(collision.id).startsWith('drop-into:')
    );

    if (dropIntoCollision) {
      return [dropIntoCollision];
    }

    return pointerCollisions;
  }

  return rectIntersection(args);
}
```

`DndContext`에 적용합니다.

```jsx
<DndContext collisionDetection={customCollisionDetection}>
```

핵심은 다음입니다.

```txt
포인터가 장바구니 droppable 영역 안에 있음
→ 항상 drop-into:{menuId} 우선
```

---

## 7. 장바구니 droppable 영역 크기

장바구니 아이콘은 작아도 실제 droppable 영역은 충분히 커야 합니다.

권장 크기:

```txt
실제 droppable 박스: 52px ~ 60px
아이콘 크기: 22px ~ 26px
```

예시 CSS:

```css
.drop-into-zone {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}
```

포인터가 살짝만 벗어나도 sort 영역으로 잡히지 않도록, 시각적 아이콘보다 실제 드롭 영역을 크게 잡아주세요.

---

## 8. 장바구니 hover 표시 분리

장바구니 위에 드래그 중일 때는 메뉴 카드가 아니라 장바구니 영역이 강조되어야 합니다.

### 정상 표시

```txt
장바구니 아이콘 강조
"학사정보 하위로 이동" 문구 표시
```

### 잘못된 표시

```txt
메뉴 카드 전체 강조
root 이동 경고 발생
```

메뉴 카드 sort 영역에 놓았을 때만 카드 사이 정렬 표시가 나와야 합니다.

---

## 9. 기대 동작

### 9.1 Level 2 → Level 1 장바구니

```txt
Level 2를 Level 1의 drop-into 영역에 놓음
→ 해당 Level 1의 children으로 이동
```

이 동작은 허용되어야 합니다.

---

### 9.2 Level 2 → Level 2 장바구니

```txt
Level 2를 Level 2의 drop-into 영역에 놓음
→ 통합 팝업 표시
```

통합 팝업 문구:

```txt
"{이동할 Level 2 이름}"은 Level 2 메뉴이므로 "{대상 Level 2 이름}"의 하위 메뉴가 될 수 없습니다.

대신 "{이동할 Level 2 이름}" 메뉴를 제거하고,
그 하위메뉴를 "{대상 Level 2 이름}"의 하위메뉴로 통합할 수 있습니다.

진행하시겠습니까?
```

버튼:

```txt
[통합하기] [취소]
```

---

### 9.3 Level 3 → Level 2 장바구니

```txt
Level 3을 Level 2의 drop-into 영역에 놓음
→ 해당 Level 2의 children으로 이동
```

이 동작은 허용되어야 합니다.

---

### 9.4 장바구니 외 영역

```txt
장바구니가 아닌 메뉴 카드 영역에 놓음
→ 순서 정렬만 처리
```

장바구니 외 영역에서 하위 이동이나 통합이 발생하면 안 됩니다.

---

## 10. 금지 조건

다음 구조는 여전히 금지해야 합니다.

```txt
Level 2 → root
Level 2 → Level 3 하위
Level 3 → root
Level 3 → Level 1 직접 하위
Level 3 → Level 3 하위
Level 1 → 다른 Level의 하위
```

단, 다음은 금지가 아니라 별도 처리입니다.

```txt
Level 2 → Level 2 drop-into
→ 통합 팝업
```

---

## 11. 레벨 보정 방식 금지

드롭 후 잘못된 level을 강제로 보정하지 마세요.

금지 예시:

```js
level: Math.max(1, Math.min(MAX_LEVEL, nextLevel))
```

이 방식은 잘못된 구조가 이미 만들어진 뒤 눈에 보이는 level만 보정하는 방식이라, 구조가 더 꼬일 수 있습니다.

대신 드롭 전 또는 드롭 처리 시 tree 기준으로 검증해야 합니다.

```txt
Level 2 이동 가능 부모: Level 1
Level 3 이동 가능 부모: Level 2
```

조건에 맞지 않으면 이동을 취소합니다.

---

## 12. 디버깅용 로그 추가 요청

문제 확인을 위해 드래그 종료 시 임시로 다음 로그를 출력해 주세요.

```js
console.log({
  activeId: active.id,
  overId: over?.id,
  mode: overId.startsWith('drop-into:')
    ? 'drop-into'
    : overId.startsWith('sort:')
      ? 'sort'
      : 'unknown'
});
```

정상적으로 장바구니 위에 놓았다면 반드시 다음처럼 나와야 합니다.

```txt
overId: drop-into:{targetMenuId}
mode: drop-into
```

---

## 13. 핵심 요약

```txt
1. 장바구니 영역은 drop-into 전용 droppable로 분리한다.
2. 메뉴 카드 영역은 sort 전용 sortable로 분리한다.
3. 장바구니는 SortableItem 내부에 넣지 않는다.
4. over.id는 drop-into:{id}와 sort:{id}로 명확히 구분한다.
5. collisionDetection은 pointerWithin을 우선 사용한다.
6. 포인터가 drop-into 영역 안에 있으면 항상 drop-into를 우선한다.
7. Level 2 → Level 1 drop-into는 허용되어야 한다.
8. 장바구니 외 영역은 순서정렬만 처리한다.
```

```
