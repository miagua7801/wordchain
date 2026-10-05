---
name: wordchain-deploy
description: "완료배포" — 영어 끝말잇기 앱의 변경을 빌드·소리 없는 테스트·커밋·푸시(GitHub Pages 자동 배포)·claude.ai 아티팩트 업데이트까지 한 번에 끝낸다. 사용자가 "완료배포", "배포해", "커밋하고 푸시하고 아티팩트 업데이트" 라고 할 때 쓴다. 사용자가 명시적으로 요청할 때만 실행한다(변경마다 자동 커밋 금지).
---

# 완료배포

사용자는 변경마다 커밋하지 않고 "완료배포"라고 할 때 한꺼번에 배포한다. 요청 없이 커밋·푸시하지 않는다.

## 순서
1. **빌드**: `python build.py` → `dist/wordchain.html`(아티팩트용, gitignore), `dist/word-chain-challenge.html`(학생용, 커밋함)
2. **테스트** (wordchain-test skill, 소리 없음): `node tests/play-test.js`, `node tests/cpu-rules.js` 를 백그라운드로 실행. 실패하면 **여기서 멈추고** 결과를 보고한다.
   - 이번 변경으로 추가한 단어가 있으면 `node tests/accept.js 단어…` 로 몇 개 확인.
3. **커밋**: `git status`로 바뀐 파일 확인 → 관련 파일만 `git add` (app.html, vocab.js, README.md, build.py, tests/, dist/word-chain-challenge.html, .claude/skills/).
   - 메시지는 한국어, 제목 한 줄 + 빈 줄 + `- ` 항목들. 마지막 줄에 시스템이 지정한 Co-Authored-By 표기.
   - 브랜치는 main에 직접 (사용자 방식).
4. **푸시**: `git push origin main` → GitHub Actions "Deploy to GitHub Pages"가 빌드해 https://miagua7801.github.io/wordchain/ 에 배포(약 20초). `gh run list --limit 1`로 한 번 확인(반복 폴링 금지).
5. **아티팩트**: Artifact 도구로 `dist/wordchain.html`을 `url: https://claude.ai/artifact/NGfWkdm9cd8TZwe1x4yiXg` 에 publish (label에 변경 요약). 거절되며 최신 버전을 읽으라고 하면 끝까지 Read 한 뒤, 내 빌드가 그 내용을 이미 포함하는지 확인하고 다시 publish.
6. **보고**: 커밋 해시·메시지, 푸시 범위, Pages 실행 상태, 아티팩트 버전을 짧게. 브라우저에 예전 화면이 보이면 화면 아래 `버전` 시각을 확인하고 Ctrl+F5 하라고 덧붙인다.

## 주의
- 아티팩트는 비공개다. 학생 공유는 공유 메뉴에서 사용자가 직접 바꾸거나 Pages 주소를 쓴다.
- `dist/word-chain-challenge.html`은 빌드 시각이 들어가 매 빌드마다 바뀐다. 정상이다.
