// 소리 잇기(맛보기·도전+): 단어쌍 판정 표, 오답 설명, 안내(모음 끝·변화형·발음 없음), 맛보기 5문제·배지, 출제 범위, 잠금·버튼, 카드. node tests/sound.js [주소]
const {target,open}=require('./lib');
let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
// [앞 단어, 학생 단어, 맛보기, 도전+] — o 정답, x 오답, - 맛보기에서 컴퓨터가 내지 않는 단어
const T=[['church','cheese','o','o'],['church','cheetah','i','i'],['church','chorus','x','x'],['fish','chef','o','o'],['nice','sure','-','x'],['math','think','o','o'],['math','this','x','x'],['smooth','this','o','o'],['smooth','think','x','x'],['laugh','phone','o','o'],['knife','fish','o','o'],
  ['book','kite','-','o'],['book','city','-','i'],['book','know','-','i'],['book','queen','-','o'],['music','chorus','-','o'],['stomach','kite','-','o'],['stomach','chair','-','x'],['headache','cat','-','o'],['headache','chorus','-','o'],['nice','city','-','i'],['nice','circle','-','o'],
  ['bridge','giant','-','o'],['bridge','jump','-','o'],['bridge','get','-','x'],['rain','knife','-','o'],['sign','night','-','o']];
const WHY={'math this':"math는 /θ/ 떨리지 않는 th로 끝나요. this는 /ð/ 떨리는 th로 시작해서 이어질 수 없어요.",'bridge get':"bridge는 /dʒ/ j '쥐' 소리로 끝나요. get은 /g/ g '그' 소리로 시작해서 이어질 수 없어요.",'church chorus':"church는 /tʃ/ ch '취' 소리로 끝나요. chorus는 /k/ k 소리로 시작해서 이어질 수 없어요.",'nice sure':"nice는 /s/ s 소리로 끝나요. sure는 /ʃ/ sh '쉬' 소리로 시작해서 이어질 수 없어요."};
const startSnd=async(p,url,k)=>{ await p.goto(url); await p.click(k==='plus'?'[data-t="hard"]':'[data-t="normal"]'); await p.click(`[data-snd="${k}"]`,{force:true}); await p.waitForSelector('#inp'); };
// 컴퓨터 단어를 정해 학생 단어를 넣고 결과를 돌려줌. o 정답, x 오답(설명), i 안내(그대로 다시 입력)
async function play(p,a,w){ await p.evaluate(()=>window.__wordchain.again()); await p.waitForSelector('#inp'); const set=await p.evaluate(a=>window.__wordchain.forceCpu(a),a); await p.waitForSelector('#inp');
  const r0=(await p.evaluate(()=>window.__wordchain.state())).rights; await p.fill('#inp',w); await p.press('#inp','Enter'); await p.waitForTimeout(650);
  const r1=(await p.evaluate(()=>window.__wordchain.state())).rights, ov=await p.$('.overlay'); let text='';
  if(ov){ text=await ov.textContent(); await p.click('#ov1'); await p.waitForTimeout(40); return {r:'x',text,set}; }
  return {r:r1>r0?'o':'i',text:await p.textContent('#msg'),set}; }
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}});
  const rows=[];
  for(const [k,col] of [['taste',2],['plus',3]]){ await startSnd(p,url,k);
    for(const t of T){ const want=t[col]; if(want==='-'){ rows.push([k,t[0],t[1],'-','-']); continue; }
      const o=await play(p,t[0],t[1]); rows.push([k,t[0],t[1],want,o.r]); ok(o.set&&o.r===want,`${k==='taste'?'맛보기':'도전+'} ${t[0]} → ${t[1]}: 기대 ${want}, 결과 ${o.r}`);
      const why=WHY[t[0]+' '+t[1]]; if(why&&want==='x') ok(o.text.includes(why),`  오답 설명: ${why}`); } }
  console.log('\n| 단어쌍 | 맛보기 기대 | 맛보기 결과 | 도전+ 기대 | 도전+ 결과 |\n|---|---|---|---|---|');
  const M={o:'⭕',x:'✗','-':'—',i:'안내'}; for(const t of T){ const a=rows.find(r=>r[0]==='taste'&&r[1]===t[0]&&r[2]===t[1]), c=rows.find(r=>r[0]==='plus'&&r[1]===t[0]&&r[2]===t[1]); console.log(`| ${t[0]} → ${t[1]} | ${M[a[3]]} | ${M[a[4]]} | ${M[c[3]]} | ${M[c[4]]} |`); } console.log('');
  // 안내(오답 아님): 하트·성공 그대로
  await startSnd(p,url,'plus');
  const note=async(w,want,name)=>{ const before=await p.evaluate(()=>window.__wordchain.state()); const o=await play(p,'book',w); const st=await p.evaluate(()=>window.__wordchain.state()); ok(o.r==='i'&&o.text.includes(want)&&st.lives===before.lives,`${name}: "${o.text}"`); };
  await note('happy','모음 소리로 끝나는 단어는 쓸 수 없어요. 다른 단어를 입력해 보세요','(학생) happy');
  await note('tea','모음 소리로 끝나는','(학생) tea'); await note('teacher','모음 소리로 끝나는','(학생) teacher');
  await note('cats','cats는 쓸 수 없어요. 단수형으로 입력해 보세요.','(학생) cats');
  await note('running','running은 쓸 수 없어요. 원형으로','(학생) running');
  await note('zzqxv','다른 단어를 입력해 보세요','(학생) 사전에 없는 단어');
  // 학생 답은 발음 중 하나만 맞아도 정답: with는 /ð/·/θ/ 둘 다
  { const s=await p.evaluate(()=>window.__wordchain.sound.first('either')); const o=await play(p,'kite','tea'); ok(o.r==='i','(학생) tea → kite 뒤에서도 모음 끝 안내'); const a=await p.evaluate(()=>window.__wordchain.sound.end('with')); ok(a.includes('TH')&&a.includes('DH'),'with의 끝소리 두 가지 '+a); const c=await play(p,'with','this'), d=await play(p,'with','think'); ok(c.r==='o'&&d.r==='o','with 뒤 this·think 둘 다 정답(컴퓨터 단어가 여러 발음이면 어느 쪽이든)'); }
  // 소리 카드: 맞힌 뒤에 보이고, 같은 소리는 다시 안 나옴. 카드를 읽을 시간 뒤 다음 단어
  { await p.evaluate(()=>window.__wordchain.again()); await p.waitForSelector('#inp'); const k0=(await p.evaluate(()=>window.__wordchain.sound.asked()[0]))==='K'; const [cw0,ans0,card0,card1]=k0?['nice','sun','/s/ s 소리','sure, sugar']:['book','kite','/k/ k 소리','stomach, headache'];   // 첫 문제가 이미 /k/면 처음 만난 소리가 아니라 카드가 없으므로 다른 소리로
    await p.evaluate(w=>window.__wordchain.forceCpu(w),cw0); await p.waitForSelector('#inp'); ok(!(await p.$('#scard')),'소리 카드: 답을 내기 전에는 없음');
    await p.fill('#inp',ans0); await p.press('#inp','Enter'); await p.waitForSelector('#qm #scard'); const c1=await p.textContent('#qm #scard'); ok(c1.includes(card0)&&c1.includes(card1),'  맞히면 소리 카드 — '+c1.slice(0,24));
    await p.waitForTimeout(3000); ok(!!(await p.$('#qm #scard')),'  3초 뒤에도 카드를 읽을 수 있음');
    await p.waitForFunction(w=>window.__wordchain.cpu()!==w,cw0,{timeout:12000}); ok(!(await p.$('#scard'))&&!!(await p.$('#inp')),'  다음 단어에서는 다시 답 전이라 카드 없음'); }
  // 컴퓨터는 학생 단어의 끝소리로 시작하는 단어로 답함
  for(const [a,w] of [['book','kite'],['nice','sun'],['laugh','phone']]){ const o=await play(p,a,w); await p.waitForFunction(w0=>{ const c=window.__wordchain.cpu(); return c&&c!==w0; },a,{timeout:9000}); const c=await p.evaluate(()=>window.__wordchain.cpu()), m=await p.evaluate(([c,w])=>[window.__wordchain.sound.first(c),window.__wordchain.sound.end(w)],[c,w]); ok(o.r==='o'&&m[0].some(x=>m[1].includes(x)),`컴퓨터 답: ${w} 뒤에 ${c} (${m[1]} → ${m[0]})`); }
  // 출제 범위
  const end=async(ws)=>p.evaluate(ws=>[...new Set(ws.map(w=>window.__wordchain.sound.end(w)[0]))].sort(),ws);
  const plusCpu=await p.evaluate(()=>window.__wordchain.sound.cpu()); const pe=await end(plusCpu); ok(pe.join()==='CH,DH,F,JH,K,N,S,SH,TH','도전+ 끝소리 9가지 '+pe+` (후보 ${plusCpu.length}개)`);
  ok(['stomach','ache','headache','toothache','stomachache'].every(w=>plusCpu.includes(w)),'도전+ /k/ 후보에 stomach, ache, headache, toothache, stomachache');
  ok(!['with','use'].some(w=>plusCpu.includes(w))&&['mouth','house'].every(w=>plusCpu.includes(w)),'발음이 여럿인 with, use는 출제 안 함, 발음이 하나인 mouth, house는 출제');
  const bad=await p.evaluate(ws=>ws.filter(w=>window.__wordchain.formKind(w)||window.__wordchain.blocked(w)),plusCpu); ok(!bad.length,'도전+ 후보에 변화형·금지어 없음 '+bad.slice(0,5));
  // 맛보기: 끝소리 범위, 5문제, /θ/ 보장, 배지 1회, 틀려도 끝까지
  await p.goto(url); await p.evaluate(()=>{ localStorage.removeItem('wordchain-badges-v1'); localStorage.setItem('wordchain-teacher','1'); });
  for(let round=0;round<6;round++){ await startSnd(p,url,'taste');
    // 앞 네 번은 모두 틀림(배지 없음). 뒤 두 번은 맞힌 것으로 쳐서 배지가 한 번만 나오는지 봄
    if(round===4) ok(await p.evaluate(()=>!(JSON.parse(localStorage.getItem('wordchain-badges-v1')||'[]').some(x=>x.id==='master-taste'||x.id==='nohint'))),'맛보기를 다 틀리면 소리 탐험가·힌트 배지 없음');
    if(round>=4) await p.evaluate(()=>window.__wordchain.tweak({rights:1}));
    if(!round){ const te=await end(await p.evaluate(()=>window.__wordchain.sound.cpu())); ok(te.join()==='CH,DH,F,SH,TH','맛보기 끝소리 5가지 '+te); ok(/문제 1 \/ 5/.test(await p.textContent('#gstat')),'상태 줄: 문제 1 / 5'); ok(!(await p.$('#scard')),'첫 문제: 답을 내기 전에는 소리 카드 없음');
      // 첫 문제가 이미 /θ/였으면 math는 처음 만난 소리가 아니라 카드가 없으므로 fish로
      const fw=(await p.evaluate(()=>window.__wordchain.sound.asked()[0]))==='TH'?'fish':'math';
      await p.evaluate(w=>window.__wordchain.forceCpu(w),fw); await p.waitForSelector('#inp'); ok(!(await p.$('#scard')),'  컴퓨터 단어가 바뀌어도 답 전에는 없음');
      await p.fill('#inp','zebra'); await p.press('#inp','Enter'); await p.waitForTimeout(100); ok(!(await p.$('#scard')),'  모음 끝 안내(답으로 안 침) 때도 없음');
      await p.fill('#inp','this'); await p.press('#inp','Enter'); await p.waitForSelector('.overlay #scard'); const cd=await p.textContent('.overlay #scard'); ok(cd.includes(fw==='math'?'떨리지 않는 th':"sh '쉬' 소리")&&!/\(도전\+에서만/.test(cd),'  틀리면 오답 창에 소리 카드 — '+cd.slice(0,24)); await p.click('#ov1'); await p.waitForSelector('#inp'); await startSnd(p,url,'taste'); }
    for(let q=0;q<5;q++){ await p.waitForFunction(()=>document.querySelector('#inp')||document.querySelector('.overlay')); const o=await p.$('.overlay'); if(o){ await p.click('#ov1'); await p.waitForSelector('#inp'); }
      if(q<4||round){ await p.fill('#inp','zebra_x'.replace('_x','')); await p.press('#inp','Enter'); await p.waitForTimeout(80); }
      if(await p.evaluate(()=>{ const m=document.querySelector('#msg'); return !!m&&/모음/.test(m.textContent); })){ await p.fill('#inp','zip'); await p.press('#inp','Enter'); }
      if(q===4&&!round){ await p.fill('#inp','zip'); await p.press('#inp','Enter'); }
      await p.waitForSelector('.overlay'); const sawOk=await p.evaluate(()=>window.__wordchain.sound.saw()); if(q===4) { if(!sawOk) fail++; if(!round||!sawOk) console.log((sawOk?'PASS':'FAIL')+` 맛보기 ${round+1}회차: /θ/ 나옴, 끝소리 ${await p.evaluate(()=>window.__wordchain.sound.asked().join(' '))}`); }
      await p.click('#ov1'); await p.waitForTimeout(60); }
    await p.waitForSelector('#rest',{timeout:4000});
    if(!round){ const rt=await p.textContent('#rest'); ok(rt.includes('5문제 끝!')&&rt.includes('0개 맞혔어요')&&!/정복|연속 성공|힌트 없이/.test(rt),'맛보기 0/5 결과: 축하 문구 없이 맞힌 수 — '+rt.replace(/\s+/g,' ').slice(0,60));
      await p.keyboard.press('Enter'); await p.waitForSelector('#tasteEnd',{timeout:4000}); ok(!(await p.$('.gift-card')),'  0개면 다시 보기·선물 상자 없이 끝'); } }
  const bd=await p.evaluate(()=>JSON.parse(localStorage.getItem('wordchain-badges-v1')).filter(x=>x.id==='master-taste').length); ok(bd===1,'소리 탐험가 배지: 여러 번 해도 1개');
  // 기존 단계: 끝 글자 판정 그대로, 음소 안내 없음
  await p.goto(url); await p.click('[data-t="normal"]'); await p.click('#teacher'); await p.click('#teacher'); await p.click('[data-lv="2"]'); await p.waitForSelector('#inp');
  await p.evaluate(()=>window.__wordchain.forceCpu('church')); await p.fill('#inp','cheetah'); await p.press('#inp','Enter'); await p.waitForSelector('.overlay');
  const tx=await p.textContent('.overlay'); ok(/cheetah는 c로 시작해요\. h로 시작해야 해요/.test(tx)&&!/소리/.test(tx.replace(/소리로만/g,'')),'(기존 단계) church → cheetah: 일반 오답, 음소 안내 없음');
  if(errs.length){ fail++; console.log('errors',errs); } await b.close();
  // 휴대폰: 처음에 try?가 보이고, 단계 원을 눌러 말풍선이 떠 있어도 사라지지 않음(흐리게), 말풍선을 닫으면 다시 또렷하고 눌림
  { const s=await open({viewport:{width:375,height:700},student:true,hasTouch:true,isMobile:true}); const q=s.p; await q.goto(url); await q.tap('[data-t="normal"]'); await q.waitForTimeout(200);
    const st=()=>q.evaluate(()=>{ const b=document.querySelector('.trybtn'), r=b.getBoundingClientRect(), pin=getComputedStyle(document.querySelector('.trypin')); return {on:!!document.querySelector('.map.focus'),vis:pin.visibility,op:+pin.opacity,inView:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth}; });
    let t=await st(); ok(t.vis==='visible'&&t.op===1&&t.inView,'휴대폰: 처음 화면에 try? 보임 '+JSON.stringify(t));
    await q.tap('[data-lv="1"]'); await q.waitForSelector('.tip'); await q.waitForTimeout(300); t=await st(); ok(t.on&&t.vis==='visible'&&t.op>0&&t.inView,'휴대폰: 단계 말풍선이 떠 있어도 try?가 사라지지 않음 '+JSON.stringify(t));
    await q.touchscreen.tap(12,300); await q.waitForTimeout(350); t=await st(); ok(!t.on&&t.op===1,'휴대폰: 말풍선을 닫으면 다시 또렷함 '+JSON.stringify(t));
    if(s.errs.length){ fail++; console.log('errors',s.errs); } await s.b.close(); }
  // 잠금: 학생 화면
  { const s=await open({viewport:{width:375,height:760},student:true,intro:true}); const q=s.p; await q.goto(url); await q.evaluate(()=>localStorage.clear()); await q.goto(url);
    const st=()=>q.evaluate(()=>[...document.querySelectorAll('[data-snd]')].map(b=>[b.dataset.snd,b.className,b.textContent]));
    const toMap=async t=>{ await q.goto(url); await q.click(`[data-t="${t}"]`); await q.waitForTimeout(100); for(let i=0;i<6&&await q.$('#rpgNext');i++){ await q.click('#rpgNext'); await q.waitForTimeout(60); } };
    let a=await st(); ok(a.length===0,'첫 화면: 소리 잇기 버튼 없음');
    await toMap('basic'); a=await st(); ok(a.length===0,'기초 단계 맵: 소리 잇기 버튼 없음');
    await toMap('normal'); a=await st(); ok(a.length===1&&a[0][0]==='taste'&&a[0][2]==='try?','보통 단계 맵: "try?" 버튼만, 도전+ 없음');
    const fl=await q.evaluate(async()=>{ const b=document.querySelector('.trybtn'), lag=document.querySelector('.trylag'), s=getComputedStyle(b); const y0=b.getBoundingClientRect().top+scrollY; scrollTo(0,500); await new Promise(r=>setTimeout(r,80)); const during=lag.style.transform; await new Promise(r=>setTimeout(r,1000)); const r=b.getBoundingClientRect(), mm=document.querySelector('#map').getBoundingClientRect(), o={cloud:!!b.querySelector('svg.cloud path'),anim:s.animationName,during,after:lag.style.transform,inView:r.top>=0&&r.bottom<=innerHeight,moved:Math.abs(r.top+scrollY-y0)>100,right:r.right<=mm.right+8&&r.left>mm.left+mm.width/2,w:r.width,h:r.height}; scrollTo(0,0); return o; });
    ok(fl.cloud&&fl.anim.includes('tryFloat')&&fl.inView&&fl.moved&&fl.right&&fl.w>=44&&fl.h>=44,'try?: 구름 모양, 떠다니는 움직임, 스크롤을 따라옴, 단계 영역 오른쪽, 누르기 충분한 크기 '+JSON.stringify(fl));
    ok(/translateY/.test(fl.during)&&fl.after==='','try?: 스크롤 직후에는 뒤처졌다가 제자리로 따라옴 '+fl.during);
    await q.screenshot({path:require('path').join(process.env.SHOTDIR||require('os').tmpdir(),'sound-normal-map.png')});
    await q.click('[data-snd="taste"]',{force:true}); await q.waitForSelector('.hrules'); ok((await q.textContent('.hrules')).includes('5문제')&&!(await q.$('#gscreen')),'try?: 설명 창을 띄우고 확인 전에는 시작 안 함'); await q.click('#ov1'); await q.waitForSelector('#back'); await q.click('#back'); await q.waitForSelector('#map'); ok((await q.textContent('.mapbar h2')).includes('보통'),'게임에서 나오면 들어온 보통 단계 맵으로');
    await toMap('hard'); a=await st(); ok(a.length===1&&a[0][0]==='taste','도전 단계 맵(아직 통과 전): try?만, 도전+ 없음');
    await q.evaluate(()=>{ const k='wordchain-v2', s=JSON.parse(localStorage.getItem(k)); s.prog.hard={unlocked:5,best:{},cleared:{1:true,2:true,3:true,4:true}}; localStorage.setItem(k,JSON.stringify(s)); }); await toMap('hard'); a=await st(); ok(a.length===1,'도전 4단계까지 통과: 아직 도전+ 없음');
    await q.evaluate(()=>{ const k='wordchain-v2', s=JSON.parse(localStorage.getItem(k)); s.prog.hard.cleared[5]=true; localStorage.setItem(k,JSON.stringify(s)); });
    await toMap('hard'); a=await st(); ok(a.length===2&&a[1][0]==='plus'&&a[1][2].includes('laugh → phone')&&a[1][2].includes('🔊'),'마지막 단계까지 통과: 도전+ 나타남, 배지 없으면 try?도 계속 보임');
    const ar=await q.evaluate(()=>{ const b=document.querySelector('.arcade'); return [getComputedStyle(b).animationName,!!b.querySelector('.press')||/PRESS START/.test(b.textContent),document.documentElement.scrollWidth]; }); ok(ar[0]==='arcadeFade'&&!ar[1]&&ar[2]<=375,'도전+: PRESS START 없이 버튼 전체가 깜빡임, 가로 넘침 없음 '+ar);
    await q.evaluate(()=>document.querySelector('.arcade').scrollIntoView({block:'center'})); await q.waitForTimeout(900); await q.screenshot({path:require('path').join(process.env.SHOTDIR||require('os').tmpdir(),'sound-hard-map.png')});
    await q.evaluate(()=>localStorage.setItem('wordchain-badges-v1',JSON.stringify([{id:'master-taste',date:'2026-11-01'}]))); await toMap('hard');
    a=await st(); ok(a.length===1&&a[0][0]==='plus','맛보기 배지까지 받으면 도전+만 보임');
    await q.screenshot({path:require('path').join(process.env.SHOTDIR||require('os').tmpdir(),'sound-title.png')});
    await q.click('[data-snd="plus"]'); await q.waitForSelector('.hrules'); ok((await q.textContent('.hrules')).includes('jump, giant')&&(await q.textContent('#ov1')).includes('확인했어요')&&!(await q.$('#gscreen')),'도전+ 시작 안내: "확인했어요" 전에는 시작 안 함');
    await q.screenshot({path:require('path').join(process.env.SHOTDIR||require('os').tmpdir(),'sound-intro.png')});
    await q.click('#ov1'); await q.waitForSelector('#inp'); ok(!!(await q.$('#rulesBtn')),'게임 화면: 규칙 보기 버튼'); const w=await q.evaluate(()=>document.documentElement.scrollWidth); ok(w<=375,'휴대폰 너비: 가로 넘침 없음 '+w);
    await q.screenshot({path:require('path').join(process.env.SHOTDIR||require('os').tmpdir(),'sound-game.png')});
    if(s.errs.length){ fail++; console.log('errors',s.errs); } await s.b.close(); }
  console.log(fail?`실패 ${fail}`:'모두 통과'); process.exit(fail?1:0);
})();
