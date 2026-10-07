# 영어 끝말잇기 챌린지 (Word Chain Challenge)

중학교 2학년 EFL 학생용 영어 끝말잇기 웹앱. 학생 vs 컴퓨터.

## 구조
- `app.html` — 앱 본체(HTML/CSS/JS). `/*__VOCAB__*/` 자리에 단어장이 들어감
- `vocab.js` — 단어장
  - `VOCAB_E` 초등 권장 수준(대명사 격변화, 비교급·최상급, 기본 단어 포함)
  - `VOCAB_M` 중학교 수준
  - `VOCAB_TB` 중학교 교과서 자주 나오는 단어 보충
  - `VOCAB_DONGA` 학교 교과서(동아출판 2022 개정 중학 영어 윤정미 1·2) New Words 442개(중2 217 · 중1 225) — 교과서 뜻·쪽수 포함
  - `VOCAB_NUM` 수 단어(one~twenty, thirty~ninety, hundred, thousand) — 학생 답으로만 인정, 컴퓨터는 내지 않음
  - `VOCAB_WF_E`·`VOCAB_WF_M` 접미사로 만든 단어(동사+er/r 사람·도구, 명사+al, 명사+y/ly, 형용사+ly, 동사+ment, 형용사+ness) — 뜻 뒤에 `(sing+er)`처럼 원래 단어 표시
  - `EMOJI` 그림 단어
- `build.py` — `dist/wordchain.html`(claude.ai 아티팩트용, doctype 없음)과 `dist/word-chain-challenge.html`(학생 배포용 단독 HTML) 생성. 화면 아래 `버전`에 빌드 시각(한국 시간)을 넣음
- `tests/` — Playwright 테스트. 모두 소리 없이 실행(`tests/lib.js`가 단어 읽기를 끄고 음소거)
  - `play-test.js` 도전 2단계 40턴, "이미 나온 단어" 오판 확인
  - `cpu-rules.js` 컴퓨터 단어 첫=끝 글자·수 단어 금지 확인
  - `accept.js 단어…` 학생 답으로 인정되는지 확인
  - `variety.js` 시작 글자 다양성 확인
  - `ime.js` 한글 자판으로 칠 때 글자가 빠지거나 겹치지 않는지 확인(입력기 조합 흉내)
  - `speech.js` 단어 읽기 순서·간격 확인(가짜 음성 엔진, 소리 없음)
  - 앞에 주소를 주면 그 주소(예: GitHub Pages)를, 없으면 로컬 빌드를 테스트
- `tools/add-words.js` — 단어 확인(`check 단어…`)·추가(`add 파일.txt`, 이미 있는 단어는 건너뜀)
- `.claude/skills/` — Claude Code용 skill: `wordchain-test`, `wordchain-deploy`("완료배포"), `wordchain-add-words`
- `old/` — 이전 버전

## 빌드 / 테스트
```
python build.py
node tests/play-test.js
node tests/cpu-rules.js
```
필요: Python 3.12, Node.js LTS, `npm i -g playwright` + `npx playwright install chromium`. Git Bash의 PATH·NODE_PATH는 `~/.bashrc`에 설정.

## 게임 규칙 요약
- 첫 화면에서 수준 선택: 기초(3단계) / 보통(4단계) / 도전(4단계, 모두 주관식)
- 단계마다 연속 성공 목표를 채우면 다음 단계가 열림. 힌트는 한 도전에 3번
- 컴퓨터 단어 길이는 단계의 `cpuMin`/`cpuMax`로 조절
- 규칙 변화 비교급·최상급(bigger, happiest 등)은 학생 답으로는 인정, 컴퓨터 출제·보기·힌트에는 쓰지 않음 (better/best 등 불규칙은 출제 가능)
- y로 끝나는 단어는 컴퓨터 출제 빈도 1/4
- 컴퓨터는 첫 글자와 끝 글자가 같은 단어(dad, trust 등)는 내지 않음
- 학생이 시작할 글자가 겹치지 않도록, 컴퓨터는 최근 두 번 요구한 글자로 끝나는 단어를 피함(다른 후보가 없을 때만 허용)
- 컴퓨터는 끝 글자를 먼저 고르게 뽑은 뒤 그 글자로 끝나는 단어를 고름 → b·p·f처럼 드문 글자로도 시작하게 됨
- 스피드 챌린지 기본 제한 시간: 보통 30초 · 도전 25초. 홈 화면과 게임 화면의 −5초/+5초 버튼으로 10~90초 조절(수준·단계별 저장). 게임 중 늘리기는 바로, 줄이기는 다음 단어부터 적용
- 영문 입력: 휴대폰은 `inputmode="email"`로 영문 자판이 뜸. PC에서 한글 자판으로 치면 같은 자리의 영문 글자로 자동 변환(두벌식 기준, 메ㅔㅣㄷ → apple)
- 교과서 단어 우선: 컴퓨터 출제·객관식 정답·힌트·예시에서 중2 교과서 단어 8배, 중1 교과서 단어 5배 가중치 (출처 표시는 하지 않음)
- 단어장에 없는 단어는 정답으로 인정하지 않지만 연속 기록도 깎지 않음
- 진행 기록과 제한 시간 설정은 브라우저 localStorage(`wordchain-v2`)에 수준별로 저장

## 배포
- 아티팩트: https://claude.ai/artifact/NGfWkdm9cd8TZwe1x4yiXg (비공개 — 공유 메뉴에서 공개 설정 필요)
- 학생용: `dist/word-chain-challenge.html`을 학교 홈페이지·구글 사이트 등에 업로드

## 남은 과제
- 교육부 [별표] 기본 어휘 원본 목록을 받으면 `vocab.js` 교체·보강
