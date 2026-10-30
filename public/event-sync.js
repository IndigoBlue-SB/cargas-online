(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.EventSync=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function diff(base,next){
    const before=new Map(base.map(e=>[e.id,e])),after=new Map(next.map(e=>[e.id,e]));const changes=[];
    for(const [id,event] of after){const old=before.get(id);if(!old){changes.push({id,create:copy(event)});continue;}const fields={};for(const key of new Set([...Object.keys(old),...Object.keys(event)])){if(key==='id'||key==='deletedSalesBackups')continue;if(!equal(old[key],event[key]))fields[key]={before:copy(old[key]),value:copy(event[key])};}if(Object.keys(fields).length)changes.push({id,fields});}
    for(const [id,event] of before)if(!after.has(id))changes.push({id,remove:copy(event)});
    return changes;
  }
  function mergeSales(before,value,current){
    if(![before,value,current].every(Array.isArray))throw Error('Formato de ventas invalido');
    const maps=[before,value,current].map(list=>new Map(list.map(s=>[s.id,s])));
    if([before,value,current].some((list,i)=>list.some(s=>!s.id)||maps[i].size!==list.length))throw Error('Identificadores de ventas invalidos');
    const [old,next,live]=maps;
    for(const id of new Set([...old.keys(),...next.keys()])){const a=old.get(id),b=next.get(id),c=live.get(id);if(equal(a,b))continue;if(!equal(c,a)&&!equal(c,b))throw Error('Otra persona modifico la misma venta.');if(b===undefined)live.delete(id);else live.set(id,copy(b));}
    return [...live.values()];
  }
  function apply(events,changes){const result=copy(events),acks=[];
    for(const change of changes){let index=result.findIndex(e=>e.id===change.id);if(change.create){if(index>=0){if(!equal(result[index],change.create))throw Error('El evento ya existe.');}else result.push(copy(change.create));acks.push({id:change.id,event:copy(change.create)});continue;}
      if(index<0){if(change.remove){acks.push({id:change.id,removed:true});continue;}throw Error('El evento fue eliminado por otra persona.');}
      if(change.remove){if(!equal(result[index],change.remove))throw Error('El evento cambio antes de eliminarlo.');result.splice(index,1);acks.push({id:change.id,removed:true});continue;}
      const event=result[index],fields={};
      for(const [key,entry] of Object.entries(change.fields||{})){if(['id','__proto__','prototype','constructor','deletedSalesBackups'].includes(key))throw Error('Campo de evento no permitido');let value=entry.value;if(!equal(event[key],entry.before)&&!equal(event[key],entry.value)){if(key==='sales')value=mergeSales(entry.before,entry.value,event[key]);else throw Error('Otra persona cambio '+key+' en '+event.name+'.');}if(value===undefined)delete event[key];else event[key]=copy(value);fields[key]=copy(value);}
      acks.push({id:change.id,fields});
    }return {events:result,acks};
  }
  return {copy,equal,diff,apply,mergeSales};
});
