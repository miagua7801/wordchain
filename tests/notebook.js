// 나의 단어 수첩: 오늘의 복습 버튼, 복습(도장·간격·외운 단어), 수첩 화면·비우기, 단어 모으기. node tests/notebook.js [주소]
const {target,open,startLevel,cpuWord}=require('./lib');
const day=n=>{ const d=new Date(); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open(); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const NB=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('wordchain-notebook-v1')||'{}'));
  // 복습할 단어 2개(tiger, apple), 아직 아닌 단어 1개(car)
  await p.goto(url);
  await p.evaluate(nb=>{ localStorage.clear(); localStorage.setItem('wordchain-notebook-v1',JSON.stringify(nb)); localStorage.setItem('wordchain-v2',JSON.stringify({track:'basic',prog:{},time:{}})); },
    {items:{tiger:{w:'tiger',reason:'wrong',stamps:0,due:day(-1)},apple:{w:'apple',reason:'hint',stamps:2,due:day(0)},car:{w:'car',reason:'textbook',stamps:1,due:day(3)}},learned:{},tbSeen:[]});
  await p.goto(url);
  const btn=await p.$('#rv'); ok(btn&&(await btn.textContent()).includes('복습하기')&&(await p.textContent('#rv .cnt'))==='2','첫 화면에 작은 "복습하기" 버튼 + 오늘 2개 표시');
  await btn.click(); await p.waitForTimeout(300);
  ok(!!(await p.$('.review .pat')),'기초 수준: 빈칸 채우기 형태로 보여 줌');
  for(let i=0;i<2;i++){
    const w=await p.evaluate(()=>window.__wordchain.review());
    await p.fill('#inp',w==='apple'?'apple':'tigre'); await p.press('#inp','Enter'); await p.waitForTimeout(200);
    console.log('   ',w,'→',(await p.textContent('#msg')).slice(0,40));
    await p.click('#next'); await p.waitForTimeout(200);
  }
  ok((await p.textContent('#app')).includes('2개 중 1개'),'복습 끝 화면: 2개 중 1개');
  const nb=await NB();
  ok(nb.learned.apple&&!nb.items.apple,'apple: 도장 3개 → 외운 단어로 옮김');
  ok(nb.items.tiger.stamps===0&&nb.items.tiger.due===day(1),'tiger: 틀려서 도장 0, 다음 날 다시 ('+nb.items.tiger.due+')');
  ok(nb.items.car.stamps===1&&nb.items.car.due===day(3),'car: 복습 날이 아니라 그대로');
  await p.click('#done'); await p.waitForTimeout(200);
  await p.click('[data-t="basic"]'); await p.click('#nbBtn'); await p.waitForTimeout(200);
  const t=await p.textContent('#app');
  ok(t.includes('모은 단어 2개')&&t.includes('외운 단어 1개')&&t.includes('tiger')&&t.includes('호랑이'),'수첩 화면: 모은 단어 2개, 외운 단어 1개, 뜻 표시');
  await p.click('#nbclear'); await p.click('#nbclear'); await p.waitForTimeout(200);
  const nb2=await NB(); ok(!Object.keys(nb2.items).length&&!Object.keys(nb2.learned).length,'수첩 비우기(두 번 눌러 확인)');
  // 틀리면 정답 예시가 모임
  await startLevel(p,url,'normal',2); await p.waitForTimeout(300);
  const ch=(await cpuWord(p)).slice(-1); const bad=ch==='z'?'apple':'zebra';
  await p.fill('#inp',bad); await p.press('#inp','Enter'); await p.waitForTimeout(800);
  const nb3=await NB(); const got=Object.values(nb3.items);
  ok(got.length===1&&got[0].reason==='wrong'&&got[0].w[0]===ch,'틀린 뒤 정답 예시를 수첩에 모음: '+(got[0]&&got[0].w));
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
