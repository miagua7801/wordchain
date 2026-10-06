// 학생 답으로 인정되는지: node tests/accept.js [주소] word1 word2 ...
// 컴퓨터 단어가 그 글자로 끝날 때까지 넘기며 시험. v·j·q처럼 끝 글자로 거의 안 나오는 글자로 시작하는 단어는 '못 해 봄'이 될 수 있음
const {target,open,startLevel,cpuWord,skip}=require('./lib');
(async()=>{
  const args=process.argv.slice(2); const url=target(args[0]); const words=/^https?:|^file:/.test(args[0]||'')?args.slice(1):args;
  const {b,p,errs}=await open();
  await startLevel(p,url,'basic',3); // 2글자 이상 인정되는 단계
  const res={};
  for(let i=0;i<250&&Object.keys(res).length<words.length;i++){
    const ch=(await cpuWord(p)).slice(-1);
    const w=words.find(x=>x[0].toLowerCase()===ch&&!(x in res));
    if(!w){ await skip(p); continue; }
    await p.fill('#inp',w); await p.press('#inp','Enter'); await p.waitForTimeout(200);
    const m=await p.textContent('#msg'); const ov=await p.$('.overlay');
    res[w]=m.startsWith('좋아요')?'인정 ('+m+')':ov?'오답: '+(await ov.textContent()).slice(0,60):'불인정: '+m.slice(0,50);
    console.log(w,'→',res[w]);
    await p.waitForTimeout(1500);
    if(await p.$('#ov2')) await p.click('#ov2'); else if(await p.$('#ov1')) await p.click('#ov1');
  }
  for(const w of words) if(!res[w]) console.log(w,'→ 못 해 봄(그 글자로 시작할 차례가 안 옴)');
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(Object.values(res).some(r=>!r.startsWith('인정'))||errs.length?1:0);
})();
