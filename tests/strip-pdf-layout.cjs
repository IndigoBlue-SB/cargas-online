const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('server.js','utf8');
function extract(name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);}
const ctx={};vm.createContext(ctx);vm.runInContext(extract('normalizeStripPdfLayoutMetrics')+extract('drawMeasuredBingoCardKit'),ctx);
const cells=Array.from({length:27},(_,i)=>({box:{x:10+(i%9)*24,y:30+Math.floor(i/9)*22,width:23,height:20},style:{fontSize:16,borderWidth:1,radius:3,numberScale:1}}));
const metrics={page:{width:1000,height:700},blocks:[{box:{x:10,y:10,width:240,height:90},meta:{x:10,y:0,width:240,height:10},metaStyle:{fontSize:14},cards:[],cardDetails:[{box:{x:10,y:10,width:240,height:90},style:{borderWidth:2,radius:6},header:{box:{x:15,y:12,width:230,height:12},style:{fontSize:10}},cells}]}]};
const normalized=ctx.normalizeStripPdfLayoutMetrics(metrics,{width:500,height:350});
const detail=normalized.blocks[0].cardDetails[0];assert.equal(detail.cells[0].box.width,11.5);assert.equal(detail.cells[0].style.fontSize,8);assert.equal(detail.cells[0].style.borderWidth,0.5);assert.equal(detail.style.borderWidth,1);assert.equal(normalized.blocks[0].metaStyle.fontSize,7);
const calls=[],rects=[];let size=12;
const doc=new Proxy({_font:{capHeight:718},fontSize(n){size=n;return this;},widthOfString(s){return s.length*size*0.556;},text(s,x,y,options){calls.push({s,x,y,options,size});return this;},roundedRect(...args){rects.push(args);return this;}},{get:(target,key)=>key in target?target[key]:function(){return doc;}});
const rows=[[0,0,21,34,0,50,64,71,0],[0,13,29,39,42,59,0,0,0],[0,15,27,35,0,54,0,0,84]];
ctx.drawMeasuredBingoCardKit(doc,{cardNumber:45001,rows},detail,{fontFamily:'Arial',cellShape:'rounded'});
const numberCalls=calls.filter(c=>/^\d+$/.test(c.s));assert.deepEqual(numberCalls.map(c=>Number(c.s)),rows.flat().filter(Boolean));assert.ok(numberCalls.every(c=>c.options.width===undefined&&c.options.height===undefined&&c.options.lineBreak===false));assert.ok(numberCalls.every(c=>c.size===8));assert.ok(calls[0].s.includes('45001'));assert.ok(rects.length>=28);
console.log('PASS measured strip PDF: exact geometry, scaled fonts/borders and complete two-digit numbers without text-box clipping');
