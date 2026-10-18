// 보관 힌트: 무료 힌트 먼저, 수준별 저장·단계 이동 후 유지·다른 수준으로 안 옮겨짐, 보관 한도, 한 번 도전에 쓸 수 있는 수, 기록 지우기. node tests/hints.js [주소]
const {target,open}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=f=>p.evaluate(f), HS=()=>H(()=>window.__wordchain.hints()), stars=()=>H(()=>window.__wordchain.stars());
  const seed=async(prog,st)=>{ await p.goto(url); await p.evaluate(([prog,st])=>{ localStorage.clear(); localStorage.setItem('wordchain-v2',JSON.stringify({track:'normal',prog,time:{},basicVer:2})); localStorage.setItem('wordchain-stars-v1',String(st)); },[prog,st]); await p.goto(url); };
  const lv=(stored)=>({unlocked:4,best:{},cleared:{},storedHints:stored});
  const startLv=async(t,n)=>{ await p.click(`[data-t="${t}"]`); await p.click(`[data-lv="${n}"]`); await p.waitForTimeout(400); };
  const W=await (async()=>{ await p.goto(url); return H(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{3,}$/.test(w)&&!/(er|est)$/.test(w))); })();
  const nextWord=async()=>{ const cw=await H(()=>window.__wordchain.cpu()); const used=await p.$$eval('#fl .hb',a=>a.map(e=>e.textContent));
    await p.fill('#inp',W.find(w=>w[0]===cw.slice(-1)&&w!==cw&&!used.includes(w))); await p.press('#inp','Enter'); await p.waitForTimeout(2700); };
  const hint=async()=>{ await p.click('#hintBtn'); await p.waitForTimeout(120); };

  // 1. 무료 힌트가 먼저 쓰임, 표시 "무료 💡 N · 보관 💡 N"
  await seed({normal:lv(2)},0); await startLv('normal',2);
  ok((await p.textContent('#qm .hcount')).includes('무료 💡 3 · 보관 💡 2'),'힌트 표시: 무료 💡 3 · 보관 💡 2');
  await hint(); let h=await HS();
  ok(h.free===2&&h.stored===2,'힌트를 쓰면 무료 힌트부터 줄어듦(무료 2, 보관 2)');
  await hint(); await hint(); h=await HS();
  ok(h.free===0&&h.stored===2,'무료 3번을 다 쓸 때까지 보관 힌트는 그대로');

  // 2. 한 번 도전에 보관 힌트는 최대 2번
  await nextWord(); await hint(); await hint(); h=await HS();
  const sv=await H(()=>JSON.parse(localStorage.getItem('wordchain-v2')).prog.normal.storedHints);
  ok(h.stored===0&&h.usedStored===2&&sv===0,'무료를 다 쓴 뒤 보관 힌트 사용(남은 개수는 wordchain-v2 수준별 진도에 저장)');
  await seed({normal:lv(4)},0); await startLv('normal',2);
  for(let i=0;i<3;i++) await hint(); await nextWord(); await hint(); await hint();
  h=await HS();
  ok(h.stored===2&&(await p.$eval('#hintBtn',e=>e.disabled))&&(await p.textContent('#qm')).includes('한 번 도전에 2번까지'),'한 번 도전에 보관 힌트 2번까지: 2개 남아도 힌트 버튼 비활성 + 안내');

  // 3. 단계가 바뀌어도 남음, 다른 수준으로 안 옮겨짐
  await p.click('#back'); await p.waitForTimeout(200);
  ok((await p.textContent('.trackbar')).includes('보관 힌트 2/5'),'단계 목록에 현재 수준의 보관 힌트 개수(2/5)');
  await p.click('[data-lv="3"]'); await p.waitForTimeout(400); h=await HS();
  ok(h.stored===2&&h.free===3&&h.usedStored===0,'다른 단계로 가도 보관 힌트 2개 유지, 무료 힌트는 새로 3번');
  await p.click('#back'); await p.click('#chg'); await startLv('hard',1); h=await HS();
  ok(h.stored===0,'도전 수준에서는 보통 수준의 보관 힌트를 쓸 수 없음(0개)');
  await p.click('#back'); await p.waitForTimeout(150);
  ok((await p.textContent('.trackbar')).includes('보관 힌트 0/5'),'도전 수준 단계 목록: 보관 힌트 0/5');
  await p.click('#chg'); await p.click('[data-t="normal"]'); await p.waitForTimeout(150);
  ok((await p.textContent('.trackbar')).includes('보관 힌트 2/5'),'보통 수준으로 돌아오면 다시 2/5');

  // 4. 사기: 개수 고르기, 보관 한도(5개)
  await seed({normal:lv(3)},50); await startLv('normal',2);
  for(let i=0;i<3;i++) await hint();
  await p.click('#buyOpen'); await p.waitForTimeout(150);
  ok((await p.textContent('#qN'))==='1'&&!!(await p.$('#qPlus')),'보관 3개: 최대 2개까지 고를 수 있음');
  await p.click('#qPlus'); await p.waitForTimeout(80);
  ok((await p.textContent('#qN'))==='2'&&(await p.$eval('#qPlus',e=>e.disabled)),'개수는 남은 보관 칸(2)까지만');
  await p.click('#buyHint'); await p.click('#buyHint'); await p.waitForTimeout(200);
  h=await HS();
  ok(h.stored===5&&(await stars())===40&&(await p.textContent('#msg')).includes('다른 수준으로는 옮겨지지 않아요'),'보관 힌트 2개 구매: ⭐ -10, 보관 5개, 안내 문구');
  ok((await p.$eval('#buyHint',e=>e.disabled))&&(await p.textContent('#qm')).includes('보관 힌트가 가득 찼어요 (5/5)'),'한도가 차면 구매 버튼 비활성 + "보관 힌트가 가득 찼어요 (5/5)"');

  // 5. 이 수준 기록 지우기: 보관 힌트도 지움, 별은 그대로
  await p.click('#back'); await p.waitForTimeout(150);
  await p.click('#reset'); await p.click('#reset'); await p.waitForTimeout(200);
  ok((await p.textContent('.trackbar')).includes('보관 힌트 0/5')&&(await stars())===40,'이 수준 기록 지우기: 보관 힌트 0, 별 ⭐40 그대로');
  // 힌트 뜻에는 접미사 단어의 원래 단어 표시(kindly의 "(kind+ly)")가 없음(답을 알려 주지 않게)
  await seed({normal:lv(0)},0); await startLv('normal',2);
  await p.evaluate(()=>{ window.__wordchain.forceCpu('book'); window.__wordchain.setHintWord('kindly'); }); await p.waitForTimeout(200);
  await p.click('#hintBtn'); await p.waitForTimeout(150);
  const hb=await p.textContent('#hintArea .hintbox');
  ok(hb.includes('친절하게')&&!hb.includes('kind+ly')&&!hb.includes('('),'힌트 뜻: "친절하게"만(원래 단어 표시 "(kind+ly)" 없음) — '+hb.replace(/\s+/g,' ').slice(0,40));
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
