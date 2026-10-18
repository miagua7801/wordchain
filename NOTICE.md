# 출처·저작권 고지 (NOTICE)

**이 앱**: © 2026 miagua7801 — [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.ko) (저작자표시-비영리-변경금지). 저작자가 만든 부분(앱 코드, 화면 구성, 게임 규칙, 한국어 뜻풀이, 문구)에만 적용되며 법적 전문은 [LICENSE](LICENSE). 아래 자료는 각자의 조건을 따릅니다.

영어 끝말잇기 챌린지(Word Chain Challenge)에 들어간 남의 자료와 그 출처·라이선스를 한곳에 모은 문서입니다. 앱 화면에서는 단계 맵 아래 **출처·저작권**을 누르면 같은 내용(요약 + 영어 고지 원문)을 볼 수 있습니다.

## 1. 교육부 영어과 교육과정 기본 어휘 (`vocab.js`의 `VOCAB_CORE`·`VOCAB_CORE_ACCEPT`)

- 자료: 교육부 고시 영어과 교육과정 [별표] 기본 어휘 목록 (인쇄 쪽 402~434, 원본 `data/basic-vocab.pdf`)
- 고시 번호: 교육부 고시 제2022-33호 [별책 3] (국가교육위원회 고시 제2026-1호 일부개정 포함)
- 근거: 저작권법 제7조 제2호 "국가 또는 지방자치단체의 고시·공고·훈령 그 밖에 이와 유사한 것"은 이 법에 따라 보호받지 못하는 저작물입니다. 표시 의무는 없지만 출처를 밝힙니다.
- 한국어 뜻은 이 앱에서 따로 썼습니다(`data/new-meanings-review.tsv` 등).

## 2. 영어 단어 목록: SCOWL/ESDB (`wordlist.js`)

정답 판정용 영어 단어 목록은 SCOWL/ESDB(https://wordlist.aspell.net)로 만들었습니다. 허가문 조건에 따라 단어 목록의 모든 복사본(`wordlist.js`, 빌드 결과 `dist/*.html`의 주석과 앱 출처 창)과 이 설명 문서에 아래 고지와 허가문을 그대로 둡니다.

```text
Custom wordlist generated from https://app.aspell.net/create using
the English Speller Database (ESDB) with parameters:
  Size: 60 (default)
  Spelling: US
  Variant Level: 1 *default*
  Special: hacker
  Diacritics: strip

https://wordlist.aspell.net

ESDB Git Revision: Wed Jun 24 14:30:42 2026 -0400 [1e5b7d3]
App Git Revision: Thu Jun 25 15:43:51 2026 -0400 [156fb4e]

Copyright 2000-2026 by Kevin Atkinson

Permission to use, copy, modify, distribute, and sell any part of the English
Speller Database (ESDB, previously known as SCOWLv2), or word lists
created from it, is hereby granted without fee, provided that the above
copyright notice appears in all copies and that both the above copyright
notice and this notice appear in supporting documentation.  Kevin Atkinson
makes no representations about the suitability of this database for any
purpose.  It is provided "as is" without express or implied warranty.

ESDB is derived from many sources, most of which are in the Public Domain.
Data from the Corpus of Contemporary American English (COCA) was also used.

All data from COCA comes from 3-gram data that is not freely available;
however, the usage is within the rights given by the NDA that was signed when
purchasing the data.  More information on COCA is available at
https://www.english-corpora.org/coca/.

The primary source of words for ESDB comes from 12dicts and ENABLE2K.  Both
are in the Public Domain, but Alan Beale <biljir@pobox.com> deserves special
credit as he is the author of 12dicts and a major contributor to ENABLE2K.  In
addition, he gave me an incredible amount of feedback and created a number of
special lists in order to help improve the overall quality of ESDB.
```

> 고지 문구의 기준은 `wordlist.js` 머리 주석 한곳입니다. `tools/make-wordlist.py`로 목록을 다시 만들어 연도(예: 2000-2027)나 문구가 바뀌면 앱 출처 창은 빌드 때 자동으로 따라가고, 이 문서·`README.md`·`intro.html`은 `node tests/license.js`가 다른 곳을 알려 줍니다.

## 3. 웹 글꼴

| 글꼴 | 쓰는 곳 | 라이선스 |
|---|---|---|
| Jua | 앱 | SIL Open Font License 1.1 |
| Lexend | 앱 | SIL Open Font License 1.1 |
| Noto Sans KR | 앱 | SIL Open Font License 1.1 |
| Noto Serif KR | 소개 페이지(`intro.html`) | SIL Open Font License 1.1 |
| IBM Plex Sans KR | 소개 페이지(`intro.html`) | SIL Open Font License 1.1 |

- 확인: Google Fonts 저장소(github.com/google/fonts)의 `ofl/<글꼴>/METADATA.pb`에 모두 `license: "OFL"`, 같은 폴더에 `OFL.txt`가 있음 (2026년 10월 확인)
- 지금은 글꼴 파일을 저장소에 넣지 않고 Google Fonts에서 불러옵니다.
- 이모지는 사용자 기기의 시스템 글꼴로 표시됨(이모지 그림이나 이모지 글꼴은 앱에 넣지 않음).
- 메모: 나중에 글꼴 파일을 앱 안에 넣는(자체 포함) 방식으로 바꾸면, 각 글꼴의 저작권 고지와 OFL 1.1 전문(`OFL.txt`)을 함께 넣어야 합니다. 글꼴 이름을 바꾸어 고친 글꼴로 배포할 때는 OFL의 예약 글꼴 이름(Reserved Font Name) 조건도 확인합니다.

