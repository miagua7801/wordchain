// 저작권·출처 표시: SCOWL/ESDB 고지와 허가문 전문이 빌드 결과·설명 문서·앱 출처 창에 그대로 있는지, 이 앱의 저작권 줄(© 2026 miagua7801)과 CC BY-NC-ND 4.0 링크가 있는지. node tests/license.js [주소]
// 기준은 wordlist.js 머리 주석 한곳. 목록을 다시 만들어 연도·문구가 바뀌면 고칠 곳을 FAIL로 알려 줌. 먼저 python build.py
const fs=require('fs'), path=require('path');
const {target,open}=require('./lib');
const R=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');

// build.py의 scowl_notice()와 같은 방법으로 꺼냄: 고지 줄(Copyright …) + 허가문 문단(Permission to use … warranty.)
function notice(src){
  const L=src.split('const WORDLIST')[0].split(/\r?\n/).map(l=>l.replace(/^\/\/\s?/,'').trimEnd());
  const cp=L.find(l=>l.startsWith('Copyright ')), i=L.findIndex(l=>l.startsWith('Permission to use'));
  const perm=[]; for(const l of L.slice(i)){ if(!l.trim()) break; perm.push(l.trim()); }
  return {cp, perm:perm.join(' ')};
}
// 비교용: 줄 앞 주석·인용 기호(//, >)와 HTML 태그를 지우고 공백을 하나로
const norm=s=>s.split(/\r?\n/).map(l=>l.replace(/^\s*(\/\/|>)\s?/,'')).join(' ').replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/g,' ');

(async()=>{
  const url=target(process.argv[2]); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const N=notice(R('wordlist.js'));
  ok(/^Copyright \d{4}-\d{4} by Kevin Atkinson$/.test(N.cp||'')&&/^Permission to use.*warranty\.$/.test(N.perm),`wordlist.js 머리 주석에서 고지 찾음: "${N.cp}"`);
  const cp=norm(N.cp), perm=norm(N.perm);

  // 1. 모든 복사본(빌드 결과)과 설명 문서에 고지·허가문 전문. 다른 연도의 고지가 남아 있으면 안 됨
  for(const f of ['dist/word-chain-challenge.html','dist/wordchain.html','NOTICE.md','README.md','intro.html']){
    if(!fs.existsSync(path.resolve(__dirname,'..',f))){ ok(false,`${f} 없음 (python build.py 먼저)`); continue; }
    const t=norm(R(f)), years=[...new Set(t.match(/Copyright \d{4}-\d{4} by Kevin Atkinson/g)||[])];
    ok(t.includes(cp)&&t.includes(perm),`${f}: 고지 + 허가문 전문`);
    ok(years.length===1&&years[0]===cp,`${f}: 고지 연도가 wordlist.js와 같음 ${years.join(', ')}`);
  }
  for(const f of ['dist/word-chain-challenge.html','dist/wordchain.html']){
    const h=R(f);
    ok(!h.includes('__SCOWL_NOTICE__')&&h.includes('const SCOWL_NOTICE='+JSON.stringify(N.cp+'\n'+N.perm)),`${f}: 앱 출처 창 문구를 빌드가 wordlist.js에서 넣음`);
  }

  // 2. 이 앱의 저작권·라이선스(CC BY-NC-ND 4.0, 저작자 miagua7801)
  const CC='creativecommons.org/licenses/by-nc-nd/4.0', ME='© 2026 miagua7801';
  const lic=R('LICENSE');
  ok(lic.startsWith('Copyright (c) 2026 miagua7801')&&lic.includes('Attribution-NonCommercial-NoDerivatives 4.0 International')&&/Section 8 -- Interpretation\./.test(lic),'LICENSE: 저작권 줄 + 적용 범위 + CC BY-NC-ND 4.0 법적 전문(영문)');
  const lic1=lic.replace(/\s+/g,' '); ok(/SCOWL/.test(lic1)&&/Article 7/.test(lic1)&&/Open Font License/.test(lic1),'LICENSE: 다른 출처(기본 어휘·SCOWL·글꼴)는 각자의 조건이라고 밝힘');
  const top1=R('dist/word-chain-challenge.html').split(/\r?\n/)[1], top0=R('dist/wordchain.html').split(/\r?\n/)[0];
  for(const [f,l] of [['dist/word-chain-challenge.html',top1],['dist/wordchain.html',top0]])
    ok(l.startsWith('<!--')&&l.includes(ME)&&l.includes(CC),`${f}: 맨 위 주석에 저작권·라이선스 한 줄`);
  for(const f of ['README.md','NOTICE.md']) ok(R(f).includes(ME)&&R(f).includes(CC),`${f}: 저작권 줄 + 라이선스 링크`);
  const it=norm(R('intro.html'));
  ok(/© 2026 <span id="author">[^<]+<\/span>/.test(R('intro.html'))&&R('intro.html').includes(CC+'/deed.ko'),'intro.html: 저작권 표시(이름은 id="author" 한곳) + 라이선스 링크');
  ok(it.includes('할 수 있는 것 출처를 밝히고 비영리로 사용하기, 원본 그대로 공유하기(링크 전달, 파일 복사)')&&it.includes('할 수 없는 것 판매 등 상업적 이용, 고쳐서 배포하기(단어 추가, 화면 변경, 일부를 다른 앱에 넣기 등)')&&it.includes('수업에 맞게 내용을 수정하려면 저작자의 허락을 받아야 합니다. (문의: miagua7801@gmail.com')&&/href="mailto:miagua7801@gmail.com/.test(R('intro.html'))&&/저작자가 만든 부분.*에만 적용/.test(it),'intro.html: 할 수 있는 것/없는 것·문의·적용 범위');
  ok(R('intro.html').indexOf('class="lic"')<R('intro.html').indexOf('class="src"'),'intro.html: 내 저작권 표시가 기존 출처 표시 위');

  // 3. 앱 화면: 단계 맵 아래 '출처·저작권' → 창에 한국어 안내 + 영어 고지 원문. 선생님 모드('버전' 5번 누르기)와 따로 동작
  const {b,p,errs}=await open({student:true,viewport:{width:390,height:760},isMobile:true,hasTouch:true});
  await p.goto(url); await p.evaluate(()=>localStorage.clear()); await p.goto(url);
  // 늘 보이는 한 줄: 첫 화면과 단계 맵 아래, 휴대폰 너비에서 두 줄 이하·가로로 밀어내지 않음
  const own=()=>p.$eval('.own',e=>{ const r=e.getBoundingClientRect(), lh=parseFloat(getComputedStyle(e).lineHeight);
    return {t:e.innerText.replace(/\s+/g,' ').trim(), lines:Math.round(r.height/lh), inside:r.left>=0&&r.right<=innerWidth, wide:document.documentElement.scrollWidth>innerWidth}; }).catch(()=>null);
  const LINE='© 2026 miagua7801 · CC BY-NC-ND 4.0 · 출처·저작권';
  let o=await own(); ok(o&&o.t===LINE&&o.lines<=2&&o.inside&&!o.wide,`첫 화면: 저작권 한 줄 "${o&&o.t}" (${o&&o.lines}줄, 넘침 ${o&&o.wide})`);
  await p.click('#credits'); ok(!!(await p.$('.overlay [role=dialog][aria-label="출처·저작권"]')),'첫 화면: 출처 창 열림');
  await p.keyboard.press('Escape'); await p.waitForTimeout(100); ok(!(await p.$('.overlay')),'첫 화면: Esc로 닫힘');
  await p.click('[data-t="basic"]'); await p.waitForSelector('#credits');
  o=await own(); ok(o&&o.t===LINE&&o.lines<=2&&o.inside&&!o.wide,`단계 맵: 저작권 한 줄 (${o&&o.lines}줄, 넘침 ${o&&o.wide})`);
  ok(!(await p.evaluate(()=>/@[a-z0-9-]+\.[a-z]/i.test(document.body.innerText))),'학생 화면에 이메일 주소 없음');
  // 두 글자 상자 사이 거리(가로 또는 세로)가 8px 이상이면 잘못 누를 일이 적음. 줄이 바뀌어 아래로 가도 됨
  const box=await p.$eval('#credits',e=>{ const r=e.getBoundingClientRect(), v=document.querySelector('#ver').getBoundingClientRect();
    return {vis:r.width>0, gap:Math.max(r.left-v.right, v.left-r.right, r.top-v.bottom, v.top-r.bottom)}; });
  ok(box.vis&&box.gap>=8,`'출처·저작권' 버튼이 '버전' 글자와 떨어져 있음 (간격 ${Math.round(box.gap)}px)`);
  await p.click('#credits');
  const d=await p.$eval('.overlay [role=dialog]',e=>({t:e.innerText,label:e.getAttribute('aria-label')}));
  const dt=norm(d.t);
  ok(d.label==='출처·저작권'&&dt.includes(cp)&&dt.includes(perm),'출처 창: SCOWL 고지 + 허가문 전문(영어 원문)');
  const lk=await p.$eval('.overlay .credits a[href*="by-nc-nd"]',e=>({href:e.href,t:e.target})).catch(()=>null);
  ok(dt.includes('© 2026 miagua7801')&&lk&&lk.href.includes(CC)&&lk.t==='_blank'&&/할 수 없는 것/.test(dt),'출처 창: © 2026 miagua7801 + CC BY-NC-ND 4.0 링크(새 창) + 할 수 있는 것/없는 것');
  ok(/저작자가 만든|앱 코드·화면·게임 규칙·한국어 뜻풀이·문구에 적용/.test(dt),'출처 창: 라이선스 적용 범위');
  ok(/교육부 고시 영어과 교육과정/.test(dt)&&dt.includes('교육부 고시 제2022-33호 [별책 3]')&&/저작권법 제7조/.test(dt)&&/Open Font License/.test(dt),'출처 창: 기본 어휘 출처·고시 번호·근거, 글꼴 라이선스(한국어 안내)');
  ok(!(await p.evaluate(()=>/@[a-z0-9-]+\.[a-z]/i.test(document.body.innerText))),'출처 창에도 이메일 주소 없음');
  await p.click('#ov1');
  ok(!(await p.$('.overlay'))&&await p.evaluate(()=>document.activeElement&&document.activeElement.id==='credits'),'닫기 → 창 닫히고 초점은 출처 버튼으로');
  await p.focus('#credits'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  const kb=await p.evaluate(()=>!!document.querySelector('.overlay')&&document.activeElement.id==='ov1');
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  ok(kb&&!(await p.$('.overlay'))&&await p.evaluate(()=>document.activeElement.id==='credits'),'키보드: Enter로 열고(초점은 닫기) Enter로 닫음 → 초점은 출처 버튼');
  for(let i=0;i<5;i++){ await p.click('#credits'); await p.click('#ov1'); }
  ok(await p.evaluate(()=>localStorage.getItem('wordchain-teacher')!=='1'&&!document.querySelector('#teacher')),'출처 버튼을 5번 눌러도 선생님 모드는 켜지지 않음');
  ok(!errs.length,'페이지 오류 없음 '+errs.join(' | '));
  await b.close();
  console.log(fail?`\n${fail}개 실패`:'\n모두 통과'); process.exit(fail?1:0);
})();
