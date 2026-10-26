// 학습 기록 지키기: 예전 형식 → 새 형식 이전, 다시 열어도 기록 유지, 깨진 기록 보관, 기록 파일 저장·불러오기, 잘못된 파일, 저장 불가 안내, 저장 안내(14일)
// 먼저 python build.py
const fs=require('fs');
const {target,open}=require('./lib');

(async()=>{
  const url=target(process.argv[2]); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const {b,p,errs}=await open({student:true,acceptDownloads:true});
  // 기록 저장·불러오기 영역은 기본으로 숨김(SETTINGS.showBackup:false) → 이 테스트는 켠 상태로 확인
  await p.addInitScript(()=>{ window.__wordchainShowBackup=true; });
  const J=o=>JSON.stringify(o);
  // 기록을 심고 앱을 다시 엶
  async function seed(items){ await p.goto(url); await p.evaluate(it=>{ localStorage.clear(); for(const [k,v] of Object.entries(it)) localStorage.setItem(k,v); },items); await p.goto(url); }
  const get=k=>p.evaluate(k=>localStorage.getItem(k),k);
  const getJ=async k=>JSON.parse(await get(k));
  const all=()=>p.evaluate(()=>{ const o={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); o[k]=localStorage.getItem(k); } return o; });
  const toMap=async t=>{ await p.click(`[data-t="${t}"]`); await p.waitForSelector('.map'); };

  // 1. 예전 형식(형식 번호·basicVer 없음, 기초 3단계 시절) → 새 형식
  const oldBasic={unlocked:3,best:{1:5,2:4,3:6},cleared:{1:true,2:true,3:true},storedHints:2};
  const oldNormal={unlocked:2,best:{1:6},cleared:{1:true},bestScore:{1:120}};
  await seed({'wordchain-v2':J({track:'normal',prog:{basic:oldBasic,normal:oldNormal},time:{'normal-2':30},listen:true})});
  let s=await getJ('wordchain-v2');
  ok(s.schemaVersion===2&&s.basicVer===2,'이전: 형식 번호(schemaVersion 2)를 넣어 저장');
  ok(J(s.prog.normal)===J(oldNormal)&&s.time['normal-2']===30&&s.listen===true,'이전: 보통 수준 진도·제한 시간·듣기 설정은 그대로');
  ok(J(s.archive&&s.archive.basicV1)===J(oldBasic),'이전: 예전 기초 진도는 지우지 않고 archive.basicV1에 보관');
  ok(s.prog.basic.unlocked===4&&s.prog.basic.storedHints===2&&!Object.keys(s.prog.basic.cleared).length,'이전: 예전 기초를 끝까지 통과 → 새 기초 4단계 모두 열림, 보관 힌트 유지');
  await toMap('basic');
  ok(await p.evaluate(()=>document.querySelectorAll('.map .node.lv').length===4&&!document.querySelector('.map .node.locked')),'이전: 단계 맵에서 기초 4단계가 모두 열려 있음');
  // 일부만 한 예전 기초
  await seed({'wordchain-v2':J({track:'basic',prog:{basic:{unlocked:2,best:{1:3},cleared:{1:true}}}})});
  s=await getJ('wordchain-v2');
  ok(s.prog.basic.unlocked===2&&s.archive.basicV1.cleared[1]===true,'이전: 기초 2단계까지 연 기록 → 새 기초도 2단계까지 열림, 원래 기록 보관');
  // 이미 새 형식(basicVer 2, schemaVersion 없음)이면 기초 진도를 건드리지 않음
  const nowBasic={unlocked:3,best:{1:4},cleared:{1:true,2:true}};
  await seed({'wordchain-v2':J({track:'basic',basicVer:2,prog:{basic:nowBasic}})});
  s=await getJ('wordchain-v2');
  ok(J(s.prog.basic)===J(nowBasic)&&!s.archive&&s.schemaVersion===2,'이전: basicVer 2 기록은 기초 진도 그대로(지우지 않음)');

  // 2. 깨진 기록은 지우지 않고 '-broken'에 보관
  await seed({'wordchain-v2':'{깨진 기록','wordchain-notebook-v1':'[1,2'});
  ok(await get('wordchain-v2-broken')==='{깨진 기록'&&await get('wordchain-notebook-v1-broken')==='[1,2','깨진 진도·수첩 기록 원문을 wordchain-v2-broken 등에 보관');
  await toMap('basic'); ok(!!(await p.$('.map')),'깨진 기록이어도 앱은 새 기록으로 시작');

  // 3. 다시 열어도 진도·수첩·배지·별이 남음
  const cur={track:'basic',schemaVersion:2,basicVer:2,since:'2026-10-20',prog:{basic:{unlocked:3,best:{1:5,2:6},cleared:{1:true,2:true},storedHints:1}},time:{}};
  const NB={items:{apple:{w:'apple',reason:'wrong',stamps:1},orange:{w:'orange',reason:'wrong',stamps:0}},learned:{},tbSeen:['apple']};
  const BD=[{id:'fire5',date:'2026-10-20'}];
  const today=await p.evaluate(()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });
  const fresh={'wordchain-v2':J(cur),'wordchain-notebook-v1':J(NB),'wordchain-stars-v1':'7','wordchain-badges-v1':J(BD),'wordchain-backup-v1':J({last:today})};
  await seed(fresh);
  for(let i=0;i<2;i++){ await p.goto(url); await toMap('basic'); }
  const after=await all();
  ok(J(JSON.parse(after['wordchain-v2']).prog)===J(cur.prog)&&after['wordchain-notebook-v1']===fresh['wordchain-notebook-v1']&&after['wordchain-stars-v1']==='7'&&after['wordchain-badges-v1']===fresh['wordchain-badges-v1'],'다시 열어도 진도·수첩·별·배지 그대로');
  ok(await p.evaluate(()=>document.querySelector('.stars-n').textContent==='7'&&document.querySelectorAll('.map .node.cleared').length===2),'다시 연 단계 맵: 별 7 · 통과 2단계');

  // 4. 기록 파일로 저장 → 기록 지움 → 불러오기 → 그대로 돌아옴
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#bkSave')]);
  const name=dl.suggestedFilename(), file=await dl.path(), txt=fs.readFileSync(file,'utf8');
  ok(/^wordchain-기록-\d{4}-\d{2}-\d{2}\.json$/.test(name),`저장 파일 이름: ${name}`);
  const d=JSON.parse(txt);
  ok(d.app==='wordchain'&&d.schemaVersion===2&&J(d.data.notebook)===J(NB)&&d.data.stars===7&&J(d.data.badges)===J(BD)&&J(d.data.progress.prog)===J(cur.prog),'저장 파일: 진도·수첩·별·배지가 모두 들어 있음');
  ok(!/teacher|@/.test(txt),'저장 파일: 선생님 표시·이메일 같은 개인 정보 없음');
  ok(JSON.parse(await get('wordchain-backup-v1')).last===today,'저장한 날을 wordchain-backup-v1에 기록');
  await p.evaluate(()=>localStorage.clear()); await p.goto(url); await toMap('basic');
  ok(await p.evaluate(()=>document.querySelector('.stars-n').textContent==='0'&&!document.querySelector('.map .node.cleared')),'기록을 지우면 빈 단계 맵');
  await p.setInputFiles('#bkFile',file); await p.waitForSelector('#bkYes');
  ok(/이 기록으로 바꿀까요\? 지금 기록은 덮어써져요/.test(await p.textContent('#bkMsg'))&&/통과한 단계 2개 · 수첩 단어 2개 · 별 7개 · 배지 1개/.test(await p.textContent('#bkMsg')),'불러오기: 요약을 보여 주고 한 번 더 누르라고 물음');
  ok(await get('wordchain-stars-v1')!=='7','불러오기: 확인 버튼을 누르기 전에는 바뀌지 않음');
  await p.click('#bkYes'); await p.waitForTimeout(100);
  const back=await all();
  ok(J(JSON.parse(back['wordchain-v2']).prog)===J(cur.prog)&&back['wordchain-notebook-v1']===J(NB)&&back['wordchain-stars-v1']==='7'&&back['wordchain-badges-v1']===J(BD),'불러오기: 진도·수첩·별·배지가 그대로 돌아옴');
  ok(await p.evaluate(()=>document.querySelector('.stars-n').textContent==='7'&&document.querySelectorAll('.map .node.cleared').length===2&&/되살렸어요/.test(document.querySelector('#bkMsg').textContent)),'불러오기: 단계 맵에 바로 반영');
  await p.goto(url); await toMap('basic');
  ok(await p.evaluate(()=>document.querySelectorAll('.map .node.cleared').length===2),'불러온 기록이 다시 열어도 남음');

  // 5. 잘못된 파일은 아무것도 바꾸지 않음
  const before=await all();
  const bad=[['끝말잇기 아님','not json at all'],['다른 앱',J({app:'other',data:{}})],['진도 형식 틀림',J({app:'wordchain',schemaVersion:2,data:{progress:{prog:[]}}})],
    ['더 새 형식',J({app:'wordchain',schemaVersion:99,data:{progress:{prog:{}}}})],['수첩 형식 틀림',J({app:'wordchain',schemaVersion:2,data:{progress:{prog:{}},notebook:[1]}})]];
  for(const [why,body] of bad){
    await p.setInputFiles('#bkFile',{name:'x.json',mimeType:'application/json',buffer:Buffer.from(body)}); await p.waitForTimeout(150);
    const msg=await p.$eval('#bkMsg',e=>({bad:!!e.querySelector('.bad'),yes:!!e.querySelector('#bkYes'),t:e.textContent}));
    ok(msg.bad&&!msg.yes&&/지금 기록은 그대로/.test(msg.t)&&J(await all())===J(before),`잘못된 파일(${why}): 안내만 하고 기록은 그대로`);
  }

  // 6. 저장 안내: 마지막 저장 14일이 지나면 '기록을 저장해 둘까요?'
  const ago=n=>p.evaluate(n=>{ const d=new Date(Date.now()-n*864e5); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; },n);
  await seed({...fresh,'wordchain-backup-v1':J({last:await ago(20)})}); await toMap('basic');
  ok(/기록을 저장해 둘까요/.test(await p.textContent('.backup')),'저장한 지 20일 → 저장 안내 보임');
  await seed({...fresh,'wordchain-backup-v1':J({last:await ago(3)})}); await toMap('basic');
  ok(!(await p.$('.bkhint')),'저장한 지 3일 → 안내 없음');
  await seed({'wordchain-v2':J({...cur,since:await ago(30)}),'wordchain-stars-v1':'3'}); await toMap('basic');
  ok(!!(await p.$('.bkhint')),'한 번도 저장 안 했고 30일 전부터 사용 → 안내 보임');
  await seed({'wordchain-v2':J({track:null,schemaVersion:2,basicVer:2,since:await ago(30),prog:{}})}); await toMap('basic');
  ok(!(await p.$('.bkhint')),'기록이 하나도 없으면 안내 없음');
  ok(!(await p.$('.nostore')),'저장할 수 있는 창에서는 저장 불가 안내 없음');
  ok(!errs.length,'페이지 오류 없음 '+errs.join(' | '));
  await b.close();

  // 7. 저장할 수 없는 창(시크릿·차단): 단계 맵 위에 안내, 앱은 그대로 동작
  const o2=await open({student:true});
  await o2.p.addInitScript(()=>{ Storage.prototype.setItem=function(){ throw new Error('QuotaExceededError'); }; });
  await o2.p.goto(url); await o2.p.click('[data-t="basic"]'); await o2.p.waitForSelector('.map');
  ok(/이 창에서는 기록이 저장되지 않아요\. 일반 창으로 열어 주세요\./.test(await o2.p.textContent('.nostore'))&&await o2.p.evaluate(()=>document.querySelector('.nostore').compareDocumentPosition(document.querySelector('.map'))&Node.DOCUMENT_POSITION_FOLLOWING),'저장 불가: 단계 맵 위에 안내');
  await o2.p.click('[data-lv="1"]'); await o2.p.waitForTimeout(300);
  ok(!o2.errs.length&&!(await o2.p.$('.map')),'저장 불가여도 게임 시작됨 '+o2.errs.join(' | '));
  await o2.b.close();

  console.log(fail?`\n${fail}개 실패`:'\n모두 통과'); process.exit(fail?1:0);
})();
