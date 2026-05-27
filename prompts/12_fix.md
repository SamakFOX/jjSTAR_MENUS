# Level 1 순서변경 모드 자동 종료 및 전체 펼침 문제 재수정 요청

## 1. 현재 문제

아직도 `Level 1 순서변경` 모드에서 Level 1 메뉴 하나를 드래그해 이동하면, 순서가 반영된 직후 모드가 자동 종료되고 전체 메뉴가 모두 펼쳐집니다.

이 문제는 반드시 수정되어야 합니다.

---

## 2. 현재 잘못된 동작

```txt
Level 1 순서변경 클릭
→ Level 1 목록만 표시
→ Level 1 하나 드래그 이동
→ 드롭 즉시 순서변경 모드 종료
→ 전체 메뉴가 모두 펼쳐짐
````

---

## 3. 원하는 동작

```txt
Level 1 순서변경 클릭
→ Level 1 목록만 표시
→ Level 1 여러 개를 원하는 만큼 드래그 이동 가능
→ 순서변경 완료 버튼 클릭
→ 그때만 순서변경 모드 종료
→ 모드 진입 전 열림/닫힘 상태 복구
```

즉, **드롭 한 번으로 순서변경 모드가 종료되면 안 됩니다.**

---

# 4. 드래그 종료 함수에서 모드 종료 금지

다음 함수들을 모두 확인해 주세요.

```txt
handleDragEnd
handleLevel1DragEnd
handleSortEnd
onDragEnd
onReorderEnd
```

이 함수들 안에 아래 코드가 있으면 제거해야 합니다.

```js
setIsLevel1SortMode(false);
setIsLevel1Ordering(false);
setLevel1SortMode(false);
setIsReorderMode(false);
setSortMode(false);
finishLevel1SortMode();
completeLevel1Sort();
cancelLevel1SortMode();
```

Level 1 순서변경 모드에서 드래그 종료 시에는 **순서만 변경하고, 모드는 유지**해야 합니다.

```js
function handleLevel1DragEnd(event) {
  reorderLevel1(event);

  // 금지
  // setIsLevel1SortMode(false);
  // finishLevel1SortMode();

  // 모드는 그대로 유지
}
```

---

# 5. 순서변경 완료 버튼에서만 모드 종료

Level 1 순서변경 모드는 반드시 아래 버튼을 눌렀을 때만 종료되어야 합니다.

```js
function finishLevel1SortMode() {
  setIsLevel1SortMode(false);
  restoreExpandedStateBeforeLevel1Sort();
}
```

```jsx
<button onClick={finishLevel1SortMode}>
  순서변경 완료
</button>
```

드롭 이벤트에서 `finishLevel1SortMode()`를 호출하면 안 됩니다.

---

# 6. 전체 펼침 발생 로직 제거

Level 1 순서변경 후 전체 메뉴가 열리는 문제는 `menuTree` 또는 `items` 변경 시 `expandedIds`를 다시 초기화하는 로직 때문일 가능성이 큽니다.

아래와 같은 코드를 제거하거나 수정해 주세요.

```js
useEffect(() => {
  if (items.length > 0 && expandedIds.size === 0) {
    setExpandedIds(new Set(items.map(i => i.id)));
  }
}, [items]);
```

또는 아래와 같은 코드도 금지합니다.

```js
useEffect(() => {
  setExpandedIds(new Set(allIds));
}, [menuTree]);
```

이런 방식은 메뉴 순서가 바뀔 때마다 열림 상태를 전체 펼침으로 바꿔버릴 수 있습니다.

---

# 7. expandedIds는 menuTree 변경마다 초기화하지 않기

`expandedIds`는 사용자의 보기 상태입니다.

따라서 메뉴 순서가 바뀌었다고 해서 전체 펼침으로 초기화하면 안 됩니다.

수정 원칙:

```txt
menuTree 변경
→ 메뉴 구조만 변경

expandedIds
→ 기존 상태 유지

Level 1 순서변경 모드 진입
→ expandedIds snapshot 저장

Level 1 순서변경 모드 중
→ 렌더링상 Level 1만 표시

순서변경 완료
→ snapshot으로 expandedIds 복구
```

---

# 8. Level 1 순서변경 모드용 렌더링 분리

Level 1 순서변경 모드에서는 실제 `expandedIds`를 비우거나 바꾸지 말고, 렌더링할 때만 Level 1만 보여주세요.

```js
const visibleItems = isLevel1SortMode
  ? flattenedItems.filter(item => item.level === 1)
  : getVisibleItemsByExpandedState(flattenedItems, expandedIds);
```

절대 이렇게 하면 안 됩니다.

```js
if (isLevel1SortMode) {
  setExpandedIds(new Set());
}
```

또는:

```js
if (isLevel1SortMode) {
  collapseAll();
}
```

이 방식은 기존 사용자의 열림 상태를 잃게 만들 수 있습니다.

---

# 9. 상태 snapshot 구조

Level 1 순서변경 모드 진입 시 상태를 저장합니다.

```js
function startLevel1SortMode() {
  setLevel1SortSnapshot({
    menuTree,
    expandedIds: new Set(expandedIds),
    viewMode: currentViewMode,
  });

  setIsLevel1SortMode(true);
}
```

완료 시:

```js
function finishLevel1SortMode() {
  setIsLevel1SortMode(false);

  if (level1SortSnapshot) {
    setExpandedIds(level1SortSnapshot.expandedIds);
    setCurrentViewMode(level1SortSnapshot.viewMode);
  }

  setLevel1SortSnapshot(null);
}
```

중요:

```txt
순서변경 완료 시 menuTree는 현재 변경된 순서를 유지한다.
expandedIds와 viewMode만 snapshot 상태로 복구한다.
```

취소 시에는 `menuTree`까지 snapshot으로 되돌립니다.

```js
function cancelLevel1SortMode() {
  if (level1SortSnapshot) {
    setMenuTree(level1SortSnapshot.menuTree);
    setExpandedIds(level1SortSnapshot.expandedIds);
    setCurrentViewMode(level1SortSnapshot.viewMode);
  }

  setIsLevel1SortMode(false);
  setLevel1SortSnapshot(null);
}
```

---

# 10. 반드시 확인할 것

아래 조건을 모두 만족해야 합니다.

```txt
1. Level 1 순서변경 모드에서 드롭해도 isLevel1SortMode가 true로 유지된다.
2. 드롭 후 Level 1 목록만 계속 보인다.
3. 여러 번 드래그해서 순서를 바꿀 수 있다.
4. 순서변경 완료 버튼을 눌러야만 모드가 종료된다.
5. 모드 종료 후 전체 펼침이 발생하지 않는다.
6. 모드 진입 전 Level 2까지만 보기 상태였다면 완료 후에도 Level 2까지만 보기 상태로 복구된다.
7. 모드 진입 전 일부 메뉴만 열려 있었다면 완료 후 그 상태로 복구된다.
```

---

# 11. 디버깅 로그 추가 요청

문제 확인을 위해 임시로 아래 로그를 추가해 주세요.

```js
useEffect(() => {
  console.log('isLevel1SortMode changed:', isLevel1SortMode);
}, [isLevel1SortMode]);

useEffect(() => {
  console.log('expandedIds changed:', Array.from(expandedIds));
}, [expandedIds]);

function handleLevel1DragEnd(event) {
  console.log('Level1 drag end');
  console.log('before isLevel1SortMode:', isLevel1SortMode);

  reorderLevel1(event);

  setTimeout(() => {
    console.log('after drag isLevel1SortMode:', isLevel1SortMode);
  }, 0);
}
```

드롭 직후 `isLevel1SortMode`가 `false`로 바뀐다면, 어딘가에서 모드를 종료시키는 코드가 남아 있는 것입니다.

드롭 직후 `expandedIds`가 전체 id로 바뀐다면, `menuTree/items` 변경 시 `expandedIds`를 전체 펼침으로 초기화하는 `useEffect`가 남아 있는 것입니다.

---

# 12. 핵심 원인 후보

현재 증상은 거의 아래 둘 중 하나입니다.

```txt
1. 드래그 종료 시 setIsLevel1SortMode(false)가 어딘가에서 실행되고 있음
2. menuTree/items 변경 시 expandedIds를 전체 펼침으로 초기화하는 useEffect가 남아 있음
```

이 두 개를 직접 찾아서 제거해야 해결됩니다.

---

# 13. 핵심 요약

```txt
드래그 종료 = 순서만 변경
모드 종료 = 순서변경 완료 버튼에서만 실행
expandedIds = menuTree 변경마다 초기화 금지
Level 1 순서변경 모드 = 렌더링상 Level 1만 표시
완료 후 = 기존 열림/닫힘 상태와 보기모드 복구
```

```
