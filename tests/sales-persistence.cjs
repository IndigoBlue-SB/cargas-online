const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os'),http=require('http');
const dir=fs.mkdtempSync(path.resolve('../sales-test-'));
process.env.DATA_DIR=dir;
fs.writeFileSync(path.join(dir,'db.json'),JSON.stringify({_bundleDataVersion:'2026-06-23-03',settings:{adminPassword:'test',recoveryPassword:'test'},users:[{name:'operadora',password:'test'}],events:[{id:'e1',name:'Evento 1',allowedUsers:['operadora'],sales:[{id:'old',desde:1,hasta:5}]},{id:'e2',name:'Evento 2',sales:[]}]}));
const {startServer}=require('../server');
(async()=>{
 const {server,port}=await startServer(0,'127.0.0.1');const root='http://127.0.0.1:'+port;
 async function login(role,name){const r=await fetch(root+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,name,password:'test'})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0]}
 const admin=await login('admin','Admin'), user=await login('user','operadora');
 async function state(cookie=admin){return (await fetch(root+'/api/state',{headers:{cookie}})).json()}
 async function save(events,version,cookie=admin){const r=await fetch(root+'/api/events',{method:'PUT',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({events,baseEventsVersion:version})});return {status:r.status,body:await r.json()}}
 try {
  const a=await state(),b=await state();assert.ok(a.eventsVersion);
  const next=structuredClone(a.events);next[0].sales=[{id:'new',desde:20,hasta:30}];
  assert.equal((await save(next,a.eventsVersion)).status,200);
  assert.equal((await save(b.events,b.eventsVersion)).status,409,'stale computer must not overwrite');
  assert.equal((await save(b.events)).status,409,'old app without a version must not overwrite');
  let current=await state();assert.equal(current.events[0].sales[0].id,'new');
  current.events[0].sales=[];assert.equal((await save(current.events,current.eventsVersion)).status,200);
  current=await state();assert.equal(current.events[0].sales.length,0,'deleted sales stay deleted');
  current.events[0].sales=[{id:'week2',desde:40,hasta:50}];assert.equal((await save(current.events,current.eventsVersion)).status,200);
  current=await state();assert.equal(current.events[0].sales[0].id,'week2');
  current.events[0].bingoClosure={status:'confirmed'};assert.equal((await save(current.events,current.eventsVersion)).status,200);
  let u=await state(user);u.events[0].sales=[];assert.equal((await save(u.events,u.eventsVersion,user)).status,403,'locked changes cannot silently succeed');
  current=await state();assert.equal(current.events[0].sales[0].id,'week2');
  current.events=current.events.filter(e=>e.id!=='e2');assert.equal((await save(current.events,current.eventsVersion)).status,200);
  assert.equal((await state()).events.length,1,'event deletion persists');
  current=await state();
  // Hold a request body open while a newer write completes: it must read the latest database before validation.
  const payload=JSON.stringify({events:current.events,baseEventsVersion:current.eventsVersion});
  let finish;const slow=new Promise((resolve,reject)=>{const req=http.request(root+'/api/events',{method:'PUT',headers:{Cookie:admin,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode))});req.on('error',reject);req.write(payload.slice(0,10));finish=()=>req.end(payload.slice(10));});
  await new Promise(r=>setTimeout(r,40));
  current.events[0].name='Evento nuevo';assert.equal((await save(current.events,current.eventsVersion)).status,200);
  finish();assert.equal(await slow,409,'overlapping request must not restore an earlier database');
  assert.equal((await state()).events[0].name,'Evento nuevo');
  console.log('PASS: delete, reload, new sales, stale computers, legacy tabs, permissions, event deletion and overlapping requests');
 } finally {await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
