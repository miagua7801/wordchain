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
out=app.replace('/*__VOCAB__*/',open('vocab.js',encoding='utf-8').read()+'\n'+words+'\n'+bl)
# 화면 아래 '버전' 표시용 빌드 시각(한국 시간) — 예전 페이지가 캐시에 남아 있는지 확인할 때 씀
build=datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M')
out=out.replace('__BUILD__',build)
os.makedirs('dist',exist_ok=True)
open('dist/wordchain.html','w',encoding='utf-8').write(out)
te=out.index('</title>')+8; se=out.index('</style>')+8
std=('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
     '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">\n'
     '<title>영어 끝말잇기 챌린지</title>'+out[te:se]+'\n</head>\n<body>\n'+out[se:]+'\n</body>\n</html>\n')
open('dist/word-chain-challenge.html','w',encoding='utf-8').write(std)
open('dist/version.json','w',encoding='utf-8').write('{"build": "'+build+'"}'+chr(10))   # 열려 있는 페이지가 새 버전이 나왔는지 확인하는 용도
print('built dist/')
