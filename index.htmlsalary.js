/* SALARY ADD-ON v2 — index.html ke </body> se pehle: <script src="salary.js"></script> */
(function(){
if(window.__salv2)return;window.__salv2=1;
['sal-fab','sal-ov','sal-pop'].forEach(function(i){var x=document.getElementById(i);if(x)x.remove();}); // v1 hatao
var SHEET_URL='';            // optional: Apps Script URL
var KEY='salaryAddon_v1';    // same key = purana data safe
var db=load();
function load(){try{var d=JSON.parse(localStorage.getItem(KEY));if(d&&d.emps){d.adv=d.adv||[];d.rep=d.rep||[];d.months=d.months||{};return d;}}catch(e){}
  return {start:ym(new Date()),emps:[],months:{},adv:[],rep:[]};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){}push();}
function ym(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function addM(k,n){var p=k.split('-');return ym(new Date(+p[0],+p[1]-1+n,1));}
function mName(k){var p=k.split('-');return new Date(+p[0],+p[1]-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function inr(n){return '₹'+Math.round(n||0).toLocaleString('en-IN');}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function emp(id){return db.emps.filter(function(e){return e.id===id;})[0];}
function sum(a,f){return a.reduce(function(t,x){return t+f(x);},0);}
function today(){return new Date().toISOString().slice(0,10);}
function curM(){var c=ym(new Date());return c<db.start?db.start:c;}

function pending(id){return sum(db.adv.filter(function(a){return a.emp===id;}),function(a){return +a.amt;})-sum(db.rep.filter(function(r){return r.emp===id;}),function(r){return +r.amt;});}
function status(e){if(e.hold)return 'Hold';return pending(e.id)>0?'Pending':'Clear';}
function rec(m,id){
  var r=(db.months[m]||{})[id]||{leave:0,ot:0,ded:null,paid:false},e=emp(id);
  var due=Math.max(0,Math.min(+e.inst||0,pending(id)));
  var ded=r.paid?(+r.ded||0):(r.ded==null?due:+r.ded);
  var cut=(+e.basic/30)*(+r.leave||0),otAmt=(+r.ot||0)*(+e.otRate||0);
  return {leave:+r.leave||0,ot:+r.ot||0,paid:!!r.paid,ded:ded,due:due,cut:cut,otAmt:otAmt,net:(+e.basic)-cut+otAmt-ded};
}
function setRec(m,id,p){db.months[m]=db.months[m]||{};var r=db.months[m][id]||{leave:0,ot:0,ded:null,paid:false};for(var k in p)r[k]=p[k];db.months[m][id]=r;}
function monthsList(upTo){var o=[],k=db.start;while(k<=upTo){o.push(k);k=addM(k,1);}return o;}
function monthTotal(m){return sum(db.emps,function(e){return rec(m,e.id).net;});}
function estimate(n){var t=0;db.emps.forEach(function(e){var p=pending(e.id),d=0;for(var i=0;i<n;i++){d=Math.min(+e.inst||0,Math.max(p,0));p-=d;}t+=(+e.basic)-d;});return t;}
function distribute(m){
  db.emps.forEach(function(e){var r=rec(m,e.id);if(r.paid)return;
    if(r.ded>0)db.rep.push({id:uid(),emp:e.id,date:today(),amt:r.ded,method:'Salary deduction',month:m});
    if(r.ded<r.due)e.hold=true;
    setRec(m,e.id,{leave:r.leave,ot:r.ot,ded:r.ded,paid:true});});
  save();
}
function undoDist(m){
  if(db.months[m])Object.keys(db.months[m]).forEach(function(id){db.months[m][id].paid=false;});
  db.rep=db.rep.filter(function(r){return !(r.method==='Salary deduction'&&r.month===m);});
  save();
}
function push(){
  if(!SHEET_URL)return;var rows=[];
  Object.keys(db.months).sort().forEach(function(m){db.emps.forEach(function(e){if(!db.months[m][e.id])return;var r=rec(m,e.id);
    rows.push([m,e.name,+e.basic,r.leave,Math.round(r.cut),r.ot,Math.round(r.otAmt),r.ded,Math.round(r.net),r.paid?'Paid':'Open']);});});
  var body={action:'salary',tabs:{
    'Salary_Records':{head:['Month','Employee','Basic','Leave days','Leave cut','OT hrs','OT amount','Advance deduction','Net pay','Status'],rows:rows},
    'Salary_Advances':{head:['Date','Employee','Amount','Note','Given by'],rows:db.adv.map(function(a){return [a.date,(emp(a.emp)||{}).name,+a.amt,a.note||'',a.by||''];})},
    'Salary_Repayments':{head:['Date','Employee','Amount','Method'],rows:db.rep.map(function(r){return [r.date,(emp(r.emp)||{}).name,+r.amt,r.method];})}}};
  try{fetch(SHEET_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body)});}catch(e){}
}

var css='#sx-fab{position:fixed;right:14px;bottom:80px;z-index:9998;background:#14532d;color:#fff;border:0;border-radius:24px;padding:11px 16px;font:600 14px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3)}'
+'#sx-ov{position:fixed;inset:0;z-index:9999;background:#f6f7f4;color:#1c1f1a;font:14px/1.4 system-ui,sans-serif;display:none;flex-direction:column}#sx-ov.open{display:flex}'
+'.sx-top{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#14532d;color:#fff;font-weight:600}.sx-top button{background:none;border:0;color:#fff;font-size:22px}'
+'.sx-tabs{display:flex;gap:4px;padding:8px;background:#e7ebe3;overflow-x:auto}.sx-tabs button{flex:1;white-space:nowrap;border:0;border-radius:8px;padding:9px 12px;background:#fff;color:#1c1f1a;font-weight:600}.sx-tabs button.on{background:#14532d;color:#fff}'
+'.sx-body{flex:1;overflow:auto;padding:12px}.sx-card{background:#fff;border:1px solid #d9ddd4;border-radius:10px;padding:12px;margin-bottom:10px;color:#1c1f1a}'
+'.sx-big{font-size:28px;font-weight:700;color:#14532d}.sx-row{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid #eef0eb}.sx-row:last-child{border:0}'
+'.sx-card input,.sx-card select,.sx-body>select{width:100%;box-sizing:border-box;padding:9px;margin:4px 0 8px;border:1px solid #bfc5b9;border-radius:8px;font-size:14px;background:#fff;color:#1c1f1a}'
+'.sx-btn{background:#14532d;color:#fff;border:0;border-radius:8px;padding:10px 14px;font-weight:600;margin:2px 0}.sx-btn.alt{background:#fff;color:#14532d;border:1px solid #14532d}.sx-btn.red{background:#fff;color:#991b1b;border:1px solid #991b1b}'
+'.sx-tag{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600}.Clear{background:#dcfce7;color:#14532d}.Pending{background:#fef3c7;color:#92400e}.Hold{background:#fee2e2;color:#991b1b}'
+'.sx-emp{cursor:pointer}.sx-mod{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center}'
+'.sx-sheet{background:#f6f7f4;color:#1c1f1a;width:100%;max-width:560px;max-height:90vh;overflow:auto;border-radius:16px 16px 0 0;padding:14px;font:14px/1.4 system-ui,sans-serif}'
+'.sx-sheet table,.sx-body table{width:100%;border-collapse:collapse;font-size:12px}.sx-sheet th,.sx-sheet td,.sx-body th,.sx-body td{padding:6px 4px;border-bottom:1px solid #dfe3da;text-align:right}'
+'.sx-sheet th:first-child,.sx-sheet td:first-child,.sx-body th:first-child,.sx-body td:first-child{text-align:left}.sx-pos{color:#14532d}.sx-neg{color:#991b1b}.sx-x{background:none;border:0;color:#991b1b;font-size:16px}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
var fab=document.createElement('button');fab.id='sx-fab';fab.textContent='Salary';document.body.appendChild(fab);
var ov=document.createElement('div');ov.id='sx-ov';document.body.appendChild(ov);
var tab='dash',viewM=curM();
fab.onclick=function(){ov.classList.add('open');draw();};

function draw(){
  var tabs=[['dash','Dashboard'],['emps','Employees'],['adv','Advances'],['rep','Report']];
  ov.innerHTML='<div class="sx-top"><span>Salary &amp; Advances</span><button data-a="close">×</button></div><div class="sx-tabs">'
   +tabs.map(function(t){return '<button data-a="tab" data-v="'+t[0]+'" class="'+(tab===t[0]?'on':'')+'">'+t[1]+'</button>';}).join('')
   +'</div><div class="sx-body">'+({dash:vDash,emps:vEmps,adv:vAdv,rep:vRep}[tab])()+'</div>';
}
function monthPicker(){
  var last=addM(curM(),2),o='',k=db.start;while(k<=last){o+='<option value="'+k+'"'+(k===viewM?' selected':'')+'>'+mName(k)+'</option>';k=addM(k,1);}
  return '<select data-a="month">'+o+'</select>';
}
function vDash(){
  var cur=curM(),pend=sum(db.emps,function(e){return Math.max(0,pending(e.id));}),paid=db.emps.length&&db.emps.every(function(e){return rec(cur,e.id).paid;});
  var h='<div class="sx-card"><div>Pay amount, '+mName(cur)+'</div><div class="sx-big">'+inr(monthTotal(cur))+'</div><div>'+db.emps.length+' employees'+(paid?' · <b class="sx-pos">Paid ✓</b>':'')+'</div></div>';
  h+='<div class="sx-card"><b>Coming months (estimate)</b>';
  for(var i=1;i<=3;i++)h+='<div class="sx-row"><span>'+mName(addM(cur,i))+'</span><b>'+inr(estimate(i))+'</b></div>';
  h+='</div><div class="sx-card"><div>Advance outstanding</div><div class="sx-big">'+inr(pend)+'</div><div>'+db.emps.filter(function(e){return e.hold;}).length+' on Hold</div></div>';
  h+='<div class="sx-card">'+(paid?'<button class="sx-btn red" data-a="undo" data-v="'+cur+'">Undo distribution for '+mName(cur)+'</button>'
    :'<button class="sx-btn" data-a="dist" data-v="'+cur+'">Distribute salary for '+mName(cur)+'</button>')+'</div>';
  h+='<div class="sx-card"><button class="sx-btn alt" data-a="bk">Download backup</button> <button class="sx-btn alt" data-a="rs">Restore backup</button><input id="sx-f" type="file" accept=".json" style="display:none"></div>';
  return h;
}
function vEmps(){
  var h=monthPicker();
  h+=db.emps.map(function(e){var r=rec(viewM,e.id);
    return '<div class="sx-card sx-emp" data-a="open" data-v="'+e.id+'"><div class="sx-row"><b>'+esc(e.name)+'</b><span class="sx-tag '+status(e)+'">'+status(e)+'</span></div>'
    +'<div class="sx-row"><span>Net pay '+(r.paid?'(paid)':'')+'</span><b>'+inr(r.net)+'</b></div></div>';}).join('')||'<p>No employees yet. Add the first one below.</p>';
  h+='<div class="sx-card"><b>Add employee</b><input id="sx-n" placeholder="Name"><input id="sx-b" type="number" placeholder="Basic salary per month"><input id="sx-o" type="number" placeholder="Overtime rate per hour"><input id="sx-i" type="number" placeholder="Advance installment per month (optional)"><button class="sx-btn" data-a="addemp">Save employee</button></div>';
  return h;
}
function ops(){return db.emps.map(function(e){return '<option value="'+e.id+'">'+esc(e.name)+(e.hold?' (Hold)':'')+'</option>';}).join('');}
function vAdv(){
  var h='<div class="sx-card"><b>Give advance</b><select id="sx-ae">'+ops()+'</select><input id="sx-ad" type="date" value="'+today()+'"><input id="sx-aa" type="number" placeholder="Amount"><input id="sx-an" placeholder="Reason / note"><input id="sx-ab" placeholder="Given by"><button class="sx-btn" data-a="addadv">Save advance</button></div>';
  h+='<div class="sx-card"><b>Record repayment</b><select id="sx-re">'+ops()+'</select><input id="sx-rd" type="date" value="'+today()+'"><input id="sx-ra" type="number" placeholder="Amount"><select id="sx-rm"><option>Salary deduction</option><option>Cash</option><option>Bank transfer</option></select><button class="sx-btn" data-a="addrep">Save repayment</button></div>';
  h+='<div class="sx-card"><b>Balances</b>'+(db.emps.map(function(e){
    return '<div class="sx-row"><span>'+esc(e.name)+' <span class="sx-tag '+status(e)+'">'+status(e)+'</span></span><b>'+inr(Math.max(0,pending(e.id)))+'</b></div>'
    +(e.hold?'<div style="text-align:right"><button class="sx-btn alt" data-a="unhold" data-v="'+e.id+'">Clear Hold</button></div>':'');}).join('')||'No employees')+'</div>';
  var hist=db.adv.map(function(a){return {d:a.date,t:'Advance',e:a.emp,a:+a.amt,n:a.note,id:a.id,k:'adv'};}).concat(db.rep.map(function(r){return {d:r.date,t:'Repaid',e:r.emp,a:+r.amt,n:r.method,id:r.id,k:'rep'};})).sort(function(x,y){return String(y.d).localeCompare(String(x.d));}).slice(0,25);
  h+='<div class="sx-card"><b>Recent entries</b>'+(hist.length?'<table><tr><th>Date</th><th>Who</th><th>Type</th><th>Amount</th><th></th></tr>'+hist.map(function(x){return '<tr><td>'+esc(x.d)+'</td><td>'+esc((emp(x.e)||{}).name)+'</td><td>'+x.t+'</td><td>'+inr(x.a)+'</td><td><button class="sx-x" data-a="delent" data-k="'+x.k+'" data-v="'+x.id+'">✕</button></td></tr>';}).join('')+'</table>':'<p>No entries.</p>')+'</div>';
  return h;
}
function vRep(){
  var h='<div class="sx-card"><b>Monthly report</b><table><tr><th>Month</th><th>Basic</th><th>Leave cut</th><th>OT</th><th>Advance</th><th>Net</th></tr>';
  monthsList(curM()).forEach(function(m){
    h+='<tr><td>'+mName(m)+'</td><td>'+inr(sum(db.emps,function(e){return +e.basic;}))+'</td><td>'+inr(sum(db.emps,function(e){return rec(m,e.id).cut;}))+'</td><td>'+inr(sum(db.emps,function(e){return rec(m,e.id).otAmt;}))+'</td><td>'+inr(sum(db.emps,function(e){return rec(m,e.id).ded;}))+'</td><td><b>'+inr(monthTotal(m))+'</b></td></tr>';});
  return h+'</table></div>';
}
function profile(id){
  var old=document.getElementById('sx-pop');if(old)old.remove();
  var e=emp(id),r=rec(viewM,id),m=document.createElement('div');m.className='sx-mod';m.id='sx-pop';
  var rowsH=monthsList(viewM).map(function(k){var x=rec(k,id);return '<tr><td>'+k+'</td><td>'+x.leave+'</td><td>'+inr(x.cut)+'</td><td>'+x.ot+'</td><td>'+inr(x.otAmt)+'</td><td>'+inr(x.ded)+'</td><td><b>'+inr(x.net)+'</b></td></tr>';}).join('');
  var dis=r.paid?' disabled':'';
  m.innerHTML='<div class="sx-sheet"><div class="sx-row"><b style="font-size:17px">'+esc(e.name)+'</b><button class="sx-btn alt" data-a="closepop">Close</button></div>'
  +'<div>'+mName(viewM)+' · <span class="sx-tag '+status(e)+'">'+status(e)+'</span> · Advance pending '+inr(Math.max(0,pending(id)))+'</div>'
  +'<div class="sx-card" style="margin-top:10px"><div class="sx-row"><span>Basic salary</span><b>'+inr(e.basic)+'</b></div>'
  +'<label>Leave days</label><input id="sx-pl" type="number" min="0" value="'+r.leave+'"'+dis+'><div class="sx-row"><span>Leave cut</span><b class="sx-neg">− '+inr(r.cut)+'</b></div>'
  +'<label>Overtime hours</label><input id="sx-po" type="number" min="0" value="'+r.ot+'"'+dis+'><div class="sx-row"><span>Overtime amount</span><b class="sx-pos">+ '+inr(r.otAmt)+'</b></div>'
  +'<label>Advance deduction</label><input id="sx-pd" type="number" min="0" value="'+r.ded+'"'+dis+'><div class="sx-row"><span>Net pay</span><b style="font-size:18px">'+inr(r.net)+'</b></div>'
  +(r.paid?'<p>This month is already paid.</p>':'<button class="sx-btn" data-a="savepro" data-v="'+id+'">Save this month</button>')
  +'<div style="margin-top:8px"><button class="sx-btn alt" data-a="editemp" data-v="'+id+'">Edit employee</button> <button class="sx-btn red" data-a="delemp" data-v="'+id+'">Delete</button></div></div>'
  +'<div class="sx-card" style="overflow:auto"><b>Month report</b><table><tr><th>Month</th><th>Leave</th><th>Cut</th><th>OT hrs</th><th>OT ₹</th><th>Adv</th><th>Net</th></tr>'+rowsH+'</table></div></div>';
  document.body.appendChild(m);
}
function V(i){return document.getElementById(i).value;}
function pop(){var p=document.getElementById('sx-pop');if(p)p.remove();}
function act(ev){
  var t=ev.target.closest('[data-a]');if(!t)return;var a=t.dataset.a,v=t.dataset.v;
  if(a==='close')ov.classList.remove('open');
  else if(a==='tab'){tab=v;draw();}
  else if(a==='open')profile(v);
  else if(a==='closepop'){pop();draw();}
  else if(a==='dist'){if(confirm('Distribute salary for '+mName(v)+'? Deductions will be recorded.')){distribute(v);draw();}}
  else if(a==='undo'){if(confirm('Undo distribution for '+mName(v)+'? Deductions will be reversed.')){undoDist(v);draw();}}
  else if(a==='addemp'){
    if(!V('sx-n').trim()||!(+V('sx-b'))){alert('Enter name and basic salary.');return;}
    db.emps.push({id:uid(),name:V('sx-n').trim(),basic:+V('sx-b'),otRate:+V('sx-o')||0,inst:+V('sx-i')||0,hold:false});save();draw();}
  else if(a==='addadv'){
    var e=emp(V('sx-ae'));if(!e||!(+V('sx-aa'))){alert('Choose employee and amount.');return;}
    if(e.hold){alert(e.name+' is on Hold. Clear the Hold before giving a new advance.');return;}
    db.adv.push({id:uid(),emp:e.id,date:V('sx-ad'),amt:+V('sx-aa'),note:V('sx-an'),by:V('sx-ab')});save();draw();}
  else if(a==='addrep'){
    var e2=emp(V('sx-re'));if(!e2||!(+V('sx-ra'))){alert('Choose employee and amount.');return;}
    db.rep.push({id:uid(),emp:e2.id,date:V('sx-rd'),amt:+V('sx-ra'),method:V('sx-rm')});save();draw();}
  else if(a==='unhold'){emp(v).hold=false;save();draw();}
  else if(a==='delent'){if(confirm('Delete this entry?')){var k=t.dataset.k;db[k]=db[k].filter(function(x){return x.id!==v;});save();draw();}}
  else if(a==='savepro'){
    setRec(viewM,v,{leave:+V('sx-pl')||0,ot:+V('sx-po')||0,ded:+V('sx-pd')||0});save();profile(v);draw();}
  else if(a==='editemp'){
    var x=emp(v),n=prompt('Name',x.name);if(n==null)return;var b=prompt('Basic salary',x.basic);if(b==null)return;
    var o=prompt('Overtime rate per hour',x.otRate);if(o==null)return;var i=prompt('Advance installment per month',x.inst);if(i==null)return;
    if(!n.trim()||!(+b)){alert('Name and basic are required.');return;}
    x.name=n.trim();x.basic=+b;x.otRate=+o||0;x.inst=+i||0;save();profile(v);draw();}
  else if(a==='delemp'){
    if(confirm('Delete this employee and ALL their advances/repayments/month records?')){
      db.emps=db.emps.filter(function(x){return x.id!==v;});db.adv=db.adv.filter(function(x){return x.emp!==v;});db.rep=db.rep.filter(function(x){return x.emp!==v;});
      Object.keys(db.months).forEach(function(m){delete db.months[m][v];});save();pop();draw();}}
  else if(a==='bk'){var l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));l.download='salary_backup_'+today()+'.json';l.click();}
  else if(a==='rs'){var f=document.getElementById('sx-f');f.onchange=function(){var fr=new FileReader();fr.onload=function(){try{var d=JSON.parse(fr.result);if(!d.emps)throw 0;db=d;db.adv=db.adv||[];db.rep=db.rep||[];db.months=db.months||{};save();draw();alert('Restored');}catch(e){alert('Invalid file');}};fr.readAsText(f.files[0]);};f.click();}
}
ov.addEventListener('click',act);
document.addEventListener('click',function(ev){if(ev.target.closest('#sx-pop'))act(ev);});
ov.addEventListener('change',function(ev){if(ev.target.dataset.a==='month'){viewM=ev.target.value;draw();}});
})();
