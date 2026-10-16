// 듣고 쓰기: 보통 2~4단계 토글, 도전 5단계 듣기 챌린지, 다시 듣기 횟수, 글자 수, 정답·오답 뒤 공개, 끝 글자 설명, 소리 끔. node tests/listen.js [주소]
const {target,open,startLevel}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=f=>p.evaluate(f);
  const words=async()=>H(()=>(VOCAB_E+'|'+VOCAB_M).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)&&!/(er|est)$/.test(w)));
  const W=await (async()=>{ await p.goto(url); return words(); })();
  const answer=async ch=>{ const used=await p.$$eval('.chain .tile',a=>a.map(e=>e.textContent)); const w=W.find(x=>x[0]===ch&&!used.includes(x)); await p.fill('#inp',w); await p.press('#inp','Enter'); return w; };

  // 끝 글자 설명
  const n=await H(()=>[['cake','k'],['happy','i'],['apple','l'],['high','g'],['tiger','e']].map(([a,b])=>window.__wordchain.silentNote(a,b)));
  ok(n[0].includes('끝의 e는 소리가 나지 않아요')&&n[1].includes('-y')&&n[2].includes('-le')&&n[3].includes('-gh')&&n[4]==='','끝 글자 설명: '+n.filter(Boolean).map(x=>x.slice(0,18)).join(' / '));

  // 보통 2단계: 토글 켜기 → 다음 단어부터 소리로만
  await startLevel(p,url,'normal',2); await p.waitForTimeout(300);
  ok((await p.textContent('#lsn')).includes('끔'),'보통 2단계: 듣고 쓰기 토글(처음은 끔)');
  await p.click('#lsn'); await p.waitForTimeout(100);
  let cw=await H(()=>window.__wordchain.cpu()); await answer(cw.slice(-1)); await p.waitForTimeout(2600);
  cw=await H(()=>window.__wordchain.cpu());
  ok(await H(()=>window.__wordchain.listening())&&!!(await p.$('.cpu.listen'))&&!(await p.$('.cpu .big')),'다음 단어는 화면에 보이지 않음');
  ok((await p.$$('.lbox')).length===cw.length,`글자 수 표시 □×${cw.length}`);
  ok(!(await p.$$eval('.chain .tile',a=>a.map(e=>e.textContent))).includes(cw),'끝말잇기 줄에도 아직 안 보임');
  await p.click('#say'); await p.click('#say');
  ok(await p.$eval('#say',e=>e.disabled&&e.textContent.includes('(0)')),'다시 듣기 2번 뒤 비활성');
  await answer(cw.slice(-1)); await p.waitForTimeout(300);
  ok((await p.textContent('.cpu .big')).replace(/\s/g,'').toLowerCase()===cw,'정답을 내면 컴퓨터 단어 공개: '+cw);
  await p.waitForTimeout(2500);
  ok((await H(()=>window.__wordchain.cpu()))===cw&&!!(await p.$('.cpu .big')),'답을 낸 뒤 공개한 컴퓨터 단어를 2.5초 넘게 보여 줌(여유)');
  await p.waitForTimeout(3100);
  cw=await H(()=>window.__wordchain.cpu()); const wrong=W.find(x=>x[0]!==cw.slice(-1));
  await p.fill('#inp',wrong); await p.press('#inp','Enter'); await p.waitForTimeout(700);
  ok((await p.textContent('.overlay')).includes('컴퓨터 단어는'),'오답이어도 컴퓨터 단어 공개');
  await p.click('#ov1'); await p.waitForTimeout(300);
  // 소리를 끄면 듣고 쓰기 꺼짐·토글 비활성
  await p.click('#snd'); await p.waitForTimeout(200);
  ok(await p.$eval('#lsn',e=>e.disabled)&&(await p.textContent('.listenbar')).includes('소리를 켜야'),'소리를 끄면 토글 비활성 + 이유 표시');
  await p.click('#snd');

  // 도전 5단계 듣기 챌린지: 4단계 통과 시 열림, 다시 듣기 1번, 글자 수 없음, 소리 끄기 막음
  await p.goto(url);
  await p.evaluate(()=>{ const s=JSON.parse(localStorage.getItem('wordchain-v2')); s.prog.hard={unlocked:4,best:{},cleared:{1:true,2:true,3:true,4:true}}; localStorage.setItem('wordchain-v2',JSON.stringify(s)); });
  await p.goto(url); await p.click('[data-t="hard"]'); await p.waitForTimeout(200);
  ok((await p.$$('.levels .lv')).length===5&&!(await p.$eval('[data-lv="5"]',e=>e.disabled)),'도전 5단계: 4단계를 통과했으면 열림');
  await p.click('[data-lv="5"]'); await p.waitForTimeout(300);
  ok(!(await p.getAttribute('#inp','placeholder')).includes('...')&&!!(await p.$('.cpu.listen'))&&!(await p.$('.lbox'))&&(await p.textContent('#say')).includes('(1)')&&!(await p.$('#lsn')),'듣기 챌린지: 처음부터 소리로만, 다시 듣기 1번, 글자 수 없음');
  await p.click('#snd'); await p.waitForTimeout(100);
  ok((await p.textContent('#msg')).includes('끌 수 없어요'),'듣기 챌린지에서는 소리를 끌 수 없음');
  // 듣기 챌린지 힌트: 시작 글자 대신 끝소리 단서(1 천천히 듣기+글자 수, 2 뜻, 3 끝 글자만 가린 철자)
  const cw5=await p.evaluate(()=>window.__wordchain.cpu());
  await p.click('#hintBtn'); await p.waitForTimeout(150);
  ok((await p.$$('.hintbox .lbox')).length===cw5.length&&!!(await p.$('#slowSay')),'듣기 힌트 1: 천천히 들려주고 글자 수 표시');
  await p.click('#hintBtn'); await p.waitForTimeout(150); await p.click('#hintBtn'); await p.waitForTimeout(150);
  const hb=await p.textContent('.hintbox');
  ok(hb.includes('뜻:')&&(await p.textContent('.hintbox .pat')).replace(/\s/g,'')===cw5.slice(0,-1)+'_','듣기 힌트 2·3: 뜻, 끝 글자만 가린 철자 '+cw5.slice(0,-1)+'_');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
