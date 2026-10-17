// 듣고 쓰기: 보통 2~4단계 토글, 도전 5단계 듣기 챌린지, 다시 듣기 횟수, 글자 수, 정답·오답 뒤 공개, 끝 글자 설명, 소리 끔. node tests/listen.js [주소]
const {target,open,startLevel}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a);
  const words=async()=>H(()=>(VOCAB_E+'|'+VOCAB_M).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)&&!/(er|est)$/.test(w)));
  const W=await (async()=>{ await p.goto(url); return words(); })();
  const answer=async ch=>{ const used=await p.$$eval('.chain .tile',a=>a.map(e=>e.textContent)); const w=W.find(x=>x[0]===ch&&!used.includes(x)); await p.fill('#inp',w); await p.press('#inp','Enter'); return w; };

  // 끝 글자 설명
  const SN=list=>H(l=>l.map(([a,b])=>window.__wordchain.silentNote(a,b)),list);
  const n=await SN([['horse','s'],['happy','i'],['apple','l'],['tiger','e']]);
  ok(n[0]==='horse는 e로 끝나요. 끝의 e는 소리가 나지 않아요.'&&n[1]==='happy는 y로 끝나요. 끝의 -y는 [이]로 소리 나요.'&&n[2]==='apple는 e로 끝나요. -le는 [을]처럼 소리 나지만 끝 글자는 e예요.'&&n[3]==='','기존 끝 글자 설명 그대로(묵음 e·-y·-le, 해당 없으면 없음): '+n.filter(Boolean).map(x=>x.slice(0,14)).join(' / '));
  const nn=await SN([['month','s'],['played','y'],['write','t'],['clock','c'],['music','g'],['graph','p'],['comb','m'],['autumn','m'],['sign','e']]);
  const want=['month는 s가 아니라 th로 끝나요.','played처럼 과거형 -ed는 끝소리가 약하게 들려요.','write의 끝 e는 소리가 나지 않아요.','clock은 k 소리지만 ck로 끝나요.','music은 k 소리지만 c로 끝나요.','graph는 f 소리지만 ph로 끝나요.','comb의 b는 소리가 나지 않아요.','autumn의 n은 소리가 나지 않아요.','sign의 g는 소리가 나지 않아요.'];
  nn.forEach((x,i)=>ok(x===want[i],'새 끝 글자 설명: '+x));
  const gh=await SN([['high','g'],['weigh','g'],['through','u'],['though','o'],['laugh','l'],['enough','u'],['cough','c'],['tough','t'],['rough','r'],['sleigh','e']]);
  ok(gh.slice(0,4).every((x,k)=>x===['high','weigh','through','though'][k]+'의 gh는 소리가 나지 않아요.')&&gh.slice(4,9).every((x,k)=>x===['laugh','enough','cough','tough','rough'][k]+'는 f 소리지만 gh로 끝나요.')&&gh[9]==='sleigh의 gh는 소리가 나지 않아요.','-gh는 단어 목록으로 나눔: '+gh[0]+' / '+gh[4]+' / 목록에 없는 sleigh → 묵음');
  const ex=await SN([['cake','k'],['side','s'],['stopped','t'],['month','l'],['seed','s'],['red','e'],['tried','t'],['tiger','e']]);
  ok(ex[0]==='cake의 끝 e는 소리가 나지 않아요.'&&ex[1]==='side의 끝 e는 소리가 나지 않아요.'&&ex[2].startsWith('stopped처럼 과거형')&&ex[3]==='month는 l이 아니라 th로 끝나요.'&&ex[4]===''&&ex[5]===''&&ex[6].startsWith('tried처럼')&&ex[7]==='','가장 구체적인 설명 하나만·조사(가/이)·과거형 아닌 -ed(seed, red)·해당 없는 단어는 없음: '+ex.map(x=>x||'∅').join(' / '));
  const okn=await SN([['write','e'],['month','h'],['played','d'],['clock','k'],['music','c'],['graph','h'],['comb','b'],['autumn','n'],['sign','n'],['horse','e'],['happy','y'],['apple','e'],['high','h'],['laugh','h'],['tiger','r']]);
  const okWant=['write의 끝 e는 소리가 나지 않아요.','month는 s가 아니라 th로 끝나요.','played처럼 과거형 -ed는 끝소리가 약하게 들려요.','clock은 k 소리지만 ck로 끝나요.','music은 k 소리지만 c로 끝나요.','graph는 f 소리지만 ph로 끝나요.','comb의 b는 소리가 나지 않아요.','autumn의 n은 소리가 나지 않아요.','sign의 g는 소리가 나지 않아요.','horse는 e로 끝나요. 끝의 e는 소리가 나지 않아요.','happy는 y로 끝나요. 끝의 -y는 [이]로 소리 나요.','apple는 e로 끝나요. -le는 [을]처럼 소리 나지만 끝 글자는 e예요.','high의 gh는 소리가 나지 않아요.','laugh는 f 소리지만 gh로 끝나요.'].map(x=>'잘 들었어요! '+x).concat(['']);
  ok(okn.every((x,i)=>x===okWant[i]),'맞혔을 때(끝 글자를 잘 들음)도 "잘 들었어요!"와 함께 설명: '+okn.slice(0,3).join(' / ')+' … 해당 없는 단어(tiger)는 없음');
  const pp=await H(()=>['write','played','month'].map(w=>window.__wordchain.penPattern(w)));
  ok(pp.join('|')==='□ □ □ t □|□ □ □ □ e □|□ □ □ t □','첫 번째 힌트 모양: write → '+pp[0]+', played → '+pp[1]+', month → '+pp[2]);

  // 보통 2단계: 토글 켜기 → 다음 단어부터 소리로만
  await startLevel(p,url,'normal',2); await p.waitForTimeout(300);
  ok((await p.textContent('#lsn')).includes('끔'),'보통 2단계: 듣고 쓰기 토글(처음은 끔)');
  await p.click('#lsn'); await p.waitForTimeout(100);
  let cw=await H(()=>window.__wordchain.cpu()); await answer(cw.slice(-1)); await p.waitForTimeout(2600);
  cw=await H(()=>window.__wordchain.cpu());
  ok(await H(()=>window.__wordchain.listening())&&!!(await p.$('.cpu.listen'))&&!(await p.$('.cpu .big')),'다음 단어는 화면에 보이지 않음');
  ok((await p.$$('.lbox')).length===cw.length,`글자 수 표시 □×${cw.length}`);
  // 듣고 쓰기 힌트: 글자 수가 이미 보여도 ① 끝에서 두 번째 글자 ② 뜻
  const pen=async w=>{ const k=w.length; return H(([w,k])=>{ const b=[...document.querySelectorAll('#penHint .lbox')]; return {pat:document.getElementById('penHint')?.dataset.pat,n:b.length,on:b.findIndex(x=>x.classList.contains('on')),onT:(b.find(x=>x.classList.contains('on'))||{}).textContent,ask:b[k-1]&&b[k-1].classList.contains('qbox'),row:new Set(b.map(x=>Math.round(x.getBoundingClientRect().top))).size===1&&new Set(b.map(x=>Math.round(x.getBoundingClientRect().height))).size===1,msg:document.getElementById('penMsg')?.textContent,cap:document.querySelector('.askcap')?.textContent.trim(),ko:!!document.getElementById('hintKo')}; },[w,k]); };
  const expPat=w=>w.split('').map((c,i)=>i===w.length-2?c:'□').join(' ');
  await p.click('#hintBtn'); await p.waitForTimeout(150); let ph=await pen(cw);
  ok(ph.pat===expPat(cw)&&ph.n===cw.length&&ph.on===cw.length-2&&ph.onT===cw[cw.length-2]&&ph.ask&&ph.row&&ph.msg==='끝에서 두 번째 글자예요. 마지막 글자는 무엇일까요?'&&ph.cap==='? 이 글자를 맞혀요'&&!ph.ko,`보통 듣고 쓰기 힌트 1: ${ph.pat} (끝에서 두 번째 글자·위치, 칸들이 한 줄로 가지런함, 마지막 칸 강조 "이 글자를 맞혀요")`);
  await p.click('#hintBtn'); await p.waitForTimeout(150); ph=await pen(cw);
  ok(ph.ko&&ph.pat===expPat(cw)&&(await p.textContent('#hintKo')).startsWith('뜻: '),'보통 듣고 쓰기 힌트 2: '+(await p.textContent('#hintKo')));
  ok(!(await p.$$eval('.chain .tile',a=>a.map(e=>e.textContent))).includes(cw),'끝말잇기 줄에도 아직 안 보임');
  await p.click('#say'); await p.click('#say');
  ok(await p.$eval('#say',e=>e.disabled&&e.textContent.includes('(0)')),'다시 듣기 2번 뒤 비활성');
  const t1=Date.now(); await answer(cw.slice(-1)); await p.waitForTimeout(300);
  ok((await p.textContent('.cpu .big')).replace(/\s/g,'').toLowerCase()===cw,'정답을 내면 컴퓨터 단어 공개: '+cw);
  await p.waitForTimeout(2500);
  ok((await H(()=>window.__wordchain.cpu()))===cw&&!!(await p.$('.cpu .big')),'답을 낸 뒤 공개한 컴퓨터 단어를 2.5초 넘게 보여 줌(여유)');
  const until=async prev=>{ while(Date.now()-t1<8000&&(await H(()=>window.__wordchain.cpu()))===prev) await p.waitForTimeout(30); return Date.now(); };
  let dt=(await until(cw))-t1;
  ok(dt>=3850&&dt<=4400,`보통 듣고 쓰기: 답한 뒤 다음 문제까지 ${dt}ms(읽고 쉼 1초 + 공개 여유 3초, 그대로)`);
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
  const free0=(await H(()=>window.__wordchain.hints())).free;
  await p.click('#hintBtn'); await p.waitForTimeout(150); let ph5=await pen(cw5);
  ok(ph5.pat===expPat(cw5)&&ph5.on===cw5.length-2&&ph5.ask&&ph5.row&&!ph5.ko&&!!(await p.$('#slowSay')),`듣기 챌린지 힌트 1: ${ph5.pat} (끝에서 두 번째 글자와 위치)`);
  await p.click('#hintBtn'); await p.waitForTimeout(150); ph5=await pen(cw5);
  ok(ph5.ko&&(await p.textContent('#hintKo')).startsWith('뜻: '),'듣기 챌린지 힌트 2: '+(await p.textContent('#hintKo')));
  await p.click('#hintBtn').catch(()=>{}); await p.waitForTimeout(150); const h5=await H(()=>window.__wordchain.hints());
  ok(h5.free===free0-2&&(await p.textContent('#msg')).includes('다 봤어요'),`한 단어에 듣기 힌트는 2개까지(세 번째는 쓰이지 않음, 무료 ${free0} → ${h5.free})`);
  // 듣기 챌린지: 컴퓨터 발음을 공개한 뒤 다음 문제까지 0.5초 짧게(공개 여유 2.5초)
  const t5=Date.now(); await answer(cw5.slice(-1)); let c5=cw5; while(Date.now()-t5<8000&&c5===cw5){ await p.waitForTimeout(30); c5=await H(()=>window.__wordchain.cpu()); }
  const dt5=Date.now()-t5;
  ok(dt5>=3350&&dt5<=3900,`듣기 챌린지: 답한 뒤 다음 문제까지 ${dt5}ms(읽고 쉼 1초 + 공개 여유 2.5초, 보통보다 0.5초 짧음)`);
  // 답을 낸 뒤에만 설명: 힌트 화면에는 없고, 맞히면 공개한 컴퓨터 단어 아래 "잘 들었어요!" + 설명, 끝 글자를 잘못 들어 틀리면 오답 창에 설명
  const NOTE=/소리가 나지 않아요|로 끝나요|약하게 들려요|잘 들었어요/;
  await H(()=>window.__wordchain.tweak({hints:3}));
  ok(await H(()=>window.__wordchain.forceCpu('write')),'(준비) 컴퓨터 단어 write');
  await p.waitForTimeout(200); await p.click('#hintBtn'); await p.waitForTimeout(150); const hA=await p.textContent('#hintArea');
  await p.click('#hintBtn'); await p.waitForTimeout(150); const hB=await p.textContent('#hintArea');
  ok(!NOTE.test(hA)&&!NOTE.test(hB)&&!(await p.$('#okNote'))&&(await p.$eval('#penHint',e=>e.dataset.pat))==='□ □ □ t □','힌트 화면(1·2)에는 끝 글자 설명이 없음');
  await answer('e'); await p.waitForTimeout(300);
  ok((await p.textContent('#okNote'))==='💡 잘 들었어요! write의 끝 e는 소리가 나지 않아요.','맞힌 뒤 공개한 컴퓨터 단어 아래: '+(await p.textContent('#okNote')));
  for(let i=0;i<150&&(await H(()=>window.__wordchain.cpu()))==='write';i++) await p.waitForTimeout(40);
  ok(!(await p.$('#okNote')),'다음 문제로 넘어가면 설명은 사라짐');
  ok(await H(()=>window.__wordchain.forceCpu('month')),'(준비) 컴퓨터 단어 month'); await p.waitForTimeout(200);
  await p.fill('#inp',W.find(x=>x[0]==='s')); await p.press('#inp','Enter'); await p.waitForSelector('.overlay');
  const mn=await p.$eval('#missNote',e=>{ const c=getComputedStyle(e); return {t:e.textContent,bg:c.backgroundColor,bd:c.borderTopWidth,fw:c.fontWeight}; }).catch(()=>null);
  ok(!!mn&&mn.t==='💡 month는 s가 아니라 th로 끝나요.'&&mn.bg!=='rgba(0, 0, 0, 0)'&&mn.bd==='2px'&&+mn.fw>=600&&!(await p.textContent('.overlay')).includes('잘 들었어요'),'끝 글자를 잘못 들어 틀리면 오답 창에 강조 상자로 "month는 s가 아니라 th로 끝나요." '+JSON.stringify(mn));
  await p.click('#ov1'); await p.waitForTimeout(400);
  // 듣기 챌린지 마지막 정답: 통과는 바로 기록, 공개한 컴퓨터 단어를 다른 문제처럼 보여 준 뒤(약 3.5초) 통과 화면
  const goal5=await H(()=>document.querySelectorAll('.status .dot').length); await H(g=>window.__wordchain.tweak({streak:g-1}),goal5);
  const c6=await H(()=>window.__wordchain.cpu()); const t6=Date.now(); await answer(c6.slice(-1)); await p.waitForTimeout(1200);
  const mid6={rest:!!(await p.$('#rest')),big:(await p.$('.cpu .big'))?(await p.textContent('.cpu .big')).replace(/\s/g,'').toLowerCase():'',cleared:await H(()=>JSON.parse(localStorage.getItem('wordchain-v2')).prog.hard.cleared[5])};
  ok(!mid6.rest&&mid6.big===c6&&mid6.cleared===true,`마지막 정답 뒤 1.2초: 통과 화면으로 바로 안 넘어가고 공개한 컴퓨터 단어(${mid6.big}) 보여 줌, 통과는 이미 기록`);
  await p.waitForSelector('#rest',{timeout:6000}); const dt6=Date.now()-t6;
  ok(dt6>=3350&&dt6<=4300,`마지막 정답 뒤 ${dt6}ms에 5단계 통과 화면(다른 문제와 같은 여유)`);
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
