// 나의 단어 수첩: 날짜·횟수 제한 없이 맞힐 때마다 도장(3번 맞히면 외운 단어), 목록에서 단어를 눌러 학습, 두 번 틀리면 정답 → 연습하기(보고 따라 쓰기) → 다시 도전,
// 첫 화면 단어 수첩(모두 학습하기), 단계 맵에 복습하기 없음, 수첩 화면·비우기, 단어 모으기. node tests/notebook.js [주소]
const {target,open,startLevel,cpuWord}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open(); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a), NB=()=>H(()=>JSON.parse(localStorage.getItem('wordchain-notebook-v1')||'{}'));
  // 수첩 목록에서 체크박스로 단어를 고르고 "선택한 단어 학습하기"
  const studyPick=async ws=>{ for(const w of ws) await p.check(`.nbck[value="${w}"]`); await p.click('#studySel'); await p.waitForTimeout(250); };
  const answer=async v=>{ await p.fill('#inp',v); await p.press('#inp','Enter'); await p.waitForTimeout(150); };
  // 예전 저장본처럼 복습 날짜(due)가 미래인 단어도 섞음 → 날짜와 관계없이 학습
  await p.goto(url);
  await H(nb=>{ localStorage.clear(); localStorage.setItem('wordchain-notebook-v1',JSON.stringify(nb)); localStorage.setItem('wordchain-v2',JSON.stringify({track:'normal',prog:{},time:{},basicVer:2})); },
    {items:{tiger:{w:'tiger',reason:'wrong',stamps:0,due:'2999-01-01'},apple:{w:'apple',reason:'hint',stamps:2},car:{w:'car',reason:'wrong',stamps:1},ball:{w:'ball',reason:'textbook',stamps:0}},learned:{},tbSeen:['ball']});
  await p.goto(url);

  // 0. 예전에 모인 '처음 맞힌 기본 어휘'(ball)는 지우지 않고 숨김: 복습 수·학습·수첩 화면에 안 나옴
  ok((await NB()).items.ball&&(await NB()).items.ball.reason==='textbook','예전 "처음 맞힌 기본 어휘" 단어는 저장본에 그대로 남음');
  // 1. 첫 화면 단어 수첩: 수첩 단어 수, 누르면 단어 수첩 → "모두 학습하기"로 모든 단어 학습(날짜 제한 없음)
  ok((await p.textContent('#nbBtn .cnt'))==='3'&&!(await p.$('#rv')),'첫 화면 "단어 수첩"에 수첩 단어 3개(날짜와 관계없이), 복습하기 버튼 없음');
  await p.click('#nbBtn'); await p.waitForTimeout(200);
  ok((await p.textContent('h2')).includes('단어 수첩')&&(await p.textContent('#study')).includes('3개'),'첫 화면 단어 수첩 → 수첩 화면(모두 학습하기 3개)');
  await p.click('#study'); await p.waitForTimeout(300);
  const seen=[];
  for(let i=0;i<3;i++){ const w=await H(()=>window.__wordchain.review()); seen.push(w); await answer(w); await p.click('#next'); await p.waitForTimeout(150); }
  ok(seen.sort().join()==='apple,car,tiger'&&(await p.textContent('#app')).includes('3개 중 3개')&&(await p.textContent('#app')).includes('도장 3개'),'모든 단어(복습 날짜가 미래인 tiger도) 학습, 끝 화면 "3개 중 3개 · 도장 3개"');
  let nb=await NB();
  ok(nb.learned.apple&&!nb.items.apple&&nb.items.tiger.stamps===1&&nb.items.car.stamps===2,'맞힐 때마다 도장 +1: apple 도장 3개 → 외운 단어, tiger 0→1, car 1→2');
  await p.click('#done'); await p.waitForTimeout(200);
  ok((await p.textContent('h2')).includes('단어 수첩'),'학습 끝 → 단어 수첩으로'); await p.click('#back'); await p.waitForTimeout(150);

  // 2. 수첩 목록에서 체크박스로 고른 단어만 학습. 바로 다시 해도 도장(제한 없음) → 3번이면 외운 단어
  await p.click('[data-t="normal"]'); await p.waitForTimeout(150);
  ok(!(await p.$('#rv'))&&!(await p.textContent('.maptools')).includes('복습하기'),'단계 맵: 복습하기 버튼 없음(단어 수첩·배지만)');
  await p.click('#nbBtn'); await p.waitForTimeout(200);
  const t=await p.textContent('#app');
  ok(!t.includes('처음 맞힌 기본 어휘')&&!/\bball\b/.test(t),'수첩 화면: 숨긴 기본 어휘(ball) 안 보임');
  ok(t.includes('모은 단어 2개')&&t.includes('외운 단어 1개')&&t.includes('호랑이')&&!t.includes('다음 복습')&&t.includes('언제든'),'수첩 화면: 모은 단어 2개·외운 단어 1개·뜻, 복습 날짜 표시 없음, "언제든" 안내');
  const sel0=await H(()=>({dis:document.getElementById('studySel').disabled,n:document.getElementById('selN').textContent,cks:document.querySelectorAll('.nblist .nbck').length}));
  ok(sel0.dis&&sel0.n==='0'&&sel0.cks===2,'단어마다 체크박스, 아무것도 고르지 않으면 "선택한 단어 학습하기" 비활성');
  await p.click('#selAll'); const sel1=await H(()=>({n:document.getElementById('selN').textContent,dis:document.getElementById('studySel').disabled,t:document.getElementById('selAll').textContent}));
  await p.click('#selAll'); const sel2=await H(()=>document.getElementById('selN').textContent);
  ok(sel1.n==='2'&&!sel1.dis&&sel1.t==='선택 해제'&&sel2==='0','전체 선택 → 2개(버튼 켜짐, "선택 해제"), 다시 누르면 0개');
  await p.click('.nbrow:has(.nbck[value="tiger"]) .nbko'); ok((await H(()=>document.querySelector('.nbck[value="tiger"]').checked))&&(await p.textContent('#selN'))==='1','줄(뜻)을 눌러도 체크됨 → 1개');
  await p.click('.nbrow:has(.nbck[value="tiger"]) .nbko');
  for(let k=0;k<2;k++){
    await studyPick(['tiger']);
    ok((await H(()=>window.__wordchain.review()))==='tiger'&&!(await p.textContent('.topbar h2')).includes('/'),`  tiger만 골라 학습하기 → tiger 하나만 학습(${k+1}번째)`);
    await answer('tiger'); await p.click('#next'); await p.waitForTimeout(150); await p.click('#done'); await p.waitForTimeout(200);
  }
  nb=await NB(); ok(nb.learned.tiger&&!nb.items.tiger,'같은 날 연달아 맞혀도 도장 → tiger 도장 3개, 외운 단어(횟수 제한 없음)');
  ok(!!(await p.$('.nblearned [data-w="tiger"]'))&&(await p.textContent('.topbar h2')).includes('단어 수첩'),'학습이 끝나면 단어 수첩으로 돌아옴, 외운 단어에 tiger');

  // 3. 두 번 틀리면 정답 → ✏️ 연습하기(철자를 보고 따라 쓰기) → 🔁 다시 도전(맞히면 도장)
  await studyPick(['car']);
  await answer('cat');
  ok((await p.textContent('#msg')).includes('한 번 더')&&!(await p.$('#prac'))&&(await H(()=>window.__wordchain.studyPhase())).tries===1,'첫 번째 틀림: "한 번 더 써 보세요"');
  await answer('kar');
  ok((await p.textContent('#msg')).includes('정답은 car')&&!!(await p.$('#prac'))&&(await NB()).items.car.stamps===2,'두 번 틀림: 정답 car + "✏️ 연습하기" 버튼, 도장은 그대로(2)');
  await p.click('#prac'); await p.waitForTimeout(250);
  ok((await p.textContent('#pracWord'))==='car'&&(await H(()=>window.__wordchain.studyPhase())).phase==='practice','연습하기: 철자(car)를 보여 주고 따라 쓰기');
  await answer('cra'); ok((await p.textContent('#msg')).includes('철자를 다시 봐요')&&!(await p.$('#retry')),'  따라 쓰기가 틀리면 다시');
  await answer('car'); ok(!!(await p.$('#retry')),'  맞게 따라 쓰면 "🔁 다시 도전"');
  await p.click('#retry'); await p.waitForTimeout(250);
  const ph=await H(()=>window.__wordchain.studyPhase());
  ok(ph.retried&&ph.phase==='test'&&!(await p.$('#pracWord'))&&(await p.textContent('.cpu .who')).includes('다시 도전'),'다시 도전: 철자를 감추고 다시 시험');
  await answer('car');
  nb=await NB(); ok(nb.learned.car&&(await p.textContent('#msg')).includes('외운 단어'),'다시 도전에서 맞히면 도장 → car 도장 3개, 외운 단어');
  await p.click('#next'); await p.click('#done'); await p.waitForTimeout(200);
  // 다시 도전에서도 두 번 틀리면 정답만 보여 주고 다음으로(연습하기는 한 번)
  await H(()=>{ const s=JSON.parse(localStorage.getItem('wordchain-notebook-v1')); s.items.house={w:'house',reason:'hint',stamps:0}; localStorage.setItem('wordchain-notebook-v1',JSON.stringify(s)); }); await p.goto(url);
  await p.click('[data-t="normal"]'); await p.click('#nbBtn'); await studyPick(['house']);
  await answer('hose'); await answer('hause'); await p.click('#prac'); await p.waitForTimeout(150); await answer('house'); await p.click('#retry'); await p.waitForTimeout(150);
  await answer('hose'); await answer('hause');
  ok((await p.textContent('#msg')).includes('정답은 house')&&!(await p.$('#prac'))&&!!(await p.$('#next'))&&(await NB()).items.house.stamps===0,'다시 도전에서도 두 번 틀리면 정답과 "다음"만(도장 그대로)');
  await p.click('#next'); await p.click('#done'); await p.waitForTimeout(200);

  // 4. 외운 단어를 누르면 도장 없이 연습
  await p.click('.nblearned [data-w="apple"]'); await p.waitForTimeout(250);
  ok((await p.textContent('.cpu .who')).includes('외운 단어'),'외운 단어를 누르면 도장 없이 연습'); await answer('apple');
  ok((await NB()).learned.apple&&(await p.textContent('#msg')).includes('맞았어요')&&!(await p.textContent('#msg')).includes('도장'),'  맞혀도 외운 단어 그대로(도장 없음)');
  await p.click('#next'); await p.click('#done'); await p.waitForTimeout(200);

  // 5. 수첩 비우기, 단어 모으기
  await p.click('#nbclear'); await p.click('#nbclear'); await p.waitForTimeout(200);
  nb=await NB(); ok(!Object.keys(nb.items).length&&!Object.keys(nb.learned).length,'수첩 비우기(두 번 눌러 확인)');
  await p.click('#back'); await p.waitForTimeout(150); await p.click('#chg'); await p.waitForTimeout(150);
  ok(!(await p.$('#nbBtn .cnt')),'수첩이 비면 첫 화면 단어 수첩에 숫자 없음'); await p.click('#nbBtn'); await p.waitForTimeout(150);
  ok((await p.textContent('h2')).includes('단어 수첩')&&!(await p.$('#study')),'빈 수첩: 모두 학습하기 없음');
  await startLevel(p,url,'normal',2); await p.waitForTimeout(300);
  const ch=(await cpuWord(p)).slice(-1); const bad=ch==='z'?'apple':'zebra';
  await p.fill('#inp',bad); await p.press('#inp','Enter'); await p.waitForTimeout(800);
  const got=Object.values((await NB()).items);
  ok(got.length===1&&got[0].reason==='wrong'&&got[0].w[0]===ch&&got[0].stamps===0&&!('due' in got[0]),'틀린 뒤 정답 예시를 수첩에 모음(복습 날짜 없음): '+(got[0]&&got[0].w));
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
