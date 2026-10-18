// 단어 수첩 안내·지금 연습하기·수첩 단어 보너스, 별 모으기·힌트 사기·다시 듣기·시간 사기. node tests/shop.js [주소]
const {target,open}=require('./lib');
const day=n=>{ const d=new Date(); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a);
  const seed=async(o)=>{ await p.goto(url); await H(o=>{ localStorage.clear(); for(const [k,v] of Object.entries(o)) localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v)); },o); await p.goto(url); };
  const NB=()=>H(()=>JSON.parse(localStorage.getItem('wordchain-notebook-v1')));
  const startLv=async(t,lv)=>{ await p.click(`[data-t="${t}"]`); await p.click('#teacher'); await p.click('#teacher'); await p.click(`[data-lv="${lv}"]`); await p.waitForTimeout(400); };

  // 1. 단어 수첩: 안내 문구, '내일' 표시, 지금 연습하기(도장·날짜 그대로, 외운 단어 제외, 최대 10개)
  const items={}; ['tiger','apple','house','water','money','music','happy','green','table','river','smile','pencil'].forEach((w,i)=>items[w]={w,reason:'hint',stamps:i%3,due:i===0?day(1):day(5)});
  await seed({'wordchain-v2':{track:'normal',prog:{},time:{},basicVer:2},'wordchain-notebook-v1':{items,learned:{zebra:{w:'zebra',date:day(-3)}},tbSeen:[]}});
  await p.click('[data-t="normal"]'); await p.click('#nbBtn'); await p.waitForTimeout(200);
  const t=await p.textContent('#app');
  ok(t.includes("모은 단어는 다음 날부터 '오늘의 복습'에 다시 나와요")&&t.includes('내일'),'수첩 안내 문구, 다음 복습 "내일" 표시');
  await p.click('#pr'); await p.waitForTimeout(300);
  ok((await p.textContent('.topbar h2')).includes('/ 10')&&(await p.textContent('#app')).includes('연습은 도장을 주지 않아요'),'지금 연습하기: 최대 10개, 안내 문구');
  const seen=[];
  for(let i=0;i<10;i++){ const w=await H(()=>window.__wordchain.review()); seen.push(w); await p.fill('#inp',i%2?w:'zzz'); await p.press('#inp','Enter'); await p.waitForTimeout(120); await p.click('#next'); await p.waitForTimeout(120); }
  const nb=await NB();
  ok(!seen.includes('zebra')&&new Set(seen).size===10,'외운 단어는 연습에 안 나옴, 섞어서 10개');
  ok(Object.keys(items).every(w=>nb.items[w].stamps===items[w].stamps&&nb.items[w].due===items[w].due)&&Object.keys(nb.learned).join()==='zebra','연습은 도장·복습 날짜·외운 단어를 바꾸지 않음');

  // 2. 수첩 단어 보너스(+5, 힌트 턴 제외)
  const pts=await H(()=>{ const P=window.__wordchain.points; return [P('cat',1,false,false,false),P('cat',1,false,false,true),P('cat',1,false,true,true)]; });
  ok(pts[1]-pts[0]===5&&pts[2]===10,`수첩 단어 보너스: ${pts[0]} → ${pts[1]}, 힌트 쓴 턴 ${pts[2]}`);
  const W=await H(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{3,}$/.test(w)&&!/(er|est)$/.test(w)));
  const allItems={}; W.forEach(w=>allItems[w]={w,reason:'hint',stamps:1,due:day(3)});
  await seed({'wordchain-v2':{track:'normal',prog:{},time:{},basicVer:2},'wordchain-notebook-v1':{items:allItems,learned:{},tbSeen:[]},'wordchain-stars-v1':'0'});
  await startLv('normal',2);
  let cw=await H(()=>window.__wordchain.cpu()); let ans=W.find(w=>w[0]===cw.slice(-1)&&w!==cw);
  await p.fill('#inp',ans); await p.press('#inp','Enter'); await p.waitForTimeout(250);
  const m=await p.textContent('#msg'), exp=await H(a=>window.__wordchain.points(a,1,false,false,true),ans);
  ok(m.includes('📒 수첩 단어!')&&m.includes(`+${exp}점`),`수첩 단어로 정답: ${m}`);
  const nbAfter=await NB(); ok(nbAfter.items[ans].stamps===1&&nbAfter.items[ans].due===day(3),'게임 정답은 수첩 도장·날짜를 바꾸지 않음');

  // 3. 별 모으기: 판이 끝날 때(하트를 다 잃거나 통과) 점수 10점 = ⭐1(버림), 오답에서는 차감 없음
  await p.waitForTimeout(2500);
  const sc=(await H(()=>window.__wordchain.state())).score;
  // 보통 수준은 하트 3개: 하트가 남아 있으면 판이 이어지므로 별은 하트를 다 잃을 때 쌓임
  const miss=async()=>{ const c=await H(()=>window.__wordchain.cpu()); await p.fill('#inp',W.find(w=>w[0]!==c.slice(-1))); await p.press('#inp','Enter'); await p.waitForTimeout(700); };
  await miss(); const st0=await H(()=>window.__wordchain.stars()); await p.click('#ov1'); await p.waitForTimeout(700);
  ok(st0===0,'하트가 남아 있으면 판이 이어져 별을 아직 안 쌓음');
  await miss(); await p.click('#ov1'); await p.waitForTimeout(700); await miss();
  const st1=await H(()=>window.__wordchain.stars());
  ok(st1===Math.floor(sc/10)&&(await p.textContent('.overlay')).includes(`⭐ +${st1}`),`판이 끝나면 ${sc}점 → ⭐ ${st1} (오답 화면에 "⭐ +${st1}")`);
  ok(+(await H(()=>localStorage.getItem('wordchain-stars-v1')))===st1,'wordchain-stars-v1에 숫자 하나만 저장');
  await p.click('#ov1');

  // 4. 힌트 사기: 무료 3번 뒤 사기 버튼, 별 부족하면 비활성·안내
  await seed({'wordchain-v2':{track:'normal',prog:{},time:{},basicVer:2},'wordchain-stars-v1':'2'});
  await startLv('normal',2);
  for(let i=0;i<3;i++){ await p.click('#hintBtn'); await p.waitForTimeout(100); }
  ok(!(await p.$('#hintBtn:not([disabled])'))&&(await p.$eval('#buyHint',e=>e.disabled))&&(await p.textContent('#qm')).includes('별이 부족해요 (⭐ 2/5)'),'무료 힌트 3번 뒤: 별 부족 → 버튼 비활성 + "별이 부족해요 (⭐ 2/5)"');
  // 보관 힌트 사기·쓰기는 tests/hints.js에서 확인
  await seed({'wordchain-v2':{track:'normal',prog:{},time:{},basicVer:2},'wordchain-stars-v1':'10'});
  // 5. 시간 +10초(시간 제한 단계)·다시 듣기 +1(듣고 쓰기), 한 판에 1번
  await p.goto(url); await startLv('normal',4); await p.waitForTimeout(300);
  await p.click('#buyTime'); await p.click('#buyTime'); await p.waitForTimeout(150);
  ok((await H(()=>window.__wordchain.stars()))===7&&!(await p.$('#buyTime')),'시간 +10초: ⭐ -3, 한 판에 1번');
  await p.goto(url); await p.click('[data-t="hard"]'); await p.click('#teacher'); await p.click('#teacher'); await p.click('[data-lv="5"]'); await p.waitForTimeout(400);
  await p.click('#say'); await p.waitForTimeout(100);
  ok(await p.$eval('#say',e=>e.disabled),'듣기 챌린지: 다시 듣기 1번 쓰면 비활성');
  await p.click('#buyReplay'); await p.click('#buyReplay'); await p.waitForTimeout(150);
  ok((await H(()=>window.__wordchain.stars()))===4&&!(await p.$eval('#say',e=>e.disabled))&&!(await p.$('#buyReplay')),'다시 듣기 +1: ⭐ -3, 다시 들을 수 있음, 한 판에 1번');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
