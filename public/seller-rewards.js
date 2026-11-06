(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SellerRewards=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const key=name=>String(name||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('es');
 function settings(value={}){return {mode:value.mode==='quantity'?'quantity':'sheets',unitsPerTicket:Number(value.unitsPerTicket)||0};}
 function eligibility(sales=[],config={},sheetSize=10){
  const rule=settings(config),per=Math.max(1,Math.trunc(Number(sheetSize)||10)),groups=new Map();
  for(const sale of sales){const id=key(sale.seller);let from=Number(sale.desde),to=Number(sale.hasta);if(!id||!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<1||to<1)continue;
   if(!groups.has(id))groups.set(id,{key:id,seller:String(sale.seller).trim(),ranges:[]});groups.get(id).ranges.push([Math.min(from,to),Math.max(from,to)]);
  }
  return [...groups.values()].map(group=>{const merged=[];for(const range of group.ranges.sort((a,b)=>a[0]-b[0])){const last=merged.at(-1);if(last&&range[0]<=last[1]+1)last[1]=Math.max(last[1],range[1]);else merged.push([...range]);}
   const units=merged.reduce((s,r)=>s+r[1]-r[0]+1,0);let fullSheets=0;const sheets=[];
   for(const [from,to] of merged){const first=Math.ceil((from-1)/per)+1,last=Math.floor(to/per);if(last>=first){fullSheets+=last-first+1;if(fullSheets<=50000)for(let n=first;n<=last;n++)sheets.push(n);}}
   return {key:group.key,seller:group.seller,units,fullSheets,sheets,ticketCount:rule.mode==='quantity'?(rule.unitsPerTicket>0?Math.floor(units/rule.unitsPerTicket):0):fullSheets};
  }).sort((a,b)=>a.seller.localeCompare(b.seller,'es',{sensitivity:'base'})||a.seller.localeCompare(b.seller,'es'));
 }
 function signature(sales,config,sheetSize){const source=JSON.stringify({config:settings(config),sheetSize:Number(sheetSize)||10,sales:sales.map(s=>[String(s.id||''),key(s.seller),Number(s.desde),Number(s.hasta)]).sort((a,b)=>{const x=JSON.stringify(a),y=JSON.stringify(b);return x<y?-1:x>y?1:0})});let a=2166136261,b=3335557771;for(let i=0;i<source.length;i++){a=Math.imul(a^source.charCodeAt(i),16777619);b=Math.imul(b^source.charCodeAt(i),2246822519);}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
 function generate(rows,randomIndex){const eligible=rows.filter(row=>row.ticketCount>0),total=eligible.reduce((s,row)=>s+row.ticketCount,0);if(total>50000)throw Error('El limite es 50.000 numeros de participacion.');const tickets=[];let number=1;
  for(const row of eligible)tickets.push({number:number++,seller:row.seller,key:row.key,first:true});
  const remaining=[];for(const row of eligible)for(let i=1;i<row.ticketCount;i++)remaining.push(row);
  for(let i=remaining.length-1;i>0;i--){const j=randomIndex(i+1);[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
  for(const row of remaining)tickets.push({number:number++,seller:row.seller,key:row.key,first:false});return tickets;
 }
 return {settings,eligibility,signature,generate,key};
});
