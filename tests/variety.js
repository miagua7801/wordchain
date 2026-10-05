// 시작 글자 다양성: 정답으로 이어 가며 학생이 시작할 글자가 최근 2번과 겹친 횟수. node tests/variety.js [주소] [턴 수=30]
const {target,open,startLevel,cpuWord}=require('./lib');
(async()=>{
  const url=target(process.argv[2]); const turns=+(process.argv.find(a=>/^\d+$/.test(a))||30);
  const {b,p,errs}=await open();
  await p.goto(url);
  const words=await p.evaluate(()=>(VOCAB_E+'|'+VOCAB_M+'|'+VOCAB_TB).split(/[|\n]/).map(x=>x.trim().split(' ')[0]).filter(w=>/^[a-z]{4,}$/.test(w)&&!/(er|est)$/.test(w)));
  for(const [t,lv] of [['basic',3],['normal',3],['hard',1]]){
    await startLevel(p,url,t,lv);
    const asked=[], mine=new Set(); let rep=0;
    for(let i=0;i<turns;i++){
      if(await p.$('.overlay')){ await p.click('#ov2').catch(()=>p.click('#ov1')); await p.waitForTimeout(100); continue; }
      const cw=await cpuWord(p), ch=cw.slice(-1);
      if(asked.slice(-2).includes(ch)) rep++; asked.push(ch);
      const used=new Set(await p.$$eval('.chain .tile',a=>a.map(e=>e.textContent))); used.add(cw);
      const ans=words.find(w=>w[0]===ch&&!used.has(w)&&!mine.has(w)); if(!ans) break; mine.add(ans);
      await p.fill('#inp',ans); await p.press('#inp','Enter'); await p.waitForTimeout(1500);
    }
    console.log(`${t} ${lv}: 시작 글자 ${asked.join('')} | 최근 2번과 겹침 ${rep}/${asked.length} | 글자 종류 ${new Set(asked).size}`);
  }
  if(errs.length) console.log('errors',errs);
  await b.close();
})();
