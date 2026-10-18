// 하트(보통·도전): 틀리면 하트 1개, 성공 수 유지, 하트를 다 잃으면 처음부터, 목표를 채우면 통과, 단계 목표·문구, 진행 쉼(약 2초), 기초는 예전 방식. node tests/lives.js [주소]
const {target,open,startLevel}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=f=>p.evaluate(f), ST=()=>H(()=>window.__wordchain.state());
  await p.goto(url);
  const W=await H(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)&&!/(er|est)$/.test(w)));
  const answer=async()=>{ const cw=await H(()=>window.__wordchain.cpu()); const used=await p.$$eval('#fl .hb',a=>a.map(e=>e.textContent.toLowerCase()));
    const w=W.find(x=>x[0]===cw.slice(-1)&&x!==cw&&!used.includes(x)); await p.fill('#inp',w); await p.press('#inp','Enter'); return cw; };
  const nextCpu=async prev=>{ const t0=Date.now(); for(let i=0;i<60;i++){ await p.waitForTimeout(50); if(await p.$('.overlay')||await p.$('#rest')) break; if((await H(()=>window.__wordchain.cpu()))!==prev) break; } return Date.now()-t0; };
  const wrong=async()=>{ await p.fill('#inp','zzzz'); await p.press('#inp','Enter'); await p.press('#inp','Enter').catch(()=>{}); await p.waitForTimeout(600); };

  // 1. 수준 목록·단계 목록: 목표 수와 하트 문구
  await p.evaluate(()=>localStorage.clear()); await p.goto(url);
  // 수준 규칙 창 둘째 쪽(공통 규칙)을 읽음
  const introRules=async t=>{ await p.evaluate(()=>{ window.__wordchainNoIntro=false; }); await p.click(`[data-t="${t}"]`);
    await p.click('#rpgNext'); await p.click('#rpgNext').catch(()=>{}); await p.waitForFunction(()=>document.querySelectorAll('.rpg-dots i')[1]?.classList.contains('on'));
    const txt=await p.textContent('.rpg-body'); await p.click('#rpgSkip'); await p.evaluate(()=>{ window.__wordchainNoIntro=true; }); return txt.replace(/\s+/g,' '); };
  const rn=await introRules('normal');
  await p.hover('[data-lv="3"]'); await p.waitForTimeout(150); const tip3=await p.textContent('#tip');
  ok(rn.includes('하트 3개')&&rn.includes('다 잃으면 처음부터')&&!rn.includes('연속 기록')&&tip3.includes('7번 성공 · ❤️ 3'),'보통 규칙 창: "하트 3개 … 다 잃으면 처음부터", 단계 맵 말풍선 "7번 성공 · ❤️ 3"');
  await p.click('#chg'); const rh=await introRules('hard'); await p.click('#chg'); const rb=await introRules('basic');
  ok(rh.includes('하트 3개')&&rb.includes('연속 기록이 0부터')&&rb.includes('연속으로 성공')&&!rb.includes('하트'),'도전은 하트, 기초는 그대로(연속 기록)');

  // 2. 틀리면 하트 1개, 성공 수 그대로
  await startLevel(p,url,'normal',2); await p.waitForTimeout(900);
  let cw=await answer(); const gap=await nextCpu(cw);
  ok(gap>=1900&&gap<2800,`보통 수준: 정답 뒤 다음 컴퓨터 단어까지 ${gap}ms(원래대로 약 2초)`);
  cw=await answer(); await nextCpu(cw);
  ok((await p.textContent('.status')).includes('성공 2 / 6')&&(await p.textContent('.status .hearts'))==='❤️❤️❤️','진행 표시: "성공 2 / 6" + ❤️❤️❤️');
  await wrong();
  let st=await ST(); const ov=await p.textContent('.overlay');
  ok(st.lives===2&&st.streak===2&&st.combo===0&&ov.includes('하트를 1개 잃었어요')&&ov.includes('❤️❤️🤍')&&(await p.textContent('#ov1'))==='계속','틀리면 하트 1개 잃음(❤️❤️🤍), 성공 2번 그대로, 콤보 0, "계속"');
  await p.click('#ov1'); await p.waitForTimeout(700);
  ok((await p.textContent('.status .hearts'))==='❤️❤️🤍'&&(await p.textContent('.status')).includes('성공 2 / 6'),'계속하면 상태 줄에 ❤️❤️🤍, 성공 2 / 6');

  // 3. 하트를 다 잃으면 성공 수 0, 하트 다시 3개
  await wrong(); await p.click('#ov1'); await p.waitForTimeout(700); await wrong();
  st=await ST(); const ov3=await p.textContent('.overlay');
  ok(st.lives===0&&st.streak===0&&ov3.includes('하트를 다 잃었어요')&&ov3.includes('성공 2 → 0')&&(await p.textContent('#ov1'))==='다시 시작','하트를 다 잃으면 성공 2 → 0, "다시 시작"');
  await p.click('#ov1'); await p.waitForTimeout(700); st=await ST();
  ok(st.lives===3&&st.streak===0&&(await p.textContent('.status .hearts'))==='❤️❤️❤️','다시 시작: 하트 3개, 성공 0');

  // 4. 하트를 잃어도 목표를 채우면 통과(통과 문구)
  await wrong(); await p.click('#ov1'); await p.waitForTimeout(700);
  for(let i=0;i<6;i++){ cw=await answer(); await nextCpu(cw); }
  const pass=await p.textContent('#rest');
  ok(pass.includes('2단계 통과')&&pass.includes('하트를 다 잃기 전에 6번 성공했어요'),'하트 1개를 잃고도 6번 성공 → 통과("하트를 다 잃기 전에 6번 성공했어요")');
  const saved=await H(()=>JSON.parse(localStorage.getItem('wordchain-v2')).prog.normal.cleared[2]);
  ok(saved===true,'통과 기록 저장');

  // 5. 기존 진도 유지(목표가 줄어도 통과 표시 그대로)
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('wordchain-v2',JSON.stringify({track:'hard',prog:{hard:{unlocked:5,best:{4:12},cleared:{1:true,2:true,3:true,4:true}}},time:{},basicVer:2})); });
  await p.goto(url); await p.click('[data-t="hard"]');
  ok((await p.$$('.map .lv.cleared')).length===4&&!(await p.$eval('[data-lv="5"]',e=>e.classList.contains('locked'))),'예전 진도(도전 1~4 통과, 5단계 열림) 그대로');

  // 6. 기초는 예전 방식: 틀리면 연속 기록 0, 하트 없음
  await startLevel(p,url,'basic',4); await p.waitForTimeout(900);
  cw=await answer(); await nextCpu(cw); await wrong();
  st=await ST(); const ovb=await p.textContent('.overlay');
  ok(st.streak===0&&!(await p.$('.status .hearts'))&&ovb.includes('연속 기록 1 → 0'),'기초: 하트 없이 예전처럼 연속 기록 0');
  await p.click('#ov1');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
