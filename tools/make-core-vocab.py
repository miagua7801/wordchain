"""기본 어휘(data/curriculum-vocab.json) -> vocab.js의 VOCAB_CORE · VOCAB_CORE_ACCEPT

  python tools/make-core-vocab.py

- VOCAB_CORE = {1: level 1(* 초등 권장), 2: level 2(** 중학교)} — 괄호 안 파생어는 앞 단어 level
  "단어 뜻"은 새로 뜻을 쓴 단어(data/new-meanings-review.tsv), "단어"만 있으면 위 단어장(E·M·TB·NUM·WF)의 뜻을 씀
- VOCAB_CORE_ACCEPT = 학생 답으로만 인정: level 3(표시 없음), 빗금으로 나뉜 다른 철자(colour, aeroplane …),
  NO_CPU 단어 — 위 단어장에 이미 있는 단어는 넣지 않음(그 뜻으로 인정)
- 금지어(blocklist.js)에 걸리는 단어는 모두 뺌
- 결과를 data/extract-report.md 끝 '## 단어장 반영' 절에 씀
뜻을 고치려면 data/new-meanings-review.tsv를 고치고 다시 실행한 뒤 python build.py.
"""
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'tools'); import blocklist as BL

# 기본 어휘지만 컴퓨터가 내기에 알맞지 않은 단어(학생 답으로는 인정): 술·담배·폭력·성 관련, 표준 철자가 아닌 붙여 쓴 말
NO_CPU = {'alcohol', 'beer', 'wine', 'pub', 'cigarette', 'gun', 'kill', 'hell', 'sex', 'breast', 'pregnant', 'livingroom'}
# 괄호 안 파생어지만 앞 단어 level을 따르지 않는 단어: VOCAB_CORE에 넣지 않음(별표 규칙이 없는 도전 수준에서만 출제). 뜻은 VOCAB_M에
HARD_ONLY = {'casual', 'clarify', 'classify', 'disclose', 'displace', 'embody', 'enclose', 'ensure', 'factual', 'formal', 'formation',
             'informal', 'interact', 'literal', 'membership', 'notion', 'programmatic', 'racial', 'secondary', 'trial'}
OLD = ['VOCAB_NUM', 'VOCAB_E', 'VOCAB_M', 'VOCAB_TB', 'VOCAB_WF_E', 'VOCAB_WF_M']

src = open('vocab.js', encoding='utf-8').read()
old = {}
for k in OLD:
    for e in re.split(r'[|\n]', re.search(r'const ' + k + r' = `(.*?)`', src, re.S).group(1)):
        e = e.strip()
        if e: old.setdefault(e[:e.index(' ')].lower(), k)
cur = json.load(open('data/curriculum-vocab.json', encoding='utf-8'))
block = BL.load()
wl = set(re.search(r'WORDLIST = "([^"]*)"', open('wordlist.js', encoding='utf-8').read()).group(1).split('|'))
mean = {}
for line in open('data/new-meanings-review.tsv', encoding='utf-8').read().splitlines()[1:]:
    if line.strip(): w, ko, *_ = line.split('\t'); mean[w.strip()] = ko.strip()


def kinds(e):
    """forms를 빗금 철자(다른 철자 — 출제 안 함)와 괄호 안 파생어로 나눔"""
    head = re.sub(r'\([^)]*\)', '', e['raw'])
    nv = len([x for x in head.split('/') if x.strip()]) - 1
    var, der = e['forms'][:nv], e['forms'][nv:]
    for g in re.findall(r'\(([^)]*)\)', e['raw']):
        for part in g.split(','):
            for x in [re.sub(r'\*+$', '', y.strip()).lower() for y in part.split('/')][1:]:
                if x in der: der.remove(x); var.append(x)
    return var, der


core, acc, blocked, nocpu = {}, {}, [], []
for e in cur:
    var, der = kinds(e)
    for w, kind in [(e['word'], 'head')] + [(f, 'form') for f in der] + [(f, 'var') for f in var]:
        if not re.fullmatch('[a-z]+', w): continue
        if BL.blocked(w, block): blocked.append(w); continue
        if w in HARD_ONLY: continue
        lv = e['level']
        to_core = lv < 3 and kind != 'var' and w not in NO_CPU
        if lv < 3 and w in NO_CPU: nocpu.append(w)
        if w in core: continue
        if to_core: acc.pop(w, None); core[w] = lv
        else: acc.setdefault(w, lv)
acc = {w: lv for w, lv in acc.items() if w not in old}
miss = [w for w in core if w not in old and w not in mean]
if miss: sys.exit('뜻이 없는 새 기본 어휘(data/new-meanings-review.tsv에 추가): ' + ' '.join(miss))
unused = [w for w in mean if w not in core or w in old]

lines = {1: [], 2: []}
for w in sorted(core): lines[core[w]].append(w if w in old else f'{w} {mean[w]}')
fmt = lambda xs: '\n'.join('|'.join(xs[i:i + 40]) for i in range(0, len(xs), 40))
block_js = ('// 교육부 영어과 교육과정 [별표] 기본 어휘(저작권 보호 대상 아님) — data/curriculum-vocab.json에서 tools/make-core-vocab.py로 만듦\n'
            '// VOCAB_CORE: 1 = level 1(* 초등 권장, 초등 수준), 2 = level 2(** 중학교, 중학 수준). 괄호 안 파생어는 앞 단어 level\n'
            '//   "단어 뜻" = 새로 뜻을 쓴 단어(data/new-meanings-review.tsv), "단어"만 = 위 단어장에 뜻이 있는 단어(뜻은 한 곳에만)\n'
            'const VOCAB_CORE = {\n1: `\n' + fmt(lines[1]) + '\n`,\n2: `\n' + fmt(lines[2]) + '\n`};\n'
            '// VOCAB_CORE_ACCEPT: 학생 답으로만 인정(뜻 없음 → 단어장 밖 단어처럼). level 3(표시 없음, 고등학교 수준)·다른 철자(colour 등)·출제 제외 단어\n'
            '//   컴퓨터 출제·힌트·예시·객관식 보기·기초 문제·단어 수첩 복습, 기본 어휘 가중치·보너스에는 쓰지 않음\n'
            'const VOCAB_CORE_ACCEPT = `\n' + fmt(sorted(acc)) + '\n`;\n')
pat = re.compile(r'// 교육부 영어과 교육과정 \[별표\] 기본 어휘.*?const VOCAB_CORE_ACCEPT = `.*?`;\n', re.S)
if pat.search(src): src = pat.sub(lambda m: block_js, src)
else:  # 처음: 수 단어 목록 앞에 넣음
    i = src.index('// 수 (학생 답으로만 인정'); src = src[:i] + block_js + src[i:]
open('vocab.js', 'w', encoding='utf-8', newline='\n').write(src)

# 보고
n1, n2 = len(lines[1]), len(lines[2])
newc = [w for w in core if w not in old]
notwl = sorted(w for w in set(core) | set(acc) if w not in wl)
R = ['## 단어장 반영 (tools/make-core-vocab.py)', '',
     f'- VOCAB_CORE {len(core)}개 — level 1: {n1}, level 2: {n2} (괄호 안 파생어 포함)',
     f'  - 기존 단어장에 있어 그 뜻을 씀: {len(core) - len(newc)}개 / 새로 뜻을 씀: {len(newc)}개 (level 1: {sum(core[w] == 1 for w in newc)}, level 2: {sum(core[w] == 2 for w in newc)}) → `data/new-meanings-review.tsv`',
     f'- VOCAB_CORE_ACCEPT(학생 답으로만) {len(acc)}개 — 기존 단어장에 없는 level 3·다른 철자·출제 제외 단어',
     f'- 금지어에 걸려 뺀 단어: {", ".join(blocked) or "없음"}',
     f'- 기본 어휘지만 출제에서 뺀 단어(학생 답으로는 인정): {", ".join(sorted(set(nocpu)))}',
     f'- 영어 단어 목록(wordlist.js)에 없는 기본 어휘 {len(notwl)}개 (단어장·인정 목록에 있어 정답으로 인정됨): {", ".join(notwl)}']
if unused: R.append(f'- 검토 파일에 있지만 쓰지 않은 뜻: {", ".join(unused)}')
# 예전 단어장 보관본(private/, 저장소에 안 올림)과 비교한 결과는 private/에만 씀
if os.path.exists('private/old-vocab.js'):
    don = json.loads(re.search(r'const \w+ = (\[.*?\]);', open('private/old-vocab.js', encoding='utf-8').read(), re.S).group(1))
    only = [w for w, *_ in don if w not in old and w not in core and w not in acc]
    P = [f'- 예전 단어장에만 있던 단어(기존 단어장·기본 어휘에 없음, 컴퓨터가 더 이상 내지 않음) {len(only)}개: {", ".join(only)}',
         f'  - 그중 영어 단어 목록에도 없어 정답으로 인정되지 않는 단어: {", ".join(w for w in only if w not in wl and not BL.blocked(w, block)) or "없음"}']
    open('private/old-vocab-report.md', 'w', encoding='utf-8', newline='\n').write('\n'.join(P) + '\n'); print('\n'.join(P))
rep = open('data/extract-report.md', encoding='utf-8').read().split('## 단어장 반영')[0].rstrip('\n')
open('data/extract-report.md', 'w', encoding='utf-8', newline='\n').write(rep + '\n\n' + '\n'.join(R) + '\n')
print('\n'.join(R))
