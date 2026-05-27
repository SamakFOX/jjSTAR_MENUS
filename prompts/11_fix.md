# 보기모드 버튼 비활성화 및 Level 1 순서변경 모드 유지 오류 수정 요청

## 1. 보기모드에서 편집 관련 버튼 비활성화 필요

### 현재 문제

현재 `메뉴 편집하기` 버튼을 누르지 않은 상태, 즉 보기모드에서도 아래 기능이 동작합니다.

```txt
Level 1 추가
Level 1 순서변경
취소
되돌리기
Level 1만 보기
Level 2까지 보기
전체 펼치기
````

특히 `Level 1 순서변경` 같은 편집 기능이 보기모드에서도 작동하면 사용자가 당황할 수 있습니다.

---

## 2. 보기모드와 편집모드 구분

### 보기모드

`메뉴 편집하기`를 누르기 전 상태입니다.

보기모드에서는 메뉴 구조를 수정할 수 없어야 합니다.

보기모드에서 허용할 수 있는 기능:

```txt
메뉴 펼치기/접기
Level 1만 보기
Level 2까지 보기
전체 펼치기
```

단, 이 보기 제어 버튼들도 단순 보기용으로만 동작해야 하며, 메뉴 구조를 변경하면 안 됩니다.

보기모드에서 비활성화해야 하는 기능:

```txt
Level 1 추가
Level 1 순서변경
순서변경 완료
취소
되돌리기
드래그
장바구니 drop-into
이름변경
삭제
Level Up / Level Down
```

---

## 3. 편집모드에서만 활성화할 기능

`메뉴 편집하기`를 누른 후 편집모드에 진입했을 때만 아래 버튼과 기능을 활성화합니다.

```txt
Level 1 추가
Level 1 순서변경
순서변경 완료
취소
되돌리기
드래그
장바구니 drop-into
이름변경
삭제
Level Up / Level Down
```

---

## 4. 버튼 표시 방식 제안

### 보기모드

보기모드에서는 편집 관련 버튼을 숨기거나 비활성화합니다.

권장:

```txt
[메뉴 편집하기]
[Level 1만 보기] [Level 2까지 보기] [전체 펼치기]
```

비활성화 또는 숨김 대상:

```txt
[Level 1 추가]
[Level 1 순서변경]
[순서변경 완료]
[취소]
[되돌리기]
```

### 편집모드

편집모드에서는 편집 버튼을 표시합니다.

```txt
[편집 완료]
[Level 1 추가]
[Level 1 순서변경]
[되돌리기]
[Level 1만 보기] [Level 2까지 보기] [전체 펼치기]
```

---

# 5. Level 1 순서변경 모드가 드롭 후 바로 종료되는 문제

## 현재 문제

현재 `Level 1 순서변경` 모드에서 Level 1 메뉴 하나를 드래그해서 이동하면, 드롭 직후 순서변경 모드가 바로 종료됩니다.

그 결과:

```txt
1. Level 1 순서변경 모드 진입
2. Level 1 메뉴 하나 이동
3. 모드가 자동 종료됨
4. 전체 메뉴가 다시 펼쳐짐
```

이 동작은 잘못되었습니다.

---

## 6. 원하는 동작

Level 1 순서변경 모드는 사용자가 직접 `순서변경 완료` 버튼을 누르기 전까지 유지되어야 합니다.

정상 흐름:

```txt
1. Level 1 순서변경 클릭
2. Level 1 목록만 표시
3. 사용자가 여러 번 드래그해서 순서 조정
4. 순서변경 완료 버튼 클릭
5. 그때 Level 1 순서변경 모드 종료
```

즉, 드래그 후 드롭만으로 모드가 종료되면 안 됩니다.

---

## 7. 구현 요구사항

Level 1 순서변경 드래그 종료 함수에서 아래와 같은 처리가 있으면 제거해야 합니다.

```js
setIsLevel1SortMode(false);
```

또는 이와 동일하게 모드를 종료시키는 로직을 제거해야 합니다.

드래그 종료 시에는 순서만 변경하고 모드는 유지합니다.

```js
function handleLevel1DragEnd(event) {
  reorderLevel1(event);

  // 금지: 드롭 후 모드 종료
  // setIsLevel1SortMode(false);

  // 유지
  setIsLevel1SortMode(true);
}
```

모드 종료는 반드시 `순서변경 완료` 버튼 클릭 시에만 처리합니다.

```js
function finishLevel1SortMode() {
  setIsLevel1SortMode(false);
}
```

---

# 8. Level 1 순서변경 모드 종료 시 전체 펼침 문제

## 현재 문제

Level 1 순서변경 모드가 종료되면, 사용자가 이전에 열어둔 상태와 상관없이 전체 메뉴가 모두 펼쳐집니다.

예를 들어 사용자가 `Level 2까지만 보기` 상태로 작업 중이었는데, Level 1 순서변경 모드가 종료되면 Level 3까지 전체가 열려 화면이 복잡해집니다.

이 동작은 잘못되었습니다.

---

## 9. 원하는 동작

Level 1 순서변경 모드에 들어가기 전의 열림/닫힘 상태를 저장해두고, 완료 후 그대로 복구해야 합니다.

예시:

```txt
변경 전:
Level 2까지만 보기 상태

Level 1 순서변경 모드:
Level 1만 보이도록 임시 표시

순서변경 완료 후:
다시 Level 2까지만 보기 상태로 복구
```

---

## 10. 열림 상태 저장 및 복구 방식

Level 1 순서변경 모드 진입 시 현재 보기 상태를 snapshot으로 저장합니다.

```js
const [expandedSnapshotBeforeLevel1Sort, setExpandedSnapshotBeforeLevel1Sort] = useState(null);
const [viewModeSnapshotBeforeLevel1Sort, setViewModeSnapshotBeforeLevel1Sort] = useState(null);

function startLevel1SortMode() {
  setExpandedSnapshotBeforeLevel1Sort(new Set(expandedIds));
  setViewModeSnapshotBeforeLevel1Sort(currentViewMode);
  setIsLevel1SortMode(true);
}
```

Level 1 순서변경 모드에서는 실제 `expandedIds`를 변경하지 말고, 렌더링 단계에서만 Level 1만 보이게 처리합니다.

```js
const visibleItems = isLevel1SortMode
  ? flattenedItems.filter(item => item.level === 1)
  : getVisibleItemsByExpandedState(flattenedItems, expandedIds, currentViewMode);
```

순서변경 완료 시 저장해둔 상태를 복구합니다.

```js
function finishLevel1SortMode() {
  setIsLevel1SortMode(false);

  if (expandedSnapshotBeforeLevel1Sort) {
    setExpandedIds(expandedSnapshotBeforeLevel1Sort);
    setExpandedSnapshotBeforeLevel1Sort(null);
  }

  if (viewModeSnapshotBeforeLevel1Sort) {
    setCurrentViewMode(viewModeSnapshotBeforeLevel1Sort);
    setViewModeSnapshotBeforeLevel1Sort(null);
  }
}
```

---

## 11. 취소 버튼 동작

취소 버튼이 있다면, 순서변경 모드 진입 전의 메뉴 순서와 열림 상태를 모두 복구해야 합니다.

```js
const [level1SortSnapshot, setLevel1SortSnapshot] = useState(null);

function startLevel1SortMode() {
  setLevel1SortSnapshot({
    menuTree,
    expandedIds: new Set(expandedIds),
    viewMode: currentViewMode
  });

  setIsLevel1SortMode(true);
}

function cancelLevel1SortMode() {
  if (level1SortSnapshot) {
    setMenuTree(level1SortSnapshot.menuTree);
    setExpandedIds(level1SortSnapshot.expandedIds);
    setCurrentViewMode(level1SortSnapshot.viewMode);
    setLevel1SortSnapshot(null);
  }

  setIsLevel1SortMode(false);
}
```

---

# 12. 핵심 수정사항 요약

```txt
1. 보기모드에서는 편집 관련 버튼을 비활성화하거나 숨긴다.
2. 보기모드에서는 Level 1 추가, Level 1 순서변경, 드래그, 삭제, 이름변경이 동작하면 안 된다.
3. 편집모드에서만 Level 1 추가와 Level 1 순서변경을 활성화한다.
4. Level 1 순서변경 모드에서 드롭해도 모드가 종료되면 안 된다.
5. 순서변경 완료 버튼을 눌렀을 때만 Level 1 순서변경 모드가 종료되어야 한다.
6. Level 1 순서변경 모드 진입 전의 expandedIds와 viewMode를 snapshot으로 저장한다.
7. 순서변경 완료 후 기존 열림/닫힘 상태와 보기모드를 복구한다.
8. Level 2까지만 보기 상태였다면 완료 후에도 Level 2까지만 보기 상태로 돌아와야 한다.
9. 전체 펼치기를 강제로 실행하면 안 된다.
```

```