# 영어 끝말잇기 챌린지 (Word Chain Challenge)

중학교 2학년 EFL 학생용 영어 끝말잇기 웹앱. 학생 vs 컴퓨터.

## 구조
- `app.html` — 앱 본체(HTML/CSS/JS). `/*__VOCAB__*/` 자리에 단어장이 들어감
- `vocab.js` — 단어장
  - `VOCAB_E` 초등 권장 수준(대명사 격변화, 비교급·최상급, 기본 단어 포함)
  - `VOCAB_M` 중학교 수준
  - `VOCAB_TB` 중학교 교과서 자주 나오는 단어 보충
  - `EMOJI` 그림 단어
- `build.py` — `dist/wordchain.html`(claude.ai 아티팩트용, doctype 없음)과 `dist/word-chain-challenge.html`(학생 배포용 단독 HTML) 생성
- `tests/play-test.js` — Playwright로 도전 수준 2단계를 자동으로 40턴 플레이하며 "이미 나온 단어" 오판 여부 확인
- `old/` — 이전 버전

## 빌드 / 테스트
```
python3 build.py
NODE_PATH=$(npm root -g) node tests/play-test.js
```

## 게임 규칙 요약
- 첫 화면에서 수준 선택: 기초(3단계) / 보통(4단계) / 도전(4단계, 모두 주관식)
- 단계마다 연속 성공 목표를 채우면 다음 단계가 열림. 힌트는 한 도전에 3번
- 컴퓨터 단어 길이는 단계의 `cpuMin`/`cpuMax`로 조절
- 규칙 변화 비교급·최상급(bigger, happiest 등)은 학생 답으로는 인정, 컴퓨터 출제·보기·힌트에는 쓰지 않음 (better/best 등 불규칙은 출제 가능)
- y로 끝나는 단어는 컴퓨터 출제 빈도 1/4
- 단어장에 없는 단어는 정답으로 인정하지 않지만 연속 기록도 깎지 않음
- 진행 기록은 브라우저 localStorage(`wordchain-v2`)에 수준별로 저장

## 배포
- 아티팩트: https://claude.ai/artifact/NGfWkdm9cd8TZwe1x4yiXg (비공개 — 공유 메뉴에서 공개 설정 필요)
- 학생용: `dist/word-chain-challenge.html`을 학교 홈페이지·구글 사이트 등에 업로드

## 남은 과제
- 교육부 [별표] 기본 어휘 원본 목록, 실제 사용 교과서 단어 목록을 받으면 `vocab.js` 교체·보강
