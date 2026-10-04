"""app.html + vocab.js -> dist/wordchain.html (아티팩트용) + dist/word-chain-challenge.html (학생 배포용 단독 파일)"""
import os
app=open('app.html',encoding='utf-8').read()
out=app.replace('/*__VOCAB__*/',open('vocab.js',encoding='utf-8').read())
os.makedirs('dist',exist_ok=True)
open('dist/wordchain.html','w',encoding='utf-8').write(out)
te=out.index('</title>')+8; se=out.index('</style>')+8
std=('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
     '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
     '<title>영어 끝말잇기 챌린지</title>'+out[te:se]+'\n</head>\n<body>\n'+out[se:]+'\n</body>\n</html>\n')
open('dist/word-chain-challenge.html','w',encoding='utf-8').write(std)
print('built dist/')
