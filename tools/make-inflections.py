"""도전 수준 단어 판정 자료 만들기 -> data/inflections.tsv(변화형 → 원형) + allowed-words.txt(허용 목록)

  python -I tools/make-inflections.py <WordNet 3.0 폴더> <Brown 태그 말뭉치 폴더>
  (WordNet·Brown은 저장소에 넣지 않음: nltk_data의 corpora/wordnet.zip·brown.zip을 풀어서 씀. 앱·빌드에는 필요 없음)

- 끝 글자만으로 판정하지 않음: 원형이 WordNet에 그 품사로 있어야 변화형이고, 원래 그 모양인 단어(morning, bed, forest, owner …)는 목록에 넣지 않음
- 불규칙 동사(IRREG)의 과거형·불규칙 복수형·불규칙 비교급은 목록에 넣지 않음(허용). 과거분사만 쓰는 꼴(gone, eaten)은 목록에 넣음
- 허용 목록: -ed/-ing 중 WordNet에 형용사·명사로 있고 Brown 말뭉치에서 형용사·명사 쓰임이 주된 단어 + 아래 손으로 고른 단어(ALLOW_*)
- allowed-words.txt를 이미 손으로 고쳤다면 다시 만들 때 덮어쓰므로 ALLOW_EXTRA에 옮겨 둠
"""
import os, re, sys
from collections import Counter, defaultdict
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools')); import blocklist as BL
os.chdir(ROOT)
WN, BROWN = sys.argv[1], sys.argv[2]

# 불규칙 동사: 원형 과거 과거분사 (쓰는 꼴이 여럿이면 /). 규칙형도 함께 쓰는 동사는 DUAL
IRREG = """arise arose arisen|awake awoke awoken|be was/were been|bear bore borne/born|beat beat beaten|become became become|begin began begun
bend bent bent|bet bet bet|bind bound bound|bite bit bitten|bleed bled bled|blow blew blown|break broke broken|breed bred bred|bring brought brought
build built built|buy bought bought|cast cast cast|catch caught caught|choose chose chosen|cling clung clung|come came come|cost cost cost|creep crept crept
cut cut cut|deal dealt dealt|dig dug dug|do did done|draw drew drawn|drink drank drunk|drive drove driven|eat ate eaten|fall fell fallen|feed fed fed|feel felt felt
fight fought fought|find found found|flee fled fled|fling flung flung|fly flew flown|forbid forbade forbidden|forget forgot forgotten|forgive forgave forgiven
freeze froze frozen|get got gotten/got|give gave given|go went gone|grind ground ground|grow grew grown|hang hung hung|have had had|hear heard heard|hide hid hidden
hit hit hit|hold held held|hurt hurt hurt|keep kept kept|kneel knelt knelt|know knew known|lay laid laid|lead led led|leave left left|lend lent lent|let let let
lie lay lain|lose lost lost|make made made|mean meant meant|meet met met|mistake mistook mistaken|overcome overcame overcome|pay paid paid|put put put|quit quit quit
read read read|ride rode ridden|ring rang rung|rise rose risen|run ran run|say said said|see saw seen|seek sought sought|sell sold sold|send sent sent|set set set
sew sewed sewn|shake shook shaken|shed shed shed|shine shone shone|shoot shot shot|show showed shown|shrink shrank shrunk|shut shut shut|sing sang sung|sink sank sunk
sit sat sat|sleep slept slept|slide slid slid|speak spoke spoken|speed sped sped|spend spent spent|spin spun spun|spit spat spat|split split split|spread spread spread
spring sprang sprung|stand stood stood|steal stole stolen|stick stuck stuck|sting stung stung|stink stank stunk|strike struck struck|swear swore sworn|sweep swept swept
swell swelled swollen|swim swam swum|swing swung swung|take took taken|teach taught taught|tear tore torn|tell told told|think thought thought|throw threw thrown
understand understood understood|wake woke woken|wear wore worn|weave wove woven|weep wept wept|win won won|wind wound wound|withdraw withdrew withdrawn|write wrote written"""
# 규칙형(-ed)도 흔히 쓰는 동사: burned, learned 등은 규칙 변화형으로 막음
DUAL = {'burn', 'dream', 'learn', 'smell', 'spell', 'spill', 'hang', 'light', 'lie', 'shine', 'sew', 'show', 'swell', 'wake', 'bet', 'fit', 'wed', 'wet', 'quit', 'lean', 'leap', 'kneel', 'speed'}
# has·is·was처럼 -s 꼴이 아닌 be·have 변화형은 불규칙(허용). -ing와 goes·does 등은 규칙 변화형처럼 막음
IRREG_S = {'is', 'has', 'am', 'are', 'was', 'were', 'be'}
# 형용사로 굳은 과거분사(허용)
ALLOW_PP = 'beaten born broken drunk fallen forbidden forgotten frozen grown hidden known lost mistaken shaken spoken stolen sunken swollen torn worn written'.split()
# 복수 모양이지만 그 자체로 쓰는 단어, 명사·형용사 뜻이 있는 불규칙 꼴(요청에 적힌 단어 포함)
ALLOW_S = ('binoculars clothes economics glasses goods headquarters jeans maths means mathematics news pajamas pants physics politics scissors shorts '
           'stairs sunglasses thanks trousers tweezers').split()
# f·fe → ves 복수형: 모양이 바뀌므로 불규칙 복수로 허용(끝 글자로 판단하면 believes·saves도 걸려서 목록으로 둠)
ALLOW_VES = 'calves dwarves elves halves hooves knives leaves lives loaves scarves selves sheaves shelves thieves wharves wives wolves'.split()
ALLOW_FORM = ('after alas cleaner concerning depending excluding fell found including inner its left lighter mars outer regarding rose saw stranger upper '
              'goggles headphones sneakers').split()
# 불규칙 비교급·최상급(변화형 목록에는 없지만 앞선 파생어 파싱에 걸리지 않게 명시)
ALLOW_CMP = 'better best worse worst more most less least farther further farthest furthest'.split()
# 요청에 적힌 예시와, 말뭉치 빈도가 적거나 동사 쓰임이 많게 나오지만 형용사·명사 뜻이 주된 단어
ALLOW_ING_ED = ('tired excited frightened fascinating interesting building evening morning amazed amazing annoyed annoying bored boring confused confusing '
                'disappointed disappointing embarrassed embarrassing exciting frightening pleased pleasing relaxed relaxing satisfied satisfying scared shocked shocking '
                'surprised surprising terrified terrifying worried ceiling clothing feeling meaning meeting painting wedding sibling ending saving').split()
# 형용사·명사 뜻이 있어도 동사 변화형 쓰임이 주된 단어(말뭉치 비율과 상관없이 허용 목록에서 뺌)
VERB_MAIN = ('running playing walking swimming going coming eating drinking sleeping sitting standing singing dancing talking thinking looking working reading writing '
             'cooking fishing jogging climbing riding skating skiing studying teaching sailing cleaning washing watching helping baking '
             'moving flying driving jumping hunting smoking cutting making taking giving getting doing saying seeing using trying waiting asked called '
             'walked played used changed moved opened closed finished started loved liked wanted needed').split()
ALLOW_EXTRA = []


def idx(pos):
    s = set()
    for line in open(f'{WN}/index.{pos}', encoding='utf-8'):
        if line.startswith(' '): continue
        w = line.split(' ', 1)[0]
        if re.fullmatch('[a-z]+', w): s.add(w)
    return s


NOUN, VERB, ADJ, ADV = idx('noun'), idx('verb'), idx('adj'), idx('adv')
# 품사별 의미 빈도(WordNet index.sense의 tag count): 1 명사 2 동사 3·5 형용사 4 부사
sense = defaultdict(Counter)
for line in open(f'{WN}/index.sense', encoding='utf-8'):
    key, _, _, c = line.split()
    w, rest = key.split('%'); t = rest[0]
    sense[w][{'1': 'n', '2': 'v', '3': 'a', '5': 'a', '4': 'r'}[t]] += int(c)
# Brown 말뭉치 품사 빈도
tags = defaultdict(Counter)
for dp, _, fs in os.walk(BROWN):
    for f in fs:
        if not re.fullmatch('c[a-r][0-9]+', f): continue
        for tok in open(os.path.join(dp, f), encoding='utf-8').read().split():
            if '/' not in tok: continue
            w, t = tok.rsplit('/', 1); t = re.sub(r'(-(hl|tl|nc))+$', '', t)
            tags[w.lower()][t.split('+')[0]] += 1
JJ = lambda w: sum(c for t, c in tags[w].items() if t in ('jj', 'nn', 'nn$', 'rb', 'jjr', 'nns'))
VB = lambda w: sum(c for t, c in tags[w].items() if t in ('vbg', 'vbn', 'vbd', 'vb', 'vbz'))
CMPT = lambda w: sum(c for t, c in tags[w].items() if t in ('jjr', 'jjt', 'jjs', 'rbr', 'rbt'))

irr, pp_only, past = {}, {}, set()
for e in re.split(r'[|\n]', IRREG):
    b, pa, pp = e.split(); irr[b] = (pa.split('/'), pp.split('/'))
    past.update(pa.split('/'))
    for x in pp.split('/'):
        if x != b and x not in pa.split('/'): pp_only[x] = b

src = open('vocab.js', encoding='utf-8').read()
dict_w = {}
for k in ['VOCAB_NUM', 'VOCAB_E', 'VOCAB_M', 'VOCAB_TB', 'VOCAB_WF_E', 'VOCAB_WF_M']:
    for e in re.split(r'[|\n]', re.search(r'const ' + k + r' = `(.*?)`', src, re.S).group(1)):
        e = e.strip()
        if e: dict_w[e[:e.index(' ')].lower()] = e[e.index(' ') + 1:]
core = [e.strip().split(' ')[0].lower() for g in re.findall(r'[12]: `(.*?)`', re.search(r'const VOCAB_CORE = \{(.*?)\};', src, re.S).group(1), re.S) for e in re.split(r'[|\n]', g) if e.strip()]
accept = [e.strip() for e in re.split(r'[|\n]', re.search(r'const VOCAB_CORE_ACCEPT = `(.*?)`', src, re.S).group(1)) if e.strip()]
wl = set(re.search(r'WORDLIST = "([^"]*)"', open('wordlist.js', encoding='utf-8').read()).group(1).split('|'))
U = wl | set(dict_w) | set(core) | set(accept)
U = {w for w in U if re.fullmatch('[a-z]{2,}', w)}
block = BL.load()
U = {w for w in U if not BL.blocked(w, block)}


def bases_s(w):
    if w.endswith('ss') or len(w) < 3 or not w.endswith('s'): return []
    b = [w[:-1]]
    if w.endswith('ies'): b.append(w[:-3] + 'y')
    if re.search(r'(s|x|z|ch|sh|o)es$', w): b.append(w[:-2])
    if w.endswith('ves'): b += [w[:-3] + 'f', w[:-3] + 'fe']
    return b


def bases_ed(w):
    if not w.endswith('ed') or len(w) < 4: return []
    s = w[:-2]; b = [s, w[:-1]]
    if w.endswith('ied'): b.append(w[:-3] + 'y')
    if len(s) > 2 and s[-1] == s[-2]: b.append(s[:-1])
    if s.endswith('ck'): b.append(s[:-1])
    return b


def bases_ing(w):
    if not w.endswith('ing') or len(w) < 5: return []
    s = w[:-3]; b = [s, s + 'e']
    if len(s) > 2 and s[-1] == s[-2]: b.append(s[:-1])
    if w.endswith('ying'): b.append(w[:-4] + 'ie')
    if s.endswith('ck'): b.append(s[:-1])
    return b


def bases_cmp(w):
    for suf in ('est', 'er'):
        if w.endswith(suf) and len(w) > len(suf) + 1:
            s = w[:-len(suf)]; b = [s, s + 'e']
            if s.endswith('i'): b.append(s[:-1] + 'y')
            if len(s) > 2 and s[-1] == s[-2]: b.append(s[:-1])
            return b
    return []


# 규칙 변화형 만들기가 맞는지 앞으로 다시 확인(예: see+d=seed, fee+d=feed는 아님)
def verb_ok_ed(b, w):
    if b in irr and b not in DUAL: return False
    if w in VERB and CMPT(w) == 0 and VB(w) and tags[w]['vbd'] + tags[w]['vbn'] < tags[w]['vb'] + tags[w]['nn']: return False  # feed, need처럼 그 자체가 동사
    return True


out = {}   # 변화형 -> (원형, 종류) 종류 v 동사, n 명사, a 형용사·부사
for w in sorted(U):
    if w in IRREG_S or w in ALLOW_CMP: continue
    if w in pp_only: out[w] = (pp_only[w], 'v'); continue
    if w == 'does': out[w] = ('do', 'v'); continue
    # -ing
    b = [x for x in bases_ing(w) if x in VERB]
    if b: out[w] = (b[0], 'v'); continue
    # -ed
    b = [x for x in bases_ed(w) if x in VERB and verb_ok_ed(x, w)]
    if b and w not in past: out[w] = (b[0], 'v'); continue
    # -s/-es: 명사 복수와 동사 3인칭. 둘 다면 말뭉치에서 더 많이 쓰는 쪽
    bs = bases_s(w)
    bn = [x for x in bs if x in NOUN]; bv = [x for x in bs if x in VERB]
    if (bn or bv) and not w.endswith('ics') and not re.search(r'(us|is)$', w):
        # 복수 모양이 아닌 단수 단어를 거름: 원형이 아주 드물고 그 자체가 단수 명사로 쓰이면 뺌(lens, news, bias …)
        if tags[w]['nn'] > tags[w]['nns'] + tags[w]['vbz'] and tags[w]['nn'] >= 2: continue
        kind = 'n' if bn and (not bv or tags[w]['nns'] >= tags[w]['vbz']) else 'v'
        out[w] = ((bn if kind == 'n' else bv)[0], kind); continue
    # -er/-est: 원형이 형용사·부사이고, 그 자체가 다른 명사·동사(owner, offer, forest, flower)가 아닐 때만
    b = [x for x in bases_cmp(w) if x in ADJ or x in ADV]
    if b:
        other = (w in NOUN or w in VERB) and CMPT(w) <= tags[w]['nn'] + tags[w]['vb'] + tags[w]['nns']
        strong = CMPT(w) > 0
        # 원형이 형용사로 실제 쓰이는 단어만(말뭉치에 형용사로 나오거나 의미 빈도가 있음)
        real = any(tags[x]['jj'] + tags[x]['rb'] + sense[x]['a'] + sense[x]['r'] > 0 for x in b)
        if real and (strong or not other): out[w] = (b[0], 'a')

# 허용 목록
allow = set(ALLOW_PP + ALLOW_S + ALLOW_VES + ALLOW_FORM + ALLOW_CMP + ALLOW_ING_ED + ALLOW_EXTRA)
for w in U:
    if w in VERB_MAIN or w in pp_only: continue
    if not re.search(r'(ed|ing)$', w) or len(w) < 4: continue
    if w not in ADJ and w not in NOUN: continue
    t = JJ(w) + VB(w)
    if t >= 3: ok = JJ(w) / t >= 0.5
    else:   # 말뭉치에 거의 없음: WordNet에서 형용사로 실제 쓰인 기록이 있거나, 동사 변화형으로 볼 수 없는 단어만
        ok = (w in ADJ and sense[w]['a'] > 0) or w not in out
    if ok: allow.add(w)
for w in U:   # -ics 학문 이름은 변화형이 아님
    if w.endswith('ics') and w in NOUN: allow.add(w)
for k in ['VOCAB_E', 'VOCAB_M', 'VOCAB_TB']:
    for e in re.split(r'[|\n]', re.search(r'const ' + k + r' = `(.*?)`', src, re.S).group(1)):
        w = e.strip().split(' ')[0].lower()
        if re.search(r'(ed|ing)$', w) and w in out: allow.add(w)
allow = {w for w in allow if not BL.blocked(w, block)}

with open('data/inflections.tsv', 'w', encoding='utf-8', newline='\n') as f:
    f.write('변화형\t원형\t종류(v 동사·n 명사·a 형용사/부사)\n')
    for w in sorted(out): f.write(f'{w}\t{out[w][0]}\t{out[w][1]}\n')
with open('allowed-words.txt', 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(sorted(allow)) + '\n')
c = Counter(k for _, k in out.values())
print('변화형', len(out), dict(c), '허용', len(allow), '겹침', len(allow & set(out)))
