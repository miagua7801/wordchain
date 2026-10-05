---
name: wordchain-test
description: 영어 끝말잇기 앱을 소리 없이(단어 읽기 음소거) 브라우저 테스트한다. 앱 변경 후 확인, 단어가 정답으로 인정되는지, 컴퓨터 출제 규칙(첫=끝 글자·수 단어 금지), 시작 글자 다양성, 배포된 GitHub Pages 확인에 사용. "테스트해", "확인해", "인정되는지" 같은 요청에 쓴다.
---

# 끝말잇기 테스트 (소리 없음)

앱은 단어를 `speechSynthesis`로 읽는다. 화면 없는(headless) Chromium에서도 Windows 음성으로 **소리가 난다**.
`tests/lib.js`의 `open()`이 speechSynthesis를 무력화하고 `--mute-audio`로 띄우므로, 새 테스트도 반드시 `open()`을 쓴다.

## 준비
- Python 3.12, Node.js, 전역 `playwright` + Chromium이 설치돼 있다. PATH·NODE_PATH는 `~/.bashrc`에 있다.
- 테스트 전에 빌드: `python build.py` (dist/를 만든다)

## 테스트 목록 (저장소 루트에서 실행)
| 명령 | 확인하는 것 | 시간 |
|---|---|---|
| `node tests/play-test.js` | 도전 2단계 40턴, "이미 나온 단어" 오판·오류 | ~1분 |
| `node tests/cpu-rules.js [주소] [단계당 수]` | 컴퓨터 단어 첫=끝 글자 금지, 수 단어 금지 | ~1분 |
| `node tests/accept.js [주소] word1 word2 …` | 학생 답으로 인정되는지 | 단어 수에 비례 |
| `node tests/variety.js [주소] [턴 수]` | 시작 글자가 최근 2번과 겹친 횟수, 글자 종류 | ~3분 |

- `[주소]`를 빼면 로컬 빌드(`dist/word-chain-challenge.html`), 주면 그 주소(예: `https://miagua7801.github.io/wordchain/`).
- `accept.js`는 컴퓨터 단어가 해당 글자로 끝날 때까지 넘기며 시험한다. v·j·q처럼 끝 글자로 거의 안 나오는 글자로 시작하는 단어는 '못 해 봄'이 되므로, 그런 단어는 `vocab.js`에 들어갔는지만 확인한다.
- 오래 걸리는 테스트는 백그라운드로 돌리고, 진행 중에는 결과를 기다린다. 결과는 마지막에 짧게 보고한다.
- 종료 코드: accept·cpu-rules는 실패 시 1.

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
