# 메뉴 드래그 이동 기능 추가 수정 요청

## 1. 현재 상태

현재 메뉴 구성 기능은 기존 문제였던 잘못된 자동 포함 현상이 개선된 상태이다.

기존에는 `Level 1` 항목을 단순히 한 칸 아래로 드래그했을 때, 다른 `Level 1`의 하위 메뉴들이 엉뚱하게 함께 빨려 들어가는 문제가 있었다.

현재는 이 문제를 방지하기 위해 다음과 같은 금지 로직이 적용되어 있다.

```txt
- 의도하지 않은 부모 변경 방지
- 최대 Level 초과 방지
- 자기 자신의 하위 메뉴 안으로 이동하는 순환 구조 방지
- 같은 부모 안에서의 안전한 순서 변경
````

이 금지 조항은 유지되어야 한다.

다만 현재 메뉴 구조가 완전히 확정된 상태는 아니기 때문에, 사용자가 직접 메뉴의 부모를 변경할 수 있는 기능이 추가로 필요하다.

---

## 2. 추가 수정이 필요한 이유

현재 메뉴 구성은 사용자가 직접 메뉴 배치를 조정하는 방식이다.

따라서 다음과 같은 상황이 발생할 수 있다.

```txt
- Level 2 메뉴가 현재 Level 1이 아닌 다른 Level 1 아래로 이동해야 하는 경우
- Level 3 메뉴가 현재 Level 2가 아닌 다른 Level 2 아래로 이동해야 하는 경우
- 특정 사용자가 보기에는 Level 3 항목이 완전히 다른 Level 1 그룹의 Level 2 하위로 들어가야 하는 경우
```

즉, 단순히 같은 부모 안에서 순서만 변경하는 것으로는 충분하지 않다.

기존의 안전 로직은 유지하되, 사용자가 명확히 다른 부모 위치로 드래그한 경우에는 부모 변경이 가능해야 한다.

---

## 3. 핵심 요구사항

## 3.1 기존 금지 조항 유지

다음 로직은 그대로 유지한다.

```txt
1. 최대 Level 3 초과 금지
2. 자기 자신의 자식 또는 후손 밑으로 이동 금지
3. 순환 구조 발생 금지
4. 잘못된 부모 자동 추론 금지
5. Level 1이 단순 순서 이동만 했는데 다른 항목의 자식으로 자동 편입되는 현상 금지
```

즉, 자동으로 잘못 들어가는 것은 막아야 하지만, 사용자가 의도적으로 허용 가능한 위치로 드래그하는 것은 가능해야 한다.

---

## 3.2 Level 2의 부모 변경 허용

`Level 2` 메뉴는 다른 `Level 1` 메뉴의 자식으로 이동할 수 있어야 한다.

### 예시

변경 전:

```txt
star 학생지원 Level 1
  star 관리 Level 2
    사제동행교수선택 Level 3

학사정보 Level 1
  수강관리 Level 2
```

`star 관리`를 `학사정보` 아래로 드래그한 경우:

```txt
star 학생지원 Level 1

학사정보 Level 1
  수강관리 Level 2
  star 관리 Level 2
    사제동행교수선택 Level 3
```

이 경우 `star 관리`는 기존 부모였던 `star 학생지원`에서 분리되어 `학사정보`의 자식으로 이동한다.

단, 자식 메뉴의 최대 Level이 3을 초과하지 않아야 한다.

---

## 3.3 Level 3의 부모 변경 허용

`Level 3` 메뉴는 다른 `Level 2` 메뉴의 자식으로 이동할 수 있어야 한다.

### 예시

변경 전:

```txt
star 학생지원 Level 1
  star 관리 Level 2
    사제동행교수선택 Level 3

학사정보 Level 1
  수강관리 Level 2
```

`사제동행교수선택`을 `수강관리` 아래로 드래그한 경우:

```txt
star 학생지원 Level 1
  star 관리 Level 2

학사정보 Level 1
  수강관리 Level 2
    사제동행교수선택 Level 3
```

이 경우 `사제동행교수선택`은 기존 부모였던 `star 관리`에서 분리되어 `수강관리`의 자식으로 이동한다.

---

## 3.4 Level 1은 다른 Level 1의 자식으로 자동 편입되지 않도록 유지

`Level 1` 항목은 단순 드래그만으로 다른 `Level 1`의 자식이 되면 안 된다.

### 예시

변경 전:

```txt
학사정보 Level 1
star 학생지원 Level 1
대학생활 Level 1
```

`학사정보`를 `star 학생지원` 아래로 드래그한 경우, 기본 동작은 같은 Level 1끼리 순서 변경이어야 한다.

```txt
star 학생지원 Level 1
학사정보 Level 1
대학생활 Level 1
```

즉, 아래처럼 자동 변경되면 안 된다.

```txt
star 학생지원 Level 1
  학사정보 Level 2
대학생활 Level 1
```

`Level 1`을 다른 `Level 1`의 자식으로 넣는 기능이 필요하다면, 드래그가 아니라 별도의 `Level Down` 버튼 또는 명확한 드롭 영역을 통해서만 처리하는 것이 좋다.

---

## 4. 리스트 모드 적용 요구사항

리스트 모드에서는 현재 각 항목이 트리형 리스트처럼 표시되고 있다.

이 모드에서 다음 동작이 가능해야 한다.

## 4.1 같은 부모 안에서 순서 변경

기존처럼 같은 부모 안에서는 위아래 순서 변경이 가능해야 한다.

```txt
장학관리 Level 2
  장학 공지사항 Level 3
  장학금 온라인신청 Level 3
  장학금 지급계좌관리 Level 3
```

`장학금 온라인신청`을 위로 이동:

```txt
장학관리 Level 2
  장학금 온라인신청 Level 3
  장학 공지사항 Level 3
  장학금 지급계좌관리 Level 3
```

---

## 4.2 Level 2를 다른 Level 1로 이동

`Level 2` 항목을 드래그해서 다른 `Level 1` 항목 아래로 이동할 수 있어야 한다.

```txt
변경 전

star 학생지원 Level 1
  star 관리 Level 2

학사정보 Level 1
  수강관리 Level 2
```

```txt
변경 후

star 학생지원 Level 1

학사정보 Level 1
  수강관리 Level 2
  star 관리 Level 2
```

---

## 4.3 Level 3을 다른 Level 2로 이동

`Level 3` 항목을 드래그해서 다른 `Level 2` 항목 아래로 이동할 수 있어야 한다.

```txt
변경 전

star 학생지원 Level 1
  star 관리 Level 2
    희망학과 선택 Level 3

학사정보 Level 1
  수강관리 Level 2
```

```txt
변경 후

star 학생지원 Level 1
  star 관리 Level 2

학사정보 Level 1
  수강관리 Level 2
    희망학과 선택 Level 3
```

---

## 5. 비주얼 모드 적용 요구사항

비주얼 모드에서도 리스트 모드와 동일한 부모 변경 규칙이 적용되어야 한다.

현재 비주얼 모드에서는 `Level 1` 메뉴를 펼친 후, 해당 `Level 1` 내부의 `Level 2`, `Level 3` 항목은 드래그 이동이 가능하다.

그러나 완전히 다른 `Level 1` 영역으로는 이동할 수 없는 문제가 있다.

이 부분을 수정해야 한다.

---

## 5.1 비주얼 모드에서 Level 2 이동

비주얼 모드에서 `Level 2` 그룹은 다른 `Level 1` 영역으로 드래그 이동할 수 있어야 한다.

### 예시

변경 전:

```txt
star 학생지원 Level 1
  전공역량 Level 2
  공동체 Level 2

학사정보 Level 1
  수강관리 Level 2
```

`전공역량`을 `학사정보` 영역으로 이동한 경우:

```txt
star 학생지원 Level 1
  공동체 Level 2

학사정보 Level 1
  수강관리 Level 2
  전공역량 Level 2
```

---

## 5.2 비주얼 모드에서 Level 3 이동

비주얼 모드에서 `Level 3` 항목은 다른 `Level 2` 그룹 아래로 드래그 이동할 수 있어야 한다.

### 예시

변경 전:

```txt
star 학생지원 Level 1
  전공역량 Level 2
    전공역량 자기평가 진단 검사 Level 3

학사정보 Level 1
  수강관리 Level 2
```

`전공역량 자기평가 진단 검사`를 `수강관리` 아래로 이동한 경우:

```txt
star 학생지원 Level 1
  전공역량 Level 2

학사정보 Level 1
  수강관리 Level 2
    전공역량 자기평가 진단 검사 Level 3
```

---

## 5.3 비주얼 모드 드롭 영역 개선

비주얼 모드에서는 다른 `Level 1` 영역으로 드래그할 때 사용자가 어디에 넣는지 명확히 알 수 있어야 한다.

권장 드롭 영역은 다음과 같다.

```txt
Level 1 영역 전체
→ Level 2를 받을 수 있는 영역

Level 2 그룹 내부
→ Level 3을 받을 수 있는 영역
```

예시:

```txt
[학사정보 Level 1 영역]
  여기에 Level 2 메뉴를 놓으면 학사정보의 하위 Level 2로 이동

[수강관리 Level 2 영역]
  여기에 Level 3 메뉴를 놓으면 수강관리의 하위 Level 3으로 이동
```

드래그 중에는 드롭 가능한 영역에 시각적 표시가 필요하다.

```txt
- 점선 테두리
- 배경 강조
- "여기로 이동" 안내 문구
- 드롭 불가 영역은 흐리게 표시
```

---

## 6. 공통 드래그 허용 규칙

리스트 모드와 비주얼 모드 모두 동일한 규칙을 사용해야 한다.

| 이동 대상                    |                허용 여부 | 설명                               |
| ------------------------ | -------------------: | -------------------------------- |
| Level 1 → Level 1 순서 변경  |                   허용 | 같은 최상위 메뉴끼리 순서 변경                |
| Level 1 → 다른 Level 1의 자식 |                기본 금지 | 별도 Level Down 버튼 또는 명확한 드롭 영역 필요 |
| Level 2 → 같은 부모 안 순서 변경  |                   허용 | 같은 Level 1 내부에서 순서 변경            |
| Level 2 → 다른 Level 1의 자식 |                   허용 | 다른 Level 1 아래로 이동 가능             |
| Level 2 → Level 3의 자식    |                   금지 | Level 구조 위반                      |
| Level 3 → 같은 부모 안 순서 변경  |                   허용 | 같은 Level 2 내부에서 순서 변경            |
| Level 3 → 다른 Level 2의 자식 |                   허용 | 다른 Level 2 아래로 이동 가능             |
| Level 3 → Level 1의 직접 자식 | 금지 또는 Level 2로 변환 필요 | 기본적으로 금지 권장                      |
| 자기 자신의 후손으로 이동           |                   금지 | 순환 구조 방지                         |
| 이동 후 Level 4 발생          |                   금지 | 최대 Level 3 유지                    |

---

## 7. 드래그 이동 처리 기준

드래그 이동 시에는 단순히 화면상 위치만 보고 부모를 추정하면 안 된다.

반드시 드롭 대상의 타입을 기준으로 처리해야 한다.

```txt
Level 2를 Level 1 위에 드롭
→ 해당 Level 1의 children으로 이동

Level 3을 Level 2 위에 드롭
→ 해당 Level 2의 children으로 이동

같은 부모 내부에서 위아래 드롭
→ 같은 children 배열 안에서 순서 변경
```

---

## 8. 데이터 처리 로직

메뉴 이동은 다음 순서로 처리한다.

```txt
1. 이동 대상 node를 기존 tree에서 제거한다.
2. 드롭 대상 node를 찾는다.
3. 이동이 허용되는지 검사한다.
4. 허용되면 드롭 대상의 children에 삽입한다.
5. 부모 기준으로 이동 대상과 하위 children의 level을 재계산한다.
6. 전체 tree를 다시 flatten하여 화면에 반영한다.
```

---

## 9. 이동 가능 여부 검사

다음 검사를 통과해야만 이동을 허용한다.

```js
const MAX_LEVEL = 3;

function canMoveNode({ movingNode, targetNode, targetParentLevel }) {
  // 1. 자기 자신에게 드롭 금지
  if (movingNode.id === targetNode.id) {
    return false;
  }

  // 2. 자기 자신의 후손 밑으로 이동 금지
  if (isDescendant(movingNode, targetNode.id)) {
    return false;
  }

  // 3. 이동 후 최대 레벨 초과 금지
  const movingDepth = getMaxDepth(movingNode);
  const nextMaxLevel = targetParentLevel + movingDepth;

  if (nextMaxLevel > MAX_LEVEL) {
    return false;
  }

  return true;
}
```

---

## 10. Level 재계산

부모가 변경된 경우, 이동한 항목과 그 하위 children의 level은 반드시 다시 계산해야 한다.

```js
function updateLevelsByParent(node, parentLevel = 0) {
  const newLevel = parentLevel + 1;

  return {
    ...node,
    level: newLevel,
    children: node.children.map(child =>
      updateLevelsByParent(child, newLevel)
    )
  };
}
```

예를 들어 `Level 2`를 다른 `Level 1` 아래로 이동하면 이동 대상은 계속 `Level 2`가 된다.

```js
movedNode = updateLevelsByParent(movedNode, targetLevel1.level);
```

예를 들어 `Level 3`을 다른 `Level 2` 아래로 이동하면 이동 대상은 계속 `Level 3`이 된다.

```js
movedNode = updateLevelsByParent(movedNode, targetLevel2.level);
```

---

## 11. 리스트 모드와 비주얼 모드의 데이터 동기화

리스트 모드와 비주얼 모드는 서로 다른 화면 방식일 뿐, 같은 원본 tree 데이터를 사용해야 한다.

```txt
공통 원본 데이터: menuTree
리스트 모드: menuTree를 flat list로 변환해서 렌더링
비주얼 모드: menuTree를 Level 1 / Level 2 / Level 3 구조로 시각화해서 렌더링
```

따라서 리스트 모드에서 이동한 결과는 비주얼 모드에도 즉시 반영되어야 한다.

반대로 비주얼 모드에서 이동한 결과도 리스트 모드에 즉시 반영되어야 한다.

---

## 12. 저장 시 반영 구조

저장 시에는 현재 화면 기준이 아니라 공통 원본 tree 기준으로 저장해야 한다.

```js
const savedMenuData = menuTree;
```

화면용 flat 데이터만 저장하면 부모-자식 관계가 다시 깨질 수 있으므로, 반드시 tree 구조를 저장해야 한다.

필요하다면 저장 시 flat 데이터도 함께 만들 수 있지만, 기준 데이터는 tree여야 한다.

```js
const savedData = {
  tree: menuTree,
  flat: flattenTree(menuTree)
};
```

---

## 13. 최종 요청사항 요약

```txt
1. 기존 금지 조항 로직은 유지한다.
2. Level 2 메뉴를 다른 Level 1의 자식으로 드래그 이동할 수 있게 한다.
3. Level 3 메뉴를 다른 Level 2의 자식으로 드래그 이동할 수 있게 한다.
4. 단순 드래그로 Level 1이 다른 Level 1의 자식으로 들어가는 현상은 계속 방지한다.
5. 리스트 모드와 비주얼 모드 모두 동일한 이동 규칙을 적용한다.
6. 비주얼 모드에서도 Level 2, Level 3을 완전히 다른 Level 1 영역으로 이동할 수 있게 한다.
7. 드래그 중 드롭 가능한 영역과 불가능한 영역을 시각적으로 구분한다.
8. 이동 후에는 부모 기준으로 하위 메뉴 level을 전부 재계산한다.
9. 최대 Level 3 초과, 자기 후손으로 이동, 순환 구조 발생은 계속 금지한다.
10. 리스트 모드와 비주얼 모드는 하나의 공통 tree 데이터를 기준으로 동기화한다.
```

---

## 14. 결론

현재 개선된 금지 로직은 유지하되, 메뉴 구조를 재배치할 수 있는 자유도는 더 필요하다.

따라서 단순 순서 변경만 허용하는 방식에서 확장하여 다음 이동을 허용해야 한다.

```txt
Level 2 → 다른 Level 1 아래로 이동 가능
Level 3 → 다른 Level 2 아래로 이동 가능
```

다만 다음 이동은 계속 금지해야 한다.

```txt
Level 1이 실수로 다른 Level 1의 자식이 되는 것
Level 2가 Level 3 밑으로 들어가는 것
Level 3이 Level 1의 직접 자식으로 들어가는 것
자기 자신의 하위 메뉴 안으로 들어가는 것
Level 4가 생기는 것
```

이 방식이면 메뉴 구조가 완전히 정해지지 않은 상태에서도 사용자가 자유롭게 메뉴를 재배치할 수 있고, 동시에 잘못된 구조가 만들어지는 문제도 방지할 수 있다.

```