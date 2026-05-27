# 메뉴 구성 영역 구조 개선 가이드

## 1. 현재 문제 상황

현재 메뉴 구성 영역은 리스트형 구조로 되어 있고, 메뉴 관리가 트리 구조로 분리되어 있지 않다.

이로 인해 `L1-B` 아래로 `L1-A`를 단순히 한 칸 이동했을 뿐인데, `L1-B`의 하위 메뉴들이 전부 `L1-A` 밑으로 들어가는 문제가 발생한다.

예를 들어 이미지 4, 5번처럼 `학사정보` 하위 메뉴가 `star 학생지원` 아래로 전부 들어가버리는 현상이 발생한다.

원래 정상 동작이라면 다음 둘 중 하나여야 한다.

1. `L1-A`가 `L1-B`의 자식이 되면서 Level 2가 되고, 기존 하위 레벨도 전부 +1 처리된다.
2. 최대 레벨 제한이나 이동 규칙에 따라 아예 들어가지 않고 튕겨나와야 한다.

현재 문제는 CSS나 드래그 라이브러리 문제가 아니라, 메뉴 구조를 단순 리스트로 관리해서 생기는 구조적 문제이다.

---

## 2. 문제의 원인

현재 데이터 구조는 다음과 같은 단순 배열 형태일 가능성이 높다.

```js
[
  { title: "학사정보", level: 1 },
  { title: "star 학생지원", level: 1 },
  { title: "star 관리", level: 2 },
  { title: "사제동행교수선택", level: 3 }
]
````

이 구조에서는 각 메뉴가 자신의 실제 부모를 가지고 있지 않다.

즉, 화면에서는 `Level 1`, `Level 2`, `Level 3`처럼 보이지만 실제 데이터상으로는 부모-자식 관계가 명확하지 않다.

그래서 `학사정보`가 `star 학생지원` 아래로 이동하면 시스템이 다음처럼 잘못 해석할 수 있다.

```txt
star 학생지원
  star 관리
  사제동행교수선택
  학사정보
```

또는 반대로 기존 하위 메뉴들이 엉뚱한 부모 아래로 빨려 들어가는 문제가 발생한다.

---

## 3. 해결 방향

메뉴 데이터는 단순 리스트가 아니라 반드시 트리 구조로 관리해야 한다.

### 잘못된 방식

```js
[
  { title: "star 학생지원", level: 1 },
  { title: "star 관리", level: 2 },
  { title: "사제동행교수선택", level: 3 },
  { title: "학사정보", level: 1 }
]
```

### 권장 방식

```js
const menuData = [
  {
    id: "L1_STAR",
    title: "star 학생지원",
    level: 1,
    children: [
      {
        id: "L2_STAR_ADMIN",
        title: "star 관리",
        level: 2,
        children: [
          {
            id: "L3_SAJAE",
            title: "사제동행교수선택(신규)",
            level: 3,
            children: []
          }
        ]
      }
    ]
  },
  {
    id: "L1_ACADEMIC",
    title: "학사정보",
    level: 1,
    children: []
  }
];
```

이렇게 관리해야 `학사정보`를 이동할 때도 단순 텍스트 한 줄이 아니라 해당 메뉴 객체 전체가 이동한다.

---

## 4. 추천 UX 정책

### 기본 정책

| 기능          | 추천 방식                             |
| ----------- | --------------------------------- |
| 드래그 이동      | 같은 부모 안에서 순서 변경만 허용               |
| 부모 변경       | 우측 Level Up / Level Down 버튼으로만 처리 |
| Level 자동 변경 | 부모 기준으로 자식까지 재계산                  |
| 최대 레벨       | Level 3까지만 허용                     |
| 삭제          | 하위 메뉴 포함 삭제 + 확인창                 |
| 추가          | 같은 레벨 추가 / 하위 메뉴 추가               |
| 이름 변경       | 인라인 input 또는 모달                   |
| 저장 데이터      | tree 구조 JSON                      |
| 화면 표시       | tree를 flat list로 변환해서 렌더링         |

---

## 5. 드래그 이동 규칙

드래그는 부모-자식 구조를 바꾸는 기능이 아니라, 같은 부모 안에서 순서를 바꾸는 기능으로 제한하는 것이 안전하다.

### 예시

변경 전:

```txt
L1-A
  L2-A
L1-B
  L2-B
```

`L1-A`를 `L1-B` 아래로 드래그한 경우:

```txt
L1-B
  L2-B
L1-A
  L2-A
```

즉, `L1-A`가 `L1-B`의 자식이 되지 않고, 같은 Level 1끼리 순서만 바뀌어야 한다.

---

## 6. 부모 변경은 Level Up / Down 버튼으로 처리

단순 드래그로 부모가 바뀌면 사용자가 의도하지 않은 구조 변경이 발생할 가능성이 높다.

따라서 부모 변경은 각 메뉴 우측에 별도 아이콘 버튼을 두고 명시적으로 처리하는 것이 좋다.

### 권장 아이콘

```txt
[↑] 위로 이동
[↓] 아래로 이동
[←] Level Up / 상위로 빼기
[→] Level Down / 하위로 넣기
[✎] 이름 변경
[+] 하위 메뉴 추가
[🗑] 삭제
```

모바일에서는 버튼이 많아질 수 있으므로 `⋯` 메뉴로 묶는 것도 좋다.

```txt
[⋯] 클릭 시
- 이름 변경
- 하위 메뉴 추가
- 위로 이동
- 아래로 이동
- 한 단계 상위로
- 한 단계 하위로
- 삭제
```

---

## 7. Level Down 동작

`Level Down`은 선택한 항목을 바로 위 형제 항목의 자식으로 넣는 기능이다.

### 변경 전

```txt
학사정보 Level 1
star 학생지원 Level 1
대학생활 Level 1
```

`학사정보`에서 Level Down을 누르면:

```txt
star 학생지원 Level 1
  학사정보 Level 2
대학생활 Level 1
```

기존 자식이 있는 경우에는 자식들도 함께 Level이 변경되어야 한다.

### 변경 전

```txt
학사정보 Level 1
  수강관리 Level 2
    수강신청 Level 3
```

Level Down 후:

```txt
star 학생지원 Level 1
  학사정보 Level 2
    수강관리 Level 3
      수강신청 Level 4
```

단, 최대 Level을 3까지만 허용한다면 위 경우는 금지해야 한다.

```txt
이 항목을 하위로 넣으면 일부 메뉴가 Level 4가 됩니다.
최대 Level 3까지만 허용되므로 이동할 수 없습니다.
```

---

## 8. Level Up 동작

`Level Up`은 선택한 항목을 현재 부모 밖으로 빼는 기능이다.

### 변경 전

```txt
star 학생지원 Level 1
  학사정보 Level 2
    수강관리 Level 3
```

`학사정보`에서 Level Up을 누르면:

```txt
star 학생지원 Level 1
학사정보 Level 1
  수강관리 Level 2
```

이때 선택 항목뿐만 아니라 하위 메뉴들도 전부 부모 기준으로 Level이 다시 계산되어야 한다.

---

## 9. 자식까지 Level 자동 변경

메뉴를 이동할 때는 선택 항목의 level만 바꾸면 안 된다.

반드시 자식 메뉴들의 level도 함께 변경해야 한다.

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

사용 예시:

```js
movedNode = updateLevelsByParent(movedNode, newParent.level);
```

---

## 10. 최대 Level 제한

현재 메뉴가 Level 1, Level 2, Level 3까지만 허용된다면 상수로 관리하는 것이 좋다.

```js
const MAX_LEVEL = 3;
```

이동하려는 메뉴의 내부 깊이를 계산해서, 이동 후 최대 Level이 3을 넘으면 이동을 금지해야 한다.

```js
function getMaxDepth(node) {
  if (!node.children.length) return 1;

  return 1 + Math.max(...node.children.map(getMaxDepth));
}
```

### 예시

```txt
새 부모 Level 2
옮기는 항목 내부 깊이 2

결과 최대 Level = 2 + 2 = 4
```

이 경우 Level 4가 발생하므로 이동을 막아야 한다.

---

## 11. 자기 자신의 자식 밑으로 이동 금지

자기 자신의 하위 메뉴 안으로 본인을 이동시키는 것은 금지해야 한다.

### 잘못된 예시

```txt
A
  B
    C
```

여기서 `A`를 `C` 밑으로 넣으면 다음과 같은 순환 구조가 발생한다.

```txt
A > B > C > A > B > C ...
```

이를 방지하기 위해 다음 함수가 필요하다.

```js
function isDescendant(parent, targetId) {
  return parent.children.some(child =>
    child.id === targetId || isDescendant(child, targetId)
  );
}
```

---

## 12. 이름 변경 기능

이름 변경은 item의 고유 id 기준으로 처리해야 한다.

```js
function renameItem(tree, id, newTitle) {
  return tree.map(item => {
    if (item.id === id) {
      return { ...item, title: newTitle };
    }

    return {
      ...item,
      children: renameItem(item.children, id, newTitle)
    };
  });
}
```

---

## 13. 삭제 기능

삭제는 두 가지 방식 중 하나를 선택해야 한다.

### 방식 1. 하위 메뉴까지 전부 삭제

```txt
장학관리 삭제
→ 장학 공지사항, 장학금 온라인신청도 같이 삭제
```

이 방식은 구조가 명확하지만 위험할 수 있으므로 확인창이 필요하다.

```txt
이 메뉴와 하위 메뉴 3개가 함께 삭제됩니다.
삭제할까요?
```

### 방식 2. 본인만 삭제하고 자식은 상위로 올리기

```txt
변경 전

장학관리
  장학 공지사항
  장학금 온라인신청

변경 후

장학 공지사항
장학금 온라인신청
```

메뉴 설계 도구라면 방식 1을 추천한다.

즉, 삭제 시 하위 메뉴까지 함께 삭제하되 반드시 확인창을 띄우는 방식이 좋다.

---

## 14. 추가 기능

추가 기능은 최소한 다음 두 가지가 필요하다.

```txt
+ 같은 레벨 추가
+ 하위 메뉴 추가
```

예시:

```txt
[+ 아래]
[+ 하위]
```

### 같은 레벨 추가

현재 선택한 메뉴와 같은 부모 아래에 새 메뉴를 추가한다.

```txt
장학 공지사항
장학금 온라인신청
신규 메뉴
```

### 하위 메뉴 추가

현재 선택한 메뉴의 children 안에 새 메뉴를 추가한다.

```txt
장학관리
  신규 메뉴
```

단, 현재 메뉴가 Level 3이면 하위 메뉴 추가는 막아야 한다.

```txt
최대 Level 3까지만 추가할 수 있습니다.
```

---

## 15. 화면 렌더링 방식

내부 데이터는 tree 구조로 관리하고, 화면에는 flat list로 변환해서 보여주는 방식이 좋다.

### Tree 데이터

```js
[
  {
    title: "star 학생지원",
    children: [
      {
        title: "star 관리",
        children: [
          {
            title: "사제동행교수선택",
            children: []
          }
        ]
      }
    ]
  }
]
```

### 화면 렌더링용 Flat 데이터

```js
[
  { title: "star 학생지원", level: 1 },
  { title: "star 관리", level: 2 },
  { title: "사제동행교수선택", level: 3 }
]
```

### 변환 함수

```js
function flattenTree(items, parentId = null, depth = 1) {
  return items.flatMap(item => [
    {
      id: item.id,
      title: item.title,
      level: depth,
      parentId,
      hasChildren: item.children.length > 0
    },
    ...flattenTree(item.children, item.id, depth + 1)
  ]);
}
```

---

## 16. 최종 정리

현재 문제는 CSS나 드래그 라이브러리 문제가 아니라, 메뉴 데이터 구조를 단순 리스트로 관리해서 발생한 문제이다.

따라서 다음 방향으로 수정해야 한다.

```txt
1. 원본 데이터는 반드시 tree 구조로 관리한다.
2. 화면 표시할 때만 flat list로 펼친다.
3. 드래그는 같은 부모 안의 순서 변경만 허용한다.
4. 부모 변경은 Level Up / Level Down 버튼으로 명시적으로 처리한다.
5. 이동 후에는 자식 level을 전부 부모 기준으로 재계산한다.
6. 최대 Level 3 초과 시 이동을 금지한다.
7. 자기 자신의 자식 밑으로 이동하는 순환 구조를 금지한다.
8. 이름 변경, 삭제, 추가 기능은 각 item의 id 기준으로 처리한다.
```

이 구조로 변경하면 단순히 한 칸 아래로 드래그했다는 이유로 `L1-A`의 하위 메뉴가 `L1-B` 아래로 잘못 들어가는 문제가 사라진다.

```