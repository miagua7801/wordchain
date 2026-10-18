// 휴대폰: 화면 키보드(가짜 visualViewport로 보이는 높이를 줄임)와 끝 글자 → 첫 글자 건네주기. node tests/mobile.js [주소]
const {target,open,startLevel}=require('./lib');
(async()=>{
  const url=target(process.argv[2]); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const fakeVV=()=>{ const vv=new EventTarget(); Object.assign(vv,{height:innerHeight,width:innerWidth,offsetTop:0,offsetLeft:0,scale:1});
    Object.defineProperty(window,'visualViewport',{value:vv}); window.__kb=h=>{ vv.height=h; vv.dispatchEvent(new Event('resize')); }; };
  // 아이폰 13(보이는 높이 664, 키보드 위 330) · 아이폰 SE(548, 250)
  for(const [W,H,K] of [[390,664,330],[375,548,250]]){
    const {b,p,errs}=await open({viewport:{width:W,height:H},isMobile:true,hasTouch:true}); await p.addInitScript(fakeVV);
    for(const [t,lv] of [['normal',3],['basic',3],['hard',5]]){
      await startLevel(p,url,t,lv); await p.waitForTimeout(500);
      await p.focus(await p.$('#inp')?'#inp':'#bslots .bin');
      await p.evaluate(()=>scrollTo(0,180));                       // 브라우저가 입력칸을 보이려고 밀어 올린 상황
      await p.evaluate(k=>window.__kb(k),K); await p.waitForTimeout(400);
      const r=await p.evaluate(()=>{ const a=document.activeElement, box=a.closest('.slots')||a, q=s=>document.querySelector(s).getBoundingClientRect();
        return {kb:document.documentElement.classList.contains('kb'),inp:box.getBoundingClientRect().bottom,cpu:q('.cpu').top,top:q('.ghead').top,chain:!!document.querySelector('.feed')&&getComputedStyle(document.querySelector('.feed')).display!=='none'}; });
      ok(r.kb&&r.inp<=K&&r.cpu>=0&&!r.chain,`${W}×${H} 키보드 위 ${K}px · ${t} ${lv}단계: 줄인 화면, 입력칸(${Math.round(r.inp)})이 키보드 위, 컴퓨터 단어 카드 보임(${Math.round(r.cpu)})`);
      if(W===390) ok(r.top>=0,`  ${t} ${lv}단계: 맨 윗줄도 보임(${Math.round(r.top)})`);
      await p.evaluate(h=>{ document.activeElement.blur(); window.__kb(h); },H); await p.waitForTimeout(200);
      ok(await p.evaluate(()=>!document.documentElement.classList.contains('kb')&&scrollY===0),'  키보드가 내려가면 원래 화면, 맨 위로');
    }
    ok(!errs.length,'페이지 오류 없음 '+errs.join(' | ')); await b.close();
  }
  // 끝 글자 건네주기: 휴대폰은 선 대신 끝 글자가 첫 글자 자리로 건너감(1단계 보기마다, 3단계 글자 없는 동그라미)
  const {b,p,errs}=await open({viewport:{width:390,height:664},isMobile:true,hasTouch:true});
  for(const lv of [1,2,3]){
    await startLevel(p,url,'basic',lv); await p.waitForTimeout(500);
    const hands=await p.$$eval('.hand',a=>a.map(e=>e.textContent)), ends=lv===1?(await p.$$('#answer .choice .f')).length:1;
    ok(hands.length===ends&&!(await p.$('svg.link'))&&(lv===3?hands.every(x=>x===''):hands.every(x=>x.length===1)),`기초 ${lv}단계: 연결선 없이 끝 글자가 첫 글자 자리 ${ends}곳으로 건너감`);
    await p.waitForTimeout(1300); ok(!(await p.$('.hand')),'  건너간 뒤 사라짐');
  }
  const t=await p.evaluate(()=>window.__wordchain.target()); await p.keyboard.type(t[0]); await p.waitForTimeout(100);
  ok(!!(await p.$('.cpu .big .last.land'))&&!!(await p.$('#bslots .bin.first.ok.land')),'3단계: 첫 글자를 맞히면 끝 글자와 첫 칸이 함께 반짝임');
  await p.emulateMedia({reducedMotion:'reduce'}); await startLevel(p,url,'basic',1); await p.waitForTimeout(500);
  ok(!(await p.$('.hand')),'동작 줄이기 설정이면 건너가기 효과 없음');
  // 넓은 화면(크롬북·노트북)도 같은 효과
  await p.emulateMedia({reducedMotion:'no-preference'}); await p.setViewportSize({width:1280,height:720}); await startLevel(p,url,'basic',1); await p.waitForTimeout(500);
  ok((await p.$$('.hand')).length===3&&!(await p.$('svg.link')),'넓은 화면 기초 1단계: 연결선 없이 끝 글자가 첫 글자 자리 3곳으로 건너감');
  ok(!errs.length,'페이지 오류 없음 '+errs.join(' | ')); await b.close();
  console.log(fail?`실패 ${fail}개`:'모두 통과'); process.exit(fail?1:0);
})();
