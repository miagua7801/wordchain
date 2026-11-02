"""소리 잇기 자료 만들기 -> data/sound-pron.tsv(단어별 첫소리·끝소리) + sound-candidates.txt(교사 검토용 출제 후보)

  python -I tools/make-sound.py <CMU 발음 사전 파일(cmudict)>
  (사전 자체는 저장소에 넣지 않음: nltk_data의 corpora/cmudict.zip을 풀어서 씀. 앱·빌드에는 필요 없음)

- 대상: 학생 답으로 인정되는 단어(wordlist.js·vocab.js) 중 사전에 있는 단어. 도전 규칙으로 막히는 규칙 변화형은 뺌(허용 목록은 포함)
- 출제 후보: 단어장 단어이면서 발음이 하나뿐이고 끝소리가 목표 소리인 단어. 고유명사·금지어·SETTINGS.noAsk 제외
- 먼저 tools/make-inflections.py를 돌려 data/inflections.tsv·allowed-words.txt가 있어야 함
"""
import os, re, sys
from collections import defaultdict
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools')); import blocklist as BL
CMU = os.path.abspath(sys.argv[1]); os.chdir(ROOT)

TARGET = {'taste': ['CH', 'SH', 'TH', 'DH', 'F'], 'plus': ['CH', 'SH', 'TH', 'DH', 'F', 'K', 'S', 'JH', 'N']}
NAME = {'CH': "/tʃ/ ch '취' 소리", 'SH': "/ʃ/ sh '쉬' 소리", 'TH': '/θ/ 떨리지 않는 th', 'DH': '/ð/ 떨리는 th', 'F': '/f/ f 소리', 'K': '/k/ k 소리', 'S': '/s/ s 소리', 'JH': "/dʒ/ j '쥐' 소리", 'N': '/n/ n 소리'}

src = open('vocab.js', encoding='utf-8').read()
raw_of, core = {}, {}
for k in ['VOCAB_E', 'VOCAB_M', 'VOCAB_TB', 'VOCAB_WF_E', 'VOCAB_WF_M', 'VOCAB_SOUND']:
    for e in re.split(r'[|\n]', re.search(r'const ' + k + r' = `(.*?)`', src, re.S).group(1)):
        e = e.strip()
        if e: raw_of.setdefault(e.split(' ')[0].lower(), e.split(' ')[0])
snd = {e.strip().split(' ')[0].lower() for e in re.split(r'[|\n]', re.search(r'const VOCAB_SOUND = `(.*?)`', src, re.S).group(1)) if e.strip()}
for lv, g in zip((1, 2), re.findall(r'[12]: `(.*?)`', re.search(r'const VOCAB_CORE = \{(.*?)\};', src, re.S).group(1), re.S)):
    for e in re.split(r'[|\n]', g):
        e = e.strip()
        if not e: continue
        w = e.split(' ')[0].lower(); core[w] = lv
        raw_of.setdefault(w, e.split(' ')[0])
num = {e.strip().split(' ')[0].lower() for e in re.split(r'[|\n]', re.search(r'const VOCAB_NUM = `(.*?)`', src, re.S).group(1)) if e.strip()}
accept = [e.strip() for e in re.split(r'[|\n]', re.search(r'const VOCAB_CORE_ACCEPT = `(.*?)`', src, re.S).group(1)) if e.strip()]
wl = set(re.search(r'WORDLIST = "([^"]*)"', open('wordlist.js', encoding='utf-8').read()).group(1).split('|'))
block = BL.load()
forms = {l.split('\t')[0] for l in open('data/inflections.tsv', encoding='utf-8').read().splitlines()[1:]}
allowed = set(open('allowed-words.txt', encoding='utf-8').read().split())
no_ask = set(re.findall(r"'([a-z]+)'", (re.search(r'noAsk:\[(.*?)\]', open('app.html', encoding='utf-8').read()) or [None, ''])[1]))
U = {w for w in wl | set(raw_of) | set(accept) | num | allowed if re.fullmatch('[a-z]{3,}', w) and not BL.blocked(w, block) and (w not in forms or w in allowed)}

# 사전에 없거나 고쳐 쓸 단어. EXTRA_PRON: toothache·stomachache는 사전에 없음, nice의 둘째 발음은 프랑스 도시 이름이라 뺌
EXTRA_PRON = {'toothache': 'T UW TH EY K', 'stomachache': 'S T AH M AH K EY K', 'nice': 'N AY S'}
# 사전에 발음이 하나여도 출제에서 뺄 단어(with·use는 사전에 발음이 여럿이라 저절로 빠짐)
NO_CPU_SOUND = set()
U |= set(EXTRA_PRON)
prons = defaultdict(list)
for line in open(CMU, encoding='latin-1'):
    p = line.split()
    if len(p) < 3 or not re.fullmatch('[A-Z]+', p[0]): continue
    w = p[0].lower()
    if w in U: prons[w].append([re.sub(r'\d', '', x) for x in p[2:]])

for w, x in EXTRA_PRON.items(): prons[w] = [x.split()]
pairs = defaultdict(list)
for w in sorted(prons):
    for f, l in sorted({(x[0], x[-1]) for x in prons[w]}): pairs[f + ' ' + l].append(w)
with open('data/sound-pron.tsv', 'w', encoding='utf-8', newline='\n') as f:
    f.write('첫소리 끝소리\t단어(CMU 발음 사전, 발음이 여럿이면 각 줄에 들어감)\n')
    for k in sorted(pairs): f.write(k + '\t' + '|'.join(pairs[k]) + '\n')

cand, multi = defaultdict(list), defaultdict(list)
for w, raw in raw_of.items():
    if w in num or w not in prons or raw != w or w in no_ask or BL.blocked(w, block) or (w in forms and w not in allowed): continue
    ends = {x[-1] for x in prons[w]}
    if len(prons[w]) > 1 or w in NO_CPU_SOUND:
        for e in ends:
            if e in NAME: multi[e].append(w)
    elif prons[w][0][-1] in NAME: cand[prons[w][0][-1]].append(w)
TASTE_DH = {'smooth', 'breathe'}   # 맛보기는 ★만. /ð/로 끝나는 ★ 단어가 없어 예외로 둠(app.html TASTE_DH와 같게)
taste = lambda w: core.get(w) == 1 or w in TASTE_DH
order = TARGET['plus']
with open('data/sound-cpu.txt', 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(sorted(w for e in order for w in cand[e])) + '\n')
with open('sound-candidates.txt', 'w', encoding='utf-8', newline='\n') as f:
    f.write('소리 잇기: 컴퓨터 출제 후보 단어 (교사 검토용, tools/make-sound.py가 만듦. 이 파일을 고쳐도 앱은 바뀌지 않음)\n')
    f.write('표시: * 맛보기에도 나올 수 있는 단어(기본 어휘 ★, /ð/만 smooth·breathe 예외). 맛보기는 /tʃ/ /ʃ/ /θ/ /ð/ /f/ 소리만 냄\n\n')
    for e in order:
        ws = sorted(cand[e])
        f.write(f'[{NAME[e]}] {len(ws)}개\n' + ' '.join(w + ('*' if taste(w) and e in TARGET['taste'] else '') for w in ws) + '\n')
        if multi[e]: f.write(f'  발음이 여럿이라 출제에서 뺀 단어: {" ".join(sorted(multi[e]))}\n')
        f.write('\n')
print('발음 있는 단어', len(prons), '소리 쌍', len(pairs), '크기', sum(len(' '.join(v)) for v in pairs.values()))
for e in order: print(e, '후보', len(cand[e]), '맛보기', sum(1 for w in cand[e] if taste(w)), '발음 여럿', len(multi[e]))
need = 'church cheetah chorus fish chef nice sure math think this smooth laugh phone knife book kite city know queen music stomach chair headache cat bridge giant jump get rain sign night happy ache toothache stomachache'.split()
print('사전에 없음:', [w for w in need if w not in prons])
print('출제 후보 아님:', [w for w in 'church fish math smooth laugh knife book music stomach headache nice bridge rain sign ache toothache stomachache'.split() if not any(w in v for v in cand.values())])
print('DH 후보:', cand['DH'], 'TH 후보:', cand['TH'][:40])
