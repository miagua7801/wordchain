// x로 끝나는 학생 단어(box, fox …)에 컴퓨터가 VOCAB_X_REPLY(xylophone·xylitol·xylophonist) 중 하나를 무작위로 답함, 뜻도 보여 줌,
// 다른 출제에는 안 씀, 학생 답으로는 인정. node tests/xreply.js [주소]
const {target,open,startLevel,cpuWord,skip}=require('./lib');
const XR={xylophone:'xylophone',xylitol:'xylitol',xylophonist:'xylophonist'};
const XW=['box','fox','six','wax','tax','mix','fix','fax','relax'];   // 보통 2단계는 3글자 이상(ox는 안 됨)
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open(); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  await p.addInitScript(()=>{ window.__said=[]; const o=window.speechSynthesis; o.speak=(f=>u=>{ window.__said.push(u.text); f(u); })(o.speak); });
  await startLevel(p,url,'normal',2); await p.waitForTimeout(300);

  // 1. 무작위: x로 시작할 때 세 단어만, 세 단어가 모두 나옴
  const got=await p.evaluate(()=>Array.from({length:60},()=>window.__wordchain.nextCpu('x')));
  ok(got.every(w=>Object.values(XR).includes(w))&&new Set(got).size===3,'x로 끝나면 세 단어 중 무작위: '+[...new Set(got)].join(', '));
  // 2. 다른 출제에는 안 씀, 학생 답으로는 인정
  const st=await p.evaluate(ws=>ws.map(w=>[w,window.__wordchain.inAll(w),window.__wordchain.judge(w)]),Object.keys(XR));
  ok(st.every(([,a,j])=>!a&&j==='dict'),'출제·힌트·보기 단어에는 없고 학생 답으로는 단어장 단어: '+st.map(x=>x[0]+'='+x[2]).join(' '));

  // 3. 실제 게임: x로 끝나는 단어를 쓰면 컴퓨터가 그중 하나로 답하고 뜻을 보여 줌
  let done=false;
  for(let i=0;i<40&&!done;i++){
    const cw=await cpuWord(p), ch=cw.slice(-1).toLowerCase(), w=XW.find(x=>x[0]===ch);
    if(!w){ await skip(p); await p.waitForTimeout(200); continue; }
    await p.fill('#inp',w); await p.press('#inp','Enter'); await p.waitForTimeout(4500);
    const r=await p.evaluate(()=>({w:window.__wordchain.cpu(),big:document.querySelector('.cpu .big')?.textContent,txt:document.querySelector('.cpu')?.textContent||'',said:window.__said.slice()}));
    ok(XR[r.w]&&r.big===XR[r.w],`학생 ${w} → 컴퓨터 ${r.big}`);
    const ko={xylophone:'실로폰',xylitol:'감미료',xylophonist:'실로폰 연주자'}[r.w];
    ok(ko&&r.txt.includes(ko),'뜻도 보여 줌: '+ko);
    ok(r.said.includes(r.w),'읽는 말: '+r.w);
    done=true;
  }
  ok(done,'x로 끝나는 단어를 쓸 차례가 옴');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
