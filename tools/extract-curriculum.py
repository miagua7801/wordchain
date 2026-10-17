"""교육부 영어과 교육과정 [별표] 기본 어휘 목록 PDF -> data/curriculum-vocab.json + data/extract-report.md

  python tools/extract-curriculum.py [data/basic-vocab.pdf]

표시 해석: `*` 초등 권장(level 1), `**` 중학교(level 2), 표시 없음 고등학교 수준(level 3)
- 괄호 안 단어(파생어)는 forms에 넣고 앞 단어의 level을 따름
- 빗금(/)으로 나뉜 철자는 앞(미국식)을 word로, 나머지를 forms로
- 줄바꿈으로 나뉜 항목(다음 줄이 '('로 시작하거나 괄호가 안 닫힘)은 앞 항목에 붙임
- 띄어쓰기·하이픈이 있는 표현은 끝말잇기 단어에서 빼고 보고서에 따로 적음
텍스트 추출은 pdftotext -raw (Xpdf/Poppler). 글자가 없는 쪽이 있으면 멈춤(OCR 하지 않음).
"""
import json, re, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")
from collections import Counter

PDF = sys.argv[1] if len(sys.argv) > 1 else 'data/basic-vocab.pdf'
HEAD = re.compile(r'^(중학교 교육과정|\[별표\] 영역|기본 어휘 목록|\d{3}|[A-Z])$')
WORD = re.compile(r'^[A-Za-z]+$')
_wl = re.search(r'WORDLIST = "([^"]*)"', open('wordlist.js', encoding='utf-8').read())
US = set(_wl.group(1).split('|')) if _wl else set()


def pages_text():
    out = subprocess.run(['pdftotext', '-raw', '-enc', 'UTF-8', PDF, '-'], capture_output=True, check=True).stdout.decode('utf-8')
    pages = out.split('\f')
    if pages and not pages[-1].strip(): pages.pop()
    empty = [i + 1 for i, p in enumerate(pages) if not re.search(r'[a-z]', p)]
    if empty: sys.exit(f'글자가 추출되지 않는 쪽: {empty} — 멈춤(OCR 하지 않음)')
    return pages


def entries(pages):
    """쪽마다 줄을 읽어 항목 문자열로 묶음 (머리말·쪽 번호·알파벳 제목 제외)"""
    items, printed = [], []
    for p in pages:
        for line in p.split('\n'):
            s = re.sub(r'\s+', ' ', line).strip()
            if not s: continue
            if HEAD.match(s):
                if s.isdigit(): printed.append(int(s))
                continue
            prev = items[-1] if items else None
            if prev is not None and (s.startswith('(') or s.startswith('/') or prev.endswith('/') or prev.count('(') > prev.count(')')):
                items[-1] = prev + ' ' + s
            else:
                items.append(s)
    return items, printed


def level(tok):
    m = re.search(r'(\*+)$', tok)
    return {None: 3, '*': 1, '**': 2}[m.group(1) if m else None] if not m or len(m.group(1)) <= 2 else None


def parse(raw):
    """-> (entry dict | None, notes[])"""
    notes = []
    paren = re.findall(r'\(([^)]*)\)', raw)
    head = re.sub(r'\([^)]*\)', ' ', raw).strip()
    if '(' in head or ')' in head: return None, ['괄호 짝이 맞지 않음']
    spell = [x.strip() for x in head.split('/') if x.strip()]
    if not spell: return None, ['단어 없음']
    lv = level(spell[0])
    if lv is None: return None, ['별표 개수 이상']
    base = [re.sub(r'\*+$', '', x).strip() for x in spell]
    lvs = {level(x) for x in spell}
    if len(lvs) > 1: notes.append(f'빗금 철자의 별표가 다름: {head}')
    forms, multi = [], []
    for alt in base[1:]: (forms if WORD.match(alt) else multi).append(alt)
    for grp in paren:
        for f in re.split(r'[,/]', grp):
            f = re.sub(r'\*+$', '', f.strip().replace('­', '-'))
            if not f: continue
            (forms if WORD.match(f) else multi).append(f)
    # 앞 철자가 미국식 영어 단어 목록(wordlist.js, SCOWL)에 없고 뒤 철자가 있으면 뒤 철자를 word로 (advertize/advertise, catalogue/catalog)
    if len(base) > 1 and base[0].lower() not in US and any(x.lower() in US for x in base[1:]):
        i = next(i for i, x in enumerate(base) if x.lower() in US)
        notes.append(f'미국식 철자 {base[i]}를 word로 (앞 철자 {base[0]}는 영어 단어 목록에 없음)')
        forms.remove(base[i]); forms.insert(0, base[0]); base[0], base[i] = base[i], base[0]
    w = base[0]
    if not WORD.match(w): return {'multi': w, 'raw': raw, 'level': lv}, notes
    seen, fs = {w.lower()}, []
    for f in forms:
        if f.lower() not in seen: seen.add(f.lower()); fs.append(f.lower())
    e = {'word': w.lower(), 'forms': fs, 'level': lv, 'raw': raw}
    if w != w.lower(): e['display'] = w
    if multi: e['multiForms'] = multi
    return e, notes


def main():
    pages = pages_text()
    items, printed = entries(pages)
    out, multi, odd = [], [], []
    for raw in items:
        e, notes = parse(raw)
        if e is None: odd.append((raw, '; '.join(notes))); continue
        if 'multi' in e: multi.append((e['multi'], e['level'], raw)); continue
        for n in notes: odd.append((raw, n))
        out.append(e)
    # 같은 단어가 두 번 나오면 낮은 level(쉬운 쪽) 하나만
    byw = {}
    for e in out:
        if e['word'] in byw:
            o = byw[e['word']]; odd.append((e['raw'], f"중복 항목(앞: {o['raw']}) — 합침"))
            o['level'] = min(o['level'], e['level']); o['forms'] += [f for f in e['forms'] if f not in o['forms']]
        else: byw[e['word']] = e
    out = list(byw.values())
    json.dump(out, open('data/curriculum-vocab.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

    lv = Counter(e['level'] for e in out)
    al = Counter(e['word'][0] for e in out)
    nforms = sum(len(e['forms']) for e in out)
    slash = [e for e in out if '/' in re.sub(r'\([^)]*\)', '', e['raw'])]
    joined = [r for r in items if re.search(r'\S \(', r) is None and r.startswith('(')]
    R = ['# 기본 어휘 추출 보고서', '',
         f'- 원본: `{PDF}` ({len(pages)}쪽, 인쇄 쪽 번호 {min(printed)}~{max(printed)}, 찾은 쪽 번호 {len(printed)}개)',
         '- 추출: `pdftotext -raw` (모든 쪽에서 글자 추출됨, OCR 안 씀). 다시 만들기: `python tools/extract-curriculum.py`',
         '- 표시 해석: `*` 초등 권장 → level 1, `**` 중학교 → level 2, 표시 없음 → level 3 (고등학교 수준)', '',
         '## 개수',
         f'- 항목(끝말잇기 단어) {len(out)}개 — level 1: {lv[1]}, level 2: {lv[2]}, level 3: {lv[3]}',
         f'- forms(괄호 안 파생어·다른 철자) {nforms}개 — 앞 단어의 level을 따름',
         f'- 첫 단어: `{out[0]["raw"]}` / 마지막 단어: `{out[-1]["raw"]}`', '',
         '| 글자 | ' + ' | '.join(sorted(al)) + ' |', '|---|' + '---|' * len(al),
         '| 개수 | ' + ' | '.join(str(al[k]) for k in sorted(al)) + ' |', '',
         '## 빗금 철자 (미국식 철자를 word로, 나머지는 forms — 기존 단어장에 없으면 학생 답으로만 인정)'] + [f'- `{e["raw"]}` → {e["word"]} (+ {", ".join(e["forms"])})' for e in slash] + ['',
         '## 띄어쓰기·하이픈 표현 (끝말잇기 단어에서 뺌)'] + [f'- `{w}` (level {l}) — 원문 `{r}`' for w, l, r in multi] + \
        [f'- `{m}` (괄호 안, level {e["level"]}) — 원문 `{e["raw"]}`' for e in out for m in e.get('multiForms', [])] + ['',
         '## 규칙으로 처리하지 못했거나 확인이 필요한 항목 (자동 처리한 내용 포함)'] + ([f'- `{r}` — {n}' for r, n in odd] or ['- 없음'])
    open('data/extract-report.md', 'w', encoding='utf-8').write('\n'.join(R) + '\n')
    print('\n'.join(R[:16]))


if __name__ == '__main__':
    main()
