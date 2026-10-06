// 한글 자판(두벌식 입력기 조합)으로 영어 단어를 칠 때 글자가 빠지지 않는지. node tests/ime.js [주소]
// Chrome의 입력기 흉내(CDP Input.imeSetComposition / insertText)로 '조합 중 → 확정'을 재현
const {target,open,startLevel}=require('./lib');
// 단어별로 입력기가 만드는 조합 순서: [조합 중 글자들..., 확정]
const CASES={
  rose:[['ㄱ','개','갠'],['ㄷ']],          // ㄱㅐㄴㄷ → '갠' 확정 후 'ㄷ'
  apple:[['ㅁ','메'],['ㅔ'],['ㅣ'],['ㄷ']], // ㅁㅔㅔㅣㄷ
  house:[['ㅗ','ㅙ'],['ㅕ'],['ㄴ'],['ㄷ']], // ㅗ+ㅐ는 겹모음 ㅙ
  robot:[['ㄱ','개'],['ㅠ'],['ㅐ'],['ㅅ']],
};
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open(); const cdp=await p.context().newCDPSession(p);
  await startLevel(p,url,'basic',3); let fail=0;
  for(const [word,steps] of Object.entries(CASES)){
    await p.fill('#inp',''); await p.focus('#inp');
    for(const comp of steps){
      for(const t of comp) await cdp.send('Input.imeSetComposition',{text:t,selectionStart:t.length,selectionEnd:t.length});
      await cdp.send('Input.insertText',{text:comp[comp.length-1]}); // 다음 글자로 넘어가며 확정
      await p.waitForTimeout(30);
    }
    await p.waitForTimeout(50);
    const v=await p.inputValue('#inp');
    const ok=v===word; if(!ok) fail++;
    console.log(`${word}: 입력칸 "${v}" ${ok?'OK':'틀림'}`);
  }
  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
