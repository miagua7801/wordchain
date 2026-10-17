// 콤보·점수·배지: 점수 규칙, 콤보 표시·유지·초기화, 축하 효과, 최고 점수 저장, 배지 저장·알림·화면, 단계 통과 화면. node tests/score.js [주소]
const {target,open,startLevel}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a);
  await p.goto(url); await H(()=>localStorage.clear()); await p.goto(url);

  // 점수 규칙: 기본 10, 5글자 이상 (n−4)×2, 기본 어휘 보너스(level 2 +5 · level 1 +3), 단어장 밖 +3, 콤보 배율, 듣고 쓰기 ×1.5, 힌트는 보너스만 없앰
  const r=await H(()=>{ const P=window.__wordchain.points, core=window.__wordchain.core;
    return {catCore:core('cat'), tigerCore:core('tiger'), cat:P('cat',1,false,false), tiger:P('tiger',1,false,false), tigerC3:P('tiger',3,false,false), tigerC5:P('tiger',5,false,false), tigerC10:P('tiger',10,false,false),
      tigerL:P('tiger',1,true,false), tigerH:P('tiger',1,false,true), tigers:P('tigers',1,false,false), dino:P('dinosaur',1,false,false), dinoCore:core('dinosaur'), access:P('access',1,false,false), accessCore:core('access'), actor:P('actor',1,false,false), actorCore:core('actor')}; });
  // cat·tiger는 기본 어휘 level 1(+3)
  ok(r.catCore===1&&r.cat===13,'cat(3글자, 기본 어휘 level 1) = 10 + 3 = 13'); ok(r.tigerCore===1&&r.tiger===15,'tiger(5글자, level 1) = 10 + 2 + 3 = 15');
  ok(r.tigerC3===18&&r.tigerC5===22&&r.tigerC10===30,`콤보 배율(×1.2·×1.5·×2, 소수점 버림): 3콤보 ${r.tigerC3}, 5콤보 ${r.tigerC5}, 10콤보 ${r.tigerC10}`);
  ok(r.tigerL===22,'듣고 쓰기 ×1.5 = 22'); ok(r.tigerH===10,'힌트 쓴 턴: 길이·기본 어휘 보너스 없이 10');
  ok(r.tigers===17,'단어장 밖 tigers(6글자) = 10 + 4 + 3 = 17');
  ok(r.dino===10+8+(r.dinoCore===2?5:r.dinoCore===1?3:0),`dinosaur(기본 어휘 level ${r.dinoCore||'없음'}) = ${r.dino}`);
  ok(r.accessCore===2&&r.access===10+4+5,`기본 어휘 보너스 level 2: access = 10 + 4 + 5 = ${r.access}`);
  ok(r.actorCore===0&&r.actor===12,`기본 어휘가 아니면 보너스 없음: actor = ${r.actor}`);

  // 플레이: 콤보 표시, 다시 쓰기는 콤보 유지, 5콤보 축하, 틀리면 0
  await startLevel(p,url,'normal',2); await p.waitForTimeout(300);
  const W=await H(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{3,}$/.test(w)&&!/(er|est)$/.test(w)));
  const answer=async()=>{ const cw=await H(()=>window.__wordchain.cpu()); const used=await p.$$eval('.chain .tile',a=>a.map(e=>e.textContent));
    const w=W.find(x=>x[0]===cw.slice(-1)&&!used.includes(x)&&x!==cw); await p.fill('#inp',w); await p.press('#inp','Enter'); await p.waitForTimeout(250); return w; };
  let burst=false; p.on('console',()=>{});
  for(let i=1;i<=5;i++){ await answer();
    if(i===1){ ok((await p.textContent('#msg')).includes('점)'),'정답 메시지에 얻은 점수'); ok(!!(await p.$('.badge-note')),'첫 정답: 화면 아래 배지 알림'); }
    if(i===3){ ok((await p.textContent('#combo')).includes('3콤보'),'3번째 연속 정답: 🔥 3콤보 표시');
      const cw=await H(()=>window.__wordchain.cpu()); await p.waitForTimeout(2400);
      const cw2=await H(()=>window.__wordchain.cpu()); await p.fill('#inp',cw2.slice(-1)+'qzxqz'); await p.press('#inp','Enter'); await p.waitForTimeout(200);
      ok((await H(()=>window.__wordchain.state())).combo===3,'단어 목록에 없어 다시 쓰기: 콤보 유지'); continue; }
    if(i===5) burst=!!(await p.$('.burst'));
    await p.waitForTimeout(2400);
  }
  ok(burst,'5콤보 축하 효과');
  const st=await H(()=>window.__wordchain.state());
  const saved=await H(()=>JSON.parse(localStorage.getItem('wordchain-v2')).prog.normal.bestScore[2]);
  ok(st.score>0&&saved===st.score,`최고 점수 저장(wordchain-v2 bestScore): ${saved}`);
  const cw=await H(()=>window.__wordchain.cpu()); const bad=W.find(x=>x[0]!==cw.slice(-1));
  await p.fill('#inp',bad); await p.press('#inp','Enter'); await p.waitForTimeout(600);
  ok((await H(()=>window.__wordchain.state())).combo===0,'틀리면 콤보 0'); await p.click('#ov1');
  const bd=await H(()=>JSON.parse(localStorage.getItem('wordchain-badges-v1')));
  ok(bd.some(x=>x.id==='first')&&bd.some(x=>x.id==='fire5')&&bd.every(x=>Object.keys(x).join()==='id,date'),'배지 저장: {id, date}만 — '+bd.map(x=>x.id).join(', '));

  // 단계 통과 화면: 이번 판 점수·최고 콤보·얻은 배지, '힌트 없이' 배지
  await startLevel(p,url,'basic',1); await p.waitForTimeout(300);
  for(let i=0;i<4;i++){ const t=await H(()=>window.__wordchain.target()); await p.click(`.spell .choice[data-v="${t}"]`);
    for(let k=0;k<40;k++){ await p.waitForTimeout(150); if(await p.$('#rest')||await H(()=>window.__wordchain.target())!==t) break; } }
  const card=await p.textContent('#rest');
  ok(card.includes('이번 판')&&card.includes('최고 콤보')&&card.includes('힌트 없이'),'통과 화면(쉬어 가기 ①): 점수·최고 콤보·이번에 얻은 배지(힌트 없이)');
  await p.click('#back'); await p.waitForTimeout(200);
  ok((await p.textContent('.lv[data-lv="1"]')).includes('최고')&&(await p.textContent('.lv[data-lv="1"]')).includes('점'),'단계 목록: 이 단계 최고 점수');
  await p.click('#bdBtn'); await p.waitForTimeout(200);
  const nb=(await p.$$('.bdg')).length, ng=(await p.$$('.bdg.got')).length;
  ok(nb===14&&ng>=2,`배지 화면(저장소를 비운 뒤 얻은 첫걸음·힌트 없이): ${nb}개 중 ${ng}개 획득(진하게), 나머지는 조건과 함께 흐리게`);
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
