"""SCOWL(ESDB) 단어 목록 → wordlist.js
사용법: python tools/make-wordlist.py scowl.txt
  scowl.txt: http://app.aspell.net/create?max_size=60&spelling=US&max_variant=0&diacritic=strip&special=hacker&download=wordlist&encoding=utf-8&format=inline
소문자 알파벳 2글자 이상 단어만 남기고(고유명사·소유격 제외), 학생 앱에 맞지 않는 욕설·비속어는 뺀다.
"""
import sys, re, os

# 학생 답으로 인정하지 않을 말: 이 글자가 들어가면 제외 / 정확히 같으면 제외
BLOCK_PART = ['fuck', 'shit', 'cunt', 'nigg', 'whore', 'slut', 'bitch', 'porn', 'faggot', 'asshole', 'bastard', 'dildo', 'wank', 'jizz']
BLOCK_WORD = {'ass', 'asses', 'damn', 'damned', 'dick', 'dicks', 'cock', 'cocks', 'pussy', 'pussies', 'fag', 'fags',
              'retard', 'retards', 'retarded', 'piss', 'pissed', 'boob', 'boobs', 'tit', 'tits', 'titty', 'crap', 'sexy',
              'horny', 'nude', 'nudes', 'penis', 'penises', 'vagina', 'vaginas', 'rape', 'raped', 'rapes', 'rapist',
              'rapists', 'raping', 'hooker', 'hookers', 'kike', 'spic', 'chink', 'gook', 'twat', 'prick', 'pricks'}

src = open(sys.argv[1], encoding='utf-8').read()
body = src.split('\n---\n', 1)[1]
header = src.split('\n---\n', 1)[0]
words = sorted({w for w in body.split() if re.fullmatch(r'[a-z]{2,}', w)
                and w not in BLOCK_WORD and not any(p in w for p in BLOCK_PART)})
notice = '\n'.join('// ' + l for l in header.strip().splitlines())
out = os.path.join(os.path.dirname(__file__), '..', 'wordlist.js')
with open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write('// 영어 단어 목록: 단어장 밖 단어가 올바른 영어 단어인지 판정할 때 씀 (tools/make-wordlist.py로 만듦)\n')
    f.write(notice + '\n')
    f.write('const WORDLIST = "' + '|'.join(words) + '";\n')
print(len(words), 'words ->', os.path.getsize(out), 'bytes')
