// 쉬어 가기: 통과 뒤 화면, 정답률·시간, 이번에 얻은 배지만, 미니 복습 단어 순서, 정식 복습/연습 도장 차이, 상자 보상·가득 찼을 때 대체, 건너뛰기, 다음 단계 시작, 마지막 단계 수준 정복. node tests/rest.js [주소]
const {target,open}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a), RS=()=>H(()=>window.__wordchain.rest()), stars=()=>H(()=>window.__wordchain.stars()), NB=()=>H(()=>JSON.parse(localStorage.getItem('wordchain-notebook-v1')));
  const day=n=>{ const d=new Date(); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  // 진도·수첩·별·배지를 심고 수준·단계 시작
  const seed=async(o)=>{ await p.goto(url); await H(o=>{ localStorage.clear(); for(const k in o) localStorage.setItem(k,typeof o[k]==='string'?o[k]:JSON.stringify(o[k])); },o); await p.goto(url); };
  const prog=(t,extra)=>({track:t,prog:{[t]:Object.assign({unlocked:5,best:{},cleared:{}},extra||{})},time:{},basicVer:2});
  const startLv=async(t,n)=>{ await p.click(`[data-t="${t}"]`); await p.click(`[data-lv="${n}"]`); await p.waitForTimeout(900); };
  await p.goto(url);
  const W=await H(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)&&!/(er|est)$/.test(w)&&!window.__wordchain.tb(w)));
  // 주관식 단계: 목표 바로 앞까지 성공 수를 올린 뒤 기본 어휘 단어가 아닌 단어로 정답 → 통과
  const passTyped=async()=>{ const goal=await H(()=>document.querySelectorAll('.status .dot').length);
    await H(g=>window.__wordchain.tweak({streak:g-1}),goal);
    const cw=await H(()=>window.__wordchain.cpu()); await p.fill('#inp',W.find(w=>w[0]===cw.slice(-1)&&w!==cw)); await p.press('#inp','Enter');
    await p.waitForSelector('#rest',{timeout:4000}); };

  // 1. 통과 → 쉬어 가기 ①: 정답률·시간·이번에 얻은 배지만·힌트 없이 통과 (기존 🏆 창은 안 뜸)
  await seed({'wordchain-v2':prog('basic'),'wordchain-badges-v1':[{id:'first',date:day(-3)}]}); await startLv('basic',1);
  let t=await H(()=>window.__wordchain.target()); const wrongOpt=await p.$$eval('.spell .choice',(a,t)=>a.map(e=>e.dataset.v).find(v=>v!==t),t);
  await p.click(`.spell .choice[data-v="${wrongOpt}"]`); await p.waitForTimeout(700); await p.click('#ov1'); await p.waitForTimeout(900);
  await H(()=>window.__wordchain.tweak({streak:3,t0:Date.now()-155000}));
  t=await H(()=>window.__wordchain.target()); await p.click(`.spell .choice[data-v="${t}"]`);
  await p.waitForSelector('#rest',{timeout:4000});
  ok(!(await p.$('.overlay'))&&(await RS()).step===1&&(await p.textContent('#rest')).includes('1단계 통과!'),'단계 통과 뒤 쉬어 가기 ① 화면(통과 창은 따로 안 뜸)');
  ok((await p.textContent('#rAcc'))==='1/2'&&(await p.textContent('#rest')).includes('정답률 50%'),'정답률: 맞힌 턴 / 답을 낸 턴 = 1/2 (50%)');
  ok(/^2분 3[5-9]초$/.test(await p.textContent('#rTime')),'걸린 시간 "'+(await p.textContent('#rTime'))+'" (2분 35초 형식)');
  const bdg=await p.textContent('#rBadges');
  ok(bdg.includes('힌트 없이')&&!bdg.includes('첫걸음'),'이번에 새로 얻은 배지만 표시: '+bdg.trim());
  ok(!!(await p.$('.nohint')),'"✨ 힌트 없이 통과!" 축하');
  ok((await H(()=>document.activeElement.id))==='go','키보드: "다음 →"에 초점');

  // 2. 미니 복습 단어 고르는 순서
  await seed({'wordchain-v2':prog('normal'),'wordchain-notebook-v1':{items:{tiger:{w:'tiger',reason:'wrong',stamps:1,due:day(-1)},apple:{w:'apple',reason:'hint',stamps:0,due:day(2)},house:{w:'house',reason:'hint',stamps:0,due:day(3)}},learned:{robot:{w:'robot',date:day(-1)}},tbSeen:[]}});
  let ws=await H(()=>window.__wordchain.restWords(['candy']));
  ok(ws.length===2&&ws[0]==='tiger:due'&&/^(apple|house):practice$/.test(ws[1]),'순서: 복습 날짜가 된 단어(정식) → 날짜 안 된 수첩 단어(연습), 외운 단어 제외 — '+ws.join(', '));
  await H(()=>localStorage.setItem('wordchain-notebook-v1',JSON.stringify({items:{},learned:{},tbSeen:[]}))); await p.goto(url);
  ws=await H(()=>window.__wordchain.restWords(['candy','zzqx','table']));
  ok(ws.length===2&&ws.every(x=>/^(candy|table):chain$/.test(x)),'수첩이 비었으면 끝말잇기 줄의 내 단어(단어장 단어만) — '+ws.join(', '));

  // 3. 정식 복습(도장 +1·날짜 바뀜)과 연습(그대로), 모두 맞히면 ⭐ +1, 상자 ⭐1
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0','wordchain-notebook-v1':{items:{tiger:{w:'tiger',reason:'wrong',stamps:1,due:day(-1)},apple:{w:'apple',reason:'hint',stamps:1,due:day(2)}},learned:{},tbSeen:[]}});
  await startLv('normal',2); await passTyped();
  const st0=await stars(); await p.click('#go'); await p.waitForTimeout(200);
  ws=(await RS()).words; ok(ws.join()==='tiger:due,apple:practice','미니 복습 단어: tiger(정식 복습), apple(연습)');
  ok((await H(()=>document.activeElement.id))==='inp'&&!!(await p.$('#skipRest')),'② 입력칸에 초점, 건너뛰기 버튼');
  for(let i=0;i<2;i++){ const w=(await RS()).words[(await RS()).words.length>i?i:0].split(':')[0]; await p.fill('#inp',w); await p.press('#inp','Enter'); await p.waitForTimeout(150);
    ok((await p.textContent('#msg')).startsWith('✔'),`${w} 맞힘: ${await p.textContent('#msg')}`);
    if(i===0) await p.keyboard.press('Enter'); else { ok((await p.textContent('#next'))==='🎁 상자 열기','마지막 단어 뒤 "🎁 상자 열기"'); await H(()=>window.__wordchain.setBoxRoll(0.1)); await p.keyboard.press('Enter'); }
    await p.waitForTimeout(250); }
  await p.waitForSelector('#reward',{timeout:3000});
  const nb=await NB();
  ok(nb.items.tiger.stamps===2&&nb.items.tiger.due===day(7),'정식 복습: tiger 도장 1 → 2, 다음 복습 7일 뒤');
  ok(nb.items.apple.stamps===1&&nb.items.apple.due===day(2),'연습: apple 도장·날짜 그대로');
  ok((await p.textContent('#reward')).includes('⭐ 1개')&&(await p.textContent('#bonus')).includes('⭐ +1')&&(await stars())===st0+2,'상자 ⭐1 + 모두 맞힘 보너스 ⭐1 → 별 +2');
  await p.click('#go'); await p.waitForTimeout(200);
  // 4. ③ 컴퓨터의 한마디 + 다음 단계 시작(Enter)
  const line=await p.textContent('#line'), lines=await H(()=>window.__wordchain.restLines('normal-3'));
  ok((await RS()).step===3&&lines.includes(line)&&(await p.textContent('#startNext'))==='▶ 3단계 시작'&&(await p.textContent('#rest')).includes('3단계 · 직접 쓰기 · 중학'),'③ 보통 2→3 한마디(REST_LINES): "'+line+'" + 다음 단계 이름·방식 + "▶ 3단계 시작"');
  ok((await H(()=>document.activeElement.id))==='startNext'&&!!(await p.$('#toList')),'"▶ 3단계 시작"에 초점, "단계 목록으로" 버튼');
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  ok((await p.textContent('.topbar h2')).includes('보통 3단계'),'Enter로 3단계 시작');

  // 5. 상자 보상 확률표, 보관 힌트, 가득 찼을 때 ⭐3, 하나 틀리면 보너스 없음
  const map=await H(()=>[0,0.49,0.5,0.79,0.8,0.89,0.9,0.99].map(v=>{ const o=window.__wordchain.pickReward(v); return o.hint?'h':o.stars; }).join(''));
  ok(map==='11223 3hh'.replace(' ',''),'확률표: 0~0.5 ⭐1, 0.5~0.8 ⭐2, 0.8~0.9 ⭐3, 0.9~1 보관 힌트 — '+map);
  for(const [full,label] of [[false,'보관 힌트 1개'],[true,'⭐ 3개로 바꿔']]){
    await seed({'wordchain-v2':prog('normal',{storedHints:full?5:1}),'wordchain-stars-v1':'0','wordchain-notebook-v1':{items:{tiger:{w:'tiger',reason:'wrong',stamps:0,due:day(-1)}},learned:{},tbSeen:[]}});
    await startLv('normal',2); await passTyped(); const s0=await stars(); await p.click('#go'); await p.waitForTimeout(200);
    await p.fill('#inp','tigre'); await p.press('#inp','Enter'); await p.waitForTimeout(150);
    ok((await p.textContent('#msg')).includes('정답은 tiger예요'),'미니 복습 틀림: 정답을 보여 줌');
    await H(()=>window.__wordchain.setBoxRoll(0.95)); await p.keyboard.press('Enter'); await p.waitForSelector('#reward',{timeout:3000});
    const sh=await H(()=>JSON.parse(localStorage.getItem('wordchain-v2')).prog.normal.storedHints);
    ok((await p.textContent('#reward')).includes(label)&&!(await p.$('#bonus'))&&(full?(await stars())===s0+3&&sh===5:sh===2&&(await stars())===s0),full?'보관 힌트가 가득(5/5) → ⭐ 3개로 대체, 하나 틀려 보너스 없음':'보관 힌트 1개 받음(1 → 2), 별 그대로');
    const tg=(await NB()).items.tiger; ok(tg.stamps===0&&tg.due===day(1),'정식 복습 틀림: 도장 0, 다음 날');
  }

  // 6. 건너뛰기: 상자 없이 ③
  await seed({'wordchain-v2':prog('normal'),'wordchain-stars-v1':'0'}); await startLv('normal',2); await passTyped();
  const s1=await stars(); await p.click('#go'); await p.waitForTimeout(200); await p.click('#skipRest'); await p.waitForTimeout(200);
  ok((await RS()).step===3&&!(await RS()).reward&&(await stars())===s1,'건너뛰기: 상자 없이 ③으로, 별 그대로');

  // 7. 마지막 단계: ③ 대신 수준 정복
  await seed({'wordchain-v2':prog('basic',{cleared:{1:true,2:true,3:true}}),'wordchain-stars-v1':'0'}); await startLv('basic',4); await passTyped();
  ok(!(await p.textContent('#rest')).includes('열렸어요')&&(await p.textContent('.rsteps')).includes('정복'),'마지막 단계 ①: 다음 단계 안내 없음, 단계 표시 "③ 정복"');
  await p.click('#go'); await p.waitForTimeout(200); await p.click('#skipRest'); await p.waitForTimeout(200);
  ok((await p.textContent('#conquer'))==='기초 수준 정복!'&&!(await p.$('#startNext'))&&(await H(()=>document.activeElement.id))==='toTracks','"🎉 기초 수준 정복!" + 수준 선택 버튼(초점)');
  await p.click('#toTracks'); await p.waitForTimeout(200);
  ok((await p.$$('.track')).length===3,'수준 선택 화면으로');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
