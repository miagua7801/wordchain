// 단어 판정(단어장 / 단어장 밖 올바른 단어 / 틀린 단어)과 철자 도움. node tests/judge.js [주소]
const {target,open,startLevel,cpuWord}=require('./lib');
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open(); let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  await p.goto(url);
  const j=await p.evaluate(()=>['tiger','tigers','running','happier','tigerr','zzqx'].map(w=>w+':'+window.__wordchain.judge(w)));
  ok(j.join()==='tiger:dict,tigers:english,running:english,happier:dict,tigerr:wrong,zzqx:wrong','판정: '+j.join(', '));
  const s=await p.evaluate(()=>window.__wordchain.suggest('tigar'));
  ok(s.includes('tiger')&&s.length<=3&&s.every(w=>w[0]==='t'),'철자 도움(tigar): '+s.join(' · '));

  // 틀린 단어: 1번 더 기회 → 두 번째는 오답
  await startLevel(p,url,'normal',2); await p.waitForTimeout(300);
  let ch=(await cpuWord(p)).slice(-1);
  await p.fill('#inp',ch+'qzxqz'); await p.press('#inp','Enter'); await p.waitForTimeout(300);
  const m1=await p.textContent('#msg');
  ok(!(await p.$('.overlay'))&&m1.includes('한 번 더'),'첫 번째 틀린 단어: 다시 쓸 기회 — '+m1.slice(0,60));
  await p.fill('#inp',ch+'qzxqzz'); await p.press('#inp','Enter'); await p.waitForTimeout(700);
  ok(!!(await p.$('.overlay')),'두 번째 틀린 단어: 오답 처리');
  await p.click('#ov1'); await p.waitForTimeout(300);

  // 단어장 밖 올바른 단어: 정답, 📗 표시, 컴퓨터가 끝 글자로 이어 감
  ch=(await cpuWord(p)).slice(-1);
  const out=await p.evaluate(ch=>WORDLIST.split('|').find(w=>w[0]===ch&&w.length>=5&&window.__wordchain.judge(w)==='english'&&/[aeiou]$/.test(w)===false),ch);
  await p.fill('#inp',out); await p.press('#inp','Enter'); await p.waitForTimeout(300);
  const m2=await p.textContent('#msg');
  ok(m2.includes('단어장 밖 단어')&&!m2.includes('='),`단어장 밖 단어(${out}): ${m2}`);
  await p.waitForTimeout(2600);
  const next=await cpuWord(p);
  ok(next[0].toLowerCase()===out.slice(-1),`컴퓨터가 이어 감: ${out} → ${next}`);
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
