// 컴퓨터 출제 규칙: 첫 글자=끝 글자 금지, 수 단어 금지, 단어장 단어만(기본 어휘 level 3·인정 전용 단어 금지), 별표 규칙(완성할 단어 포함): 기초 모든 단계·보통 1~2단계는 ★만, 보통 3~4단계는 ★·★★까지, a/an 제외. node tests/cpu-rules.js [주소] [단계당 단어 수=40]
const {target,open,startLevel,cpuWord,skip}=require('./lib');
const NUM=/^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\w+teen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)$/;
(async()=>{
  const url=target(process.argv[2]); const n=+(process.argv.find(a=>/^\d+$/.test(a))||40);
  const {b,p,errs}=await open(); let fail=0;
  for(const [t,lv] of [['basic',1],['basic',2],['basic',3],['basic',4],['normal',1],['normal',2],['normal',3],['normal',4],['hard',1],['hard',3]]){
    await startLevel(p,url,t,lv); const bad=new Set(); const star=t==='basic'||(t==='normal'&&lv<=2)?1:t==='normal'?2:0;
    for(let i=0;i<n;i++){ const w=await cpuWord(p); if(w[0]===w[w.length-1]) bad.add(w); if(NUM.test(w)) bad.add('수:'+w); if(await p.evaluate(w=>window.__wordchain.judge(w.toLowerCase())!=='dict'||!window.__wordchain.inAll(w.toLowerCase()),w)) bad.add('단어장 밖:'+w);
      if(star){ const tg=await p.evaluate(()=>window.__wordchain.target()); for(const x of [w,tg].filter(Boolean)){ const c=await p.evaluate(x=>window.__wordchain.core(x.toLowerCase()),x); if(!c||c>star||/^an?$/i.test(x)) bad.add('★'.repeat(star)+'까지 아님:'+x); } }
      await skip(p); }
    if(bad.size) fail++;
    console.log(`${t} ${lv}: 컴퓨터 단어 ${n}개, 규칙 위반 ${[...bad].join(', ')||'없음'}`);
  }
  // 출제하지 않을 단어(SETTINGS.noAsk): spaghetti·kiss는 출제 단어에 없고 학생 답으로는 인정
  for(const w of ['spaghetti','kiss']){
    const sp=await p.evaluate(w=>[window.__wordchain.inAll(w),window.__wordchain.judge(w)],w);
    if(sp[0]||sp[1]!=='dict') fail++; console.log(`${w}: 출제 ${sp[0]?'됨(실패)':'안 함'}, 학생 답 판정 ${sp[1]}`); }
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
