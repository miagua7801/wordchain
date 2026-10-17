// 단계 통과 뒤 화면: 제목(쉬어 가기 이름 없음), 정답률·시간·이번 배지만, 미니 복습 없음, 끝말잇기 하이라이트(순서·마지막 줄만·채팅처럼 밀어 올림·카톡처럼 겹침 없이 좌우·표시/글자 색/아이콘 없음·누르면 읽기·Enter/누르기로 전부·동작 줄이기),
// 따로 된 상자 화면(설명 없음)·등급(금·은·동)과 보상, 금상자 보관 힌트·가득 찼을 때 대체, 다음 단계 시작, 마지막 단계 수준 정복. node tests/rest.js [주소]
const {target,open}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a), RS=()=>H(()=>window.__wordchain.rest()), stars=()=>H(()=>window.__wordchain.stars()), HS=t=>H(t=>JSON.parse(localStorage.getItem('wordchain-v2')).prog[t].storedHints||0,t);
  const title=()=>p.textContent('.topbar h2'), noRestName=async()=>!(await H(()=>document.body.innerText.includes('쉬어 가기')));
  // 진도·별을 심고 수준·단계 시작
  const seed=async(o)=>{ await p.goto(url); await H(o=>{ localStorage.clear(); for(const k in o) localStorage.setItem(k,typeof o[k]==='string'?o[k]:JSON.stringify(o[k])); },o); await p.goto(url); };
  const prog=(t,extra)=>({track:t,prog:{[t]:Object.assign({unlocked:5,best:{},cleared:{}},extra||{})},time:{},basicVer:2});
  const startLv=async(t,n)=>{ await p.click(`[data-t="${t}"]`); await p.click(`[data-lv="${n}"]`); await p.waitForTimeout(900); };
  await p.goto(url);
  const ALLW=await H(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,6}$/.test(w)&&!/(er|est)$/.test(w)));
  const core=new Set(await H(ws=>ws.filter(w=>window.__wordchain.core(w)),ALLW));
  const W=ALLW.filter(w=>!core.has(w));
  const used=()=>p.$$eval('.chain .tile',a=>a.map(e=>e.textContent.toLowerCase()));
  const ANYW=await H(()=>(VOCAB_E+'|'+VOCAB_M).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)));
  // 끝 글자로 시작하는 단어: 기본 어휘가 아닌 짧은 단어 → 없으면 단어장의 아무 단어(x·z처럼 드문 글자 대비)
  const avoid=new Set();   // 틀린 시도로 쓴 단어는 다시 답으로 쓰지 않음(하이라이트에 안 보이는지 확인용)
  const pick=async(list,ch)=>{ const u=await used(); const ok=w=>w[0]===ch&&!u.includes(w)&&!avoid.has(w); return list.find(ok)||ANYW.find(ok); };
  const typeW=async w=>{ await p.fill('#inp',w); await p.press('#inp','Enter'); };
  const nextCpu=async prev=>{ for(let i=0;i<80;i++){ await p.waitForTimeout(50); if(await p.$('.overlay')||await p.$('#rest')) return; if((await H(()=>window.__wordchain.cpu()))!==prev) return; } };
  // 주관식 단계: 목표 바로 앞까지 성공 수를 올린 뒤 기본 어휘가 아닌 단어로 정답 → 통과
  const passTyped=async()=>{ const goal=await H(()=>document.querySelectorAll('.status .dot').length);
    await H(g=>window.__wordchain.tweak({streak:g-1}),goal);
    const cw=await H(()=>window.__wordchain.cpu()); const ok=w=>w[0]===cw.slice(-1)&&w!==cw; await typeW(W.find(ok)||ANYW.find(ok));
    await p.waitForSelector('#rest',{timeout:4000}); };
  const allShown=()=>p.waitForFunction(()=>{ const r=window.__wordchain.rest(); return r&&r.shown===r.hl.length; },null,{timeout:15000});
  // ② 끝말잇기 → "다음 →" → ③ 상자 화면, 상자 열기
  const toBox=async()=>{ await allShown(); await p.click('#go'); await p.waitForSelector('#openBox',{timeout:3000}); };
  const openBox=async()=>{ await toBox(); await p.click('#openBox'); await p.waitForSelector('#reward',{timeout:3000}); };

  // 1. 통과 → ① 요약: 제목 "🎉 1단계 통과!", 정답률·시간·이번에 얻은 배지만·힌트 없이 통과 (기존 🏆 창은 안 뜸)
  await seed({'wordchain-v2':prog('basic'),'wordchain-badges-v1':[{id:'first',date:'2026-01-01'}]}); await startLv('basic',1);
  let t=await H(()=>window.__wordchain.target()); const wrongOpt=await p.$$eval('.spell .choice',(a,t)=>a.map(e=>e.dataset.v).find(v=>v!==t),t);
  await p.click(`.spell .choice[data-v="${wrongOpt}"]`); await p.waitForTimeout(700); await p.click('#ov1'); await p.waitForTimeout(900);
  await H(()=>window.__wordchain.tweak({streak:3,t0:Date.now()-155000}));
  t=await H(()=>window.__wordchain.target()); await p.click(`.spell .choice[data-v="${t}"]`);
  await p.waitForSelector('#rest',{timeout:4000});
  ok(!(await p.$('.overlay'))&&(await RS()).step===1&&(await title())==='🎉 1단계 통과!'&&(await p.textContent('#rest')).includes('1단계 통과!'),'단계 통과 뒤 제목 "'+(await title())+'"(통과 창은 따로 안 뜸)');
  ok(await noRestName(),'① 화면 어디에도 "쉬어 가기"가 없음');
  ok((await p.textContent('#rAcc'))==='1/2'&&(await p.textContent('#rest')).includes('정답률 50%'),'정답률: 맞힌 턴 / 답을 낸 턴 = 1/2 (50%)');
  ok(/^2분 3[5-9]초$/.test(await p.textContent('#rTime')),'걸린 시간 "'+(await p.textContent('#rTime'))+'" (2분 35초 형식)');
  const bdg=await p.textContent('#rBadges');
  ok(bdg.includes('힌트 없이')&&!bdg.includes('첫걸음'),'이번에 새로 얻은 배지만 표시: '+bdg.trim());
  ok(!!(await p.$('.nohint')),'"✨ 힌트 없이 통과!" 축하');
  ok((await H(()=>document.activeElement.id))==='go','키보드: "다음 →"에 초점');
  await p.click('#go'); await allShown();
  ok(!(await p.$('#inp'))&&!(await p.$('#skipRest'))&&!(await H(()=>document.body.innerText.includes('미니 복습')))&&(await noRestName()),'② 미니 복습 없음(입력칸·건너뛰기·"미니 복습" 문구 없음), "쉬어 가기" 없음');
  ok(await H(()=>window.__wordchain.restWords===undefined&&window.__wordchain.pickReward===undefined&&[...document.scripts].some(e=>e.textContent.includes('restBox:{gap:'))&&![...document.scripts].some(e=>/restBox:\{[^\n]*(words|rewards|perfectBonus)|restWords|미니 복습/.test(e.textContent))),'미니 복습·무작위 보상 코드와 설정이 빠짐');
  await toBox(); const r1=await RS();
  ok(r1.step===3&&r1.lost===1&&r1.grade==='gold'&&(await p.textContent('#grade'))==='🥇 금상자','기초: 1번 틀렸지만 힌트 없이 통과 → ③ 🥇 금상자');

  // 2. 하이라이트: 하트를 잃고 새로 시작한 줄은 빼고 마지막 줄만, 틀린 시도 없음, 컴퓨터 왼쪽·학생 오른쪽, 채팅처럼 아래에서 밀어 올림, 누르면 읽기, Enter로 전부
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2);
  const firstCpu=await H(()=>window.__wordchain.cpu());
  const bad=W.find(w=>w[0]!==firstCpu.slice(-1)); avoid.add(bad); await typeW(bad); await p.waitForSelector('#ov1'); await p.click('#ov1'); await p.waitForTimeout(900);
  const goal=await H(()=>document.querySelectorAll('.status .dot').length); await H(g=>window.__wordchain.tweak({streak:g-4}),goal);
  const cpus=[], mine=[];
  for(let i=0;i<4;i++){ const cw=await H(()=>window.__wordchain.cpu()); cpus.push(cw); mine.push(await pick(W,cw.slice(-1)));
    if(i===1) await H(()=>window.__wordchain.tweak({turnHint:true,hintUsed:true}));
    await typeW(mine[i]); if(i<3) await nextCpu(cw); }
  await p.waitForSelector('#rest',{timeout:5000});
  const s0=await stars(); await p.click('#go');
  const pos=()=>H(()=>{ const b=document.getElementById('hlBox').getBoundingClientRect(), li=[...document.querySelectorAll('#hl li:not(.wait)')]; return {n:li.length,boxBottom:b.bottom,boxTop:b.top,first:li[0].getBoundingClientRect().toJSON(),last:li[li.length-1].getBoundingClientRect().toJSON()}; });
  const shown0=(await RS()).shown;
  const an=await H(()=>{ const li=document.querySelector('#hl li.up'), cs=li&&getComputedStyle(li); return cs?{d:cs.animationDuration,f:cs.animationTimingFunction}:null; });
  await p.waitForTimeout(250); const mid=await H(()=>document.querySelector('#hl li').getBoundingClientRect().height);
  await p.waitForTimeout(400); const full=await H(()=>document.querySelector('#hl li').getBoundingClientRect().height);
  ok(an&&an.d==='0.6s'&&/cubic-bezier/.test(an.f)&&mid>3&&mid<full-3,`부드럽게 올라옴: ${an&&an.d} ${an&&an.f}, 중간 높이 ${Math.round(mid)} / ${Math.round(full)}px`);
  const a1=await pos(), shown1=(await RS()).shown;
  ok(shown0===1&&shown1<=2&&!!(await p.$('#hl li.wait')),`말풍선이 천천히 차례로 나옴(처음 ${shown0}개, 0.65초 뒤 ${shown1}개)`);
  ok(a1.boxBottom-a1.first.bottom<=16,`채팅처럼 첫 말풍선이 아래쪽에서 시작(아래 여백 ${Math.round(a1.boxBottom-a1.first.bottom)}px)`);
  await p.waitForTimeout(1400); const a2=await pos();
  ok(a2.n>a1.n&&a2.first.top<a1.first.top-20&&a2.boxBottom-a2.last.bottom<=16,`새 말풍선이 아래에 나오며 앞 말풍선을 위로 밀어 올림(첫 말풍선 ${Math.round(a1.first.top)} → ${Math.round(a2.first.top)}px)`);
  await p.keyboard.press('Enter'); await p.waitForTimeout(50);
  let r=await RS();
  ok(r.shown===8&&r.step===2&&!(await p.$('#hl li.wait')),'Enter: 말풍선이 전부 바로 보이고 다음 화면으로 넘어가지 않음');
  const exp=cpus.flatMap((c,i)=>[`cpu:${c}`,`me:${mine[i]}`]);
  ok(r.hl.join()===exp.join(),'순서: '+r.hl.join(' / '));
  ok(r.hl.length===8&&r.hl[0]==='cpu:'+cpus[0]&&!r.hl.some(x=>x.split(':')[1]===bad),`하트를 잃기 전 줄(${firstCpu})과 틀린 시도(${bad})는 안 보임 — `+r.hl.join(' '));
  const side=await p.$$eval('#hl li',a=>a.map(li=>{ const h=li.parentNode.getBoundingClientRect(), bb=li.querySelector('.hb').getBoundingClientRect(); return (li.classList.contains('hme')?'me':li.classList.contains('hcpu')?'cpu':'?')+(bb.left-h.left<h.right-bb.right?'L':'R'); }));
  ok(side.every((x,i)=>x===(i%2?'meR':'cpuL')),'컴퓨터 왼쪽, 학생 오른쪽 말풍선: '+side.join(' '));
  // 카톡처럼: 말풍선이 겹치지 않고 한 줄씩(12px 간격), 컴퓨터는 왼쪽·나는 오른쪽 정렬, 양 끝은 상자 끝에서 안쪽으로(좌우 같은 거리)
  const lay=await H(()=>{ const h=document.getElementById('hlBox').getBoundingClientRect(), bs=[...document.querySelectorAll('#hl .hb')].map(b=>b.getBoundingClientRect());
    return {gaps:bs.slice(1).map((r,i)=>Math.round(r.top-bs[i].bottom)),left:[...new Set(bs.filter((r,i)=>i%2===0).map(r=>Math.round(r.left-h.left)))],right:[...new Set(bs.filter((r,i)=>i%2===1).map(r=>Math.round(h.right-r.right)))]}; });
  ok(lay.gaps.every(g=>g>=11&&g<=13),'말풍선이 겹치지 않고 한 줄씩(위아래 간격 '+lay.gaps.join(',')+'px)');
  ok(lay.left.length===1&&lay.right.length===1&&lay.left[0]>=40&&Math.abs(lay.left[0]-lay.right[0])<=2,`좌우 끝 정렬 + 양 끝을 안쪽으로: 왼쪽 ${lay.left}px, 오른쪽 ${lay.right}px 안쪽`);
  const plain=await H(()=>({mk:document.querySelectorAll('#rest .mk,#rest .j,#rest .face,#legend').length,txt:[...document.querySelectorAll('#hl .hb')].map(b=>b.textContent),robot:document.getElementById('hl').textContent.includes('🤖')}));
  ok(plain.mk===0&&!plain.robot&&plain.txt.join()===r.hl.map(x=>x.split(':')[1]).join(),'말풍선에 표시·글자 색 강조·컴퓨터 아이콘 없음(단어만)');
  await H(()=>{ window.__said=[]; const o=speechSynthesis.speak; speechSynthesis.speak=u=>{ window.__said.push(u.text); o(u); }; });
  await p.click('#hl .hb[data-i="6"]'); await p.waitForTimeout(300);
  ok((await H(()=>window.__said)).includes(cpus[3]),`말풍선 누르면 읽기: ${cpus[3]}`);
  await p.focus('#hl .hb[data-i="7"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok((await H(()=>window.__said)).includes(mine[3])&&(await RS()).step===2,`키보드(Enter)로도 읽기: ${mine[3]}`);
  ok(!(await p.$('#openBox')),'② 화면에는 상자가 없음');
  // ③ 상자 화면(따로): 은상자, 설명 없음, Enter로 열기 → ⭐ 2
  await p.focus('#go'); await p.keyboard.press('Enter'); await p.waitForSelector('#openBox');
  r=await RS(); const boxTxt=(await p.textContent('#rest')).trim();
  ok(r.step===3&&!(await p.$('#hl'))&&(await p.textContent('.rsteps li.on')).includes('③ 선물 상자'),'"다음 →" → ③ 선물 상자 화면(하이라이트와 따로)');
  ok(r.lost===1&&r.grade==='silver'&&(await p.textContent('#grade'))==='🥈 은상자'&&!/하트|금상자|힌트/.test(boxTxt),'하트 1개 잃음(힌트 씀) → 🥈 은상자, 상자 설명 없음: "'+boxTxt.replace(/\s+/g,' ')+'"');
  ok((await H(()=>document.activeElement.id))==='openBox','상자에 초점');
  await p.keyboard.press('Enter'); await p.waitForSelector('#reward',{timeout:3000});
  ok((await p.textContent('#reward')).includes('은상자에서 ⭐ 2개')&&!(await p.$('#bonus'))&&(await stars())===s0+2,'Enter로 열기 → ⭐ 2개');
  ok((await H(()=>document.activeElement.id))==='go','"다음 →"에 초점');
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  // 3. ④ 컴퓨터의 한마디 + 다음 단계 시작(Enter)
  const line=await p.textContent('#line'), lines=await H(()=>window.__wordchain.restLines('normal-3'));
  ok((await RS()).step===4&&lines.includes(line)&&(await p.textContent('#startNext'))==='▶ 3단계 시작'&&(await p.textContent('#rest')).includes('3단계 · 직접 쓰기 · 중학'),'④ 보통 2→3 한마디(REST_LINES): "'+line+'" + 다음 단계 이름·방식 + "▶ 3단계 시작"');
  ok((await H(()=>document.activeElement.id))==='startNext'&&!!(await p.$('#toList'))&&(await title())==='🎉 2단계 통과!'&&(await noRestName()),'"▶ 3단계 시작"에 초점, "단계 목록으로" 버튼, 제목 그대로');
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  ok((await p.textContent('.topbar h2')).includes('보통 3단계'),'Enter로 3단계 시작');

  // 4. 상자 등급 조건
  const g=await H(()=>[[0,false],[0,true],[2,true],[1,false],[2,false],[3,false]].map(([l,n])=>window.__wordchain.boxGrade(l,n)).join());
  ok(g==='gold,gold,gold,silver,bronze,bronze','등급: 하트 0 → 금, 힌트 없이 → 금, 하트 1 → 은, 그 외 → 동 — '+g);
  // 금상자: 보관 힌트 20%(받음 / 가득 차서 ⭐1 / 안 나옴)
  for(const [full,roll,label] of [[false,0.1,'hint'],[true,0.1,'full'],[false,0.5,'none']]){
    await seed({'wordchain-v2':prog('normal',{storedHints:full?5:1}),'wordchain-stars-v1':'0'}); await startLv('normal',2); await passTyped();
    const s=await stars(), h0=await HS('normal'); await p.click('#go');
    await H(v=>window.__wordchain.setBoxRoll(v),roll); await openBox();
    const rw=await p.textContent('#reward'), bn=(await p.$('#bonus'))?await p.textContent('#bonus'):'', h1=await HS('normal'), ds=(await stars())-s;
    ok((await RS()).grade==='gold'&&rw.includes('금상자에서 ⭐ 3개'),'하트도 안 잃고 힌트도 없이 → 🥇 금상자 ⭐ 3');
    if(label==='hint') ok(bn.includes('보관 힌트 1개')&&h1===h0+1&&ds===3,`금상자 보관 힌트(20%) 받음: ${h0} → ${h1}, ⭐ +${ds}`);
    if(label==='full') ok(bn.includes('가득 차서 ⭐ 1개')&&h1===5&&ds===4,`보관 힌트가 가득(5/5) → ⭐ 1개로 대체: ⭐ +${ds}`);
    if(label==='none') ok(!bn&&h1===h0&&ds===3,'뽑기 80%: 보관 힌트 없이 ⭐ 3만');
  }
  // 동상자: 하트 2개 잃고 힌트도 씀 → ⭐ 1, 화면을 누르면 말풍선 전부
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2);
  const cw=await H(()=>window.__wordchain.cpu());
  await H(c=>window.__wordchain.tweak({livesLost:2,hintUsed:true,chain:[{w:'internationalization',d:'internationalization',me:false},{w:'nonrepresentationalism',d:'nonrepresentationalism',me:true},{w:'grape',d:'grape',me:false},{w:'eat',d:'eat',me:true},...['tiger','rabbit','table','egg','goat','tree','echo','open','night','tent','turtle','east'].map((w,i)=>({w,d:w,me:i%2===1})),{w:c,d:c,me:false}]}),cw);
  await passTyped(); const s=await stars(); await p.click('#go');
  ok((await RS()).shown<18,'말풍선 18개가 차례로 나오는 중');
  await p.click('#rest h3'); await p.waitForTimeout(50);
  ok((await RS()).shown===18&&!(await p.$('#hl li.wait'))&&(await RS()).step===2,'화면을 누르면 전부 바로 보임(다음 화면으로 안 넘어감)');
  const longZ=await p.$$eval('#hl .hb',a=>{ const h=document.getElementById('hlBox').getBoundingClientRect(), [x,y]=a.slice(0,2).map(e=>e.getBoundingClientRect()); return {inside:x.left>=h.left&&x.right<=h.right&&y.left>=h.left&&y.right<=h.right,below:y.top>=x.bottom+10}; });
  ok(longZ.inside&&longZ.below,'긴 단어도 상자 안에(잘리지 않음), 겹치지 않음 '+JSON.stringify(longZ));
  await p.waitForTimeout(400); const a3=await pos();
  ok(a3.boxBottom-a3.last.bottom<=16&&a3.first.top<a3.boxTop,'말풍선이 많으면 마지막 말풍선이 아래에 보이고 앞 말풍선은 위로 넘어감');
  const box=await H(()=>{ const h=document.getElementById('hlBox'), cs=getComputedStyle(h); return {oy:cs.overflowY,ch:h.clientHeight,sh:h.scrollHeight}; });
  ok(box.oy==='auto'&&box.ch<=300&&box.sh>box.ch,`말풍선이 많으면 하이라이트 안에서만 스크롤(${box.ch}px 안에 ${box.sh}px)`);
  await toBox();
  ok((await RS()).grade==='bronze'&&(await p.textContent('#grade'))==='🥉 동상자','하트 2개 잃음 + 힌트 → 🥉 동상자');
  await p.click('#openBox'); await p.waitForSelector('#reward',{timeout:3000});
  ok((await p.textContent('#reward')).includes('동상자에서 ⭐ 1개')&&(await stars())===s+1,'동상자 ⭐ 1');

  // 줄이 바뀌어도 이번 단계에서 이어 간 단어는 모두: 두 번 맞히고 → 틀려서 새로 시작 → 통과. 대답 못 한 컴퓨터 단어·틀린 시도는 없음, 줄 사이 '새로 시작'
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2);
  const L1=[];
  for(let i=0;i<2;i++){ const cw=await H(()=>window.__wordchain.cpu()); const w=await pick(W,cw.slice(-1)); L1.push(cw,w); await typeW(w); await nextCpu(cw); }
  const miss=await H(()=>window.__wordchain.cpu()); const wrongW=W.find(w=>w[0]!==miss.slice(-1)&&!L1.includes(w));
  await typeW(wrongW); await p.waitForSelector('#ov1'); await p.click('#ov1'); await p.waitForTimeout(900);
  const c4=await H(()=>window.__wordchain.cpu()); await passTyped();
  const r4=(await RS()).hl;
  await p.click('#go'); await allShown();
  const expL=[`cpu:${L1[0]}`,`me:${L1[1]}`,`cpu:${L1[2]}`,`me:${L1[3]}`,'---',`cpu:${c4}`];
  ok(r4.length===7&&r4.slice(0,6).join()===expL.join()&&r4[6].startsWith('me:')&&!r4.some(x=>x==='cpu:'+miss||x.endsWith(':'+wrongW))&&(await p.textContent('#hl .hdiv')).trim()==='새로 시작',
    `틀려서 새로 시작한 앞 줄의 이어 간 단어도 보여 주고 줄 사이 "새로 시작"(대답 못 한 ${miss}·틀린 시도 ${wrongW}는 없음): `+r4.join(' '));
  const fit=await H(()=>{ const b=document.getElementById('hlBox'), h=document.getElementById('hl'); return {box:b.clientHeight,need:h.scrollHeight+20}; });
  ok(fit.box<=300&&Math.abs(fit.box-Math.min(fit.need,300))<=3,`상자 높이를 말풍선에 맞춤(${fit.box}px, 필요 ${fit.need}px, 최대 300px)`);

  // 5. 동작 줄이기: 처음부터 전부 보임
  await p.emulateMedia({reducedMotion:'reduce'});
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2); await passTyped(); await p.click('#go');
  const few=await H(()=>{ const b=document.getElementById('hlBox'), h=document.getElementById('hl'); return {box:b.clientHeight,need:h.scrollHeight+20,n:h.children.length}; });
  ok(few.n===2&&Math.abs(few.box-few.need)<=3&&few.box<150,`말풍선이 2개뿐이면 상자도 그만큼만(${few.box}px, 빈 공간 없음)`);
  ok((await RS()).shown===(await RS()).hl.length&&!(await p.$('#hl li.wait'))&&!(await p.$('#hl li.up')),'동작 줄이기: 말풍선이 처음부터 전부 보임(올라오는 효과 없음)');
  await p.click('#go'); await p.click('#openBox'); ok(!!(await p.$('#reward')),'동작 줄이기: 상자가 바로 열림');
  await p.emulateMedia({reducedMotion:'no-preference'});

  // 6. 마지막 단계: 제목 "🎉 기초 수준 정복!", ④ 대신 수준 정복
  await seed({'wordchain-v2':prog('basic',{cleared:{1:true,2:true,3:true}}),'wordchain-stars-v1':'0'}); await startLv('basic',4); await passTyped();
  ok((await title())==='🎉 기초 수준 정복!'&&!(await p.textContent('#rest')).includes('열렸어요')&&(await p.textContent('.rsteps')).includes('④ 정복'),'마지막 단계: 제목 "🎉 기초 수준 정복!", 다음 단계 안내 없음, 단계 표시 "④ 정복"');
  await p.click('#go'); await openBox(); ok((await p.textContent('#go'))==='🎉 확인','상자 연 뒤 "🎉 확인"'); await p.click('#go'); await p.waitForTimeout(200);
  ok((await p.textContent('#conquer'))==='기초 수준 정복!'&&!(await p.$('#startNext'))&&(await H(()=>document.activeElement.id))==='toTracks'&&(await noRestName()),'"🎉 기초 수준 정복!" + 수준 선택 버튼(초점)');
  await p.click('#toTracks'); await p.waitForTimeout(200);
  ok((await p.$$('.track')).length===3,'수준 선택 화면으로');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
