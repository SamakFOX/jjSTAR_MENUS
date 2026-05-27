# Visual Editor Mode 전용 드래그/드롭 레벨 제한 수정 요청

## 중요 전제

현재 **List Mode는 정상 동작하고 있으므로 절대 수정하지 마세요.**

이번 수정 범위는 **Visual Editor Mode 전용**입니다.

아래 항목은 변경하지 않습니다.

- List Mode drag/drop 로직
- List Mode reorder 로직
- List Mode 상태 업데이트 함수
- List Mode 검증 로직
- List Mode에서 이미 정상 동작 중인 제한사항

Visual Editor Mode에서만 발생하는 문제이므로,  
Visual Editor Mode의 drop target 판정, hover 판정, move-as-child 판정만 수정해주세요.

가능하면 기존 List Mode 로직은 참고만 하고,  
공통 함수를 직접 수정하지 말고 **Visual Mode 전용 wrapper 또는 guard 함수**를 만들어 적용해주세요.

---

# 현재 문제

Visual Editor Mode에서 메뉴 항목을 드래그할 때,  
상위 레벨 또는 동일 레벨 항목이 다른 항목의 하위로 들어가면서 메뉴 구조가 깨지고 있습니다.

예시:

- Level 1 메뉴가 다른 메뉴의 하위로 들어감
- Level 2 메뉴가 다른 Level 2 메뉴의 하위로 들어감
- Level 2 메뉴가 Level 3 메뉴 아래로 들어감
- Level 3 메뉴가 다른 Level 3 메뉴의 하위로 들어감
- 결과적으로 존재하면 안 되는 Level 4 구조가 생성됨

현재는 드래그 위치 계산 또는 drop target 판정이 느슨해서  
“순서 변경”이어야 할 동작이 “하위 삽입”으로 잘못 처리되는 문제가 있습니다.

---

# 1차 수정 목표

이번 단계에서는 기능 확장보다 안정성이 우선입니다.

먼저 **상위 레벨 또는 동일 레벨이 하위로 들어가는 상황을 완전히 차단**해주세요.

즉, 잘못된 drop 자체가 실행되지 않아야 합니다.

---

# 메뉴 레벨 규칙

메뉴 레벨은 1, 2, 3까지만 존재합니다.

| 항목 레벨 | 허용되는 부모 |
|---|---|
| Level 1 | 부모 없음 |
| Level 2 | Level 1 아래만 가능 |
| Level 3 | Level 2 아래만 가능 |

---

# 절대 금지 규칙

## Level 1

Level 1은 어떤 항목의 하위로도 들어갈 수 없습니다.

허용:

```txt
Level 1 ↔ Level 1 순서 변경
````

금지:

```txt
Level 1 → Level 2 하위 이동 금지
Level 1 → Level 3 하위 이동 금지
Level 1 → 어떤 항목의 하위 이동도 금지
```

---

## Level 2

Level 2는 Level 1 아래에만 위치할 수 있습니다.

허용:

```txt
Level 2 ↔ Level 2 순서 변경
Level 2 → 다른 Level 1 아래로 이동
```

금지:

```txt
Level 2 → Level 2 하위 삽입 금지
Level 2 → Level 3 하위 삽입 금지
Level 2 → Level 1보다 위로 이동 금지
```

---

## Level 3

Level 3은 Level 2 아래에만 위치할 수 있습니다.

허용:

```txt
Level 3 ↔ Level 3 순서 변경
Level 3 → 다른 Level 2 아래로 이동
```

금지:

```txt
Level 3 → Level 1 바로 아래 삽입 금지
Level 3 → Level 3 하위 삽입 금지
Level 3 → Level 1보다 위로 이동 금지
```

---

# Visual Mode 전용 Drop 처리 방식

Visual Mode에서는 drop 동작을 반드시 아래 두 가지로 분리해주세요.

```ts
type VisualDropMode = 'reorder' | 'move-as-child';
```

## reorder

같은 레벨 내 순서 변경입니다.

허용 예시:

```txt
Level 1 ↔ Level 1 순서 변경
Level 2 ↔ Level 2 순서 변경
Level 3 ↔ Level 3 순서 변경
```

기본 조건:

* dragItem.level과 targetItem.level이 같아야 함
* Level 1은 전체 Level 1끼리 순서 변경 가능
* Level 2, Level 3은 같은 parentId 안에서 순서 변경 가능

---

## move-as-child

다른 항목의 하위로 넣는 동작입니다.

허용 예시:

```txt
Level 2 → Level 1 하위
Level 3 → Level 2 하위
```

금지 예시:

```txt
Level 1 → 아무 항목 하위
Level 2 → Level 2 하위
Level 2 → Level 3 하위
Level 3 → Level 1 하위
Level 3 → Level 3 하위
```

---

# Visual Mode 전용 하위 삽입 검증 함수

List Mode에는 영향을 주지 않도록
Visual Mode 전용 함수로 작성해주세요.

```js
function canVisualDropAsChild(dragItem, targetItem) {
  // Level 1은 어떤 항목의 하위로도 들어갈 수 없음
  if (dragItem.level === 1) return false;

  // Level 2는 Level 1 아래에만 들어갈 수 있음
  if (dragItem.level === 2) {
    return targetItem.level === 1;
  }

  // Level 3은 Level 2 아래에만 들어갈 수 있음
  if (dragItem.level === 3) {
    return targetItem.level === 2;
  }

  return false;
}
```

---

# Visual Mode 전용 순서 변경 검증 함수

```js
function canVisualReorder(dragItem, targetItem) {
  // 기본적으로 같은 레벨끼리만 순서 변경 허용
  if (dragItem.level !== targetItem.level) return false;

  // Level 1은 전체 Level 1끼리 순서 변경 가능
  if (dragItem.level === 1 && targetItem.level === 1) {
    return true;
  }

  // Level 2, Level 3은 같은 부모 안에서만 reorder 허용
  return dragItem.parentId === targetItem.parentId;
}
```

---

# Visual Mode 전용 Drop 처리 전 방어 코드

실제 상태 변경 전에 반드시 검증을 넣어주세요.

중요:
잘못된 drop은 `applyVisualDrop()` 또는 상태 변경 함수가 실행되기 전에 차단되어야 합니다.

```js
function handleVisualDrop(dragItem, targetItem, dropMode) {
  // Visual Editor Mode 전용 방어 코드
  // List Mode에서는 이 함수를 사용하지 않음

  if (dropMode === 'move-as-child') {
    if (!canVisualDropAsChild(dragItem, targetItem)) {
      console.warn('Invalid visual child drop blocked:', {
        dragLevel: dragItem.level,
        targetLevel: targetItem.level,
        dragTitle: dragItem.title,
        targetTitle: targetItem.title,
      });

      return;
    }
  }

  if (dropMode === 'reorder') {
    if (!canVisualReorder(dragItem, targetItem)) {
      console.warn('Invalid visual reorder blocked:', {
        dragLevel: dragItem.level,
        targetLevel: targetItem.level,
        dragTitle: dragItem.title,
        targetTitle: targetItem.title,
      });

      return;
    }
  }

  // 검증 통과한 경우에만 Visual Mode 상태 변경
  applyVisualDrop(dragItem, targetItem, dropMode);
}
```

---

# UI 피드백 요청

잘못된 위치로 드래그 중일 때는 사용자가 헷갈리지 않도록
drop 가능 표시가 나오지 않아야 합니다.

## 잘못된 drop target일 때

* hover highlight 표시하지 않기
* 하위 삽입 안내 표시하지 않기
* move group 표시하지 않기
* 커서를 `not-allowed` 느낌으로 표시
* drop해도 아무 변화 없음
* 상태 저장 또는 구조 변경 없음

예시:

```js
const isValidVisualChildDrop = canVisualDropAsChild(dragItem, targetItem);

className={`
  visual-drop-target
  ${isValidVisualChildDrop ? 'valid-drop' : 'invalid-drop'}
`}
```

---

# 가장 중요한 요구사항

이번 요청은 **Visual Editor Mode만 수정**하는 것입니다.

아래 조건을 반드시 지켜주세요.

1. List Mode는 절대 수정하지 않습니다.
2. Visual Mode에서 Level 4가 절대 생성되지 않아야 합니다.
3. Visual Mode에서 Level 1은 절대 하위 메뉴가 되면 안 됩니다.
4. Visual Mode에서 Level 2는 Level 2 또는 Level 3 아래로 들어가면 안 됩니다.
5. Visual Mode에서 Level 3은 Level 1 바로 아래 또는 Level 3 아래로 들어가면 안 됩니다.
6. 잘못된 drop은 상태 변경 전에 무조건 차단해야 합니다.
7. Visual Mode도 List Mode와 동일한 레벨 제한 규칙을 가져야 하지만, List Mode의 기존 코드는 변경하지 않습니다.
8. 공통 drag/drop 함수 수정이 필요하다면, List Mode에 영향이 없는지 먼저 확인하고 Visual Mode 전용 분기 또는 wrapper로 처리해주세요.

---

# 완료 기준

아래 테스트가 모두 통과해야 합니다.

| 테스트                                    | 기대 결과                 |
| -------------------------------------- | --------------------- |
| Visual Mode에서 Level 1을 Level 2 위에 drop | 하위 이동 안 됨             |
| Visual Mode에서 Level 1을 Level 3 위에 drop | 하위 이동 안 됨             |
| Visual Mode에서 Level 2를 Level 2 위에 drop | 하위 이동 안 됨             |
| Visual Mode에서 Level 2를 Level 3 위에 drop | 하위 이동 안 됨             |
| Visual Mode에서 Level 3을 Level 1 위에 drop | Level 1 바로 아래로 이동 안 됨 |
| Visual Mode에서 Level 3을 Level 3 위에 drop | 하위 이동 안 됨             |
| Visual Mode에서 Level 2를 Level 1 위에 drop | Level 1 하위로 이동 가능     |
| Visual Mode에서 Level 3을 Level 2 위에 drop | Level 2 하위로 이동 가능     |
| Visual Mode에서 같은 Level 1끼리 순서 변경       | 가능                    |
| Visual Mode에서 같은 Level 2끼리 순서 변경       | 가능                    |
| Visual Mode에서 같은 Level 3끼리 순서 변경       | 가능                    |
| Visual Mode 이동 후 전체 트리 검사              | Level 4가 없어야 함        |
| List Mode 기존 이동 테스트                    | 기존처럼 정상 동작해야 함        |

---

# 추가 안전장치

Visual Mode에서 drop 이후에도 전체 트리를 검사해서
잘못된 depth가 생기면 즉시 rollback하거나 저장하지 않도록 해주세요.

단, 이 검증도 List Mode의 기존 저장 로직에 영향을 주지 않도록
Visual Mode 적용 범위 안에서 처리해주세요.

```js
function validateVisualTree(nodes) {
  for (const node of nodes) {
    if (node.level < 1 || node.level > 3) {
      return false;
    }

    if (node.level === 1 && node.parentId) {
      return false;
    }

    if (node.level === 2) {
      const parent = findNodeById(nodes, node.parentId);
      if (!parent || parent.level !== 1) return false;
    }

    if (node.level === 3) {
      const parent = findNodeById(nodes, node.parentId);
      if (!parent || parent.level !== 2) return false;
    }
  }

  return true;
}
```

---

# 최종 요약

List Mode는 현재 완성된 상태로 간주합니다.
따라서 이번 요청은 **Visual Editor Mode에서만 잘못된 하위 삽입을 막는 수정**입니다.

Visual Mode의 드래그/드롭 로직에서
“순서 변경”과 “하위 삽입”을 분리하고,
하위 삽입은 반드시 아래 규칙만 허용해주세요.

```txt
Level 2 → Level 1 아래만 가능
Level 3 → Level 2 아래만 가능
Level 1 → 하위 삽입 절대 불가
```

이 외의 모든 하위 삽입은 상태 변경 전에 차단해야 합니다.

특히 아래 문장을 반드시 지켜주세요.

```txt
List Mode는 수정하지 말고, Visual Editor Mode 전용 로직에서만 처리한다.
```

```