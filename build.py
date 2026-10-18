"""app.html + vocab.js + wordlist.js + blocklist.js -> dist/wordchain.html (아티팩트용) + dist/word-chain-challenge.html (학생 배포용 단독 파일)"""
import os, re, sys
from datetime import datetime, timezone, timedelta
sys.path.insert(0,'tools'); import blocklist as BL
app=open('app.html',encoding='utf-8').read()
# 단어장 + 영어 단어 목록(단어장 밖 단어 판정용, tools/make-wordlist.py로 만듦) + 부적절한 단어 목록(blocklist.js, 인코딩)
block=BL.load()
words=open('wordlist.js',encoding='utf-8').read() if os.path.exists('wordlist.js') else ''
m=re.search(r'WORDLIST = "([^"]*)"',words)
if m:  # 영어 단어 목록에서 금지어를 모두 뺌
    keep=[w for w in m.group(1).split('|') if not BL.blocked(w,block)]
    print('영어 단어 목록에서 금지어', m.group(1).count('|')+1-len(keep), '개 제외')
    words=words[:m.start(1)]+'|'.join(keep)+words[m.end(1):]
bl=open('blocklist.js',encoding='utf-8').read() if os.path.exists('blocklist.js') else 'const BLOCKLIST="";\n'
def scowl_notice(src):
    """wordlist.js 머리 주석에서 SCOWL/ESDB 고지 줄(Copyright …)과 허가문 문단(Permission to use … warranty.)을 그대로 꺼냄.
    고지 문구는 이곳(wordlist.js)에서만 관리: 앱 출처 창은 빌드 때 여기서 읽고, NOTICE·README·intro.html은 tests/license.js가 같은지 확인"""
    lines=[re.sub(r'^//\s?','',l).rstrip() for l in src.split('const WORDLIST',1)[0].splitlines()]
    cp=next((l for l in lines if l.startswith('Copyright ')),None)
    i=next((k for k,l in enumerate(lines) if l.startswith('Permission to use')),None)
    if cp is None or i is None: return ''
    perm=[]
    for l in lines[i:]:
        if not l.strip(): break
        perm.append(l.strip())
    return cp+'\n'+' '.join(perm)
notice=scowl_notice(words) if words else ''
if words and not notice: sys.exit('wordlist.js 머리 주석에서 SCOWL 고지문을 찾지 못함')
out=app.replace('/*__VOCAB__*/',open('vocab.js',encoding='utf-8').read()+'\n'+words+'\n'+bl)
# 화면 아래 '버전' 표시용 빌드 시각(한국 시간) — 예전 페이지가 캐시에 남아 있는지 확인할 때 씀
build=datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M')
out=out.replace('__BUILD__',build)
import json
out=out.replace("'__SCOWL_NOTICE__'",json.dumps(notice,ensure_ascii=False))
# 이 앱의 저작권·라이선스 한 줄(소스를 받은 사람에게 보이도록 파일 맨 위 주석). 실명은 넣지 않음
OWN='<!-- © 2026 miagua7801 — CC BY-NC-ND 4.0 (https://creativecommons.org/licenses/by-nc-nd/4.0/) · 출처·고지: NOTICE.md -->'
os.makedirs('dist',exist_ok=True)
open('dist/wordchain.html','w',encoding='utf-8').write(OWN+'\n'+out)
te=out.index('</title>')+8; se=out.index('</style>')+8
std=('<!doctype html>\n'+OWN+'\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
     '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">\n'
     '<title>영어 끝말잇기 챌린지</title>'+out[te:se]+'\n</head>\n<body>\n'+out[se:]+'\n</body>\n</html>\n')
open('dist/word-chain-challenge.html','w',encoding='utf-8').write(std)
open('dist/version.json','w',encoding='utf-8').write('{"build": "'+build+'"}'+chr(10))   # 열려 있는 페이지가 새 버전이 나왔는지 확인하는 용도
print('built dist/')
