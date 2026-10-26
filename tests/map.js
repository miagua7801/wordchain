// 첫 화면·규칙 창·단계 맵·게임 화면 틀: 첫 화면은 제목·기초/보통/도전·작은 단어 수첩만, 수준 규칙 창(2쪽·SKIP·Enter·Esc), 단계 맵(이은 길·잠김·도착점),
// 마우스를 올리면 말풍선 설명 + 다른 단계 흐리게, 손가락은 한 번 눌러 설명·두 번째에 시작, 단계 규칙 창(컴퓨터 한마디·하는 방법·목표·시간 조절),
// 게임 화면(☰ 단계 맵 · "기초 1단계" · 소리 아이콘), 채팅(아래에서 밀어 올림) 위 가운데 문제 창, 정답 뒤 문제 창을 감춤. node tests/map.js [주소]
const {target,open}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800},intro:true}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a);
  await p.goto(url); await H(()=>localStorage.clear()); await p.goto(url);

  // 1. 첫 화면
  const tb=await H(()=>[...document.querySelectorAll('#app button')].map(b=>b.id||b.dataset.t));
  ok(tb.join()==='basic,normal,hard,nbBtn,credits'&&(await p.textContent('h1'))==='영어 끝말잇기 챌린지','첫 화면: 제목 + 기초·보통·도전 + 단어 수첩 + 아래 출처·저작권 — '+tb.join());
  const sz=await H(()=>{ const r=e=>document.querySelector(e).getBoundingClientRect(); return {rv:r('#nbBtn').height,t:r('[data-t=basic]').height}; });
  ok(sz.rv<sz.t*0.6,`단어 수첩은 작게(${Math.round(sz.rv)}px < 수준 버튼 ${Math.round(sz.t)}px)`);
  await p.click('#nbBtn'); await p.waitForTimeout(150);
  ok((await p.textContent('h2')).includes('단어 수첩'),'단어 수첩 버튼 → 단어 수첩'); await p.click('#back'); await p.waitForTimeout(150);
  ok(!!(await p.$('.tracksel')),'수첩에서 돌아가기 → 첫 화면');

  // 2. 수준 규칙 창: 2쪽, 줄이 차례로, 다음 ▶, SKIP
  await p.click('[data-t="normal"]'); await p.waitForSelector('.rpg-ov');
  const pg1=await H(()=>({t:document.getElementById('rpgTitle').textContent,dots:document.querySelectorAll('.rpg-dots i').length,skip:document.getElementById('rpgSkip').textContent,map:!!document.getElementById('map'),focus:document.activeElement.id}));
  ok(pg1.t.includes('보통 수준')&&pg1.dots===2&&pg1.skip.includes('SKIP')&&pg1.map&&pg1.focus==='rpgNext','수준 규칙 창 1쪽: "'+pg1.t+'", 2쪽 표시, SKIP 버튼, 뒤에는 단계 맵, "다음"에 초점');
  const op=await H(()=>[...document.querySelectorAll('.rpg-lines li')].map(l=>+getComputedStyle(l).opacity));
  ok(op[0]<1&&op[op.length-1]<0.5,'줄이 하나씩 나옴(롤플레잉 대화창) '+op.map(x=>x.toFixed(1)).join(','));
  await p.keyboard.press('Enter'); await p.waitForTimeout(50);
  ok((await H(()=>document.querySelector('.rpg-lines').classList.contains('all')))&&(await p.textContent('#rpgTitle')).includes('보통'),'줄이 나오는 중에 Enter → 한 번에 모두(쪽은 그대로)');
  await p.keyboard.press('Enter'); await p.waitForTimeout(80);
  const pg2=await p.textContent('.rpg-body');
  const n2=await p.$$eval('.rpg-lines li',a=>a.length);
  ok(pg2.includes('공통 규칙')&&pg2.includes('하트 3개')&&pg2.includes('다 잃으면 처음부터')&&pg2.includes('힌트는 도전마다 3번')&&n2<=3&&(await p.textContent('#rpgNext')).includes('단계 맵 보기'),`2쪽: 공통 규칙(하트·통과·힌트) ${n2}줄로 짧게, 마지막 버튼 "단계 맵 보기"`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  ok(!(await p.$('.rpg-ov'))&&!!(await p.$('#map')),'Esc(또는 SKIP)로 닫힘 → 단계 맵');
  await p.click('#rules'); await p.waitForSelector('.rpg-ov'); await p.click('#rpgSkip'); await p.waitForTimeout(80);
  ok(!(await p.$('.rpg-ov')),'📜 규칙 다시 보기 → SKIP으로 닫힘');

  // 3. 단계 맵: 단계 원 4개 + 도착점, 원을 잇는 길, 1단계만 열림
  const m=await H(()=>({n:document.querySelectorAll('.map .node.lv').length,locked:document.querySelectorAll('.map .node.locked').length,roads:document.querySelectorAll('.map svg .road').length,open:document.querySelectorAll('.map svg .road.open').length,goal:!!document.querySelector('.map .node.goal'),cur:document.querySelector('.map .node.cur')?.dataset.lv}));
  ok(m.n===4&&m.locked===3&&m.roads===4&&m.open===0&&m.goal&&m.cur==='1',`단계 맵: 단계 ${m.n}개(잠김 ${m.locked}), 길 ${m.roads}개, 도착점 🏆, 지금 할 단계 1`);
  const ys=await H(()=>[...document.querySelectorAll('.map .node.lv')].map(e=>e.getBoundingClientRect()).map(r=>[Math.round(r.left),Math.round(r.top)]));
  ok(ys.every((y,i)=>!i||y[1]>ys[i-1][1])&&ys.some((y,i)=>i&&Math.abs(y[0]-ys[i-1][0])>100),'단계가 굽은 길을 따라 이어짐 '+JSON.stringify(ys));

  // 4. 마우스를 올리면 말풍선 + 다른 단계는 흐리게
  await p.hover('[data-lv="2"]'); await p.waitForTimeout(250);
  const tip2=await H(()=>{ const t=document.getElementById('tip'), n=document.querySelector('[data-lv="2"]').getBoundingClientRect(), r=t.getBoundingClientRect(), o=document.querySelector('[data-lv="1"]'), cs=getComputedStyle(o);
    return {txt:t.textContent,above:r.bottom<=n.top,focus:document.getElementById('map').classList.contains('focus'),blur:cs.filter,op:+cs.opacity,me:getComputedStyle(document.querySelector('[data-lv="2"]')).filter}; });
  ok(tip2.txt.includes('2단계 · 직접 쓰기')&&tip2.txt.includes('6번 성공 · ❤️ 3')&&tip2.txt.includes('1단계를 통과하면 열려요')&&tip2.above,'2단계에 마우스: 단계 위에 말풍선(이름·설명·목표, 잠김 안내)');
  ok(tip2.focus&&/blur/.test(tip2.blur)&&tip2.op<0.6&&tip2.me==='none','다른 단계는 흐리게(blur·딤드), 가리킨 단계는 그대로 — '+tip2.blur+' / '+tip2.op);
  await p.hover('[data-lv="1"]'); await p.waitForTimeout(150);
  ok((await p.textContent('#tip')).includes('1단계 · 빈칸 채우기')&&(await p.$$('.tip')).length===1&&!!(await p.$('#tipGo')),'다른 단계로 옮기면 말풍선도 옮김(열린 단계는 "▶ 시작")');
  await p.mouse.move(5,5); await p.waitForTimeout(150);
  ok(!(await p.$('.tip'))&&!(await H(()=>document.getElementById('map').classList.contains('focus'))),'맵 밖으로 나가면 말풍선·흐림 사라짐');
  // 잠긴 단계를 누르면 시작하지 않고 설명만
  await p.click('[data-lv="3"]'); await p.waitForTimeout(150);
  ok(!(await p.$('.rpg-ov'))&&(await p.textContent('#tip')).includes('2단계를 통과하면 열려요'),'잠긴 단계를 누르면 설명만(시작 안 함)');

  // 5. 손가락: 한 번 누르면 설명, 한 번 더 누르면 시작(규칙 창)
  const tap=lv=>H(lv=>{ const e=document.querySelector(`[data-lv="${lv}"]`); e.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',bubbles:true})); e.click(); },lv);
  await p.mouse.move(5,5); await H(()=>document.activeElement.blur()); await p.waitForTimeout(100);
  await tap(1); await p.waitForTimeout(100);
  ok(!!(await p.$('#tip'))&&!(await p.$('.rpg-ov')),'손가락: 첫 번째는 말풍선만');
  await tap(1); await p.waitForTimeout(100);
  ok(!!(await p.$('.rpg-ov')),'손가락: 두 번째에 단계 규칙 창');

  // 6. 단계 규칙 창: 1쪽 컴퓨터 한마디(REST_LINES)·이름·설명, 2쪽 하는 방법·목표·힌트
  const lines=await H(()=>window.__wordchain.restLines('normal-1'));
  const s1=await p.textContent('.rpg-body');
  ok((await p.textContent('#rpgTitle'))==='1단계 · 빈칸 채우기'&&lines.some(l=>s1.includes(l)),'단계 규칙 1쪽: "1단계 · 빈칸 채우기" + 컴퓨터 한마디');
  await p.click('#rpgNext'); await p.click('#rpgNext'); await p.waitForTimeout(80);
  const s2=await p.textContent('.rpg-body');
  ok(s2.includes('이번 단계')&&s2.includes('5번')&&s2.includes('첫 칸')&&!/힌트|하트/.test(s2)&&(await p.textContent('#rpgNext')).includes('시작하기'),'단계 규칙 2쪽: 이 단계만의 것(목표 5번·첫 칸 팁), 공통 규칙(힌트·하트)은 되풀이하지 않음, "시작하기"');
  await p.click('#rpgSkip'); await p.waitForTimeout(700);

  // 7. 게임 화면: ☰ · "보통 1단계" · 소리 아이콘, 채팅 위 가운데 문제 창
  const gh=await H(()=>({back:document.querySelector('.ghead #back').textContent,title:document.querySelector('.ghead h2').textContent,snd:document.querySelector('.ghead #snd').textContent,lab:document.querySelector('#snd').getAttribute('aria-label')}));
  ok(gh.back==='☰'&&gh.title==='보통 1단계'&&gh.snd==='🔊'&&gh.lab.includes('켜짐'),`제목줄: 왼쪽 목록 ☰, "${gh.title}", 오른쪽 소리 아이콘 ${gh.snd}`);
  await p.click('#snd'); ok((await p.textContent('#snd'))==='🔇'&&(await p.getAttribute('#snd','aria-label')).includes('꺼짐'),'소리 끔 → 🔇'); await p.click('#snd');
  const lay=await H(()=>{ const q=document.getElementById('qm').getBoundingClientRect(), g=document.getElementById('gbody').getBoundingClientRect(), f=document.getElementById('feed');
    return {dx:Math.round(q.left+q.width/2-(g.left+g.width/2)),dy:Math.round(q.top+q.height/2-(g.top+g.height/2)),inQ:!!document.querySelector('#qm .cpu')&&!!document.querySelector('#qm #answer')&&!!document.querySelector('#qm #hintBtn'),behind:getComputedStyle(f).position==='absolute'&&+getComputedStyle(f).opacity<1,n:document.querySelectorAll('#fl li').length}; });
  ok(Math.abs(lay.dx)<=2&&Math.abs(lay.dy)<=2&&lay.inQ,`문제(컴퓨터 단어)·답·힌트는 화면 가운데 문제 창 안(${lay.dx},${lay.dy})`);
  ok(lay.behind&&lay.n===1&&(await H(()=>window.__wordchain.feed()))[0].startsWith('cpu:'),'뒤에는 채팅(흐리게), 컴퓨터 첫 단어 말풍선');
  // 자동 완성·자판 추천 끄기: autocomplete="off"·autocorrect·autocapitalize·spellcheck 끔 + 그릴 때마다 새 name(예전 입력 기록과 맞지 않게), PC에서 채팅 폭은 문제 창 폭(540px) 이하
  const ac=await H(()=>{ const b=[...document.querySelectorAll('#bslots .bin')]; return {a:b.map(x=>x.getAttribute('autocomplete')),n:b.map(x=>x.name),aria:b.map(x=>x.getAttribute('aria-autocomplete')),fw:document.getElementById('fl').getBoundingClientRect().width}; });
  ok(ac.a.every(x=>x==='off')&&new Set(ac.n).size===ac.n.length&&ac.n.every(Boolean)&&ac.aria.every(x=>x==='none'),'빈칸 칸: 자동 완성 끔(알 수 없는 autocomplete 값·칸마다 다른 name) '+ac.a[0]);
  ok(ac.fw<=541,`PC: 채팅(단어 체인) 폭 ${Math.round(ac.fw)}px — 좌우 말풍선이 너무 멀지 않게`);
  // 정답 → 잠깐 뒤 문제 창을 감추고 내 말풍선이 채팅에 → 다음 컴퓨터 단어와 함께 문제 창이 다시
  const tg=await H(()=>window.__wordchain.target()), bins=await p.$$eval('#bslots .bin',a=>a.map(s=>+s.dataset.i));
  await p.focus('#bslots .bin'); await p.keyboard.type(bins.map(i=>tg[i]).join(''),{delay:40}); await p.keyboard.press('Enter');
  await p.waitForTimeout(1250);
  const aw=await H(()=>({away:document.getElementById('qm').classList.contains('away'),free:document.getElementById('gbody').classList.contains('free'),feed:[...document.querySelectorAll('#fl li')].map(l=>l.className.split(' ')[0]+':'+l.textContent.replace('🤖',''))}));
  ok(aw.away&&aw.free&&aw.feed.length===2&&aw.feed[1]==='fm:'+tg,'정답 뒤: 문제 창을 감추고 채팅에 내 말풍선(오른쪽) '+aw.feed.join(' '));
  await p.waitForFunction(()=>!document.getElementById('qm').classList.contains('away'),null,{timeout:4000});
  const f3=await H(()=>window.__wordchain.feed());
  ok(f3.length===3&&f3[2]==='cpu:'+(await H(()=>window.__wordchain.cpu())),'다음 컴퓨터 단어가 채팅 아래에 나오고 문제 창이 다시 뜸');
  const st=await p.textContent('.status'); ok(st.includes('성공 1 / 5'),'상태 줄: 성공 1 / 5');
  await p.click('#back'); await p.waitForTimeout(200);
  ok(!!(await p.$('#map')),'☰ → 단계 맵');

  // 8. 시간 제한 단계: 단계 규칙 창에서 시간 조절
  await H(()=>{ const s=JSON.parse(localStorage.getItem('wordchain-v2')); s.prog.normal.unlocked=4; localStorage.setItem('wordchain-v2',JSON.stringify(s)); }); await p.goto(url);
  await p.click('[data-t="normal"]'); await p.click('#rpgSkip'); await p.click('[data-lv="4"]'); await p.waitForSelector('.rpg-ov');
  await p.click('#rpgNext'); await p.click('#rpgNext'); await p.waitForTimeout(80);
  ok(!!(await p.$('.rpg-body .timectl')),'스피드 챌린지 규칙 2쪽에 제한 시간 조절');
  await p.click('.rpg-body .timectl [data-d="5"]'); await p.waitForTimeout(50);
  ok((await p.textContent('.rpg-body .tval'))==='35초','+5초 → 35초'); await p.click('#rpgNext'); if(await p.$('.rpg-ov')) await p.click('#rpgNext'); await p.waitForTimeout(300);
  ok((await p.textContent('.ghead h2'))==='보통 4단계'&&(await p.textContent('#qm .tval'))==='35초','"시작하기" → 4단계, 조절한 시간 그대로');
  const nm1=await p.getAttribute('#inp','name'), ac1=await p.getAttribute('#inp','autocomplete'); await p.click('#hintBtn'); const nm2=await p.getAttribute('#inp','name');
  ok(ac1==='off'&&(await p.getAttribute('#inp','autocorrect'))==='off'&&(await p.getAttribute('#inp','spellcheck'))==='false'&&(await p.getAttribute('#inp','autocapitalize'))==='off'&&nm1&&nm2&&nm1!==nm2&&(await p.getAttribute('#inp','aria-autocomplete'))==='none','입력칸: 자동 완성 끔(autocomplete 값 '+ac1+', 다시 그릴 때마다 name이 바뀜)');

  // 9. 휴대폰 너비: 문제 창이 화면 안에
  await p.setViewportSize({width:375,height:812}); await p.waitForTimeout(200);
  const mw=await H(()=>{ const r=document.getElementById('qm').getBoundingClientRect(); return [Math.round(r.left),Math.round(r.right),document.documentElement.scrollWidth]; });
  ok(mw[0]>=8&&mw[1]<=367&&mw[2]<=375,'휴대폰 너비: 문제 창이 화면 안(가로 넘침 없음) '+mw);
  // 10. 선생님 모드: 학생 화면에는 '모든 단계 열기'가 없고, 버전 글자를 5번 누르면 보임(이 기기에 저장), 끄기
  { const s=await open({viewport:{width:1280,height:800},student:true}); const q=s.p;
    await q.goto(url); await q.evaluate(()=>localStorage.clear()); await q.goto(url); await q.click('[data-t="basic"]'); await q.waitForTimeout(100);
    ok(!(await q.$('#teacher'))&&!!(await q.$('#reset')),'학생 화면: "선생님: 모든 단계 열기" 버튼 없음(기록 지우기는 그대로)');
    for(let i=0;i<4;i++) await q.click('#ver'); ok(!(await q.$('#teacher')),'  버전 글자 4번으로는 안 보임');
    await q.click('#ver'); await q.waitForTimeout(100);
    ok(!!(await q.$('#teacher'))&&(await q.evaluate(()=>localStorage.getItem('wordchain-teacher')))==='1','버전 글자를 3초 안에 5번 누르면 선생님 버튼이 보임(이 기기에 저장)');
    await q.click('#teacher'); await q.click('#teacher'); await q.waitForTimeout(100);
    ok((await q.$$('.map .node.locked')).length===0,'  선생님: 모든 단계 열기');
    await q.click('#teacherOff'); await q.waitForTimeout(100); ok(!(await q.$('#teacher')),'"선생님 모드 끄기" → 다시 숨김');
    await q.goto(url+'?teacher=1'); await q.click('[data-t="basic"]'); ok(!!(await q.$('#teacher')),'주소 ?teacher=1 로도 켜짐');
    await q.goto(url+'?teacher=0'); await q.click('[data-t="basic"]'); ok(!(await q.$('#teacher')),'?teacher=0 으로 끔');
    if(s.errs.length) console.log('errors',s.errs); await s.b.close(); }
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
