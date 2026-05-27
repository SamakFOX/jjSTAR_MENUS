# Level 2 → Level 3 복귀 및 Undo 기능 수정 요청

## 1. 현재 문제

현재 Level 3 메뉴가 실수로 Level 2로 올라간 뒤, 다시 Level 3으로 되돌릴 수 없는 문제가 있습니다.

예시:

```txt
학사정보 L1
  AHA 교육이수증 L2
  교육과정 L2
    교양 교육과정 조회 L3
    전공 교육과정 조회 L3
    교육과정 시뮬레이션 L3
````

이 상태에서 `AHA 교육이수증`은 자식이 없는 Level 2 메뉴이므로, Level Down 버튼을 누르면 다시 Level 3으로 변경될 수 있어야 합니다.

---

## 2. 정상 동작 예시

`AHA 교육이수증`의 Level Down 버튼을 누르면, 바로 뒤에 같은 Level 1 안의 `교육과정 L2`가 있으므로 `교육과정`의 첫 번째 Level 3 메뉴로 들어가야 합니다.

변경 후:

```txt
학사정보 L1
  교육과정 L2
    AHA 교육이수증 L3
    교양 교육과정 조회 L3
    전공 교육과정 조회 L3
    교육과정 시뮬레이션 L3
```

즉, 현재처럼 아무 반응이 없으면 안 됩니다.

---

## 3. Level 2 Down 동작 확정 규칙

Level 2를 Level Down 하면 Level 3이 됩니다.

단, 다음 조건을 지켜야 합니다.

```txt
1. 해당 Level 2에 하위메뉴가 없어야 한다.
2. 같은 Level 1 안의 형제 Level 2만 대상이 된다.
3. 바로 뒤에 같은 부모의 Level 2가 있으면 그 Level 2의 첫 번째 Level 3으로 이동한다.
4. 뒤에 Level 2가 없으면 바로 앞 같은 부모의 Level 2의 마지막 Level 3으로 이동한다.
5. 앞뒤에 받을 수 있는 Level 2가 모두 없으면 Level Down 불가 안내를 띄운다.
```

---

## 4. 자식 없는 Level 2는 반드시 Level Down 가능해야 함

자식이 없는 Level 2는 같은 Level 1 안에 다른 Level 2가 하나라도 있으면 Level 3으로 변경 가능해야 합니다.

현재처럼 자식이 없는 Level 2인데도 Level Down 버튼이 아무 반응이 없으면 안 됩니다.

---

## 5. Level Down 불가 조건과 안내 문구

### 5.1 같은 Level 1 안에 받을 Level 2가 없는 경우

```txt
이 메뉴를 Level 3으로 변경할 수 없습니다.
같은 Level 1 안에 이동할 대상 Level 2가 없습니다.
```

### 5.2 자식이 있는 Level 2인 경우

```txt
"{메뉴명}"에는 하위메뉴가 있어 Level 3으로 변경할 수 없습니다.
먼저 하위메뉴를 이동하거나 삭제해 주세요.
```

---

## 6. Undo 기능 추가 요청

현재 Level 변경, 이동, 삭제, 통합 후 되돌릴 방법이 없어 편집 위험도가 높습니다.

따라서 Undo 기능을 추가해야 합니다.

---

## 7. Undo 요구사항

```txt
1. 최근 작업 기준 최대 10회까지 되돌리기 가능
2. 이동, Level Up, Level Down, 삭제, 통합, 이름변경, 추가 작업 모두 Undo 대상
3. 작업 전 menuTree 상태를 history stack에 저장
4. Undo 버튼 클릭 시 직전 menuTree로 복원
5. Undo 후 화면도 해당 위치로 스크롤하거나 변경된 메뉴를 하이라이트
```

---

## 8. 권장 상태 구조

```js
const [menuTree, setMenuTree] = useState(initialMenuTree);
const [historyStack, setHistoryStack] = useState([]);

function commitMenuChange(nextTree, log) {
  setHistoryStack(prev => [
    {
      tree: menuTree,
      log,
      createdAt: new Date().toISOString()
    },
    ...prev
  ].slice(0, 10));

  setMenuTree(nextTree);
}

function undoLastChange() {
  setHistoryStack(prev => {
    if (prev.length === 0) return prev;

    const [last, ...rest] = prev;
    setMenuTree(last.tree);
    return rest;
  });
}
```

---

## 9. Undo 버튼 UI

상단 편집 영역에 Undo 버튼을 추가합니다.

```txt
[되돌리기]
```

historyStack이 비어 있으면 비활성화합니다.

---

## 10. 작업 직후 토스트 예시

작업 직후에는 되돌리기 가능한 토스트를 표시하면 좋습니다.

```txt
"AHA 교육이수증"이 Level 3으로 변경되었습니다. [되돌리기]
```

또는

```txt
"장학관리"가 "수강관리"로 통합되었습니다. [되돌리기]
```

---

## 11. 핵심 정리

```txt
1. 자식 없는 Level 2는 같은 Level 1 안에 다른 Level 2가 있으면 반드시 Level 3으로 내릴 수 있어야 한다.
2. Level 2 Down 시 바로 뒤의 Level 2가 있으면 그 Level 2의 첫 번째 Level 3으로 들어간다.
3. 뒤에 Level 2가 없으면 바로 앞 Level 2의 마지막 Level 3으로 들어간다.
4. 불가능한 경우에는 아무 반응 없이 끝내지 말고 안내 문구를 표시한다.
5. 모든 주요 편집 작업은 최대 10회까지 Undo 가능해야 한다.
```

```