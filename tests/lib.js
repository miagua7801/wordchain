// 테스트 공용: 소리 없는 브라우저(단어 읽기 speechSynthesis 무력화 + 음소거)와 대상 주소
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

// 인자로 주소를 주면 그 주소(예: GitHub Pages), 없으면 로컬 빌드 결과
function target(arg){ return arg && /^https?:|^file:/.test(arg) ? arg : pathToFileURL(path.resolve(__dirname,'../dist/word-chain-challenge.html')).href; }

// intro:true면 규칙 창(수준·단계 안내)을 띄움. 기본은 건너뜀(window.__wordchainNoIntro)
// student:true면 학생 화면(선생님 모드 끔). 기본은 선생님 모드를 켜서 '모든 단계 열기' 버튼을 씀
async function open(opts={}){
  const {intro,student,...po}=opts;
  const b=await chromium.launch({args:['--mute-audio']});
  const p=await b.newPage(po);
  await p.addInitScript(()=>Object.defineProperty(window,'speechSynthesis',{value:{speak(u){setTimeout(()=>u.onend&&u.onend(),0);},cancel(){}}}));
  if(!intro) await p.addInitScript(()=>{ window.__wordchainNoIntro=true; });
  if(!student) await p.addInitScript(()=>{ try{ localStorage.setItem('wordchain-teacher','1'); }catch(e){} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  return {b,p,errs};
}

// 수준(basic/normal/hard)과 단계를 골라 게임 시작. 모든 단계를 열고 시작함
async function startLevel(p,url,track,lv){
  await p.goto(url); await p.evaluate(()=>localStorage.clear()); await p.goto(url);
  await p.click(`[data-t="${track}"]`); await p.click('#teacher'); await p.click('#teacher'); await p.click(`[data-lv="${lv}"]`);
}

const cpuWord=p=>p.$eval('.cpu .big',e=>e.textContent);
// 일부러 틀려서 새 끝말잇기로 넘어감
async function skip(p){
  if(await p.$('#inp')){ await p.fill('#inp','zzzz'); await p.press('#inp','Enter'); }
  else if(await p.$('#bslots')) await p.evaluate(()=>{ const t=window.__wordchain.target(); document.querySelectorAll('#bslots .bin').forEach(b=>b.value=t[0]==='z'?'q':'z'); document.querySelector('#answer form').requestSubmit(); });   // 빈칸 채우기: 첫 글자를 틀리게
  else if(await p.$('.blk')){ const r=(await p.evaluate(()=>window.__wordchain.target())).slice(1), s=[...r].sort().join(''); await p.keyboard.type(s!==r?s:[...s].reverse().join('')); await p.waitForTimeout(700); }   // 글자 블록: 순서를 틀리게
  else await p.click('.choice');
  await p.click('#ov1',{timeout:1500}).catch(()=>{});
}

module.exports={target,open,startLevel,cpuWord,skip};
