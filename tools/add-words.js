// 단어장(vocab.js) 도구
//   있는지 확인:  node tools/add-words.js check word1 word2 ...
//   추가:        node tools/add-words.js add 파일.txt
// 추가 파일 형식 — [목록] 다음 줄부터 "단어 뜻" 을 | 또는 줄바꿈으로 구분. 이미 있는 단어는 건너뜀
//   [E]     초등 수준(VOCAB_E)        [M]     중학 수준(VOCAB_M)
//   [WF_E]  접미사 단어 초등(VOCAB_WF_E) [WF_M]  접미사 단어 중학(VOCAB_WF_M)
//   [NUM]   수 단어(VOCAB_NUM, 컴퓨터는 내지 않음)
const fs=require('fs'); const path=require('path');
const FILE=path.resolve(__dirname,'../vocab.js');
const LISTS={E:'VOCAB_E',M:'VOCAB_M',WF_E:'VOCAB_WF_E',WF_M:'VOCAB_WF_M',NUM:'VOCAB_NUM'};
const split=s=>s.split(/[|\n]/).map(x=>x.trim()).filter(Boolean);

function load(){
  const src=fs.readFileSync(FILE,'utf8');
  const m=new Function(src+';return {VOCAB_E,VOCAB_M,VOCAB_TB,VOCAB_DONGA,VOCAB_NUM,VOCAB_WF_E,VOCAB_WF_M}')();
  const where=new Map(); // 단어 → [목록, 뜻]
  for(const k of ['VOCAB_NUM','VOCAB_E','VOCAB_M','VOCAB_TB','VOCAB_WF_E','VOCAB_WF_M'])
    for(const e of split(m[k])){ const i=e.indexOf(' '); const w=e.slice(0,i).toLowerCase(); if(!where.has(w)) where.set(w,[k,e.slice(i+1)]); }
  for(const [w,ko] of m.VOCAB_DONGA) where.set(w,['VOCAB_DONGA',ko]);
  return {src,where};
}

const [cmd,...rest]=process.argv.slice(2);
const {src,where}=load();
if(cmd==='check'){
  const words=rest.flatMap(s=>s.split(/[\s,]+/)).map(w=>w.trim().toLowerCase()).filter(Boolean);
  const miss=words.filter(w=>!where.has(w));
  for(const w of words) if(where.has(w)) console.log(`있음  ${w.padEnd(14)} ${where.get(w)[0]}: ${where.get(w)[1]}`);
  console.log(`없음  ${miss.join(', ')||'-'}`);
}else if(cmd==='add'){
  const text=fs.readFileSync(rest[0],'utf8'); let out=src; const have=new Set(where.keys()); const report=[];
  for(const part of text.split(/^\[/m).slice(1)){
    const key=part.slice(0,part.indexOf(']')); const list=LISTS[key]; if(!list) throw new Error('알 수 없는 목록: '+key);
    const items=split(part.slice(part.indexOf(']')+1)).filter(s=>!s.startsWith('//'));
    const fresh=[], skipped=[];
    for(const s of items){ const w=s.split(' ')[0].toLowerCase(); if(!/^[a-z]+$/.test(w)||s.indexOf(' ')<0) throw new Error('형식 오류: '+s); (have.has(w)?skipped:fresh).push(s); have.add(w); }
    report.push(`${list}: +${fresh.length}${skipped.length?` (이미 있음: ${skipped.map(s=>s.split(' ')[0]).join(', ')})`:''}`);
    if(!fresh.length) continue;
    const start=out.indexOf(`const ${list} = \``); const end=out.indexOf('\n`;',start);
    out=out.slice(0,end)+'\n'+fresh.join('|')+out.slice(end);
  }
  new Function(out); // 문법 확인
  fs.writeFileSync(FILE,out); console.log(report.join('\n'));
}else{
  console.log('사용법: node tools/add-words.js check 단어… | add 파일.txt');
}
