# 영어 끝말잇기 챌린지 (Word Chain Challenge)

중학교 2학년 EFL 학생용 영어 끝말잇기 웹앱. 학생 vs 컴퓨터.

## 구조
- `app.html` — 앱 본체(HTML/CSS/JS). `/*__VOCAB__*/` 자리에 단어장·영어 단어 목록이 들어감. 맨 위 `SETTINGS`에 선생님이 바꿀 수 있는 설정을 모아 둠
- `vocab.js` — 단어장
  - `VOCAB_E` 초등 권장 수준(대명사 격변화, 비교급·최상급, 기본 단어 포함)
  - `VOCAB_M` 중학교 수준
  - `VOCAB_TB` 중학교 기본 어휘 자주 나오는 단어 보충
  - `VOCAB_OLD` 예전 단어장(삭제됨)
  - `VOCAB_NUM` 수 단어(one~twenty, thirty~ninety, hundred, thousand) — 학생 답으로만 인정, 컴퓨터는 내지 않음
  - `VOCAB_WF_E`·`VOCAB_WF_M` 접미사로 만든 단어(동사+er/r 사람·도구, 명사+al, 명사+y/ly, 형용사+ly, 동사+ment, 형용사+ness) — 뜻 뒤에 `(sing+er)`처럼 원래 단어 표시
  - `EMOJI` 그림 단어
- `wordlist.js` — 영어 단어 목록 79,200개(SCOWL size 60, 미국식 철자, 소문자 알파벳 단어만, 욕설·비속어 제외). 단어장 밖 단어가 올바른 영어 단어인지 판정. `tools/make-wordlist.py`로 다시 만들 수 있음
- `blocklist.js` — 부적절한 단어 목록(영어 욕설·성적 어휘·혐오 표현, 한국어 욕설의 로마자·영문 자판 표기). base64로 인코딩해 페이지 소스에서 바로 읽히지 않고 실행할 때 풂. `tools/blocklist.py`로 관리
- `build.py` — `dist/wordchain.html`(claude.ai 아티팩트용, doctype 없음)과 `dist/word-chain-challenge.html`(학생 배포용 단독 HTML) 생성. 화면 아래 `버전`에 빌드 시각(한국 시간)을 넣음. 빌드할 때 영어 단어 목록에서 금지어를 모두 뺌
- `tests/` — Playwright 테스트. 모두 소리 없이 실행(`tests/lib.js`가 단어 읽기를 끄고 음소거)
  - `play-test.js` 도전 2단계 40턴, "이미 나온 단어" 오판 확인
  - `cpu-rules.js` 컴퓨터 단어 첫=끝 글자·수 단어 금지 확인
  - `accept.js 단어…` 학생 답으로 인정되는지 확인
  - `variety.js` 시작 글자 다양성 확인
  - `ime.js` 한글 자판으로 칠 때 글자가 빠지거나 겹치지 않는지 확인(입력기 조합 흉내)
  - `speech.js` 단어 읽기 순서·간격 확인(가짜 음성 엔진, 소리 없음)
  - `judge.js` 단어 판정(단어장 / 단어장 밖 / 틀린 단어)과 철자 도움 확인
  - `basic.js` 기초 4단계(철자 고르기·글자 블록·빈칸 채우기·직접 쓰기), 틀린 보기 규칙, 자동 조절, 건너뛰기 도전, 진도 초기화 확인
  - `listen.js` 듣고 쓰기: 토글, 듣기 챌린지, 다시 듣기, 글자 수, 공개, 끝 글자 설명, 소리 끔 확인
  - `score.js` 콤보·점수·배지: 점수 규칙, 콤보, 축하 효과, 최고 점수, 배지 저장·알림·화면, 통과 화면 확인
  - `blocklist.js` 금지어: 소스에서 안 읽힘, 출력에 없음, 정상 단어가 안 막힘, 입력 시 읽지 않음·기록 안 함·3번째 새 판
  - `levels.js` 수준별 1·2단계를 정답으로 자동 플레이해 통과·오류 확인
  - `notebook.js` 단어 수첩: 오늘의 복습, 도장·복습 간격, 외운 단어, 수첩 비우기, 단어 모으기 확인
  - 앞에 주소를 주면 그 주소(예: GitHub Pages)를, 없으면 로컬 빌드를 테스트
- `tools/blocklist.py` — 금지어 목록 보기·추가·삭제·확인
- `tools/add-words.js` — 단어 확인(`check 단어…`)·추가(`add 파일.txt`, 이미 있는 단어는 건너뜀)
- `.claude/skills/` — Claude Code용 skill: `wordchain-test`, `wordchain-deploy`("완료배포"), `wordchain-add-words`
- `old/` — 이전 버전

## 빌드 / 테스트
```
python build.py
node tests/levels.js
node tests/play-test.js
node tests/cpu-rules.js
```
필요: Python 3.12, Node.js LTS, `npm i -g playwright` + `npx playwright install chromium`. Git Bash의 PATH·NODE_PATH는 `~/.bashrc`에 설정.

## 게임 규칙 요약
- 첫 화면에서 수준 선택: 기초(4단계) / 보통(4단계) / 도전(5단계, 모두 주관식)
- 기초 수준(1~3단계): 앱이 '다음에 올 단어'(컴퓨터 단어의 끝 글자로 시작하는 단어장 단어)를 정해 뜻·그림·소리를 보여 주고, 학생은 그 철자를 완성. 끝말잇기 줄은 그대로 이어짐
  - 1단계 철자 고르기(연속 4): 정답 1개 + 철자만 틀린 보기 2~3개. 틀린 보기는 모음 바꾸기·끝 e 빼기/붙이기·겹자음 빼기/넣기·이웃 글자 순서 바꾸기로 만들고, 서로 겹치거나 실제 영어 단어가 되면 뺌. 숫자 키 1~4로도 고름
  - 2단계 글자 블록 조립(연속 5): 첫 글자는 놓여 있고 섞인 글자 블록을 눌러 완성. 키보드로 글자를 쳐도 됨(한글 자판이어도 자판 위치로), Backspace·↶ 되돌리기
  - 3단계 빈칸 채우기(연속 5): 빈칸에 들어갈 글자만 순서대로 써서 완성(단어 전체를 써도 됨). 처음 1칸, 잘할수록 늘어 최대 절반
  - 4단계 직접 쓰기(연속 6): 예전 기초 직접 쓰기와 같음(2글자 이상)
  - 자동 조절: 같은 단계에서 3연속 정답이면 한 칸 어렵게, 2연속 오답이면 한 칸 쉽게(1단계 보기 수, 2단계 헷갈리는 글자 블록 수, 3단계 빈칸 수). 상태 줄에 '난이도 N ▲/▼'. `SETTINGS.adapt`
  - 힌트(3번)는 '한 글자 더 보여 주기'
  - 건너뛰기 도전: 기초 1단계를 처음 할 때 힌트·실수 없이 통과하면 통과 화면에 '3단계로 바로 가기'(1·2단계 통과 처리). 필요한 연속 수는 `SETTINGS.skipStreak`(기본 5, 1단계 목표 4보다 크면 목표 수)
  - 기초를 4단계로 바꾸면서 예전 기초 진도만 한 번 초기화(다른 수준 진도는 유지)
- 단계마다 연속 성공 목표를 채우면 다음 단계가 열림. 힌트는 한 도전에 3번
- 컴퓨터 단어 길이는 단계의 `cpuMin`/`cpuMax`로 조절
- 규칙 변화 비교급·최상급(bigger, happiest 등)은 학생 답으로는 인정, 컴퓨터 출제·보기·힌트에는 쓰지 않음 (better/best 등 불규칙은 출제 가능)
- y로 끝나는 단어는 컴퓨터 출제 빈도 1/4
- 컴퓨터는 첫 글자와 끝 글자가 같은 단어(dad, trust 등)는 내지 않음
- 학생이 시작할 글자가 겹치지 않도록, 컴퓨터는 최근 두 번 요구한 글자로 끝나는 단어를 피함(다른 후보가 없을 때만 허용)
- 컴퓨터는 끝 글자를 먼저 고르게 뽑은 뒤 그 글자로 끝나는 단어를 고름 → b·p·f처럼 드문 글자로도 시작하게 됨
- 스피드 챌린지 기본 제한 시간: 보통 30초 · 도전 25초. 홈 화면과 게임 화면의 −5초/+5초 버튼으로 10~90초 조절(수준·단계별 저장). 게임 중 늘리기는 바로, 줄이기는 다음 단어부터 적용
- 영문 입력: 휴대폰은 `inputmode="email"`로 영문 자판이 뜸. PC에서 한글 자판으로 치면 같은 자리의 영문 글자로 자동 변환(두벌식 기준, 메ㅔㅣㄷ → apple)
- 기본 어휘 단어 우선: 컴퓨터 출제·객관식 정답·힌트·예시에서 중2 기본 어휘 단어 8배, 중1 기본 어휘 단어 5배 가중치 (출처 표시는 하지 않음)
- 단어 판정(주관식): ① 단어장 단어 → 정답, 뜻 표시 ② 단어장엔 없지만 영어 단어 목록(변화형 포함)에 있음 → 정답, "📗 단어장 밖 단어"(뜻 없음), 컴퓨터가 끝 글자로 이어 감 ③ 둘 다 없음 → 같은 첫 글자·철자 차이 1~2인 단어장 단어를 최대 3개 보여 주고(누를 수 없고 직접 다시 써야 함) 1번 더 기회, 두 번째도 틀리면 오답. 다시 쓸 기회 수는 `SETTINGS.wrongRetry`(0이면 바로 오답)
- 듣고 쓰기: 컴퓨터 단어를 화면에 보여 주지 않고 소리로만 들려줌. 학생은 들은 단어의 끝 글자로 시작하는 단어를 씀. 답을 내면(정답·오답 모두) 컴퓨터 단어를 공개하고, 끝 글자를 놓친 이유가 소리 나지 않는 끝 글자(끝의 묵음 e, -y[이], -le, -gh)이면 짧게 설명
  - 보통 2~4단계: "🎧 듣고 쓰기" 토글(다음 단어부터 적용, 다시 듣기 2번, 글자 수 □ 표시). 켜고 끈 상태는 저장됨
  - 도전 5단계 "듣기 챌린지": 4단계를 통과해야 열림, 연속 8번 목표, 다시 듣기 1번, 글자 수 표시 없음, 소리를 끌 수 없음
  - 소리 읽기(speechSynthesis)가 안 되는 브라우저에서는 토글이 비활성화되고 이유를 표시(듣기 챌린지는 단어를 보여 줌). 소리를 끄면 듣고 쓰기를 켤 수 없음. 다시 듣기 횟수는 `SETTINGS.listen`
- 나의 단어 수첩(꺼내 쓰기·간격 복습): 틀렸을 때 나온 정답 예시, 힌트로 본 단어, 처음 맞힌 기본 어휘 단어를 자동으로 모음. 처음 모은 다음 날 복습 → 맞히면 3일 → 7일 뒤, 틀리면 다음 날로 되돌림, 도장 3개면 '외운 단어'. 복습할 단어가 있으면 첫 화면·단계 목록에 "오늘의 복습 N개" 버튼(강제 아님). 복습은 뜻(그림)과 소리를 보고 듣고 철자를 직접 씀, 기초 수준이면 빈칸 채우기 형태(t _ g _ r). 단계 목록의 "📒 단어 수첩"에서 모은 단어·뜻·도장·외운 단어를 보고, "수첩 비우기"(두 번 눌러 확인). 간격은 `SETTINGS.review`
- 콤보·점수·배지(동기 부여용, 단계 통과 조건은 그대로)
  - 콤보: 연속 성공 3번부터 "🔥 3콤보" 표시, 5·10콤보에서 짧은 축하 효과(동작 줄이기 설정이면 생략). 틀리면 0, 단어 목록에 없어 다시 쓰는 경우는 유지
  - 점수(한 판, 감점 없음): 정답 10 + 길이 보너스(5글자 이상 (글자 수 − 4) × 2) + 기본 어휘(중2 +5, 중1 +3) + 단어장 밖 단어 +3, 콤보 배율(3~4 ×1.2, 5~9 ×1.5, 10 이상 ×2, 소수점 버림), 듣고 쓰기 ×1.5. 힌트를 쓴 턴은 길이·기본 어휘 보너스만 없어짐. 화면 위에 현재 점수, 단계 목록에 이 단계 최고 점수
  - 배지 14개: 첫걸음, 불꽃 5/10, 긴 단어(7글자 이상), 기본 어휘 탐험가 10/30(서로 다른 기본 어휘 단어, 누적), 사전 밖 모험가(단어장 밖 단어 5개, 누적), 힌트 없이(단계 통과), 다시 일어서기(틀린 직후 판에서 5연속), 복습왕(외운 단어 10개), 귀가 밝아요(듣고 쓰기 5연속), 기초·보통·도전 정복. 처음 얻으면 화면 아래 3초 알림, 단계 목록 "🏅 배지"에서 얻은 배지와 못 얻은 배지(조건, 흐리게)를 봄
  - 단계 통과 화면에 이번 판 점수·최고 콤보·이번에 얻은 배지
  - 점수 값은 `SETTINGS.score`, 콤보는 `SETTINGS.combo`, 배지 조건 숫자는 `SETTINGS.badge`
- 부적절한 단어 차단
  - 판정 순서: 단어장 단어면 항상 허용 → 금지어 확인 → 단어장 밖 판정 → 철자 도움
  - 비교는 대소문자 무시, 같은 글자 3번 이상 반복은 2번으로 줄임(일부러 늘여 쓴 입력은 1번으로 줄인 형태도 비교). 정확히 같은 금지어는 항상, 강한 표현은 단어장 밖 입력 안에 들어 있기만 해도 막음(class, grape, assistant, saltwater 같은 정상 단어는 테스트로 확인)
  - 금지어를 쓰면 소리로 읽지 않고, 단어를 다시 보여 주지 않고, 입력 칸을 비운 뒤 "이 단어는 사용할 수 없어요. 다른 단어를 써 보세요."만 표시. 정답·점수·콤보·배지·단어 수첩·연속 기록에 반영하지 않음. 한 판에서 3번째면 오답 처리(연속 기록 0) 후 새 판. 입력 내용·횟수는 저장하지 않음
  - 컴퓨터 출제·힌트·예시·객관식 보기·듣고 쓰기·단어 수첩 복습·철자 도움에는 금지어가 나오지 않음
- 키보드만으로 조작: 모든 버튼은 Tab·Enter, 객관식·철자 고르기는 숫자 키 1~4, 글자 블록은 글자 키·Backspace
- 진행 기록과 제한 시간 설정은 브라우저 localStorage(`wordchain-v2`)에 수준별로 저장

## 설정값 위치
`app.html` 스크립트 맨 위 `SETTINGS` 객체에 모여 있다. 숫자만 바꾸고 `python build.py`.
| 설정 | 내용 | 기본값 |
|---|---|---|
| `wrongRetry` | 틀린 단어에 다시 쓸 기회(0이면 바로 오답) | 1 |
| `suggestMax` · `suggestDist` | 철자 도움 단어 수 · 허용 글자 차이 | 3 · 2 |
| `review.intervals` · `review.stampsToLearn` | 복습 간격(일) · 외운 단어가 되는 도장 수 | [1,3,7] · 3 |
| `adapt.upAfter` · `adapt.downAfter` | 기초 자동 조절: 연속 정답/오답 횟수 | 3 · 2 |
| `skipStreak` | 건너뛰기 도전에 필요한 연속 성공(1단계 목표보다 크면 목표 수) | 5 |
| `listen.normalReplays` · `listen.hardReplays` | 듣고 쓰기 다시 듣기 횟수(보통 · 듣기 챌린지) | 2 · 1 |
| `basicSpeech.rate` · `basicSpeech.targetGap` | 기초 수준 읽기 속도 · 컴퓨터 단어를 읽고 다음 단어를 읽기까지 쉬는 시간(ms) | 0.6 · 1500 |
| `score` | 점수 기본·보너스·콤보 배율·듣고 쓰기 배율 | 위 규칙 |
| `combo.show` · `combo.celebrate` | 콤보 표시 시작 · 축하 효과 | 3 · [5,10] |
| `badge` | 배지 조건 숫자 | 위 규칙 |

단계 구성(목표 연속 수, 글자 수, 제한 시간 등)은 같은 파일의 `TRACKS`, 읽기 속도·흐름 여유는 `SPEECH_RATE` 등.

## localStorage 키 (학생 기기에만 저장, 개인 정보 없음)
| 키 | 저장 내용 |
|---|---|
| `wordchain-v2` | 마지막 수준(`track`), 수준별 진도 `prog.{basic,normal,hard}` = `{unlocked, best(단계별 최고 연속), cleared, bestScore(단계별 최고 점수)}`, 제한 시간 설정 `time`, 듣고 쓰기 토글 `listen`, 배지용 누적 기록 `stats = {tb: 맞힌 기본 어휘 단어, outside: 단어장 밖 단어 수}`, 기초 구성 버전 `basicVer` |
| `wordchain-notebook-v1` | 단어 수첩 `items = {단어: {w, reason, stamps, due}}`, 외운 단어 `learned = {단어: {w, date}}`, 처음 맞힌 기본 어휘 단어 `tbSeen` |
| `wordchain-badges-v1` | 얻은 배지 `[{id, date}]` |

이름·학번·목소리 등은 받거나 저장하지 않는다. 음성 인식은 쓰지 않고 음성 합성(speechSynthesis)만 쓴다.

## 금지어 목록 고치기 (선생님용)
목록은 `blocklist.js`에 인코딩되어 있어 직접 열어 고치지 않고 명령으로 고친다. 고친 뒤에는 `python build.py`로 다시 빌드한다.
```
python tools/blocklist.py show                    # 목록 보기
python tools/blocklist.py add 단어 단어            # 정확히 같을 때 막는 단어 추가
python tools/blocklist.py add --strong 표현        # 단어장 밖 입력 안에 들어 있기만 해도 막는 강한 표현 추가
python tools/blocklist.py allow 단어               # 강한 표현이 들어 있어도 허용할 정상 단어(예: snigger)
python tools/blocklist.py remove 단어              # 삭제
python tools/blocklist.py check 단어 단어          # 막히는지 확인
```
- 강한 표현은 정상 단어 안에 들어 있을 수 있으니 추가한 뒤 `node tests/blocklist.js`로 정상 단어가 막히지 않는지 확인한다(예: 'twat'은 saltwater·wristwatch를 막아서 정확히 같을 때만 막도록 둠)
- 단어장(vocab.js)에 있는 단어는 금지어 목록과 관계없이 항상 허용된다. 단어장 단어를 막고 싶으면 단어장에서 지운다

## 단어 목록 라이선스
`wordlist.js`는 SCOWL/ESDB(https://wordlist.aspell.net)로 만든 목록이다.

> Copyright 2000-2026 by Kevin Atkinson. Permission to use, copy, modify, distribute, and sell any part of the English Speller Database (ESDB, previously known as SCOWLv2), or word lists created from it, is hereby granted without fee, provided that the above copyright notice appears in all copies and that both the above copyright notice and this notice appear in supporting documentation. Kevin Atkinson makes no representations about the suitability of this database for any purpose. It is provided "as is" without express or implied warranty.

전체 고지문은 `wordlist.js` 맨 위 주석에 있다.

## 배포
- 아티팩트: https://claude.ai/artifact/NGfWkdm9cd8TZwe1x4yiXg (비공개 — 공유 메뉴에서 공개 설정 필요)
- 학생용: `dist/word-chain-challenge.html`을 학교 홈페이지·구글 사이트 등에 업로드

## 남은 과제
- 교육부 [별표] 기본 어휘 원본 목록을 받으면 `vocab.js` 교체·보강
