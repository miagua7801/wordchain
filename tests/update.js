// 새 버전 알림: version.json의 빌드 시각이 다르면 띠가 뜨고, 누르면 ?v=새시각 주소로 이동. node tests/update.js
const {open}=require('./lib');
const http=require('http'), fs=require('fs'), path=require('path');
(async()=>{
  let fail=0; const ok=(c,m)=>{ if(!c) fail++; console.log((c?'PASS ':'FAIL ')+m); };
  let ver=null; const dist=path.resolve(__dirname,'../dist');
  const srv=http.createServer((q,r)=>{ const u=q.url.split('?')[0];
    if(u==='/version.json'){ r.setHeader('content-type','application/json'); r.end(JSON.stringify({build:ver})); return; }
    r.setHeader('content-type','text/html; charset=utf-8'); r.end(fs.readFileSync(path.join(dist,'word-chain-challenge.html'))); }).listen(0);
  const base='http://127.0.0.1:'+srv.address().port+'/';
  const {b,p,errs}=await open({viewport:{width:390,height:664}});
  const mine=fs.readFileSync(path.join(dist,'word-chain-challenge.html'),'utf8').match(/const BUILD='([^']+)'/)[1];
  ver=mine; await p.goto(base); await p.waitForTimeout(500);
  ok(!(await p.$('.updbar')),'같은 버전이면 알림 없음');
  ver='2099-01-01 00:00'; await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange'))); await p.waitForTimeout(500);
  ok(!!(await p.$('.updbar')),'다른 버전이 나오면 "새 버전이 있어요" 띠가 뜸 (탭으로 돌아올 때 확인)');
  await p.click('.updbar .x'); ok(!(await p.$('.updbar')),'✕로 닫기');
  await p.goto(base); await p.waitForTimeout(500);
  ok(!!(await p.$('.updbar')),'페이지를 열 때도 확인');
  await p.click('.updbar .go'); await p.waitForTimeout(500);
  ok(p.url().includes('?v='+encodeURIComponent('2099-01-01 00:00')),'새로 고침을 누르면 새 주소(?v=)로 이동 '+p.url());
  ok(!errs.length,'페이지 오류 없음 '+errs.join(' | ')); await b.close(); srv.close();
  console.log(fail?`실패 ${fail}개`:'모두 통과'); process.exit(fail?1:0);
})();
