---
name: wordchain-test
description: 영어 끝말잇기 앱을 소리 없이(단어 읽기 음소거) 브라우저 테스트한다. 앱 변경 후 확인, 단어가 정답으로 인정되는지, 컴퓨터 출제 규칙(첫=끝 글자·수 단어 금지), 시작 글자 다양성, 배포된 GitHub Pages 확인에 사용. "테스트해", "확인해", "인정되는지" 같은 요청에 쓴다.
---

# 끝말잇기 테스트 (소리 없음)

앱은 단어를 `speechSynthesis`로 읽는다. 화면 없는(headless) Chromium에서도 Windows 음성으로 **소리가 난다**.
`tests/lib.js`의 `open()`이 speechSynthesis를 무력화하고 `--mute-audio`로 띄우므로, 새 테스트도 반드시 `open()`을 쓴다. `open()`은 규칙 창(수준·단계 안내)도 건너뛰고(`window.__wordchainNoIntro`, 규칙 창을 볼 때는 `open({intro:true})`) 선생님 모드를 켠다("모든 단계 열기" 버튼, 학생 화면은 `open({student:true})`).

## 준비
- Python 3.12, Node.js, 전역 `playwright` + Chromium이 설치돼 있다. PATH·NODE_PATH는 `~/.bashrc`에 있다.
- 테스트 전에 빌드: `python build.py` (dist/를 만든다)

## 테스트 목록 (저장소 루트에서 실행)
| 명령 | 확인하는 것 | 시간 |
|---|---|---|
| `node tests/levels.js [주소]` | 수준별 1·2단계를 정답으로 자동 플레이해 통과·페이지 오류 | ~2분 |
| `node tests/judge.js [주소]` | 단어 판정(단어장/단어장 밖/틀린 단어)·철자 도움 | ~30초 |
| `node tests/notebook.js [주소]` | 단어 수첩: 맞힐 때마다 도장(제한 없음)·단어 눌러 학습·두 번 틀리면 연습하기 → 다시 도전·외운 단어 | ~30초 |
| `node tests/basic.js [주소]` | 기초 4단계·틀린 보기·자동 조절·건너뛰기·진도 초기화·첫 글자 빈칸 | ~1분 |
| `node tests/listen.js [주소]` | 듣고 쓰기 토글·듣기 챌린지·공개·다음 문제까지 시간(보통 4초·챌린지 3.5초)·듣기 힌트(끝에서 두 번째 글자→뜻)·끝 글자 설명(-th·-ed·-te·-ck·-ic·-ph·-mb·-mn·-gn·묵음/f 소리 -gh·묵음 e·-y·-le, 맞히면 "잘 들었어요!", 힌트 화면엔 없음) | ~40초 |
| `node tests/score.js [주소]` | 콤보·점수·배지·통과 화면 | ~1분 |
| `node tests/blocklist.js [주소]` | 금지어: 소스에서 안 읽힘, 출력에 없음, 정상 단어 안 막힘, 입력 시 읽지 않음·기록 안 함 | ~30초 |
| `node tests/shop.js [주소]` | 수첩 모두 학습하기·수첩 단어 보너스·별 모으기·힌트 사기·다시 듣기·시간 사기 | ~1분 |
| `node tests/rest.js [주소]` | 통과 뒤(게임 화면 그대로): 결과 요약 창(정답률·시간·이번 배지만·3초 뒤 저절로 닫힘), 주고받은 단어 다시 보기(처음부터 밀어 올림·좌우·누르면 읽기·Enter로 전부·동작 줄이기), 가운데 "다음 ▶", 선물 상자(저절로 열고 닫힘·등급·보상·보관 힌트 대체), 단계 맵으로/다음 단계로, 수준 정복 | ~1.5분 |
| `node tests/map.js [주소]` | 첫 화면(제목·수준 3개·작은 복습하기), 규칙 창(2쪽·SKIP·Enter·Esc), 단계 맵(길·잠김·도착점·말풍선·다른 단계 흐림·손가락 두 번), 단계 규칙 창(한마디·방법·목표·시간 조절), 게임 화면(☰·제목·소리 아이콘·채팅 위 가운데 문제 창·정답 뒤 감춤) | ~40초 |
| `node tests/lives.js [주소]` | 하트(보통·도전): 하트 1개 잃기·성공 수 유지·다 잃으면 처음부터·통과, 목표·문구, 진행 쉼(약 2초), 예전 진도, 기초는 예전 방식 | ~1분 |
| `node tests/mobile.js [주소]` | 휴대폰: 화면 키보드가 올라오면 줄인 화면·입력칸이 키보드 위에·밀려 올라간 화면 되돌림(가짜 visualViewport), 끝 글자 건네주기·반짝임(선 없음) | ~30초 |
| `node tests/update.js` | 새 버전 알림: 같은 버전이면 없음, 다른 버전이면 띠, ✕ 닫기, 누르면 `?v=` 새 주소로 이동 (임시 서버) | ~10초 |
| `node tests/hints.js [주소]` | 보관 힌트: 무료 먼저, 단계 이동 후 유지, 수준 간 분리, 한도, 도전당 사용 제한, 기록 지우기 | ~1분 |
| `node tests/play-test.js` | 도전 2단계 40턴, "이미 나온 단어" 오판·오류 | ~1분 |
| `node tests/cpu-rules.js [주소] [단계당 수]` | 컴퓨터 단어 첫=끝 글자 금지, 수 단어 금지, 단어장 단어만(기본 어휘 level 3·인정 전용 금지), 기초 수준은 기본 어휘 ★·★★만(완성할 단어 포함) | ~1분 |
| `node tests/core-vocab.js [주소]` | 기본 어휘: 빌드에 예전 단어장 자료(뜻·쪽수·자료 이름) 없음, 가중치 ×5, level 3는 출제 안 함·학생 답 인정, 기본 어휘 탐험가 배지·예전 배지 유지·수첩 사유 | ~40초 |
| `node tests/license.js [주소]` | 저작권·출처: SCOWL 고지 + 허가문 전문이 빌드 결과(`dist/*.html`)·NOTICE.md·README·intro.html에 그대로(연도까지 `wordlist.js`와 같음), 앱 '출처·저작권' 창에 보임, '버전'(선생님 모드)과 따로 동작. 이 앱의 저작권 줄(© 2026 miagua7801)·CC BY-NC-ND 4.0 링크가 LICENSE·README·NOTICE·intro.html·빌드 결과 맨 위 주석·출처 창에 있는지 | ~15초 |
| `node tests/accept.js [주소] word1 word2 …` | 학생 답으로 인정되는지 | 단어 수에 비례 |
| `node tests/variety.js [주소] [턴 수]` | 시작 글자가 최근 2번과 겹친 횟수, 글자 종류 | ~3분 |
| `node tests/ime.js [주소]` | 한글 자판으로 칠 때: 화면 키보드식 조합은 끝난 뒤 영어로(빠짐·겹침 없음), 실제 키보드+한글 입력기는 영문 고정으로 바로 영어(빈칸 칸 포함) | ~20초 |
| `node tests/speech.js [주소]` | 단어 읽기: 앞에 무음 여유, 끊은 뒤 쉬었다 읽기, 학생 단어 다 읽은 뒤 컴퓨터 단어 (가짜 음성 엔진, 소리 없음) | ~10초 |

- `[주소]`를 빼면 로컬 빌드(`dist/word-chain-challenge.html`), 주면 그 주소(예: `https://miagua7801.github.io/wordchain/`).
- `accept.js`는 컴퓨터 단어가 해당 글자로 끝날 때까지 넘기며 시험한다. v·j·q처럼 끝 글자로 거의 안 나오는 글자로 시작하는 단어는 '못 해 봄'이 되므로, 그런 단어는 `vocab.js`에 들어갔는지만 확인한다.
- 오래 걸리는 테스트는 백그라운드로 돌리고, 진행 중에는 결과를 기다린다. 결과는 마지막에 짧게 보고한다.
- 종료 코드: accept·cpu-rules·license는 실패 시 1.

## 다른 테스트 skill과 함께 쓸 때
`webapp-testing`(Python Playwright) 등으로 따로 스크립트를 쓸 때도 반드시 소리를 끈다:
```python
b = p.chromium.launch(headless=True, args=['--mute-audio'])
page = b.new_page()
page.add_init_script("Object.defineProperty(window,'speechSynthesis',{value:{speak(){},cancel(){}}})")
```
이 앱은 서버 없이 `file://` 로 열리는 단독 HTML이라 `with_server.py`는 필요 없다.

## 배포본이 예전 같을 때
화면 아래 `버전 YYYY-MM-DD HH:MM`(빌드 시각, 한국 시간)를 확인한다. 최신 배포 시각보다 이르면 브라우저 캐시(Pages는 최대 10분)이므로 Ctrl+F5.
