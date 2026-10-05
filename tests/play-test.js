const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--mute-audio']}); const p=await b.newPage({viewport:{width:420,height:900}}); await p.addInitScript(()=>Object.defineProperty(window,'speechSynthesis',{value:{speak(){},cancel(){}}}));
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/dist/word-chain-challenge.html'); await p.waitForTimeout(300);
 const words=await p.evaluate(()=>{const s=VOCAB_E+'|'+VOCAB_M+'|'+VOCAB_TB;return s.split(/[|\n]/).map(x=>x.trim()).filter(Boolean).map(x=>x.split(' ')[0]).filter(w=>/^[a-z]{2,}$/.test(w));});
 console.log('dict',new Set(words).size, 'hard L1 choices?');
 await p.click('[data-t="hard"]'); await p.click('#teacher'); await p.click('#teacher');
 // play hard L2 many turns, answering with unused valid words, check false 'used'
 await p.click('[data-lv="2"]');
 const mine=new Set(); let falseUsed=0, turns=0, cmpSeen=0;
 for(let i=0;i<40;i++){
   await p.waitForTimeout(100);
   if(await p.$('.overlay')){ await p.click('#ov1'); continue; }
   const cw=await p.$eval('.cpu .big',e=>e.textContent); if(/(er|est)$/.test(cw)) cmpSeen++;
   const chain=await p.$$eval('.chain .tile',a=>a.map(e=>e.textContent));
   const used=new Set([...chain,cw]);
   const ch=cw.slice(-1);
   const ans=words.find(w=>w[0]===ch&&w.length>=4&&!used.has(w)&&!mine.has(w)&&!/(er|est)$/.test(w));
   if(!ans) break;
   await p.fill('#inp',ans); await p.press('#inp','Enter'); turns++;
   await p.waitForTimeout(150);
   const m=await p.$('.overlay'); if(m){const t=await m.textContent(); if(t.includes('이미')) {falseUsed++; console.log('FALSE USED',ans,chain);} if(t.includes('통과')){console.log('passed after',turns);} await p.click('#ov1');}
   else await p.waitForTimeout(1400);
 }
 console.log('turns',turns,'falseUsed',falseUsed,'cpu -er/-est words',cmpSeen);
 await p.screenshot({path:'s8.png'});
 console.log('errors',errs); await b.close();})();
