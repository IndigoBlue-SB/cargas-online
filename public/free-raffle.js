(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FreeRaffle=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const limit=50000;
 function parse(text,type,options={}){const values=[];const source=String(text).replace(/^\uFEFF/,'');
  if(type==='names'){
   for(let line of source.split(/\r?\n/)){line=line.trim();if(!line)continue;
    const first=line.match(/^"((?:[^"]|"")*)"(?:[,;\t]|$)/);
    const name=(first?first[1].replace(/""/g,'"'):line.split(options.csv ? /[,;\t]/ : /[;\t]/)[0]).trim();
    if(!values.length&&/^(nombre|name|participante|participant)$/i.test(name))continue;
    if(name.length>200)throw Error('Cada nombre puede tener hasta 200 caracteres.');
    values.push({id:'name:'+name.normalize('NFC').toLocaleLowerCase('es'),label:name});
    if(values.length>limit)throw Error('El limite es 50.000 participantes.');
   }
  }else{
   for(let token of source.split(/[\s,;]+/)){token=token.replace(/^"|"$/g,'');if(!token||/^(numero|number|serie|series|participante)$/i.test(token))continue;
    const match=token.match(/^(\d+)(?:-(\d+))?$/);if(!match)throw Error('Usa numeros o rangos, por ejemplo 1-100.');
    const start=Number(match[1]),end=match[2]?Number(match[2]):start;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start||end-start+1>limit)throw Error('Rango invalido o demasiado grande.');
    for(let value=start;value<=end;value++)values.push({id:'number:'+value,label:String(value)});
    if(values.length>limit)throw Error('El limite es 50.000 participantes.');
   }
  }
  const unique=[...new Map(values.map(item=>[item.id,item])).values()];if(unique.length>limit)throw Error('El limite es 50.000 participantes.');return unique;
 }
 return {parse,limit};
});
