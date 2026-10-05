// 컴퓨터 출제 규칙: 첫 글자=끝 글자 금지, 수 단어 금지. node tests/cpu-rules.js [주소] [단계당 단어 수=40]
const {target,open,startLevel,cpuWord,skip}=require('./lib');
const NUM=/^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\w+teen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)$/;
(async()=>{
  const url=target(process.argv[2]); const n=+(process.argv.find(a=>/^\d+$/.test(a))||40);
  const {b,p,errs}=await open(); let fail=0;
  for(const [t,lv] of [['basic',1],['basic',3],['normal',3],['hard',1],['hard',3]]){
    await startLevel(p,url,t,lv); const bad=new Set();
    for(let i=0;i<n;i++){ const w=await cpuWord(p); if(w[0]===w[w.length-1]) bad.add(w); if(NUM.test(w)) bad.add('수:'+w); await skip(p); }
    if(bad.size) fail++;
    console.log(`${t} ${lv}: 컴퓨터 단어 ${n}개, 규칙 위반 ${[...bad].join(', ')||'없음'}`);
  }
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
