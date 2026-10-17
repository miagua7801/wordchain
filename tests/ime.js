// 한글 자판(두벌식 입력기 조합)으로 영어 단어를 칠 때: ① 화면 키보드처럼 키 정보 없이 조합만 오면 조합이 끝난 뒤 영어로 바꿈(글자 빠짐·겹침 없음)
// ② 실제 키보드에서 한글 입력기가 켜져 있으면 영문 고정으로 바뀌어 누른 키 자리의 영어 글자가 바로 써짐(빈칸 채우기 칸 포함). node tests/ime.js [주소]
// Chrome의 입력기 흉내(CDP Input.imeSetComposition / insertText / dispatchKeyEvent key=Process)로 재현
const {target,open,startLevel}=require('./lib');
// 단어별로 입력기가 만드는 조합 순서: [조합 중 글자들..., 확정]
const CASES={
  rose:[['ㄱ','개','갠'],['ㄷ']],          // ㄱㅐㄴㄷ → '갠' 확정 후 'ㄷ'
  apple:[['ㅁ','메'],['ㅔ'],['ㅣ'],['ㄷ']], // ㅁㅔㅔㅣㄷ
  house:[['ㅗ','ㅙ'],['ㅕ'],['ㄴ'],['ㄷ']], // ㅗ+ㅐ는 겹모음 ㅙ
  robot:[['ㄱ','개'],['ㅠ'],['ㅐ'],['ㅅ']],
};
const KO={a:'ㅁ',b:'ㅠ',c:'ㅊ',d:'ㅇ',e:'ㄷ',f:'ㄹ',g:'ㅎ',h:'ㅗ',i:'ㅑ',j:'ㅓ',k:'ㅏ',l:'ㅣ',m:'ㅡ',n:'ㅜ',o:'ㅐ',p:'ㅔ',q:'ㅂ',r:'ㄱ',s:'ㄴ',t:'ㅅ',u:'ㅕ',v:'ㅍ',w:'ㅈ',x:'ㅌ',y:'ㅛ',z:'ㅋ'};
(async()=>{
  const url=target(process.argv[2]);
  const {b,p,errs}=await open(); const cdp=await p.context().newCDPSession(p); let fail=0;
  const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  const H=(f,a)=>p.evaluate(f,a);
  // 실제 키보드 + 한글 입력기: keydown은 key=Process(229)로 오고, 입력기가 한글 조합을 시도함
  const koKey=async ch=>{ const code='Key'+ch.toUpperCase();
    await cdp.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Process',code,windowsVirtualKeyCode:229,nativeVirtualKeyCode:229});
    await cdp.send('Input.imeSetComposition',{text:KO[ch],selectionStart:1,selectionEnd:1}).catch(()=>{});
    await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Process',code,windowsVirtualKeyCode:229});
    await p.waitForTimeout(30); };
  const key=async (k,code,vk)=>{ await cdp.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:k,code,windowsVirtualKeyCode:vk}); await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:k,code,windowsVirtualKeyCode:vk}); await p.waitForTimeout(30); };

  // ① 화면 키보드처럼 조합만 오는 경우(키 정보 없음): 조합이 끝난 뒤 영어로
  await startLevel(p,url,'basic',4);
  for(const [word,steps] of Object.entries(CASES)){
    await p.fill('#inp',''); await p.focus('#inp');
    for(const comp of steps){
      for(const t of comp) await cdp.send('Input.imeSetComposition',{text:t,selectionStart:t.length,selectionEnd:t.length});
      await cdp.send('Input.insertText',{text:comp[comp.length-1]}); // 다음 글자로 넘어가며 확정
      await p.waitForTimeout(30);
    }
    await p.waitForTimeout(50);
    const v=await p.inputValue('#inp');
    ok(v===word,`화면 키보드식 조합 ${word}: 입력칸 "${v}"`);
  }
  ok(!(await p.$eval('#inp',e=>e.readOnly)),'화면 키보드식 조합만으로는 영문 고정으로 바뀌지 않음');

  // ② 실제 키보드 + 한글 입력기: 첫 키부터 영어로 바로 써짐
  await startLevel(p,url,'basic',4); await p.focus('#inp');
  for(const ch of 'apple') await koKey(ch);
  await p.waitForTimeout(80);
  let st=await H(()=>{ const i=document.getElementById('inp'), c=document.querySelector('.fcaret'); return {v:i.value,ro:i.readOnly,caret:!!c,cx:c?c.getBoundingClientRect().left-i.getBoundingClientRect().left:0,msg:document.getElementById('msg').textContent}; });
  ok(st.v==='apple'&&!/[ㄱ-ㅣ가-힣]/.test(st.v),`한글 자판으로 a·p·p·l·e 키 → 입력칸 "${st.v}" (한글 없이 바로 영어)`);
  ok(st.ro&&st.caret&&st.cx>20&&!st.msg,`영문 고정: 커서 표시(글자 뒤 ${Math.round(st.cx)}px), 따로 안내 문구 없음`);
  await key('Backspace','Backspace',8); await key('Backspace','Backspace',8);
  ok((await p.inputValue('#inp'))==='app','Backspace 2번 → "app"');
  await key('ArrowLeft','ArrowLeft',37); await koKey('s');
  ok((await p.inputValue('#inp'))==='apsp','← 뒤 s → 커서 자리에 들어감 "apsp"');
  await key('End','End',35); await key('Backspace','Backspace',8); await key('Backspace','Backspace',8); await key('l','KeyL',76); await koKey('e');
  ok((await p.inputValue('#inp'))==='aple','한/영을 바꿔 영어 자판으로 쳐도(key=l) 그대로 영어 "aple"');
  // Enter로 내기 → 다음 입력칸도 처음부터 영문 고정
  const t0=(await H(()=>window.__wordchain.state())).turns;
  await key('Enter','Enter',13); await p.waitForTimeout(300);
  ok((await H(()=>window.__wordchain.state())).turns===t0+1||!!(await p.$('.overlay'))||(await p.textContent('#msg')).length>0,'Enter로 냄');
  if(await p.$('#ov1')) await p.click('#ov1');
  for(let i=0;i<80&&!(await p.$('#inp'));i++) await p.waitForTimeout(50);
  for(let i=0;i<80&&(await H(()=>{ const e=document.getElementById('inp'); return !e||e.disabled||!!document.querySelector('.myword'); }));i++) await p.waitForTimeout(50);
  ok(await p.$eval('#inp',e=>e.readOnly),'다음 입력칸도 처음부터 영문 고정');
  // 손가락으로 누르면(화면 키보드가 떠야 하므로) 영문 고정을 끔
  const bx=await p.$eval('#inp',e=>{ const r=e.getBoundingClientRect(); return {x:r.left+20,y:r.top+r.height/2}; });
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bx.x,y:bx.y}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(100);
  ok(!(await p.$eval('#inp',e=>e.readOnly)),'손가락으로 입력칸을 누르면 영문 고정 끔(화면 키보드용)');

  // ③ 빈칸 채우기 칸: 한글 입력기로 쳐도 영어 글자가 칸에 들어가고 다음 칸으로
  await startLevel(p,url,'basic',3); await p.waitForTimeout(300);
  const w=await H(()=>window.__wordchain.target()); const idx=await p.$$eval('.bin',a=>a.map(e=>+e.dataset.i));
  for(const i of idx) await koKey(w[i]);
  await p.waitForTimeout(100);
  const vals=await p.$$eval('.bin',a=>a.map(e=>e.value).join(''));
  ok(vals===idx.map(i=>w[i]).join('')&&!/[ㄱ-ㅣ가-힣]/.test(vals),`빈칸 채우기(${w}): 한글 자판으로 친 글자 → 칸마다 "${vals}"`);

  if(errs.length) console.log('errors',errs);
  await b.close(); process.exit(fail||errs.length?1:0);
})();
