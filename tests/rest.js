// 단계 통과 뒤(게임 화면 그대로): ① 결과 요약 창(정답률·시간·이번 배지만, 3초 뒤 저절로 닫힘, 누르거나 Enter면 바로) → ② 주고받은 단어 다시 보기(채팅을 비우고 처음부터 아래에서 밀어 올림·컴퓨터 왼쪽/나 오른쪽·누르면 읽기·Enter/누르기로 전부·동작 줄이기)
// → 다 나온 뒤 가운데 "다음 ▶" → ③ 선물 상자(저절로 열리고 닫힘, 등급 금·은·동과 보상, 금상자 보관 힌트·가득 찼을 때 대체) → ④ "단계 맵으로 가기"·"다음 단계로 가기", 마지막 단계는 수준 정복. node tests/rest.js [주소]
const {target,open}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a), RS=()=>H(()=>window.__wordchain.rest()), stars=()=>H(()=>window.__wordchain.stars()), HS=t=>H(t=>JSON.parse(localStorage.getItem('wordchain-v2')).prog[t].storedHints||0,t);
  const title=()=>p.textContent('.ghead h2'), noRestName=async()=>!(await H(()=>document.body.innerText.includes('쉬어 가기')));
  // 진도·별을 심고 수준·단계 시작
  const seed=async(o)=>{ await p.goto(url); await H(o=>{ localStorage.clear(); for(const k in o) localStorage.setItem(k,typeof o[k]==='string'?o[k]:JSON.stringify(o[k])); },o); await p.goto(url); };
  const prog=(t,extra)=>({track:t,prog:{[t]:Object.assign({unlocked:5,best:{},cleared:{}},extra||{})},time:{},basicVer:2});
  const startLv=async(t,n)=>{ await p.click(`[data-t="${t}"]`); await p.click(`[data-lv="${n}"]`); await p.waitForTimeout(900); };
  await p.goto(url);
  const ALLW=await H(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,6}$/.test(w)&&!/(er|est)$/.test(w)));
  const core=new Set(await H(ws=>ws.filter(w=>window.__wordchain.core(w)),ALLW));
  const W=ALLW.filter(w=>!core.has(w));
  const used=()=>p.$$eval('#fl .hb',a=>a.map(e=>e.textContent.toLowerCase()));
  const ANYW=await H(()=>(VOCAB_E+'|'+VOCAB_M).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)));
  // 끝 글자로 시작하는 단어: 기본 어휘가 아닌 짧은 단어 → 없으면 단어장의 아무 단어(x·z처럼 드문 글자 대비)
  const avoid=new Set();   // 틀린 시도로 쓴 단어는 다시 답으로 쓰지 않음(다시 보기에 안 보이는지 확인용)
  const pick=async(list,ch)=>{ const u=await used(); const ok=w=>w[0]===ch&&!u.includes(w)&&!avoid.has(w); return list.find(ok)||ANYW.find(ok); };
  const typeW=async w=>{ await p.fill('#inp',w); await p.press('#inp','Enter'); };
  const nextCpu=async prev=>{ for(let i=0;i<80;i++){ await p.waitForTimeout(50); if(await p.$('.overlay')||await p.$('#rest')) return; if((await H(()=>window.__wordchain.cpu()))!==prev) return; } };
  // 주관식 단계: 목표 바로 앞까지 성공 수를 올린 뒤 기본 어휘가 아닌 단어로 정답 → 통과
  const passTyped=async()=>{ const goal=await H(()=>document.querySelectorAll('.status .dot').length);
    await H(g=>window.__wordchain.tweak({streak:g-1}),goal);
    const cw=await H(()=>window.__wordchain.cpu()); const ok=w=>w[0]===cw.slice(-1)&&w!==cw&&!avoid.has(w); await typeW(W.find(ok)||ANYW.find(ok));
    await p.waitForSelector('#rest',{timeout:4000}); };
  const allShown=()=>p.waitForFunction(()=>{ const r=window.__wordchain.rest(); return r&&r.shown===r.hl.length&&!!document.getElementById('go'); },null,{timeout:15000});
  // ① 요약을 Enter로 닫고 ② 다시 보기를 Enter로 전부 → "다음 ▶" → ③ 상자(저절로 열림)
  const toReplay=async()=>{ await p.waitForTimeout(100); await p.keyboard.press('Enter'); await p.waitForFunction(()=>window.__wordchain.rest().step===2); };
  const toBox=async()=>{ await toReplay(); await p.keyboard.press('Enter'); await allShown(); await p.click('#go'); await p.waitForSelector('#grade',{timeout:3000}); };
  const opened=async()=>{ await toBox(); await p.waitForSelector('#reward',{timeout:3000}); };

  // 1. 통과 → ① 요약 창: 게임 화면 위 가운데, 정답률·시간·이번에 얻은 배지만·힌트 없이 통과. 3초 뒤 저절로 닫힘
  await seed({'wordchain-v2':prog('basic'),'wordchain-badges-v1':[{id:'first',date:'2026-01-01'}]}); await startLv('basic',1);
  let t=await H(()=>window.__wordchain.target()); const wrongOpt=await p.$$eval('.spell .choice',(a,t)=>a.map(e=>e.dataset.v).find(v=>v!==t),t);
  await p.click(`.spell .choice[data-v="${wrongOpt}"]`); await p.waitForTimeout(700); await p.click('#ov1'); await p.waitForTimeout(900);
  await H(()=>window.__wordchain.tweak({streak:3,t0:Date.now()-155000}));
  t=await H(()=>window.__wordchain.target()); await p.click(`.spell .choice[data-v="${t}"]`);
  await p.waitForSelector('#rest',{timeout:4000}); const tRest=Date.now();
  ok(!(await p.$('.overlay'))&&(await RS()).step===1&&(await title())==='기초 1단계'&&(await p.textContent('#rest .rcard h3'))==='1단계 통과!'&&!!(await p.$('#gscreen #rest')),'게임 화면 그대로(제목 "'+(await title())+'"), 가운데 결과 요약 창 "1단계 통과!"');
  ok(await noRestName(),'① 화면 어디에도 "쉬어 가기"가 없음');
  ok((await p.textContent('#rAcc'))==='1/2'&&(await p.textContent('#rest')).includes('정답률 50%'),'정답률: 맞힌 턴 / 답을 낸 턴 = 1/2 (50%)');
  ok(/^2분 3[5-9]초$/.test(await p.textContent('#rTime')),'걸린 시간 "'+(await p.textContent('#rTime'))+'" (2분 35초 형식)');
  const bdg=await p.textContent('#rBadges');
  ok(bdg.includes('힌트 없이')&&!bdg.includes('첫걸음'),'이번에 새로 얻은 배지만 표시: '+bdg.trim());
  ok(!!(await p.$('.nohint')),'"✨ 힌트 없이 통과!" 축하');
  ok(await H(()=>{ const q=document.getElementById('qm'); return q.classList.contains('away')&&getComputedStyle(q).pointerEvents==='none'; }),'문제 창은 감춤');
  await p.waitForTimeout(Math.max(0,2200-(Date.now()-tRest)));
  ok((await RS()).step===1,'2.2초: 아직 요약');
  await p.waitForFunction(()=>window.__wordchain.rest().step===2,null,{timeout:2000}); const dtS=Date.now()-tRest;
  ok(dtS>=2300&&dtS<=3700&&!(await p.$('#rest .rcard')),`약 3초(${dtS}ms) 뒤 요약 창이 저절로 닫히고 ② 다시 보기`);
  ok(!(await p.$('#inp'))&&!(await H(()=>document.body.innerText.includes('미니 복습')))&&(await noRestName()),'② 미니 복습 없음, "쉬어 가기" 없음');
  ok(await H(()=>window.__wordchain.restWords===undefined&&window.__wordchain.pickReward===undefined&&![...document.scripts].some(e=>/restBox:\{[^\n]*(words|rewards|perfectBonus)|restWords|미니 복습/.test(e.textContent))),'미니 복습·무작위 보상 코드와 설정이 빠짐');
  ok(!(await p.$('#go')),'다시 보기가 끝나기 전에는 "다음" 버튼 없음');
  await allShown();
  ok((await p.textContent('#go'))==='다음 ▶'&&(await H(()=>document.activeElement.id))==='go','다 나오면 가운데에 "다음 ▶"(초점)');
  const gc=await H(()=>{ const g=document.getElementById('go').getBoundingClientRect(), b=document.getElementById('gbody').getBoundingClientRect(); return [Math.round(g.left+g.width/2-(b.left+b.width/2)),Math.round(g.top+g.height/2-(b.top+b.height/2))]; });
  ok(Math.abs(gc[0])<=4&&Math.abs(gc[1])<=24,'"다음 ▶"은 화면 가운데 '+gc);
  await p.click('#go'); await p.waitForSelector('#grade');
  const r1=await RS();
  ok(r1.step===3&&r1.lost===1&&r1.grade==='gold'&&(await p.textContent('#grade'))==='🥇 금상자','기초: 1번 틀렸지만 힌트 없이 통과 → ③ 🥇 금상자 창이 저절로 뜸');

  // 2. 다시 보기: 하트를 잃고 새로 시작한 앞 줄은 이어 간 단어가 없으면 없음, 틀린 시도 없음, 컴퓨터 왼쪽·학생 오른쪽, 채팅처럼 아래에서 밀어 올림, 누르면 읽기, Enter로 전부
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2);
  const firstCpu=await H(()=>window.__wordchain.cpu());
  const bad=W.find(w=>w[0]!==firstCpu.slice(-1)); avoid.add(bad); await typeW(bad); await p.waitForSelector('#ov1'); await p.click('#ov1'); await p.waitForTimeout(900);
  const goal=await H(()=>document.querySelectorAll('.status .dot').length); await H(g=>window.__wordchain.tweak({streak:g-4}),goal);
  const cpus=[], mine=[];
  for(let i=0;i<4;i++){ const cw=await H(()=>window.__wordchain.cpu()); cpus.push(cw); mine.push(await pick(W,cw.slice(-1)));
    if(i===1) await H(()=>window.__wordchain.tweak({turnHint:true,hintUsed:true}));
    await typeW(mine[i]); if(i<3) await nextCpu(cw); }
  await p.waitForSelector('#rest',{timeout:5000});
  const s0=await stars(); await toReplay();
  const pos=()=>H(()=>{ const b=document.getElementById('feed').getBoundingClientRect(), li=[...document.querySelectorAll('#fl li:not(.wait)')]; return {n:li.length,boxBottom:b.bottom,boxTop:b.top,first:li[0].getBoundingClientRect().toJSON(),last:li[li.length-1].getBoundingClientRect().toJSON()}; });
  const shown0=(await RS()).shown;
  const an=await H(()=>{ const li=document.querySelector('#fl li.up'), cs=li&&getComputedStyle(li); return cs?{d:cs.animationDuration,f:cs.animationTimingFunction}:null; });
  await p.waitForTimeout(250); const mid=await H(()=>document.querySelector('#fl li').getBoundingClientRect().height);
  await p.waitForTimeout(400); const full=await H(()=>document.querySelector('#fl li').getBoundingClientRect().height);
  ok(an&&an.d==='0.6s'&&/cubic-bezier/.test(an.f)&&mid>3&&mid<full-3,`부드럽게 올라옴: ${an&&an.d} ${an&&an.f}, 중간 높이 ${Math.round(mid)} / ${Math.round(full)}px`);
  const a1=await pos(), shown1=(await RS()).shown;
  ok(shown0===1&&shown1<=2&&!!(await p.$('#fl li.wait')),`채팅을 비우고 처음부터 말풍선이 차례로 나옴(처음 ${shown0}개, 0.65초 뒤 ${shown1}개)`);
  ok(a1.boxBottom-a1.first.bottom<=a1.first.height+40,`첫 말풍선이 화면 아래쪽에서 시작(아래 여백 ${Math.round(a1.boxBottom-a1.first.bottom)}px, 다음 말풍선이 올라오는 중)`);
  await p.waitForTimeout(1400); const a2=await pos();
  ok(a2.n>a1.n&&a2.first.top<a1.first.top-20&&a2.boxBottom-a2.last.bottom<=16,`새 말풍선이 아래에 나오며 앞 말풍선을 위로 밀어 올림(첫 말풍선 ${Math.round(a1.first.top)} → ${Math.round(a2.first.top)}px)`);
  await H(()=>{ window.__said=[]; const o=speechSynthesis.speak; speechSynthesis.speak=u=>{ window.__said.push(u.text); o(u); }; });
  const n0=(await RS()).shown; await p.click('#fl .hb[data-i="0"]',{force:true}); await p.waitForTimeout(150);
  ok((await H(()=>window.__said)).includes(cpus[0])&&(await RS()).shown<8&&!(await p.$('#go')),`다시 보기 중 철자(말풍선)를 누르면 읽기만(${cpus[0]}), 다시 보기는 계속(${n0}개 → 아직 다 안 나옴)`);
  await p.focus('#fl .hb[data-i="1"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  ok((await H(()=>window.__said)).includes(mine[0])&&(await RS()).shown<8,`키보드(Enter)로도 읽기: ${mine[0]}`);
  await p.focus('#fl'); await p.evaluate(()=>document.activeElement.blur()); await p.keyboard.press('Enter'); await p.waitForTimeout(50);
  let r=await RS();
  ok(r.shown===8&&r.step===2&&!(await p.$('#fl li.wait'))&&!!(await p.$('#go')),'Enter: 말풍선이 전부 바로 보이고 "다음 ▶"이 나옴(다음 화면으로 넘어가지 않음)');
  const exp=cpus.flatMap((c,i)=>[`cpu:${c}`,`me:${mine[i]}`]);
  ok(r.hl.join()===exp.join(),'순서: '+r.hl.join(' / '));
  ok(r.hl.length===8&&r.hl[0]==='cpu:'+cpus[0]&&!r.hl.some(x=>x.split(':')[1]===bad),`하트를 잃기 전 줄(${firstCpu})과 틀린 시도(${bad})는 안 보임 — `+r.hl.join(' '));
  const side=await p.$$eval('#fl li',a=>a.map(li=>{ const h=li.parentNode.getBoundingClientRect(), bb=li.querySelector('.hb').getBoundingClientRect(); return (li.classList.contains('fm')?'me':li.classList.contains('fc')?'cpu':'?')+(bb.left-h.left<h.right-bb.right?'L':'R'); }));
  ok(side.every((x,i)=>x===(i%2?'meR':'cpuL')),'카톡처럼 컴퓨터 왼쪽(🤖), 학생 오른쪽 말풍선: '+side.join(' '));
  const lay=await H(()=>{ const bs=[...document.querySelectorAll('#fl .hb')].map(b=>b.getBoundingClientRect()); return bs.slice(1).map((r,i)=>Math.round(r.top-bs[i].bottom)); });
  ok(lay.every(g=>g>=11),'말풍선이 겹치지 않고 한 줄씩(위아래 간격 '+lay.join(',')+'px)');
  const plain=await H(()=>({txt:[...document.querySelectorAll('#fl .hb')].map(b=>b.textContent),av:document.querySelectorAll('#fl li.fc .fav').length,me:document.querySelectorAll('#fl li.fm .fav').length}));
  ok(plain.txt.join()===r.hl.map(x=>x.split(':')[1]).join()&&plain.av===4&&plain.me===0,'말풍선에는 단어만, 컴퓨터 말풍선 옆에만 🤖');
  // "다음 ▶"일 때: 딤드 없이 버튼만 — 말풍선이 그대로 보이고 눌러 읽을 수 있음
  const nx=await H(()=>{ const b=document.querySelector('#fl .hb[data-i="6"]'), r=b.getBoundingClientRect(), x=document.elementFromPoint(r.left+8,r.top+r.height/2);
    return {hitBubble:!!x&&b.contains(x),dim:document.getElementById('rest').classList.contains('dim'),tip:getComputedStyle(document.getElementById('hlTip')).display}; });
  ok(nx.hitBubble&&!nx.dim&&nx.tip!=='none','"다음 ▶"일 때는 딤드 없이 가운데 버튼만, 말풍선은 그대로 보이고 눌림');
  await H(()=>{ window.__said=[]; }); await p.click('#fl .hb[data-i="6"]',{position:{x:8,y:10}}); await p.waitForTimeout(150);
  ok((await H(()=>window.__said)).includes(cpus[3])&&(await RS()).step===2,`다시 보기가 끝난 뒤에도 철자(말풍선)를 누르면 읽기: ${cpus[3]}`);
  ok(!(await p.$('#grade')),'② 화면에는 상자가 없음');
  // ③ 선물 상자: "다음 ▶" → 은상자 창이 저절로 뜨고, 저절로 열려 ⭐ 2, 저절로 닫힘
  await p.focus('#go'); await p.keyboard.press('Enter'); await p.waitForSelector('#grade');
  const dim=await H(()=>{ const at=(el)=>{ const r=el.getBoundingClientRect(); const x=document.elementFromPoint(r.left+8,r.top+r.height/2); return x&&x.id; };
    const cs=getComputedStyle(document.getElementById('rest'),'::before'); return {bubble:at(document.querySelector('#fl .hb[data-i="6"]')),back:at(document.getElementById('back')),corner:document.elementFromPoint(3,3)?.id,pos:cs.position}; });
  ok(dim.bubble==='rest'&&dim.back==='rest'&&dim.corner==='rest'&&dim.pos==='fixed','선물 상자부터는 화면 전체 딤드, 뒤의 말풍선·제목줄 버튼·화면 구석이 눌리지 않음');
  r=await RS();
  ok(r.step===3&&r.lost===1&&r.grade==='silver'&&(await p.textContent('#grade'))==='🥈 은상자'&&!(await p.$('#reward')),'"다음 ▶" → 🥈 은상자 창(하트 1개 잃음·힌트 씀), 처음엔 닫힌 상자');
  await p.waitForSelector('#reward',{timeout:2000});
  ok((await p.textContent('#reward')).includes('은상자에서 ⭐ 2개')&&!(await p.$('#bonus'))&&(await stars())===s0+2,'상자가 저절로 열림 → ⭐ 2개');
  const tOpen=Date.now(); await p.waitForSelector('#toList',{timeout:4000}); const dtO=Date.now()-tOpen;
  ok(!(await p.$('#grade'))&&dtO>=1800,`보상을 보여 준 뒤(${dtO}ms) 상자 창이 저절로 닫힘`);
  // 3. ④ "단계 맵으로 가기" · "다음 단계로 가기"
  ok((await RS()).step===4&&(await p.textContent('#toList'))==='🗺 단계 맵으로 가기'&&(await p.textContent('#startNext'))==='▶ 다음 단계로 가기'&&(await H(()=>document.activeElement.id))==='startNext','④ "🗺 단계 맵으로 가기" · "▶ 다음 단계로 가기"(초점)');
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  ok((await title())==='보통 3단계'&&!(await p.$('#rest')),'Enter로 다음 단계(보통 3단계) 시작');

  // 4. 상자 등급 조건
  const g=await H(()=>[[0,false],[0,true],[2,true],[1,false],[2,false],[3,false]].map(([l,n])=>window.__wordchain.boxGrade(l,n)).join());
  ok(g==='gold,gold,gold,silver,bronze,bronze','등급: 하트 0 → 금, 힌트 없이 → 금, 하트 1 → 은, 그 외 → 동 — '+g);
  // 금상자: 보관 힌트 20%(받음 / 가득 차서 ⭐1 / 안 나옴)
  for(const [full,roll,label] of [[false,0.1,'hint'],[true,0.1,'full'],[false,0.5,'none']]){
    await seed({'wordchain-v2':prog('normal',{storedHints:full?5:1}),'wordchain-stars-v1':'0'}); await startLv('normal',2); await passTyped();
    const s=await stars(), h0=await HS('normal');
    await H(v=>window.__wordchain.setBoxRoll(v),roll); await opened();
    const rw=await p.textContent('#reward'), bn=(await p.$('#bonus'))?await p.textContent('#bonus'):'', h1=await HS('normal'), ds=(await stars())-s;
    ok((await RS()).grade==='gold'&&rw.includes('금상자에서 ⭐ 3개'),'하트도 안 잃고 힌트도 없이 → 🥇 금상자 ⭐ 3');
    if(label==='hint') ok(bn.includes('보관 힌트 1개')&&h1===h0+1&&ds===3,`금상자 보관 힌트(20%) 받음: ${h0} → ${h1}, ⭐ +${ds}`);
    if(label==='full') ok(bn.includes('가득 차서 ⭐ 1개')&&h1===5&&ds===4,`보관 힌트가 가득(5/5) → ⭐ 1개로 대체: ⭐ +${ds}`);
    if(label==='none') ok(!bn&&h1===h0&&ds===3,'뽑기 80%: 보관 힌트 없이 ⭐ 3만');
  }
  // 상자 창은 누르면 빨리: 누르면 바로 열리고, 한 번 더 누르면 닫힘 → ④
  await p.click('#rest .gift-card'); await p.waitForSelector('#toList',{timeout:1500});
  ok((await RS()).step===4,'상자 창을 누르면 바로 닫히고 ④');
  // 동상자: 하트 2개 잃고 힌트도 씀 → ⭐ 1, 화면을 누르면 말풍선 전부
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2);
  const cw=await H(()=>window.__wordchain.cpu());
  await H(c=>window.__wordchain.tweak({livesLost:2,hintUsed:true,chain:[{w:'internationalization',d:'internationalization',me:false},{w:'nonrepresentationalism',d:'nonrepresentationalism',me:true},{w:'grape',d:'grape',me:false},{w:'eat',d:'eat',me:true},...['tiger','rabbit','table','egg','goat','tree','echo','open','night','tent','turtle','east'].map((w,i)=>({w,d:w,me:i%2===1})),{w:c,d:c,me:false}]}),cw);
  await passTyped(); const s=await stars(); await p.click('#rest .rcard'); await p.waitForFunction(()=>window.__wordchain.rest().step===2);
  ok((await RS()).shown<18,'요약 창을 누르면 바로 다시 보기, 말풍선 18개가 차례로 나오는 중');
  const before=(await RS()).shown; await p.mouse.click(640,400); await p.waitForTimeout(50);
  ok((await RS()).shown===18&&!(await p.$('#fl li.wait'))&&(await RS()).step===2&&!!(await p.$('#go')),'화면을 누르면 전부 바로 보임(다음 화면으로 안 넘어감) — 누르기 전 '+before+', 뒤 '+(await RS()).shown);
  const longZ=await p.$$eval('#fl .hb',a=>{ const h=document.getElementById('feed').getBoundingClientRect(), [x,y]=a.slice(0,2).map(e=>e.getBoundingClientRect()); return {inside:x.left>=h.left&&x.right<=h.right&&y.left>=h.left&&y.right<=h.right,below:y.top>=x.bottom+10}; });
  await p.waitForTimeout(400); const a3=await pos();
  const box=await H(()=>{ const h=document.getElementById('feed'), cs=getComputedStyle(h); return {oy:cs.overflowY,ch:h.clientHeight,sh:h.scrollHeight}; });
  ok(a3.boxBottom-a3.last.bottom<=16&&box.oy==='auto'&&(box.sh<=box.ch||a3.first.top<a3.boxTop),'말풍선이 많으면 마지막 말풍선이 아래에 보이고 앞 말풍선은 위로(스크롤) '+JSON.stringify(box));
  ok(longZ.inside&&longZ.below,'긴 단어도 화면 안에(잘리지 않음), 겹치지 않음 '+JSON.stringify(longZ));
  await p.click('#go'); await p.waitForSelector('#reward',{timeout:3000});
  ok((await RS()).grade==='bronze'&&(await p.textContent('#grade'))==='🥉 동상자'&&(await p.textContent('#reward')).includes('동상자에서 ⭐ 1개')&&(await stars())===s+1,'하트 2개 잃음 + 힌트 → 🥉 동상자 ⭐ 1');

  // 줄이 바뀌어도 이번 단계에서 이어 간 단어는 모두: 두 번 맞히고 → 틀려서 새로 시작 → 통과. 대답 못 한 컴퓨터 단어·틀린 시도는 없음, 줄 사이 '새로 시작'
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2);
  const L1=[];
  for(let i=0;i<2;i++){ const cw=await H(()=>window.__wordchain.cpu()); const w=await pick(W,cw.slice(-1)); L1.push(cw,w); await typeW(w); await nextCpu(cw); }
  const miss=await H(()=>window.__wordchain.cpu()); const wrongW=W.find(w=>w[0]!==miss.slice(-1)&&!L1.includes(w)); avoid.add(wrongW);
  await typeW(wrongW); await p.waitForSelector('#ov1'); await p.click('#ov1'); await p.waitForTimeout(900);
  const live=await H(()=>window.__wordchain.feed());
  ok(live.includes('cpu:'+miss)&&live.includes('---')&&!live.some(x=>x.endsWith(':'+wrongW)),'게임 중 채팅: 대답 못 한 컴퓨터 단어도 남고, 줄이 바뀌면 "새로 시작", 틀린 시도는 없음 — '+live.join(' '));
  const c4=await H(()=>window.__wordchain.cpu()); await passTyped();
  const r4=(await RS()).hl;
  await toReplay(); await p.keyboard.press('Enter'); await allShown();
  const expL=[`cpu:${L1[0]}`,`me:${L1[1]}`,`cpu:${L1[2]}`,`me:${L1[3]}`,'---',`cpu:${c4}`];
  ok(r4.length===7&&r4.slice(0,6).join()===expL.join()&&r4[6].startsWith('me:')&&!r4.some(x=>x==='cpu:'+miss||x.endsWith(':'+wrongW))&&(await p.textContent('#fl .fdiv')).trim()==='새로 시작',
    `다시 보기: 틀려서 새로 시작한 앞 줄의 이어 간 단어도 보여 주고 줄 사이 "새로 시작"(대답 못 한 ${miss}·틀린 시도 ${wrongW}는 없음): `+r4.join(' '));

  // 5. 동작 줄이기: 움직임 없이 하나씩 차례로
  await p.emulateMedia({reducedMotion:'reduce'});
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2); await passTyped(); await toReplay();
  const rm0=await RS(), rmUp=await p.$('#fl li.up');
  await p.waitForTimeout(800); const rm1=await RS();
  ok(rm0.shown===1&&rm1.shown===2&&!rmUp&&!(await p.$('#fl li.up'))&&!(await p.$('#go')),`동작 줄이기: 올라오는 움직임 없이 말풍선이 하나씩 차례로(처음 ${rm0.shown}개, 0.8초 뒤 ${rm1.shown}개)`);
  await allShown(); ok(!!(await p.$('#go')),'동작 줄이기: 다 나오면 "다음 ▶"');
  await p.click('#go'); await p.waitForSelector('#reward',{timeout:3000}); ok(!(await p.$('.gift.opening')),'동작 줄이기: 상자 흔들림 없이 열림');
  await p.emulateMedia({reducedMotion:'no-preference'});

  // 6. 마지막 단계: "🎉 기초 수준 정복!", "다음 단계로 가기" 대신 "다른 수준 고르기"
  await seed({'wordchain-v2':prog('basic',{cleared:{1:true,2:true,3:true}}),'wordchain-stars-v1':'0'}); await startLv('basic',4); await passTyped();
  ok((await p.textContent('#rest .rcard h3'))==='기초 수준 정복!'&&!(await p.textContent('#rest')).includes('열렸어요'),'마지막 단계 요약: "기초 수준 정복!", 다음 단계 안내 없음');
  await opened(); await p.waitForSelector('#conquer',{timeout:4000});
  ok((await p.textContent('#conquer'))==='🎉 기초 수준 정복!'&&!(await p.$('#startNext'))&&(await H(()=>document.activeElement.id))==='toTracks'&&!!(await p.$('#toList'))&&(await noRestName()),'"🎉 기초 수준 정복!" + "단계 맵으로 가기" · "다른 수준 고르기"(초점)');
  await p.click('#toList'); await p.waitForTimeout(200);
  ok((await p.$$('.map .node.lv.cleared')).length===4&&!!(await p.$('.map .node.goal.cleared')),'단계 맵으로: 4단계 모두 통과 표시, 🏆 도착점');
  await p.click('#chg'); await p.waitForTimeout(200);
  ok((await p.$$('.track')).length===3,'← 로 첫 화면(수준 선택)');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
