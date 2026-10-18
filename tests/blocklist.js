// 부적절한 단어 차단: 소스에서 바로 안 읽힘, 출력에 금지어 없음, 정상 단어가 막히지 않음, 금지어 입력 처리(읽지 않음·다시 안 보여 줌·기록 안 함·3번째 새 판). node tests/blocklist.js [주소]
// 금지어는 이 파일에 적지 않고 blocklist.js를 풀어서 가져옴
const fs=require('fs'), path=require('path');
const {chromium}=require('playwright');
const {target}=require('./lib');
const BL=JSON.parse(Buffer.from(/BLOCKLIST = "([^"]*)"/.exec(fs.readFileSync(path.join(__dirname,'../blocklist.js'),'utf8'))[1],'base64').toString());
const NORMAL='class grape assistant passage peacock scrape therapist shiitake cockpit cocktail glass embassy assume assess title constitution analysis arsenal saltwater wristwatch snigger niggle swanky basement sclerotic nymph spice prickly document cucumber dickens hello tiger happiness'.split(' ');
(async()=>{
  const url=target(process.argv[2]); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  // 1. 페이지 소스에서 금지어가 바로 읽히지 않음(목록은 인코딩, 영어 단어 목록에서는 빠짐)
  const dist=fs.readFileSync(path.join(__dirname,'../dist/word-chain-challenge.html'),'utf8'), wl=/WORDLIST = "([^"]*)"/.exec(dist)[1].split('|');
  const distNoAllow=(BL.allow||[]).reduce((t,a)=>t.split(a).join(''),dist); // 허용 예외 단어(snigger 등) 안의 글자는 제외
  const plain=BL.strong.filter(s=>distNoAllow.includes(s)), inWl=BL.exact.filter(w=>wl.includes(w));
  ok(!plain.length&&!inWl.length,`소스에 강한 표현 ${plain.length}개·영어 단어 목록에 금지어 ${inWl.length}개 (목록 ${BL.exact.length+BL.strong.length}개는 base64로 인코딩)`);

  const b=await chromium.launch({args:['--mute-audio']}); const p=await b.newPage({viewport:{width:1280,height:800}}); await p.addInitScript(()=>{ window.__wordchainNoIntro=true; try{ localStorage.setItem('wordchain-teacher','1'); }catch(e){} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  // 소리 기록용 가짜 음성 엔진(소리 없음)
  await p.addInitScript(()=>{ window.__said=[]; Object.defineProperty(window,'speechSynthesis',{value:{speak(u){ window.__said.push(u.text); setTimeout(()=>u.onend&&u.onend(),0); },cancel(){}}}); });
  await p.goto(url); await p.evaluate(()=>localStorage.clear()); await p.goto(url);
  const H=(f,a)=>p.evaluate(f,a);
  // 2. 출력(컴퓨터·힌트·예시·보기·복습)에 쓰는 단어와 영어 단어 목록에 금지어 없음, 단어장 단어는 하나도 빠지지 않음
  const dirty=await H(()=>window.__wordchain.dirty());
  ok(dirty.all===0&&dirty.words===0&&dirty.lists>0,`출력용 단어·영어 단어 목록에 금지어 0개`);
  // 3. 정상 단어가 잘못 막히지 않음
  const wrongly=await H(ws=>ws.filter(w=>window.__wordchain.blocked(w)),NORMAL);
  ok(!wrongly.length,`정상 단어 ${NORMAL.length}개 중 잘못 막힌 단어: ${wrongly.join(', ')||'없음'}`);
  const vocabHit=await H(()=>(VOCAB_E+'|'+VOCAB_M+'|'+VOCAB_TB).split(/[|\n]/).map(x=>x.trim().split(' ')[0].toLowerCase()).filter(w=>/^[a-z]+$/.test(w)&&window.__wordchain.blocked(w)));
  ok(!vocabHit.length,'단어장 단어는 항상 허용: 막힌 단어장 단어 '+vocabHit.length+'개');
  // 막혀야 하는 입력: 정확한 금지어, 대문자, 3번 이상 늘여 쓴 형태, 강한 표현이 들어간 단어장 밖 입력
  const s0=BL.strong[0], e0=BL.exact.find(w=>w.length>=4)||BL.exact[0];
  const stretch=w=>w.slice(0,2)+w[2].repeat(4)+w.slice(3), probes=[e0,e0.toUpperCase(),stretch(e0),s0,stretch(s0),'xx'+s0+'yy'];
  const notBlocked=await H(ws=>ws.filter(w=>!window.__wordchain.blocked(w)),probes);
  ok(!notBlocked.length,`금지어 변형(대문자·늘여 쓰기·포함) ${probes.length}개 모두 막힘`);

  // 4. 게임에서 금지어 입력: 읽지 않음, 다시 보여 주지 않음, 입력 칸 비움, 연속 기록·점수·콤보 그대로, 저장 안 함
  await p.click('[data-t="normal"]'); await p.click('#teacher'); await p.click('#teacher'); await p.click('[data-lv="2"]'); await p.waitForTimeout(1200);
  const W=await H(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{3,}$/.test(w)&&!/(er|est)$/.test(w)));
  const cw=await H(()=>window.__wordchain.cpu()); await p.fill('#inp',W.find(w=>w[0]===cw.slice(-1))); await p.press('#inp','Enter'); await p.waitForTimeout(2800);
  const before=await H(()=>window.__wordchain.state());
  for(const [i,w] of [stretch(s0),e0].entries()){
    const said0=(await H(()=>window.__said.length));
    await p.fill('#inp',w); await p.press('#inp','Enter'); await p.waitForTimeout(600);
    const said=(await H(()=>window.__said)).slice(said0), m=await p.textContent('#msg'), v=await p.inputValue('#inp'), st=await H(()=>window.__wordchain.state());
    ok(said.length===0,`${i+1}번째 금지어: 소리로 읽지 않음(TTS 호출 ${said.length}번)`);
    const cls=await p.getAttribute('#msg','class');
    ok(m==='다른 단어를 써 보세요.'&&cls==='msg info'&&v===''&&!(await p.textContent('#app')).toLowerCase().includes(w.toLowerCase()),`${i+1}번째 금지어: 평범한 안내("다른 단어를 써 보세요.", 일반 색), 입력 칸 비움, 화면에 다시 안 보임`);
    ok(st.streak===before.streak&&st.score===before.score&&st.combo===before.combo&&!(await p.$('.overlay')),`${i+1}번째 금지어: 연속 기록·점수·콤보 그대로(${st.streak}연속, ${st.score}점)`);
  }
  const stored=await H(()=>Object.keys(localStorage).map(k=>localStorage.getItem(k)).join(' ').toLowerCase());
  ok(!stored.includes(e0)&&!stored.includes(s0),'localStorage 어디에도 금지어 입력이 저장되지 않음');
  await p.fill('#inp',s0); await p.press('#inp','Enter'); await p.waitForTimeout(800);
  const ovt=await p.textContent('.overlay');
  const st3=await H(()=>window.__wordchain.state());
  ok(ovt.includes('아쉬워요!')&&ovt.includes('하트를 1개 잃었어요')&&!/사용할 수 없|금지/.test(ovt)&&st3.lives===2&&st3.streak===before.streak,'3번째 금지어: 평범한 오답 화면(이유 설명 없음, 다른 오답처럼 하트 1개)');
  await p.click('#ov1'); await p.waitForTimeout(400);
  ok((await p.evaluate(()=>window.__wordchain.feed().slice(-2,-1)[0]))==='---'&&!(await p.$('.overlay')),'새 판 시작(채팅에 "새로 시작")');

  // 5. 복습에서 금지어 입력: 기록하지 않음
  await p.evaluate(()=>{ const d=new Date(); d.setDate(d.getDate()-1); const y=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    localStorage.setItem('wordchain-notebook-v1',JSON.stringify({items:{tiger:{w:'tiger',reason:'wrong',stamps:1,due:y}},learned:{},tbSeen:[]})); });
  await p.goto(url); await p.click('#rv'); await p.waitForTimeout(300);
  const said1=await H(()=>window.__said.length);
  await p.fill('#inp',e0); await p.press('#inp','Enter'); await p.waitForTimeout(300);
  const nb=await H(()=>JSON.parse(localStorage.getItem('wordchain-notebook-v1')).items.tiger);
  ok((await p.textContent('#msg'))==='다른 단어를 써 보세요.'&&nb.stamps===1&&!(await H(()=>window.__said)).slice(said1).includes(e0),'복습: 금지어는 기록하지 않고 읽지 않음');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
