// 기초 4단계: 철자 고르기·글자 블록·빈칸 채우기·직접 쓰기, 틀린 보기 규칙, 자동 조절, 건너뛰기 도전, 진도 초기화. node tests/basic.js [주소]
const {target,open,startLevel}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:720}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const T=()=>p.evaluate(()=>window.__wordchain.target()), H=f=>p.evaluate(f);
  const waitNext=async prev=>{ for(let i=0;i<40;i++){ await p.waitForTimeout(150); if(await p.$('.overlay')||await p.$('#rest')) return; const t=await T(); if(t&&t!==prev) return; } };

  // 진도 초기화: 예전 기초 진도만 지우고 다른 수준은 유지
  await p.goto(url);
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('wordchain-v2',JSON.stringify({track:'basic',prog:{basic:{unlocked:3,best:{},cleared:{1:true,2:true}},normal:{unlocked:2,best:{1:5},cleared:{1:true}}},time:{}})); });
  await p.goto(url);
  const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('wordchain-v2')));
  ok(!st.prog.basic&&st.prog.normal.cleared[1]&&st.basicVer===2,'예전 기초 진도만 초기화, 보통 진도 유지');
  await p.click('[data-t="basic"]');
  ok((await p.$$('.levels .lv')).length===4,'기초 4단계로 구성');

  // 틀린 보기 규칙
  const ms=await p.evaluate(()=>['tiger','apple','cake','bird','happy'].map(w=>[w,window.__wordchain.misspellings(w,3)]));
  const real=await p.evaluate(ms=>ms.flatMap(([w,l])=>l).filter(x=>window.__wordchain.judge(x)!=='wrong'),ms);
  ok(ms.every(([w,l])=>l.length===3&&new Set(l).size===3&&l.every(x=>x[0]===w[0]&&x!==w))&&!real.length,'틀린 보기: 첫 글자 같음·서로 다름·실제 단어 아님 — '+ms.map(([w,l])=>w+'→'+l.join('/')).join(', '));

  // 1단계 철자 고르기: 처음 3개 보기, 3연속 정답 뒤 4개(자동 조절), 힌트 없이 통과 → '3단계로 바로 가기'
  await p.click('[data-lv="1"]'); await p.waitForTimeout(300);
  ok((await p.$$('.spell .choice')).length===3&&!!(await p.$('.target .tko')),'1단계: 다음 단어 카드(뜻) + 보기 3개');
  for(let i=0;i<4;i++){
    if(i===0) ok(!(await p.$('svg.link'))&&!!(await p.$('.spell .choice .f')),'1단계: 연결선 없음(끝 글자 건네주기로 대신), 보기 첫 글자 강조');
  const t=await T(); const n=(await p.$$('.spell .choice')).length; if(i===3) ok(n===4,`3연속 정답 뒤 보기 ${n}개(난이도 ▲)`);
    await p.click(`.spell .choice[data-v="${t}"]`); await waitNext(t);
  }
  const skip=await p.$('#skip3'); ok(!!skip,'처음에 힌트·실수 없이 통과 → "3단계로 바로 가기" 버튼');
  await skip.click(); await p.waitForTimeout(400);
  const st2=await p.evaluate(()=>JSON.parse(localStorage.getItem('wordchain-v2')).prog.basic);
  ok(st2.cleared[1]&&st2.cleared[2]&&(await p.textContent('.topbar h2')).includes('3단계'),'건너뛰기: 1·2단계 통과 처리 후 3단계 시작');

  // 3단계 빈칸 채우기: 첫 글자 + 1칸이 빈칸, 첫 글자를 틀리면 안내, 맞으면 반짝임
  const t3=await T(); const bins=await p.$$eval('#bslots .bin',a=>a.map(s=>+s.dataset.i));
  ok(bins.length===2&&bins[0]===0&&!!(await p.$('#bslots .bin.first'))&&!(await p.$('svg.link')),'3단계: 처음 빈칸 2칸(첫 글자 + 1칸), 연결선 없음');
  const cl=await H(()=>{ document.activeElement.blur(); const a=getComputedStyle(document.querySelector('.cpu .big .last')).backgroundColor, b=getComputedStyle(document.querySelector('#bslots .bin.first')).borderTopColor; document.querySelector('#bslots .bin.first').focus(); return [a,b]; });
  ok(cl[0]===cl[1],'컴퓨터 끝 글자와 첫 빈칸이 같은 색 '+cl[0]);
  const wrongCh='abcdefghijklmnopqrstuvwxyz'.split('').find(c=>c!==t3[0]);
  await p.keyboard.type(wrongCh); await p.waitForTimeout(100);
  ok((await p.textContent('#msg'))==='컴퓨터 단어의 끝 글자를 다시 봐요.'&&(await H(()=>document.activeElement.dataset.i))==='0','첫 글자를 틀리면 "컴퓨터 단어의 끝 글자를 다시 봐요." + 첫 칸에 그대로');
  await p.keyboard.type(t3[0]); await p.waitForTimeout(100);
  ok(!!(await p.$('.cpu .big .last.land'))&&!!(await p.$('#bslots .bin.first.ok'))&&(await H(()=>document.activeElement.dataset.i))===String(bins[1]),'첫 글자를 맞게 채우면 끝 글자와 첫 칸이 반짝이고 다음 빈칸으로');
  await p.keyboard.type(bins.slice(1).map(i=>t3[i]).join('')); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  ok((await p.textContent('#msg')).startsWith('좋아요'),`빈칸 칸에 ${bins.map(i=>t3[i]).join('')}을 써서 ${t3} 완성`);
  // 긴 단어도 글자 칸이 한 줄(휴대폰 너비)
  await p.setViewportSize({width:360,height:640}); await p.evaluate(()=>window.__wordchain.forceTarget('umbrella')); await p.waitForTimeout(200);
  const tops=await p.$$eval('#bslots .slot',a=>[...new Set(a.map(s=>Math.round(s.getBoundingClientRect().top)))]);
  ok(tops.length===1,'휴대폰에서 umbrella(8글자) 글자 칸이 한 줄');
  await p.setViewportSize({width:1280,height:720});

  // 2단계 글자 블록: 키보드로 조립, 되돌리기, 틀리면 오답
  await startLevel(p,url,'basic',2); await p.waitForTimeout(300);
  let t2=await T();
  ok(!(await p.$('svg.link'))&&!!(await p.$('#answer .slot.given')),'2단계: 연결선 없음, 첫 글자 칸');
  await p.keyboard.type(t2[1]); await p.keyboard.press('Backspace');
  ok((await p.$$eval('.slot.on',a=>a.length))===0,'2단계: Backspace로 되돌리기');
  await p.keyboard.type(t2.slice(1)); await p.waitForTimeout(200);
  ok((await p.textContent('#msg')).startsWith('좋아요'),`2단계: 키보드로 블록 조립해 ${t2} 완성`);
  await waitNext(t2); t2=await T();
  const blks=await p.$$eval('.blk',a=>a.map(x=>x.textContent)); const wrongOrder=t2.slice(1).split('').reverse().join('');
  if(wrongOrder!==t2.slice(1)){ for(const c of wrongOrder) await p.click(`.blk:not([disabled]):text-is("${c}")`); await p.waitForTimeout(700);
    ok(!!(await p.$('.overlay')),'2단계: 순서가 틀리면 오답'); }

  // 4단계 직접 쓰기는 예전과 같음
  await startLevel(p,url,'basic',4); await p.waitForTimeout(300);
  ok(!!(await p.$('#inp'))&&!(await p.$('.target')),'4단계: 직접 쓰기(다음 단어 카드 없음)');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
