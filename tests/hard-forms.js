// 도전 수준 단어 규칙: 규칙 변화형은 막고 불규칙은 인정(학생 답·컴퓨터 출제), 알림만 띄우고 다시 입력, 규칙 안내·규칙 보기, 허용 목록 파일 반영. node tests/hard-forms.js [주소]
const fs=require('fs'), path=require('path'), http=require('http');
const {target,open,startLevel}=require('./lib');
let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
const BLOCK='running played plays studies goes believes saves caves taller biggest happier cats boxes cities gone eaten been'.split(' ');
const PASS=('went ate took made children men women teeth feet mice better best worse worst more most less least farther further farthest furthest '
  +'broken known saw left found rose fell news tired excited frightened fascinating interesting building evening morning '
  +'bed bus water forest owner offer flower corner butter sister need feed seed glass king thing knives leaves wolves wives lives shelves thieves').split(' ');
(async()=>{
  const url=target(process.argv[2]);
  { const {b,p,errs}=await open({viewport:{width:1280,height:800}});
    await startLevel(p,url,'hard',1);
    const kind=w=>p.evaluate(w=>window.__wordchain.formKind(w),w);
    const blocked=[],passed=[]; for(const w of BLOCK) if(!(await kind(w))) blocked.push(w); for(const w of PASS) if(await kind(w)) passed.push(w);
    ok(!blocked.length,'규칙 변화형·과거분사는 막음 '+blocked); ok(!passed.length,'불규칙형·허용 단어·원래 그 모양인 단어는 막지 않음 '+passed);
    ok((await kind('running'))==='v'&&(await kind('cats'))==='n'&&(await kind('taller'))==='a','종류: 동사·명사·형용사');
    ok(!!(await kind('goed')),'단어 목록에 없는 "단어장 단어 + 어미"(goed)도 막음');
    // 컴퓨터 출제: 도전 모든 단계에서 변화형 없음
    for(const lv of [1,2,3,4,5]){ await startLevel(p,url,'hard',lv); const bad=await p.evaluate(()=>{ const o=window.__wordchain.pools(), W=window.__wordchain; return [...new Set([...o.pool,...o.cpu])].filter(w=>W.formKind(w)); }); ok(!bad.length,`도전 ${lv}단계 출제 단어에 변화형 없음 ${bad.slice(0,8)}`); }
    // 알림만: 하트·성공·힌트·다시 쓸 기회 그대로, 입력 칸 유지
    await startLevel(p,url,'hard',1);
    const trial=async(cpu,w,want)=>{ await p.evaluate(c=>window.__wordchain.forceCpu(c),cpu); const before=await p.evaluate(()=>[window.__wordchain.state(),window.__wordchain.hints()]);
      await p.fill('#inp',w); await p.press('#inp','Enter'); await p.waitForTimeout(150);
      const after=await p.evaluate(()=>[window.__wordchain.state(),window.__wordchain.hints()]), m=await p.textContent('#msg');
      ok(m.includes(want)&&JSON.stringify(after)===JSON.stringify(before)&&!!(await p.$('#inp')),`${w}: "${m}", 하트·기록·힌트 그대로`); };
    await trial('jar','running','running은 쓸 수 없어요. 원형으로 입력해 보세요.');
    await trial('car','rabbits','rabbits는 쓸 수 없어요. 단수형으로 입력해 보세요.');
    await trial('star','richer','richer는 쓸 수 없어요. 원급으로 입력해 보세요.');
    // 불규칙형·허용 단어는 정답
    await p.evaluate(()=>window.__wordchain.forceCpu('cow')); await p.waitForTimeout(100); const s0=await p.evaluate(()=>window.__wordchain.state());
    await p.fill('#inp','woken'); await p.press('#inp','Enter'); await p.waitForTimeout(150); ok(/원형으로/.test(await p.textContent('#msg')),'woken(과거분사): 막음');
    await p.fill('#inp','went'); await p.press('#inp','Enter'); await p.waitForTimeout(200); const s1=await p.evaluate(()=>window.__wordchain.state()); ok(s1.rights===s0.rights+1,'went(불규칙 과거): 정답');
    // 다른 수준에는 적용하지 않음
    await startLevel(p,url,'normal',2); ok(!(await kind('running'))&&!(await p.$('#rulesBtn')),'보통 수준: 변화형 규칙 없음, 규칙 보기 버튼 없음');
    if(errs.length){ fail++; console.log('errors',errs); } await b.close(); }
  // 규칙 안내: 처음 한 번, "확인했어요"를 눌러야 시작, Esc로 닫히지 않음, 규칙 보기로 다시 봄, 제한 시간 멈춤
  { const {b,p,errs}=await open({viewport:{width:375,height:700},intro:true});
    await p.goto(url); await p.evaluate(()=>{ localStorage.removeItem('wordchain-hard-rules'); localStorage.setItem('wordchain-teacher','1'); }); await p.goto(url);
    await p.click('[data-t="hard"]'); await p.waitForTimeout(100); for(let i=0;i<9&&await p.$('#rpgNext');i++){ await p.click('#rpgNext'); await p.waitForTimeout(80); }
    await p.click('[data-lv="1"]'); await p.waitForTimeout(150); if(!(await p.$('.hrules'))){ await p.click('[data-lv="1"]'); await p.waitForTimeout(150); }
    const t=await p.textContent('.hrules'); ok(['기본형','playing, played, plays','cats, boxes','taller, biggest','went, ate, took','children, teeth, mice','better, best, worse, worst','tired, excited, interesting','따로 외워야'].every(x=>t.includes(x))&&(await p.textContent('#ov1')).includes('확인했어요'),'처음 들어가면 규칙 안내(문구·"확인했어요")');
    await p.keyboard.press('Escape'); await p.waitForTimeout(100); ok(!!(await p.$('.hrules'))&&!(await p.$('#gscreen')),'Esc로는 닫히지 않고 게임이 시작되지 않음');
    await p.screenshot({path:process.env.SHOT||path.join(require('os').tmpdir(),'hard-rules.png')});
    await p.click('#ov1'); await p.waitForTimeout(150); for(let i=0;i<9&&await p.$('#rpgNext');i++){ await p.click('#rpgNext'); await p.waitForTimeout(80); }
    await p.waitForSelector('#rulesBtn'); ok(!!(await p.$('#gscreen'))&&await p.evaluate(()=>localStorage.getItem('wordchain-hard-rules'))==='1','"확인했어요" 뒤 게임 시작(이 기기에 저장)');
    const ov=await p.evaluate(()=>document.documentElement.scrollWidth); ok(ov<=375,'휴대폰 너비: 게임 화면 가로 넘침 없음 '+ov);
    await p.click('#rulesBtn'); await p.waitForTimeout(100); ok(!!(await p.$('.hrules')),'규칙 보기: 다시 보임'); await p.click('#ov1'); await p.waitForTimeout(100); ok(!(await p.$('.hrules')),'  닫으면 게임으로');
    await p.goto(url); await p.click('[data-t="hard"]'); await p.waitForTimeout(100); for(let i=0;i<9&&await p.$('#rpgNext');i++){ await p.click('#rpgNext'); await p.waitForTimeout(80); }
    await p.click('[data-lv="1"]'); await p.waitForTimeout(150); ok(!(await p.$('.hrules')),'두 번째부터는 안내 없음');
    if(errs.length){ fail++; console.log('errors',errs); } await b.close(); }
  // 허용 목록 파일: 웹에서 앱이 읽어 바로 반영(임시 서버). 빌드에 넣은 목록보다 앞섬
  { const html=fs.readFileSync(path.resolve(__dirname,'..','dist/word-chain-challenge.html'));
    const srv=http.createServer((q,r)=>{ if(q.url.startsWith('/allowed-words.txt')){ r.writeHead(200,{'content-type':'text/plain'}); r.end('Running\r\nmorning\n'); } else if(q.url==='/'){ r.writeHead(200,{'content-type':'text/html'}); r.end(html); } else { r.writeHead(404); r.end(); } });
    await new Promise(k=>srv.listen(0,k)); const u=`http://127.0.0.1:${srv.address().port}/`;
    const {b,p,errs}=await open({viewport:{width:1280,height:800}}); await startLevel(p,u,'hard',1); await p.waitForTimeout(300);
    const r=await p.evaluate(()=>{ const W=window.__wordchain; return [W.formKind('running'),W.formKind('tired'),W.formKind('cats')]; });
    ok(r[0]===''&&r[1]==='v'&&r[2]==='n','allowed-words.txt를 읽음: 넣은 running은 허용, 뺀 tired는 막힘 '+r);
    srv.close(); if(errs.length){ fail++; console.log('errors',errs); } await b.close(); }
  console.log(fail?`실패 ${fail}`:'모두 통과'); process.exit(fail?1:0);
})();
