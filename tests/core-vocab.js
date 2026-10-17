// 교육부 기본 어휘: 빌드에 예전 단어장 자료(뜻·쪽수·"기본 어휘" 문구)가 없음, 기본 어휘 가중치, level 3·인정 전용 단어는 컴퓨터가 안 내고 학생 답으로는 인정,
// 이름 바뀐 배지(기본 어휘 탐험가)·예전 배지 유지·수첩 사유. node tests/core-vocab.js [주소]
const fs=require('fs'), path=require('path');
const {target,open}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open({viewport:{width:1280,height:800}}); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a);
  const day=n=>{ const d=new Date(); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  await p.goto(url); await H(()=>localStorage.clear()); await p.goto(url);

  // 1. 빌드 결과: 예전 단어장 자료·문구 없음 ('textbook 교과서'는 단어 뜻이라 제외, '동아리'는 다른 말)
  const html=await H(()=>document.documentElement.outerHTML);
  const tbN=(html.match(/기본 어휘/g)||[]).length-(html.match(/textbook 교과서/g)||[]).length;
  ok(tbN===0,`"기본 어휘" 문구 없음 (단어 textbook의 뜻 제외) — ${tbN}개`);
  ok(!/VOCAB_OLD| |예전(?!리)/.test(html),'VOCAB_OLD·"예전"·" " 없음');
  ok(!/\["[a-z]+", "[^"]*", [12], \d+\]/.test(html),'[단어, 뜻, 학년, 쪽] 형식(쪽수) 자료 없음');
  const priv=path.resolve(__dirname,'../private/old-vocab.js');
  if(fs.existsSync(priv)){
    const don=JSON.parse(fs.readFileSync(priv,'utf8').match(/const VOCAB_OLD = (\[.*?\]);/s)[1]);
    // 여러 뜻·설명이 붙은(예전 자료 고유의 표현일 수 있는) 뜻이 빌드에 그대로 있으면 안 됨
    const odd=don.filter(([,ko])=>/[,/;(〔…]/.test(ko)), found=odd.filter(([w,ko])=>html.includes(ko));
    ok(found.length===0,`예전 자료 단어장(private/old-vocab.js)의 설명형 뜻 ${odd.length}개가 빌드에 없음${found.length?' — '+found.map(x=>x[0]+' '+x[1]).join(', '):''}`);
  }else console.log('     (private/old-vocab.js 없음 — 예전 뜻 비교는 건너뜀)');

  // 2. 기본 어휘 가중치(SETTINGS.coreWeight = 5)와 level
  const w=await H(()=>{ const W=window.__wordchain; const c=W.pickMany(['access','actor'],12000);
    return {acc:W.weight('access'),act:W.weight('actor'),apple:W.core('apple'),access:W.core('access'),actor:W.core('actor'),ratio:c.access/c.actor}; });
  ok(w.apple===1&&w.access===2&&w.actor===0,`level: apple ${w.apple}(초등 권장 *), access ${w.access}(중학교 **), actor ${w.actor}(기본 어휘 아님)`);
  ok(w.acc===5&&w.act===1,`출제 가중치: 기본 어휘 ×${w.acc}, 그 밖 ×${w.act}`);
  ok(w.ratio>4&&w.ratio<6.2,`우선 출제 비율 access:actor ≈ 5 — ${w.ratio.toFixed(2)}`);

  // 3. level 3·인정 전용 단어: 컴퓨터 출제·힌트·보기·기초·복습 후보(단어장)에 없음, 학생 답으로는 인정
  const a=await H(()=>{ const W=window.__wordchain, A=VOCAB_CORE_ACCEPT.split(/[|\n]/).map(s=>s.trim()).filter(Boolean);
    return {n:A.length, inAll:A.filter(x=>W.inAll(x)), notAcc:A.filter(x=>x.length>1&&W.judge(x)!=='english'),
      j:['abandon','colour','aeroplane','sex','kill','environ'].map(x=>x+':'+W.judge(x)+(W.inAll(x)?'+출제':'')), core:W.core('abandon')}; });
  ok(a.n>900&&a.inAll.length===0,`인정 전용 ${a.n}개 모두 단어장(출제·힌트·보기·복습 후보) 밖${a.inAll.length?' — '+a.inAll.slice(0,10):''}`);
  ok(a.notAcc.length===0&&a.j.every(x=>x.endsWith(':english')),`학생 답으로 인정(단어장 밖 단어): ${a.j.join(', ')}${a.notAcc.length?' / 안 됨 '+a.notAcc.slice(0,10):''}`);
  ok(a.core===0,'level 3 단어는 기본 어휘 가중치·보너스 없음(core 0)');

  // 4. 게임에서 level 3 단어로 답하기 → "단어장 밖 단어"로 인정
  const acc=await H(()=>VOCAB_CORE_ACCEPT.split(/[|\n]/).map(s=>s.trim()).filter(x=>/^[a-z]{4,}$/.test(x)&&window.__wordchain.judge(x)==='english'));
  await p.click('[data-t="normal"]'); await p.click('#teacher'); await p.click('#teacher'); await p.click('[data-lv="3"]'); await p.waitForTimeout(900);
  let used=null;
  for(let i=0;i<30&&!used;i++){ const cw=await H(()=>window.__wordchain.cpu()); const x=acc.find(y=>y[0]===cw.slice(-1));
    if(x){ await p.fill('#inp',x); await p.press('#inp','Enter'); await p.waitForTimeout(400); used=x; break; }
    await p.fill('#inp','zzzz'); await p.press('#inp','Enter'); await p.click('#ov1',{timeout:1500}).catch(()=>{}); await p.waitForTimeout(600); }
  const m=await p.textContent('#msg');
  ok(used&&m.includes('단어장 밖'),`level 3 단어 ${used} → "${m.slice(0,40)}"`);

  // 5. 배지: 예전에 얻은 배지(tb10) 유지, 이름은 "기본 어휘 탐험가", 서로 다른 기본 어휘 30개면 tb30, 수첩 사유 "처음 맞힌 기본 어휘"
  const core=await H(()=>[1,2].flatMap(l=>VOCAB_CORE[l].split(/[|\n]/).map(s=>s.trim().split(' ')[0])).filter(x=>/^[a-z]{3,}$/.test(x)&&window.__wordchain.inAll(x)));
  const seen=core.slice(0,29);
  await p.goto(url);
  await H(o=>{ localStorage.clear(); for(const k in o) localStorage.setItem(k,JSON.stringify(o[k])); },{
    'wordchain-v2':{track:'normal',prog:{normal:{unlocked:4,best:{},cleared:{}}},time:{},basicVer:2,stats:{tb:seen,outside:0}},
    'wordchain-badges-v1':[{id:'tb10',date:day(-5)}],
    'wordchain-notebook-v1':{items:{},learned:{},tbSeen:seen}});
  await p.goto(url); await p.click('[data-t="normal"]'); await p.click('[data-lv="2"]'); await p.waitForTimeout(900);
  let ans=null;
  for(let i=0;i<20&&!ans;i++){ const cw=await H(()=>window.__wordchain.cpu()); const x=core.find(y=>y[0]===cw.slice(-1)&&!seen.includes(y)&&y!==cw);
    if(x){ await p.fill('#inp',x); await p.press('#inp','Enter'); await p.waitForTimeout(500); ans=x; break; }
    await p.fill('#inp','zzzz'); await p.press('#inp','Enter'); await p.click('#ov1',{timeout:1500}).catch(()=>{}); await p.waitForTimeout(600); }
  const bd=await H(()=>JSON.parse(localStorage.getItem('wordchain-badges-v1')).map(x=>x.id+':'+x.date));
  ok(bd.includes('tb10:'+day(-5))&&bd.some(x=>x.startsWith('tb30:')),`기본 어휘 ${ans}로 30개째 → tb30, 예전 tb10(날짜 그대로) 유지 — ${bd.join(', ')}`);
  const note=await p.$$eval('.badge-note',a=>a.map(e=>e.textContent).join(' / '));
  ok(note.includes('기본 어휘 탐험가 30'),`배지 알림: ${note}`);
  const nb=await H(()=>JSON.parse(localStorage.getItem('wordchain-notebook-v1')));
  ok(nb.items[ans]&&nb.items[ans].reason==='textbook'&&nb.tbSeen.includes(ans),`처음 맞힌 기본 어휘 → 수첩(사유 키 textbook 그대로)`);
  await p.click('#back').catch(()=>{}); await p.waitForTimeout(300);
  await p.click('#bdBtn'); await p.waitForTimeout(200);
  const bs=await p.$$eval('.bdg.got',a=>a.map(e=>e.textContent).join(' | '));
  const all=await p.textContent('#app');
  ok(bs.includes('기본 어휘 탐험가 10')&&bs.includes('기본 어휘 탐험가 30')&&!all.includes('기본 어휘'),'배지 화면: 기본 어휘 탐험가 10·30 획득, "기본 어휘" 없음');
  await p.click('#back').catch(()=>{}); await p.waitForTimeout(200); await p.click('#nbBtn'); await p.waitForTimeout(200);
  const nt=await p.textContent('#app');
  ok(nt.includes('처음 맞힌 기본 어휘')&&!nt.includes('기본 어휘'),'수첩 화면: 사유 "처음 맞힌 기본 어휘", "기본 어휘" 없음');

  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
