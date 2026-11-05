(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DuplicateSales=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function analyze(sales=[]){
  const points=new Map(),entries=new Map();
  function mark(at,index,add){if(!points.has(at))points.set(at,[]);points.get(at).push({index,add});}
  sales.forEach((sale,index)=>{let start=Number(sale.desde),end=Number(sale.hasta);if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<1||end<1)return;[start,end]=[Math.min(start,end),Math.max(start,end)];if(end>=Number.MAX_SAFE_INTEGER)return;
   entries.set(index,{saleId:String(sale.id||''),loadId:String(sale.batchId||sale.id||''),seller:String(sale.seller||'Sin vendedor'),town:String(sale.town||''),province:String(sale.province||''),from:start,to:end,virtualSheetId:sale.virtualSheetId||'',date:sale.date||''});mark(start,index,true);mark(end+1,index,false);
  });
  const active=new Set(),ranges=[];let previous=null,count=0,extraOccurrences=0;
  for(const at of [...points.keys()].sort((a,b)=>a-b)){
   if(previous!==null&&at>previous&&active.size>1){const length=at-previous;count+=length;extraOccurrences+=length*(active.size-1);ranges.push({from:previous,to:at-1,entries:[...active].map(index=>entries.get(index))});}
   for(const change of points.get(at))if(change.add)active.add(change.index);else active.delete(change.index);
   previous=at;
  }
  return {count,extraOccurrences,ranges};
 }
 function owners(report,number){const range=report.ranges.find(range=>number>=range.from&&number<=range.to);return range?range.entries:[];}
 function page(report,offset=0,limit=100){const numbers=[];let skip=Math.max(0,offset);for(const range of report.ranges){const length=range.to-range.from+1;if(skip>=length){skip-=length;continue;}for(let n=range.from+skip;n<=range.to&&numbers.length<limit;n++)numbers.push(n);skip=0;if(numbers.length===limit)break;}return numbers;}
 return {analyze,owners,page};
});
