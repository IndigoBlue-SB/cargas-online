const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/bingo90/app.js','utf8');
function extract(name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);}
let storedScale,saveCount=0;
const destination={eventSeed:'destination-seed',cards:[{id:'official-card'}],stripDesign:{cellSize:37,cellWidth:28,printContentScale:0.55,backgroundImageData:'destination-image',backgroundImageName:'Bingo6000.jpg'}};
const sourceEvent={id:'source',stripDesign:{cellWidth:28,contentScalePercent:55,gap:736,rowGap:2,cardScale:222,cellSize:37,fontSize:28,backgroundImageData:'source-image'}};
const ctx={state:destination,els:{stripPreview:{style:{setProperty:(name,value)=>storedScale=value}},stripCopySourceInput:{value:'source'}},clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),clonePlain:v=>structuredClone(v),createDefaultStripDesign:()=>({fitToPage:true}),loadSavedEvents:()=>[sourceEvent],fillStripDesigner(){},renderStripPreview(){},persistEventDesign(){saveCount++;},window:{alert(){throw Error('unexpected alert');}}};
vm.createContext(ctx);vm.runInContext(extract('initializeStripCellGeometry')+extract('updateStripContentFitScale')+extract('copyStripParameters'),ctx);
vm.runInContext('initializeStripCellGeometry()',ctx);assert.equal(destination.stripDesign.contentScalePercent,55);
for(const legacy of [{fitCellHeight:18,fitGeometry:{gap:8}},{fitCellHeight:42,fitGeometry:{gap:1000}}]){
 ctx.state.stripDesign={...structuredClone(sourceEvent.stripDesign),...legacy};vm.runInContext('updateStripContentFitScale()',ctx);assert.equal(storedScale,'0.55');assert.equal(ctx.state.stripDesign.fitGeometry,undefined);assert.equal(ctx.state.stripDesign.fitCellHeight,undefined);
}
ctx.state.stripDesign=structuredClone(destination.stripDesign);ctx.state.stripDesign.backgroundImageData='destination-image';ctx.state.stripDesign.backgroundImageName='Bingo6000.jpg';
vm.runInContext('copyStripParameters()',ctx);assert.equal(ctx.state.stripDesign.backgroundImageData,'destination-image');assert.equal(ctx.state.stripDesign.backgroundImageName,'Bingo6000.jpg');assert.equal(ctx.state.stripDesign.cardScale,222);assert.equal(ctx.state.stripDesign.contentScalePercent,55);assert.equal(ctx.state.eventSeed,'destination-seed');assert.equal(ctx.state.cards[0].id,'official-card');assert.equal(saveCount,1);
console.log('PASS explicit strip geometry: legacy scale migration, history independence and parameter copying preserves destination background and combinations');
