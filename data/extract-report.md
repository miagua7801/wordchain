# 기본 어휘 추출 보고서

- 원본: `data/basic-vocab.pdf` (33쪽, 인쇄 쪽 번호 402~434, 찾은 쪽 번호 33개)
- 추출: `pdftotext -raw` (모든 쪽에서 글자 추출됨, OCR 안 씀). 다시 만들기: `python tools/extract-curriculum.py`
- 표시 해석: `*` 초등 권장 → level 1, `**` 중학교 → level 2, 표시 없음 → level 3 (고등학교 수준)

## 개수
- 항목(끝말잇기 단어) 2997개 — level 1: 797, level 2: 1200, level 3: 1000
- forms(괄호 안 파생어·다른 철자) 282개 — 앞 단어의 level을 따름
- 첫 단어: `a* (an)` / 마지막 단어: `zoo*`

| 글자 | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | y | z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 개수 | 206 | 175 | 326 | 175 | 133 | 159 | 92 | 97 | 110 | 21 | 18 | 97 | 138 | 64 | 66 | 235 | 12 | 158 | 351 | 179 | 30 | 49 | 93 | 9 | 4 |

## 빗금 철자 (미국식 철자를 word로, 나머지는 forms — 기존 단어장에 없으면 학생 답으로만 인정)
- `advertize** / advertise**` → advertise (+ advertize)
- `airplane* / aeroplane*` → airplane (+ aeroplane)
- `analyze / analyse` → analyze (+ analyse)
- `catalogue** / catalog**` → catalog (+ catalogue)
- `check* / cheque*` → check (+ cheque)
- `color* / colour*` → color (+ colour)
- `cookie* / cooky*` → cookie (+ cooky)
- `defense** / defence**` → defense (+ defence)
- `dialogue* / dialog*` → dialogue (+ dialog)
- `favor** / favour**` → favor (+ favour)
- `favorite* / favourite*` → favorite (+ favourite)
- `fiber / fibre` → fiber (+ fibre)
- `flavor / flavour` → flavor (+ flavour)
- `gasoline / petrol` → gasoline (+ petrol)
- `gray* / grey*` → gray (+ grey)
- `gymnasium / gym` → gymnasium (+ gym)
- `harbor / harbour` → harbor (+ harbour)
- `hello* / hey* / hi*` → hello (+ hey, hi)
- `honor** / honour**` → honor (+ honour)
- `humor** / humour**` → humor (+ humour)
- `inquire / enquire` → inquire (+ enquire)
- `labor** / labour**` → labor (+ labour)
- `laboratory** / lab**` → laboratory (+ lab)
- `license** / licence**` → license (+ licence)
- `mathematics* / maths* / math*` → mathematics (+ maths, math)
- `neighbor** / neighbour**` → neighbor (+ neighbour)
- `no* / nope* / nay*` → no (+ nope, nay)
- `okay* / okey* / OK*` → okay (+ okey, ok)
- `oversea / overseas` → oversea (+ overseas)
- `photograph** / photo**` → photograph (+ photo)
- `practice** / practise**` → practice (+ practise)
- `program* / programme* (programmatic)` → program (+ programme, programmatic)
- `rumor / rumour` → rumor (+ rumour)
- `technique** / technic**` → technique (+ technic)
- `telephone* / phone*` → telephone (+ phone)
- `theater** / theatre**` → theater (+ theatre)
- `toward** / towards**` → toward (+ towards)
- `upward / upwards` → upward (+ upwards)
- `utilize / utilise` → utilize (+ utilise)
- `yes* / yeah* / yep*` → yes (+ yeah, yep)

## 띄어쓰기·하이픈 표현 (끝말잇기 단어에서 뺌)
- `twenty-first` (level 1) — 원문 `twenty-first*`
- `twenty-second` (level 1) — 원문 `twenty-second*`
- `twenty-third` (level 1) — 원문 `twenty-third*`
- `half-moon` (괄호 안, level 1) — 원문 `moon* (half­moon)`

## 규칙으로 처리하지 못했거나 확인이 필요한 항목 (자동 처리한 내용 포함)
- `advertize** / advertise**` — 미국식 철자 advertise를 word로 (앞 철자 advertize는 영어 단어 목록에 없음)
- `catalogue** / catalog**` — 미국식 철자 catalog를 word로 (앞 철자 catalogue는 영어 단어 목록에 없음)

## 단어장 반영 (tools/make-core-vocab.py)

- VOCAB_CORE 2099개 — level 1: 820, level 2: 1279 (괄호 안 파생어 포함)
  - 기존 단어장에 있어 그 뜻을 씀: 1458개 / 새로 뜻을 씀: 641개 (level 1: 59, level 2: 582) → `data/new-meanings-review.tsv`
- VOCAB_CORE_ACCEPT(학생 답으로만) 973개 — 기존 단어장에 없는 level 3·다른 철자·출제 제외 단어
- 금지어에 걸려 뺀 단어: 없음
- 기본 어휘지만 출제에서 뺀 단어(학생 답으로는 인정): alcohol, beer, breast, cigarette, gun, hell, kill, livingroom, pregnant, pub, sex, wine
- 영어 단어 목록(wordlist.js)에 없는 기본 어휘 42개 (단어장·인정 목록에 있어 정답으로 인정됨): a, advertize, aeroplane, aggress, analyse, behaviour, catalogue, cheque, colour, cooky, criticise, defence, enquire, enrol, environ, evitable, favour, favourite, fibre, flavour, fulfil, grey, harbour, honour, humour, i, illude, labour, licence, livingroom, maths, neighbour, ok, okey, organise, practise, programme, realise, rumour, technic, theatre, utilise
