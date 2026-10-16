// 수준별 1·2단계를 정답으로 자동 플레이해 통과까지 오류가 없는지. node tests/levels.js [주소]
const {target,open,startLevel}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=f=>p.evaluate(f);
  await p.goto(url);
  const W=await H(()=>(VOCAB_E+'|'+VOCAB_M).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)&&!/(er|est)$/.test(w)));
  for(const t of ['basic','normal','hard']) for(const lv of [1,2]){
    await startLevel(p,url,t,lv); await p.waitForTimeout(300);
    let turns=0, passed=false;
    for(let i=0;i<30&&!passed;i++){
      const ov=await p.$('.overlay'); if(ov){ const tx=await ov.textContent(); if(tx.includes('통과')){ passed=true; break; } await p.click('#ov1'); await p.waitForTimeout(300); continue; }
      const tg=await H(()=>window.__wordchain.target()), cw=await H(()=>window.__wordchain.cpu()), ch=cw.slice(-1);
      if(await p.$('.spell')) await p.click(`.spell .choice[data-v="${tg}"]`);
      else if(await p.$('.blocks')) await p.keyboard.type(tg.slice(1));
      else if(await p.$('#bslots')){ const bins=await p.$$eval('#bslots .bin',a=>a.map(s=>+s.dataset.i)); await p.focus('#bslots .bin'); await p.keyboard.type(bins.map(i=>tg[i]).join('')); await p.keyboard.press('Enter'); }
      else if(await p.$('.choices')){ const bs=await p.$$('.choice'); for(const x of bs){ if((await x.$eval('.w',e=>e.textContent))[0].toLowerCase()===ch){ await x.click(); break; } } }
      else { const used=await p.$$eval('.chain .tile',a=>a.map(e=>e.textContent.toLowerCase())); const w=W.find(x=>x[0]===ch&&!used.includes(x)&&x!==cw); await p.fill('#inp',w); await p.press('#inp','Enter'); }
      turns++;
      for(let k=0;k<30;k++){ await p.waitForTimeout(150); if(await p.$('.overlay')) break; const c2=await H(()=>window.__wordchain.cpu()); if(c2!==cw) break; }
    }
    ok(passed,`${t} ${lv}단계: ${turns}턴 만에 통과`);
  }
  ok(!errs.length,'페이지 오류 없음'+(errs.length?': '+errs.join(' | '):''));
  await b.close(); process.exit(fail?1:0);
})();
