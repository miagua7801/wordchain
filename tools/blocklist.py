"""부적절한 단어 목록(blocklist.js) 관리 — 목록은 base64로 인코딩해 페이지 소스에서 바로 읽히지 않게 함
  python tools/blocklist.py show                 목록 보기
  python tools/blocklist.py add 단어 [단어…]      정확히 같을 때 막는 단어 추가
  python tools/blocklist.py add --strong 단어 …  단어장 밖 입력 안에 들어 있기만 해도 막는 강한 표현 추가
  python tools/blocklist.py allow 단어 [단어…]    강한 표현이 들어 있어도 허용할 정상 단어(예: snigger)
  python tools/blocklist.py remove 단어 [단어…]   삭제
  python tools/blocklist.py check 단어 [단어…]    막히는지 확인
바꾼 뒤에는 python build.py 로 다시 빌드한다(빌드할 때 영어 단어 목록에서도 금지어를 뺌).
"""
import sys, os, re, json, base64

FILE = os.path.join(os.path.dirname(__file__), '..', 'blocklist.js')
HEAD = ('// 부적절한 단어 목록 — base64로 인코딩한 JSON {"exact":[정확히 같을 때 막음], "strong":[단어장 밖 입력에 들어 있으면 막음], "allow":[강한 표현이 들어 있어도 허용]}\n'
        '// 수정: python tools/blocklist.py show | add 단어 | add --strong 단어 | allow 단어 | remove 단어 (README 참고)\n')

def load():
    if not os.path.exists(FILE): return {'exact': [], 'strong': [], 'allow': []}
    m = re.search(r'BLOCKLIST\s*=\s*"([^"]*)"', open(FILE, encoding='utf-8').read())
    d = json.loads(base64.b64decode(m.group(1)).decode('utf-8')) if m else {}
    return {'exact': d.get('exact', []), 'strong': d.get('strong', []), 'allow': d.get('allow', [])}

def save(d):
    d = {k: sorted(set(d.get(k, []))) for k in ('exact', 'strong', 'allow')}
    enc = base64.b64encode(json.dumps(d, separators=(',', ':')).encode('utf-8')).decode('ascii')
    with open(FILE, 'w', encoding='utf-8', newline='\n') as f: f.write(HEAD + 'const BLOCKLIST = "' + enc + '";\n')

# 앱(app.html)과 같은 규칙: 소문자, 같은 글자 3번 이상 반복은 2번으로. 일부러 늘여 쓴(3번 이상 반복) 입력은 1번으로 줄인 형태도 비교
def norm2(w): return re.sub(r'(.)\1{2,}', r'\1\1', w.lower())
def norm1(w): return re.sub(r'(.)\1+', r'\1', w.lower())
def blocked(w, d, in_vocab=False):
    n2, stretched = norm2(w), re.search(r'(.)\1\1', w.lower()) is not None
    ex1 = {norm1(x) for x in d['exact']}; st1 = [norm1(x) for x in d['strong']]
    if n2 in d['exact'] or (stretched and norm1(w) in ex1): return True
    if in_vocab or n2 in d['allow']: return False
    return any(s in n2 for s in d['strong']) or (stretched and any(s in norm1(w) for s in st1))

if __name__ == '__main__':
    a = sys.argv[1:]; d = load()
    if not a or a[0] == 'show':
        for k in ('exact', 'strong', 'allow'): print(k.ljust(6), ':', ' '.join(d[k]))
    elif a[0] == 'add':
        strong = '--strong' in a; ws = [w.lower() for w in a[1:] if w != '--strong']
        d['strong' if strong else 'exact'] += ws; save(d); print('추가:', ' '.join(ws))
    elif a[0] == 'allow':
        ws = [w.lower() for w in a[1:]]; d['allow'] += ws; save(d); print('허용 예외 추가:', ' '.join(ws))
    elif a[0] == 'remove':
        ws = {w.lower() for w in a[1:]}
        for k in ('exact', 'strong', 'allow'): d[k] = [x for x in d[k] if x not in ws]
        save(d); print('삭제:', ' '.join(ws))
    elif a[0] == 'check':
        for w in a[1:]: print(w, '→', '막힘' if blocked(w, d) else '허용')
