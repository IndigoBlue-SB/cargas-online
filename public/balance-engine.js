(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BalanceEngine=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const n=v=>Number(v)||0;
 const pct=(amount,percent)=>amount*n(percent)/100;
 const payer=(value,fallback='shared')=>['shared','institution','indigo'].includes(value)?value:fallback;
 function adminAmount(balance,item){
  const units=Math.max(0,n(item.units)),mode=item.commissionMode||'sales';
  if(mode==='sales'&&item.automatic&&item.amount!==undefined)return n(item.amount);
  if(mode==='fixed'||(mode==='sales'&&n(item.fixed)>0))return units*n(item.fixed);
  return units*pct(n(balance.price),item.percent);
 }
 function calculate(balance){
  const gross=n(balance.units)*n(balance.price),sellerCommission=pct(gross,balance.sellerPercent);
  const adminsCommission=(balance.admins||[]).reduce((s,a)=>s+adminAmount(balance,a),0);
  const costs={shared:0,institution:0,indigo:0},prizeCosts={shared:0,institution:0,indigo:0},expenseCosts={shared:0,institution:0,indigo:0};
  for(const line of balance.prizesList||[]){const who=payer(line.payer);prizeCosts[who]+=n(line.amount);costs[who]+=n(line.amount);}
  for(const [lines,fallback] of [[balance.expenses,'shared'],[balance.indigoExpenses,'indigo']])for(const line of lines||[]){const who=payer(line.payer,fallback);expenseCosts[who]+=n(line.amount);costs[who]+=n(line.amount);}
  const prizes=Object.values(prizeCosts).reduce((a,b)=>a+b,0),expenses=Object.values(expenseCosts).reduce((a,b)=>a+b,0);
  const afterSellers=gross-sellerCommission,afterAdmins=afterSellers-adminsCommission;
  const income=afterAdmins-costs.shared,noeAmount=pct(income,balance.noePercent),afterNoe=income-noeAmount;
  const mode=balance.indigoMode==='sales'?'sales':'result';
  const indigoAmount=pct(mode==='sales'?gross:afterNoe,balance.indigoPercent==null?50:balance.indigoPercent);
  const institutionGross=afterNoe-indigoAmount,institutionAmount=institutionGross-costs.institution;
  const indigoNetAmount=indigoAmount-costs.indigo;
  const giseAmount=pct(indigoNetAmount,balance.gisePercent),laureanoAmount=pct(indigoNetAmount,balance.laureanoPercent);
  return {gross,sellerCommission,adminsCommission,adminGeneralCommission:0,commissions:sellerCommission+adminsCommission,prizes,expenses,ordinaryExpenses:(balance.expenses||[]).reduce((s,x)=>s+n(x.amount),0),income,subtotal:income,noeAmount,afterNoe,afterSellers,afterAdmins,sharedCosts:costs.shared,institutionCosts:costs.institution,indigoExpenses:costs.indigo,prizeCosts,expenseCosts,institutionGross,institutionAmount,indigoAmount,indigoNetAmount,giseAmount,laureanoAmount,extraPercents:giseAmount+laureanoAmount,result:indigoNetAmount,mode};
 }
 return {calculate,adminAmount,payer};
});
