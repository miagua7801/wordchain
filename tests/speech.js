// 단어 읽기 순서·간격 확인(소리 없음: 가짜 음성 엔진이 읽는 척만 하고 기록). node tests/speech.js [주소]
// ① 단어 앞에 소리 없는 여유(volume 0)가 있는지 ② 읽던 소리를 끊은 뒤 바로 읽지 않는지 ③ 학생 단어를 다 읽은 뒤 컴퓨터 단어를 읽는지
const {chromium}=require('playwright');
const {target}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const b=await chromium.launch({args:['--mute-audio']}); const p=await b.newPage(); await p.addInitScript(()=>{ window.__wordchainNoIntro=true; });
  await p.addInitScript(()=>{
    const log=[]; window.__tts=log; let busy=0; const t0=performance.now(); const now=()=>Math.round(performance.now()-t0);
    const ss={ get speaking(){return busy>0;}, get pending(){return false;},
      speak(u){ log.push({t:now(),ev:'speak',text:u.text,vol:u.volume,rate:u.rate}); busy++; const dur=u.volume===0?100:700; // 단어는 0.7초 읽는 척
        setTimeout(()=>{ busy--; log.push({t:now(),ev:'end',text:u.text}); u.onend&&u.onend(); },dur); },
      cancel(){ log.push({t:now(),ev:'cancel'}); busy=0; } };
    Object.defineProperty(window,'speechSynthesis',{value:ss});
  });
  await p.goto(url); await p.evaluate(()=>localStorage.clear()); await p.goto(url);
  await p.click('[data-t="basic"]'); await p.click('#teacher'); await p.click('#teacher'); await p.click('[data-lv="4"]');
  await p.waitForTimeout(1200);
  const words=await p.evaluate(()=>(VOCAB_E).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{3,}$/.test(w)&&!/(er|est)$/.test(w)));
  const cw=await p.$eval('.cpu .big',e=>e.textContent); const ans=words.find(w=>w[0]===cw.slice(-1)&&w!==cw);
  await p.fill('#inp',ans); await p.press('#inp','Enter');
  await p.waitForTimeout(5000);
  await p.click('#say'); await p.waitForTimeout(100); await p.click('#say'); // 읽는 도중에 다시 듣기 → 끊고 다시 읽기
  await p.waitForTimeout(1500);
  const log=await p.evaluate(()=>window.__tts);
  let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const speaks=log.filter(e=>e.ev==='speak');
  const words2=speaks.filter(e=>e.vol!==0);
  ok(words2.every(w=>{ const i=speaks.indexOf(w); return i>0&&speaks[i-1].vol===0; }),'모든 단어 앞에 소리 없는 여유가 있음');
  const sEnd=log.find(e=>e.ev==='end'&&e.text===ans); const next=words2.find(e=>e.text!==ans&&e.t>(sEnd?sEnd.t:0)&&e.text!==cw);
  ok(sEnd&&next&&next.t-sEnd.t>=900,`학생 단어(${ans})를 다 읽고 ${next?next.t-sEnd.t:'?'}ms 뒤 컴퓨터 단어(${next&&next.text})를 읽음`);
  const c=log.findIndex(e=>e.ev==='cancel'); const after=log.slice(c+1).find(e=>e.ev==='speak');
  ok(c>=0&&after&&after.t-log[c].t>=150,`끊은 뒤 ${after?after.t-log[c].t:'?'}ms 쉬고 다시 읽음`);
  // 기초 1~3단계: 더 천천히 읽고, 컴퓨터 단어를 다 읽은 뒤 쉬었다가 다음 단어(학생이 완성할 단어)를 읽음
  await p.evaluate(()=>{ window.__tts.length=0; });
  await p.click('#back'); await p.click('[data-lv="1"]'); await p.waitForTimeout(4500);
  const L2=await p.evaluate(()=>window.__tts), cpuW=await p.evaluate(()=>window.__wordchain.cpu()), tgt=await p.evaluate(()=>window.__wordchain.target());
  const cEnd=L2.find(e=>e.ev==='end'&&e.text===cpuW), tSp=L2.find(e=>e.ev==='speak'&&e.text===tgt), cSp=L2.find(e=>e.ev==='speak'&&e.text===cpuW);
  ok(cSp&&cSp.rate<0.65,`기초 읽기 속도 ${cSp&&cSp.rate.toFixed(2)}배`);
  ok(cEnd&&tSp&&tSp.t-cEnd.t>=1400,`컴퓨터 단어(${cpuW})를 다 읽고 ${tSp&&cEnd?tSp.t-cEnd.t:'?'}ms 뒤 다음 단어(${tgt})를 읽음`);
  await b.close(); process.exit(fail?1:0);
})();
