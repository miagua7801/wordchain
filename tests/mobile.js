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
  // 아이폰: 자판 위에 떠 있는 주소창(약 64px)에 입력칸·뜻이 가리지 않게
  { const {b,p,errs}=await open({viewport:{width:390,height:664},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'}); await p.addInitScript(fakeVV);
    const K=330;
    for(const [t,lv] of [['normal',3],['basic',3],['hard',1]]){
      await startLevel(p,url,t,lv); await p.waitForTimeout(500);
      await p.focus(await p.$('#inp')?'#inp':'#bslots .bin'); await p.evaluate(()=>scrollTo(0,180));
      await p.evaluate(k=>window.__kb(k),K); await p.waitForTimeout(400);
      const r=await p.evaluate(()=>{ const a=document.activeElement, box=a.closest('.slots')||a, ko=document.querySelector('.target .tko')||document.querySelector('.cpu .ko');
        return {inp:box.getBoundingClientRect().bottom,ko:ko.getBoundingClientRect().top,kob:ko.getBoundingClientRect().bottom}; });
      ok(r.inp<=K-56&&r.ko>=0&&r.kob<=K-56,`아이폰 ${t} ${lv}단계: 입력칸(${Math.round(r.inp)})·뜻(${Math.round(r.ko)}~${Math.round(r.kob)})이 주소창(키보드 위 ${K-64}~${K}px)에 가리지 않음`);
      await p.evaluate(h=>{ document.activeElement.blur(); window.__kb(h); },664); await p.waitForTimeout(200);
    }
    // 화면 떨림: 사파리는 칸에 초점이 갈 때마다 그 칸이 자판 바로 위에 오게 스크롤함. 앱이 그때마다 다시 스크롤하면 위아래로 떨림
    // → 빈칸 채우기에서 칸을 옮겨 가며 써도 앱은 다시 스크롤하지 않음
    for(const lv of [3,4]){
      await startLevel(p,url,'basic',lv); await p.waitForTimeout(500);
      const sel=lv===3?'#bslots .bin':'#inp'; await p.focus(sel); await p.evaluate(k=>window.__kb(k),K); await p.waitForTimeout(500);
      await p.evaluate(()=>{ window.__appScroll=0; const o=window.scrollTo; window.scrollTo=function(){ window.__appScroll++; return o.apply(window,arguments); };
        // 사파리 흉내: 초점이 간 칸의 아래끝이 자판 바로 위(보이는 높이 - 10px)에 오게 문서를 스크롤하고 visualViewport scroll 이벤트
        addEventListener('focusin',e=>setTimeout(()=>{ const r=e.target.getBoundingClientRect(), vv=window.visualViewport; const d=r.bottom-(vv.height-10);
          if(Math.abs(d)>1){ document.scrollingElement.scrollTop+=d; vv.dispatchEvent(new Event('scroll')); } },0)); });
      const ys=[];
      if(lv===3){ const tg=await p.evaluate(()=>window.__wordchain.target()), bins=await p.$$eval('#bslots .bin',a=>a.map(s=>+s.dataset.i));
        for(const i of bins.slice(0,-1)){ await p.keyboard.type(tg[i]); await p.waitForTimeout(350); ys.push(await p.evaluate(()=>scrollY)); } }
      else for(const c of 'abc'){ await p.keyboard.type(c); await p.waitForTimeout(200); ys.push(await p.evaluate(()=>scrollY)); }
      for(let k=0;k<3;k++){ await p.evaluate(()=>window.visualViewport.dispatchEvent(new Event('scroll'))); await p.waitForTimeout(300); ys.push(await p.evaluate(()=>scrollY)); }
      const n=await p.evaluate(()=>window.__appScroll);
      ok(n===0&&new Set(ys).size<=2,`아이폰 기초 ${lv}단계: 칸을 옮겨 쓰고 브라우저가 스크롤해도 앱이 다시 스크롤하지 않음(앱 스크롤 ${n}번, 위치 ${ys.join(',')})`);
      await p.evaluate(h=>{ document.activeElement.blur(); window.__kb(h); },664); await p.waitForTimeout(200);
    }
    // 사파리 도구 막대: 스크롤하면 주소창이 줄었다 늘었다 하며 보이는 높이가 50~80px 바뀜. 그때마다 앱이 아래 여백·위치를 바꾸면 다시 스크롤 → 막대가 또 바뀌는 고리로 흔들림
    // → 키보드가 떠 있는 동안 작은 높이 변화에는 여백(--kbh)도 위치도 그대로
    await startLevel(p,url,'basic',3); await p.waitForTimeout(500);
    await p.focus('#bslots .bin'); await p.evaluate(k=>window.__kb(k),K); await p.waitForTimeout(500);
    const tb=await p.evaluate(async()=>{ let n=0; const o=window.scrollTo; window.scrollTo=function(){ n++; return o.apply(window,arguments); };
      const kbh0=getComputedStyle(document.documentElement).getPropertyValue('--kbh'), H0=document.documentElement.scrollHeight, ks=new Set([kbh0]);
      for(const d of [-60,0,-80,-20,0,-60,0]){ window.__kb(330+d); await new Promise(r=>setTimeout(r,320)); ks.add(getComputedStyle(document.documentElement).getPropertyValue('--kbh')); }
      return {n,ks:[...ks],dh:document.documentElement.scrollHeight-H0}; });
    ok(tb.n===0&&tb.ks.length===1&&tb.dh===0,`아이폰 기초 3단계: 주소창이 줄었다 늘었다 해도(보이는 높이 ±80px) 앱 스크롤 ${tb.n}번, 아래 여백 ${tb.ks.join('/')}, 문서 높이 변화 ${tb.dh}px — 흔들림 고리 없음`);
    await p.evaluate(h=>{ document.activeElement.blur(); window.__kb(h); },664); await p.waitForTimeout(200);
    ok(!errs.length,'페이지 오류 없음 '+errs.join(' | ')); await b.close(); }
  // 휴대폰: "내기"·"확인"을 손가락으로 한 번만 눌러도 제출(입력칸 초점 그대로 → 자판이 내려가지 않음), 두 번 제출되지 않음
  { const kbVV=()=>{ const vv=new EventTarget(); Object.assign(vv,{height:664,width:390,offsetTop:0,offsetLeft:0,scale:1});
      Object.defineProperty(window,'visualViewport',{value:vv}); const set=h=>{ vv.height=h; vv.dispatchEvent(new Event('resize')); };
      addEventListener('focusin',e=>{ if(e.target.tagName==='INPUT') setTimeout(()=>set(330),50); });
      addEventListener('focusout',()=>setTimeout(()=>{ if(!(document.activeElement&&document.activeElement.tagName==='INPUT')) set(664); },30)); };
    const {b,p,errs}=await open({viewport:{width:390,height:664},isMobile:true,hasTouch:true}); await p.addInitScript(kbVV); const H=(f,a)=>p.evaluate(f,a);
    const W=await (async()=>{ await p.goto(url); return H(()=>(VOCAB_E+'|'+VOCAB_M).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w))); })();
    const tapBtn=async sel=>{ const r=await p.$eval(sel,e=>{ const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; }); await p.touchscreen.tap(r.x,r.y); };
    for(const [t,lv] of [['hard',1],['normal',2]]){
      await startLevel(p,url,t,lv); await p.waitForTimeout(500); await p.tap('#inp'); await p.waitForTimeout(400);
      const cw=await H(()=>window.__wordchain.cpu()); await p.keyboard.type(W.find(x=>x[0]===cw.slice(-1)&&x!==cw),{delay:30}); await p.waitForTimeout(200);
      const t0=(await H(()=>window.__wordchain.state())).turns; await tapBtn('#f button[type=submit]'); await p.waitForTimeout(100);
      const r=await H(()=>({id:document.activeElement.id,kb:document.documentElement.classList.contains('kb')})); await p.waitForTimeout(400);
      const t1=(await H(()=>window.__wordchain.state())).turns;
      ok(t1===t0+1&&r.id==='inp'&&r.kb,`휴대폰 ${t} ${lv}단계: "내기" 한 번 → 제출 1번(${t1-t0}), 입력칸 초점·자판 그대로`);
    }
    await startLevel(p,url,'basic',3); await p.waitForTimeout(500);
    const tg=await H(()=>window.__wordchain.target()), bins=await p.$$eval('#bslots .bin',a=>a.map(s=>+s.dataset.i));
    await p.tap('#bslots .bin'); await p.waitForTimeout(300); await p.keyboard.type(bins.map(i=>tg[i]).join(''),{delay:60}); await p.waitForTimeout(200);
    const s0=(await H(()=>window.__wordchain.state())).turns; await tapBtn('#answer form button[type=submit]'); await p.waitForTimeout(500);
    ok((await H(()=>window.__wordchain.state())).turns===s0+1,'휴대폰 기초 3단계: "확인" 한 번 → 제출');
    ok(!errs.length,'페이지 오류 없음 '+errs.join(' | ')); await b.close(); }
  // 휴대폰: 퀴즈 중에는 채팅 말풍선을 숨기고(정답 뒤에도 문제 창 그대로), 단계를 마친 뒤 다시 보기에서만 보임
  { const {b,p,errs}=await open({viewport:{width:390,height:664},isMobile:true,hasTouch:true}); const H=(f,a)=>p.evaluate(f,a);
    await startLevel(p,url,'hard',1); await p.waitForTimeout(400);
    const W=await H(()=>(VOCAB_E+'|'+VOCAB_M).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)));
    const feedShown=()=>H(()=>{ const f=document.getElementById('feed'); return getComputedStyle(f).display!=='none'&&f.getBoundingClientRect().height>0; });
    ok(!(await feedShown()),'휴대폰 퀴즈 중: 채팅 말풍선 숨김');
    const cw=await H(()=>window.__wordchain.cpu()); await p.fill('#inp',W.find(x=>x[0]===cw.slice(-1)&&x!==cw)); await p.press('#inp','Enter'); await p.waitForTimeout(1300);
    ok(!(await feedShown())&&!(await H(()=>document.getElementById('qm').classList.contains('away'))),'정답 뒤에도 말풍선 없이 문제 창 그대로');
    const qt=await H(()=>document.getElementById('qm').getBoundingClientRect().top-document.querySelector('.gscreen .status').getBoundingClientRect().bottom);
    ok(qt<30,`문제 창은 상태 줄 바로 아래(${Math.round(qt)}px)`);
    const goal=await H(()=>document.querySelectorAll('.status .dot').length); await H(g=>window.__wordchain.tweak({streak:g-1}),goal);
    for(let i=0;i<40&&(await H(()=>window.__wordchain.cpu()))===cw;i++) await p.waitForTimeout(100);
    const c2=await H(()=>window.__wordchain.cpu()); await p.fill('#inp',W.find(x=>x[0]===c2.slice(-1)&&x!==c2&&x!==cw)); await p.press('#inp','Enter');
    await p.waitForSelector('#rest',{timeout:5000}); await p.waitForTimeout(100); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
    ok((await H(()=>window.__wordchain.rest().step))===2&&(await feedShown())&&(await p.$$('#fl li:not(.wait)')).length>=1,'단계를 마친 뒤 다시 보기에서는 말풍선이 보임');
    ok(!errs.length,'페이지 오류 없음 '+errs.join(' | ')); await b.close(); }
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
