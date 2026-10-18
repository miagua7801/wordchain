// 홈 화면 아이콘 만들기: node tools/make-icon.js → icons/icon-180.png, icon-192.png, icon-512.png, icon-maskable-512.png
// 원본은 icons/icon.svg(연한 보라파랑 바탕에 말풍선 두 개, "…e" → "e…"). 글꼴 Lexend를 쓰므로 Google Fonts를 불러와 브라우저로 그림
// maskable은 안드로이드가 가장자리를 잘라 내므로 그림을 80%로 줄여 바탕색 위 가운데에 둠
const {chromium}=require('playwright');
const fs=require('fs'), path=require('path');
(async()=>{
  const svg=fs.readFileSync(path.join(__dirname,'../icons/icon.svg'),'utf8');
  const bg=(svg.match(/<rect width="1024" height="1024" fill="(#[0-9A-Fa-f]+)"/)||[])[1]||'#D5D9FA';
  const b=await chromium.launch();
  for(const [n,name,scale] of [[512,'icon-512',1],[192,'icon-192',1],[180,'icon-180',1],[512,'icon-maskable-512',.8]]){
    const p=await b.newPage({viewport:{width:n,height:n}});
    await p.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@700&display=block"><style>html,body{margin:0;background:${bg}}body{width:${n}px;height:${n}px;display:grid;place-items:center}svg{display:block;width:${n*scale}px;height:${n*scale}px}</style></head><body>${svg}</body></html>`);
    await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(300);
    const ok=await p.evaluate(()=>document.fonts.check('700 100px Lexend'));
    if(!ok) console.warn('경고: Lexend 글꼴을 못 불러와 대체 글꼴로 그림');
    await p.screenshot({path:path.join(__dirname,`../icons/${name}.png`),clip:{x:0,y:0,width:n,height:n}});
    await p.close();
  }
  await b.close(); console.log('icons/ done');
})();
