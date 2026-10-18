"""SCOWL(ESDB) 단어 목록 → wordlist.js
사용법: python tools/make-wordlist.py scowl.txt
  scowl.txt: http://app.aspell.net/create?max_size=60&spelling=US&max_variant=0&diacritic=strip&special=hacker&download=wordlist&encoding=utf-8&format=inline
소문자 알파벳 2글자 이상 단어만 남기고(고유명사·소유격 제외), blocklist.js의 금지어는 뺀다.
"""
import sys, re, os

# 학생 답으로 인정하지 않을 말은 blocklist.js(인코딩)에서 읽어 뺌 — tools/blocklist.py로 관리
sys.path.insert(0, os.path.dirname(__file__)); import blocklist as BL
BLOCK = BL.load()

src = open(sys.argv[1], encoding='utf-8').read()
body = src.split('\n---\n', 1)[1]
header = src.split('\n---\n', 1)[0]
words = sorted({w for w in body.split() if re.fullmatch(r'[a-z]{2,}', w) and not BL.blocked(w, BLOCK)})
notice = '\n'.join('// ' + l for l in header.strip().splitlines())
out = os.path.join(os.path.dirname(__file__), '..', 'wordlist.js')
with open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write('// 영어 단어 목록: 단어장 밖 단어가 올바른 영어 단어인지 판정할 때 씀 (tools/make-wordlist.py로 만듦)\n')
    f.write(notice + '\n')
    f.write('const WORDLIST = "' + '|'.join(words) + '";\n')
print(len(words), 'words ->', os.path.getsize(out), 'bytes')
# 고지 문구(Copyright 연도 등)의 기준은 여기서 쓴 wordlist.js 머리 주석. 앱 출처 창은 build.py가 자동으로 따라가고,
# NOTICE.md·README.md·intro.html에 옮겨 적은 고지가 달라졌으면 tests/license.js가 FAIL로 알려 줌
m = re.search(r'Copyright \d{4}-\d{4} by Kevin Atkinson', header)
if m:
    stale = [f for f in ('NOTICE.md', 'README.md', 'intro.html')
             if m.group(0) not in open(os.path.join(os.path.dirname(__file__), '..', f), encoding='utf-8').read()]
    if stale: print('고지 문구가 바뀜 → 이 파일들도 고칠 것:', ', '.join(stale), '(확인: node tests/license.js)')
