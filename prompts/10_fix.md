# Level 1 순서변경 모드 완료 방식 및 열림 상태 복구 수정 요청

## 1. 현재 문제

현재 `Level 1 순서변경` 모드에서 Level 1 메뉴를 드래그해서 한 번 드롭하면, 순서변경 모드가 바로 종료됩니다.

하지만 원하는 동작은 다음과 같습니다.

```txt
Level 1 순서변경 모드 진입
→ 사용자가 원하는 만큼 여러 번 순서 변경
→ [순서변경 완료] 버튼 클릭
→ 그때 순서변경 모드 종료
````

즉, 드롭 한 번으로 순서변경 모드가 종료되면 안 됩니다.

---

## 2. 원하는 동작

### 현재 잘못된 동작

```txt
[Level 1 순서변경] 클릭
→ Level 1 목록만 표시
→ 메뉴 하나 드래그 후 드롭
→ 순서변경 모드 자동 종료
```

### 수정할 동작

```txt
[Level 1 순서변경] 클릭
→ Level 1 목록만 표시 또는 닫힌 것처럼 표시
→ 여러 번 드래그해서 순서 변경 가능
→ [순서변경 완료] 클릭
→ 순서변경 모드 종료
```

---

## 3. Level 1 순서변경 모드 진입 시 열림 상태 처리

현재 메뉴가 모두 펼쳐져 있거나 일부 펼쳐져 있는 상태에서 `Level 1 순서변경`을 누르면, 화면상으로는 자동으로 다 닫힌 상태처럼 보여야 합니다.

### 핵심

```txt
Level 1 순서변경 모드 진입 시:
- 실제 사용자의 열림/닫힘 상태는 저장해둔다.
- 화면에서는 모든 Level 1이 닫힌 것처럼 보여준다.
- Level 2, Level 3은 화면에서 숨긴다.
```

즉, 기존 열림 상태를 완전히 지우는 것이 아니라, **순서변경 모드 동안만 임시로 닫힌 화면을 연출**해야 합니다.

---

## 4. Level 1 순서변경 완료 후 열림 상태 복구

`순서변경 완료` 버튼을 누르면 Level 1 순서변경 모드를 종료하고, 모드 진입 전 열려 있던 메뉴 상태를 복구해야 합니다.

### 예시

변경 전 사용자가 열어둔 상태:

```txt
star 학생지원 L1 열림
  star 관리 L2 열림
    사제동행교수선택 L3
    희망학과 선택 L3

학사정보 L1 열림
  학사관리 L2 열림
    학사관리 공지사항 L3
```

Level 1 순서변경 모드 진입 시 화면:

```txt
star 학생지원 L1 닫힌 것처럼 표시
학사정보 L1 닫힌 것처럼 표시
대학생활 L1 닫힌 것처럼 표시
```

순서변경 완료 후:

```txt
기존에 열려 있던 star 학생지원, star 관리, 학사정보, 학사관리 등의 열림 상태 복구
단, Level 1 순서는 변경된 순서로 반영
```

---

## 5. 상태 관리 방식

열림 상태는 실제 상태와 순서변경 모드의 임시 표시 상태를 분리해서 관리합니다.

권장 상태:

```js
const [expandedIds, setExpandedIds] = useState(new Set());
const [isLevel1SortMode, setIsLevel1SortMode] = useState(false);
const [expandedSnapshotBeforeLevel1Sort, setExpandedSnapshotBeforeLevel1Sort] = useState(null);
```

### 모드 진입

```js
function startLevel1SortMode() {
  setExpandedSnapshotBeforeLevel1Sort(new Set(expandedIds));
  setIsLevel1SortMode(true);
}
```

### 화면 표시

Level 1 순서변경 모드에서는 `expandedIds`를 실제로 비우지 말고, 렌더링 단계에서만 Level 2, Level 3을 숨깁니다.

```js
const visibleItems = isLevel1SortMode
  ? flattenedItems.filter(item => item.level === 1)
  : getVisibleItemsByExpandedState(flattenedItems, expandedIds);
```

### 완료 버튼 클릭

```js
function finishLevel1SortMode() {
  setIsLevel1SortMode(false);

  if (expandedSnapshotBeforeLevel1Sort) {
    setExpandedIds(expandedSnapshotBeforeLevel1Sort);
    setExpandedSnapshotBeforeLevel1Sort(null);
  }
}
```

---

## 6. 버튼 상태

Level 1 순서변경 모드에 들어가면 상단 버튼은 다음처럼 변경합니다.

```txt
[순서변경 완료]
```

또는 취소 기능까지 둘 경우:

```txt
[순서변경 완료] [취소]
```

현재처럼 `순서변경 완료` 버튼이 이미 표시되어 있다면, 드롭 시 자동 종료하지 말고 이 버튼을 눌렀을 때만 종료되도록 해주세요.

---

## 7. 드래그 완료 시 모드 유지

Level 1 순서변경 모드에서 드래그 완료 시에는 순서만 변경하고 모드는 계속 유지합니다.

```js
function handleLevel1DragEnd(event) {
  reorderLevel1(event);

  // 순서변경 모드 유지
  setIsLevel1SortMode(true);
}
```

금지:

```js
function handleLevel1DragEnd(event) {
  reorderLevel1(event);
  setIsLevel1SortMode(false); // 금지
}
```

---

## 8. Undo / 로그 처리

Level 1 순서변경 모드에서는 사용자가 여러 번 드래그할 수 있으므로, 로그 처리 방식은 완료 시 한 번만 기록하는 것을 권장합니다.

### 권장 방식

Level 1 순서변경 모드 진입 시의 순서를 저장해두고, 완료 버튼 클릭 시 변경 전/후를 비교해서 한 번만 로그를 남깁니다.

```txt
대분류(Level 1) 순서가 변경되었습니다.
```

드래그마다 로그를 남기면 사용자가 여러 번 조정할 때 로그가 너무 많아질 수 있으므로 비추천입니다.

---

## 9. 취소 버튼을 둘 경우

취소 버튼이 있다면, 순서변경 모드 진입 시점의 Level 1 순서와 열림 상태로 되돌립니다.

```js
const [level1SortSnapshot, setLevel1SortSnapshot] = useState(null);

function startLevel1SortMode() {
  setLevel1SortSnapshot({
    menuTree,
    expandedIds: new Set(expandedIds)
  });

  setIsLevel1SortMode(true);
}

function cancelLevel1SortMode() {
  if (level1SortSnapshot) {
    setMenuTree(level1SortSnapshot.menuTree);
    setExpandedIds(level1SortSnapshot.expandedIds);
    setLevel1SortSnapshot(null);
  }

  setIsLevel1SortMode(false);
}
```

---

## 10. 핵심 요구사항

```txt
1. Level 1 순서변경 모드에서 드롭해도 모드가 종료되면 안 됩니다.
2. 사용자가 원하는 만큼 여러 번 Level 1 순서를 바꿀 수 있어야 합니다.
3. [순서변경 완료] 버튼을 눌렀을 때만 모드를 종료합니다.
4. Level 1 순서변경 모드 진입 시, 화면상 모든 메뉴는 닫힌 것처럼 보여야 합니다.
5. 이때 기존 expandedIds는 삭제하지 말고 snapshot으로 저장하거나 그대로 유지해야 합니다.
6. Level 1 순서변경 완료 후, 모드 진입 전에 열려 있던 메뉴 상태를 복구해야 합니다.
7. 가능하면 [취소] 버튼도 제공하여 모드 진입 전 순서와 열림 상태로 되돌릴 수 있게 합니다.
8. 변경 로그는 드래그마다 남기기보다 완료 시 한 번만 남기는 것을 권장합니다.
```

```