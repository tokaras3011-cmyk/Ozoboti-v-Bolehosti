import { game, bind, bindLet } from './context.js';
import * as THREE from 'three';
import { MAP } from '../mapdata.js';

export const api = {};


export function initMinimapa() {
/* Minimapa */
const mini=game.$('mini'),mctx=mini.getContext('2d');
const spanX=game.RX1-game.RX0,spanZ=game.RZ1-game.RZ0,MS=Math.min(0.42,210/spanX,250/spanZ);
mini.width=Math.round((game.RX1-game.RX0)*MS);mini.height=Math.round((game.RZ1-game.RZ0)*MS);
const mm=(x,z)=>[(game.RX1-x)*MS,(game.RZ1-z)*MS];
const miniBase=document.createElement('canvas');miniBase.width=mini.width;miniBase.height=mini.height;
{
  const g=miniBase.getContext('2d');g.fillStyle='#bfe6a0';g.fillRect(0,0,miniBase.width,miniBase.height);
  g.fillStyle='#4aa8ff';game.M.W.forEach(([n,p])=>{g.beginPath();for(let i=0;i<p.length;i+=2){const [a,b]=mm(p[i],p[i+1]);i?g.lineTo(a,b):g.moveTo(a,b)}g.fill()});
  g.strokeStyle='#4aa8ff';g.lineWidth=1;game.M.ST.forEach(p=>{g.beginPath();for(let i=0;i<p.length;i+=2){const [a,b]=mm(p[i],p[i+1]);i?g.lineTo(a,b):g.moveTo(a,b)}g.stroke()});
  game.M.R.forEach(([k,p])=>{g.strokeStyle=k?'#b99a66':'#fff';g.lineWidth=k?1:2.2;g.beginPath();for(let i=0;i<p.length;i+=2){const [a,b]=mm(p[i],p[i+1]);i?g.lineTo(a,b):g.moveTo(a,b)}g.stroke()});
  game.M.B.forEach(b=>{const [a,c]=mm(b[0],b[1]);g.fillStyle=b[5]===2?'#e04030':b[5]===3?'#e0b000':'#8a7a6a';g.fillRect(a-1.5,c-1.5,3,3)});
  g.font='bold 10px Arial';g.fillStyle='#124';game.M.LM.forEach(([n,x,z])=>{const [a,b]=mm(x,z);g.fillText(n,a+4,b-3)});
  g.strokeStyle='#e23b2b';g.lineWidth=4;g.strokeRect(2,2,miniBase.width-4,miniBase.height-4);
}
function drawMini(){
  mctx.drawImage(miniBase,0,0);
  const dot=(x,z,c,r)=>{const [a,b]=mm(x,z);mctx.fillStyle=c;mctx.beginPath();mctx.arc(a,b,r,0,7);mctx.fill()};
  dot(game.H.x,game.H.z,'#ffe94a',5);game.garages.forEach(h=>dot(h.x,h.z,'#ff4fb8',3.5));dot(game.PAST.x,game.PAST.z,'#ffb000',5);
  game.robots.forEach(r=>{if(r.alive&&Math.hypot(r.x-game.pv.x,r.z-game.pv.z)<60)dot(r.x,r.z,r.quest?'#ff4fb8':'#'+r.lm.color.getHexString(),r.quest?4:2.6)});
  game.traps.forEach(t=>dot(t.x,t.z,'#22ffee',3));
  const [a,b]=mm(game.pv.x,game.pv.z);
  mctx.strokeStyle='#ffffff99';mctx.lineWidth=1;mctx.beginPath();mctx.arc(a,b,60*MS,0,7);mctx.stroke();
  mctx.fillStyle='#fff';mctx.strokeStyle='#000';mctx.lineWidth=2;mctx.beginPath();mctx.arc(a,b,5,0,7);mctx.fill();mctx.stroke();
  mctx.strokeStyle='#e00';mctx.beginPath();mctx.moveTo(a,b);mctx.lineTo(a-Math.sin(game.pv.face)*12,b-Math.cos(game.pv.face)*12);mctx.stroke();
}



  bind(game, "drawMini", () => drawMini);
  bind(game, "mini", () => mini);
}

export function initVelkaMapaKlikNaMinimapuNeboKlavesaN() {
/* Velká mapa (klik na minimapu nebo klávesa N) */
let bigOpen=false,bigBase=null,bigK=1,mayorIt=null;
const bigEl=game.$('bigmap'),bigC=game.$('bigc'),bgx=bigC.getContext('2d');
function bigP(x,z){return[(game.RX1-x)*bigK,(game.RZ1-z)*bigK]}
function halo(g,t,x,y,col,font){g.font=font;g.lineWidth=4;g.strokeStyle='#fffe';g.strokeText(t,x,y);g.fillStyle=col;g.fillText(t,x,y)}
function buildBig(){
  const asp=(game.RX1-game.RX0)/(game.RZ1-game.RZ0);
  const IH=Math.max(innerHeight,400),IW=Math.max(innerWidth,300),h=Math.floor(Math.min(IH*0.9,IW*0.95/asp)),w=Math.floor(h*asp);
  bigK=h/(game.RZ1-game.RZ0);bigC.width=w;bigC.height=h;
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),k=bigK;
  g.fillStyle='#cdebb0';g.fillRect(0,0,w,h);
  const poly=(pts,fill)=>{g.beginPath();for(let i=0;i<pts.length;i+=2){const[a,b]=bigP(pts[i],pts[i+1]);i?g.lineTo(a,b):g.moveTo(a,b)}if(fill)g.fill();else g.stroke()};
  g.fillStyle='#5ab4ff';game.M.W.forEach(([n,p])=>poly(p,true));
  g.strokeStyle='#5ab4ff';g.lineWidth=Math.max(2,1.4*k);g.lineJoin='round';game.M.ST.forEach(p=>poly(p,false));
  g.lineCap='round';
  game.M.R.forEach(([kk,p])=>{g.strokeStyle=kk?'#b99a66':'#ffffff';g.lineWidth=(kk?1.8:3.6)*k;poly(p,false)});
  game.M.B.forEach(b=>{
    const[a,d]=bigP(b[0],b[1]);g.save();g.translate(a,d);g.rotate(b[4]);
    g.fillStyle=b[5]===2?'#e04030':b[5]===3?'#e0b000':b[5]===1?'#a89880':'#8a7a6a';
    g.fillRect(-b[2]*k/2,-b[3]*k/2,b[2]*k,b[3]*k);g.restore();
  });
  g.textAlign='center';
  game.M.LM.forEach(([n,x,z])=>{const[a,b]=bigP(x,z);halo(g,n,a,b-6,/Nadýmač|Baba|Nebeský/.test(n)?'#0a5aa8':'#8a1a10','bold 15px Segoe UI,Arial')});
  MAP.PLACES.forEach(p=>{const[a,b]=bigP(p.x,p.z);g.fillStyle='#1a6a2a';g.beginPath();g.arc(a,b,4,0,7);g.fill();halo(g,p.n+(p.approx?' *':''),a,b-8,'#14501e','bold 14px Segoe UI,Arial')});
  // legenda
  g.textAlign='left';  g.fillStyle='#fffd';g.fillRect(8,8,300,140);g.strokeStyle='#789';g.lineWidth=1;g.strokeRect(8,8,300,140);
  g.font='bold 13px Segoe UI,Arial';g.fillStyle='#123';
  [['#ffe94a','Domov'],['#ff4fb8','Robo-garáže sousedů (zloději, psi!)'],['#ffb000','Pastvina s býkem a duhovými Ozoboty'],['#ffffff','Ty (šipka = kam koukáš)'],['#22d0c0','Pasti / cíl události či mise'],['#e23b2b','Červený okraj = dál už to nejde']].forEach(([c2,t],i)=>{g.fillStyle=c2;g.strokeStyle='#000';g.lineWidth=1.5;g.beginPath();g.arc(22,24+i*21,6,0,7);g.fill();g.stroke();g.fillStyle='#123';g.fillText(t,36,29+i*21)});
  g.strokeStyle='#e23b2b';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
  bigBase=c;
}
function drawBig(){
  if(!bigBase||!bigBase.width)return;
  bgx.drawImage(bigBase,0,0);const g=bgx,k=bigK;
  const dot=(x,z,c,r,st)=>{const[a,b]=bigP(x,z);g.fillStyle=c;g.beginPath();g.arc(a,b,r,0,7);g.fill();g.strokeStyle=st||'#000';g.lineWidth=2;g.stroke()};
  dot(game.H.x,game.H.z,'#ffe94a',9);halo(g,'DOMOV',bigP(game.H.x,game.H.z)[0],bigP(game.H.x,game.H.z)[1]-12,'#7a5a00','bold 15px Segoe UI,Arial');
  game.garages.forEach(h=>dot(h.x,h.z,'#ff4fb8',6));dot(game.PAST.x,game.PAST.z,'#ffb000',9);
  if(!mayorIt)mayorIt=game.interact.find(i=>/starost/i.test(i.text()));
  if(mayorIt){const[a,b]=bigP(mayorIt.x,mayorIt.z);halo(g,'🎩 Starosta',a,b-8,'#5a3a00','bold 13px Segoe UI,Arial')}
  game.traps.forEach(t=>dot(t.x,t.z,'#22ffee',6));
  // radar – Ozoboti do 60 jednotek
  game.robots.forEach(r=>{if(r.alive&&Math.hypot(r.x-game.pv.x,r.z-game.pv.z)<60)dot(r.x,r.z,r.quest?'#ff4fb8':'#'+r.lm.color.getHexString(),r.quest?7:5)});
  const[pa,pb]=bigP(game.pv.x,game.pv.z);
  g.strokeStyle='#ffffffcc';g.lineWidth=2;g.setLineDash([6,6]);g.beginPath();g.arc(pa,pb,60*k,0,7);g.stroke();g.setLineDash([]);
  // cíle
  const tg=game.X.compassTarget(),vm=game.S&&game.S.missions.find(m=>m.k==='visit'&&!m.done),pulse=8+4*Math.sin(game.time*5);
  [tg,vm&&{x:vm.x,z:vm.z}].forEach(t=>{if(!t)return;const[a,b]=bigP(t.x,t.z);g.strokeStyle='#22d0c0';g.lineWidth=4;g.beginPath();g.arc(a,b,pulse+8,0,7);g.stroke();g.fillStyle='#22d0c0';g.beginPath();g.arc(a,b,5,0,7);g.fill()});
  // hráč – šipka
  g.save();g.translate(pa,pb);g.rotate(-game.pv.face); // x i z jsou na mapě zrcadlově
  g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=3;g.beginPath();g.moveTo(0,-14);g.lineTo(9,10);g.lineTo(0,5);g.lineTo(-9,10);g.closePath();g.fill();g.stroke();g.restore();
}
function toggleBig(){
  bigOpen=!bigOpen;
  if(bigOpen){buildBig();bigEl.style.display='flex';drawBig()}else bigEl.style.display='none';
}
game.mini.addEventListener('click',()=>{if(game.started)toggleBig()});
bigEl.addEventListener('click',toggleBig);
addEventListener('resize',()=>{if(bigOpen){buildBig();drawBig()}});


  bindLet(game, "bigOpen", () => bigOpen, (v) => { bigOpen = v; });
  bind(game, "drawBig", () => drawBig);
  bind(game, "toggleBig", () => toggleBig);
}

export function initHud() {
/* HUD */
function refreshCarry(){
  while(game.carryGroup.children.length)game.carryGroup.remove(game.carryGroup.children[0]);
  const list=game.carry.slice(0,16),gap=0.75;
  list.forEach((it,i)=>{
    const d=game.ROB[it.id],m=new THREE.Mesh(new THREE.SphereGeometry(0.34,10,8),new THREE.MeshBasicMaterial({color:it.id==='duha'?0xffffff:d.c}));
    m.position.set((i-(list.length-1)/2)*gap,0,0);m.userData.id=it.id;m.userData.bx=m.position.x;game.carryGroup.add(m);
  });
}
function refreshHud(){
  if(!game.S)return;
  game.$('money').textContent='⚡'+game.fmt(game.S.money);
  game.$('stats').innerHTML='👟 rychlost '+(game.speed()*(game.veh()?game.veh().mult:1)).toFixed(1)+'<br>📦 Ozoboti '+game.carry.length+'/'+game.cap()+(game.S.pets.some(x=>x)?'<br>🤖 příjem '+game.income().toFixed(1)+' ⚡/s':'');
  game.$('who').innerHTML='👤 '+game.S.name.replace(/</g,'&lt;')+'  <span style="font-size:16px">⭐'+game.S.stars+'</span><br><span style="font-size:16px">🎯 chyceno: '+game.S.caught+'</span><br><button id="albbtn">📖 Album (Q)</button><button id="chg">Změnit hráče</button>';
  game.$('albbtn').onclick=game.albumModal;game.$('chg').onclick=()=>{game.save();location.reload()};
  game.$('missions').innerHTML=game.X.missionsHtml()||'<div style="font-size:12px;opacity:.85">DENNÍ MISE</div>'+game.S.missions.map(m=>'<div class="'+(m.done?'done':'')+'">• '+game.missionText(m)+(m.done?'':' ('+Math.floor(m.p)+'/'+m.n+')')+'</div>').join('');
  const col=[0xffffff,0x5dff3a,0x3ad0ff,0xc06bff,0xffd21a,0xff5a5a][Math.min(game.S.aura,5)];
  game.aura.visible=game.S.aura>0;game.aura.material.color.setHex(col);
  const ic=game.S.items,vv=game.veh();
  game.$('slots').innerHTML=[['1','🧲','Magnet',ic.magnet,game.magnetT>0],['2','❄️','Zmraz',ic.freeze,false],['3','🪤','Past',ic.trap,false]].map(([k,e,n,c,on])=>'<div class="slot'+(c>0?'':' off')+(on?' on':'')+'">'+e+'<b>×'+c+'</b>'+n+' ['+k+']</div>').join('')
    +'<div class="slot'+(game.S.vehs.length?'':' off')+(vv?' on':'')+'">'+(vv?vv.icon:'🚶')+'<b>'+(vv?'':'pěšky')+'</b>'+(vv?vv.n:'Vozidlo')+' [V]</div>';
}

/* Pomocní roboti za hráčem */
let petMeshes=[];
function rebuildPets(){
  petMeshes.forEach(p=>game.scene.remove(p));petMeshes=[];
  const list=[];game.S.pets.forEach((c,i)=>{for(let k=0;k<Math.min(c,3);k++)list.push(i)});
  list.sort((a,b)=>game.HELP[b].inc-game.HELP[a].inc).slice(0,9).forEach(i=>{
    const g=game.makeHelper(i);g.position.set(game.pv.x,game.gy(game.pv.x,game.pv.z),game.pv.z);game.scene.add(g);petMeshes.push(g);
  });
}

/* Jiskry */
const sparks=[];
const sparkGeo=new THREE.BoxGeometry(0.22,0.22,0.22);
function burst(x,y,z,color,n=16){
  for(let i=0;i<n;i++){
    const m=new THREE.Mesh(sparkGeo,new THREE.MeshBasicMaterial({color:color===0xffffff?new THREE.Color().setHSL(Math.random(),1,0.6):color,transparent:true}));
    m.position.set(x,y,z);game.scene.add(m);
    sparks.push({m,vx:game.rnd(-5,5),vy:game.rnd(3,9),vz:game.rnd(-5,5),t:0.7});
  }
}
function updateSparks(dt){
  for(let i=sparks.length-1;i>=0;i--){
    const s=sparks[i];s.t-=dt;s.vy-=22*dt;s.m.position.x+=s.vx*dt;s.m.position.y+=s.vy*dt;s.m.position.z+=s.vz*dt;
    s.m.material.opacity=Math.max(0,s.t/0.7);s.m.rotation.x+=dt*8;
    if(s.t<=0){game.scene.remove(s.m);s.m.material.dispose();sparks.splice(i,1)}
  }
}


function tickHud(dt){
  game.drawMini();if(game.bigOpen)game.drawBig();updateSparks(dt);
  if(game.toastT>0){game.toastT-=dt;if(game.toastT<=0)game.$('toast').style.opacity=0}
}
api.tick=tickHud;
function tickPrompt(dt){  game.nearest=null;let best=1e9;
  for(const it of game.interact){const d=Math.hypot(it.x-game.pv.x,it.z-game.pv.z);if(d<it.r&&d<best){best=d;game.nearest=it}}
  const pe=game.$('prompt');
  if(game.nearest&&!game.modalOpen){pe.style.display='block';pe.textContent=game.nearest.text()}else pe.style.display='none';
  const vm=game.S.missions.find(m=>m.k==='visit'&&!m.done);
  const cp=game.$('compass'),et=game.X.compassTarget(),tg=et||(vm&&{x:vm.x,z:vm.z,label:vm.place});
  if(tg){
    const tdx=tg.x-game.pv.x,tdz=tg.z-game.pv.z,ang=Math.atan2(tdx*Math.cos(game.yaw)-tdz*Math.sin(game.yaw),-(tdx*Math.sin(game.yaw)+tdz*Math.cos(game.yaw)));
    cp.style.display='block';game.$('arrow').style.transform='rotate('+ang+'rad)';game.$('cdist').textContent=tg.label+' · '+Math.round(Math.hypot(tdx,tdz)*2)+' m';
  }else cp.style.display='none';
}
api.tickPrompt=tickPrompt;

  bind(game, "burst", () => burst);
  bindLet(game, "petMeshes", () => petMeshes, (v) => { petMeshes = v; });
  bind(game, "rebuildPets", () => rebuildPets);
  bind(game, "refreshCarry", () => refreshCarry);
  bind(game, "refreshHud", () => refreshHud);
}

export function initModalniOkna() {
/* Modální okna */
let modalOpen=false,modalRender=null,modalLive=false;
function openModal(title,render,live=true){modalOpen=true;modalLive=live;modalRender=()=>{game.$('mtitle').textContent=title;render(game.$('mitems'))};modalRender();game.$('modal').style.display='flex'}
function closeModal(){modalOpen=false;modalRender=null;game.$('modal').style.display='none'}
game.$('mclose').onclick=closeModal;
function controlsModal(){
  openModal('⌨ Ovládání',el=>{
    el.innerHTML='<table class="ctrl"><thead><tr><th>Ovládání</th><th>Co dělá</th></tr></thead><tbody>'
      +'<tr><td><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></td><td>Pohyb</td></tr>'
      +'<tr><td><kbd>↑</kbd><kbd>↓</kbd></td><td>Dopředu a dozadu</td></tr>'
      +'<tr><td><kbd>←</kbd><kbd>→</kbd></td><td>Otočit se</td></tr>'
      +'<tr><td><kbd>Mezerník</kbd></td><td>Skok</td></tr>'
      +'<tr><td><kbd>Shift</kbd></td><td>Sprint</td></tr>'
      +'<tr><td><kbd>1</kbd></td><td>Magnet – přitáhne Ozoboty</td></tr>'
      +'<tr><td><kbd>2</kbd></td><td>Zmrazení – zastaví psy a býka</td></tr>'
      +'<tr><td><kbd>3</kbd></td><td>Past na Ozoboty</td></tr>'
      +'<tr><td><kbd>V</kbd></td><td>Nasednout do vozidla nebo přestoupit</td></tr>'
      +'<tr><td><kbd>E</kbd></td><td>Použít to, co je poblíž, nebo zavřít okno</td></tr>'
      +'<tr><td><kbd>Q</kbd></td><td>Album, mise a odznaky</td></tr>'
      +'<tr><td><kbd>N</kbd></td><td>Velká mapa</td></tr>'
      +'<tr><td><kbd>M</kbd></td><td>Zapnout nebo vypnout hudbu</td></tr>'
      +'<tr><td><kbd>Esc</kbd></td><td>Zavřít okno nebo mapu</td></tr>'
      +'<tr><td><kbd>+</kbd><kbd>−</kbd> nebo kolečko</td><td>Přiblížit a oddálit kameru</td></tr>'
      +'<tr><td>Myš</td><td>Táhni po obrazovce a otáčej kameru</td></tr>'
      +'</tbody></table>';
  },false);
}
game.$('help').onclick=controlsModal;
function row(parent,name,desc,price,fn,lbl){
  const r=document.createElement('div');r.className='row';
  r.innerHTML='<div><b>'+name+'</b><small>'+desc+'</small></div>';
  const b=document.createElement('button');b.textContent=lbl||('⚡'+game.fmt(price));
  if(price!==null&&price!==undefined&&game.S.money<price)b.disabled=true;
  b.onclick=()=>{fn();game.sfx.buy();game.save();game.refreshHud();modalRender&&modalRender()};
  r.appendChild(b);parent.appendChild(r);
}
function shopModal(){
  openModal('🛒 Obchod',el=>{
    el.innerHTML='<div style="margin-bottom:6px">Máš ⚡'+game.fmt(game.S.money)+'</div>';
    row(el,'👟 Turbo boty','Rychlost '+game.speed().toFixed(1)+' → '+(game.speed()+0.8).toFixed(1),game.cost.boots(),()=>{game.S.money-=game.cost.boots();game.S.boots++});
    row(el,'📦 Větší krabice na Ozoboty','Kapacita '+game.cap()+' → '+(game.cap()+1),game.cost.bag(),()=>{game.S.money-=game.cost.bag();game.S.bag++});
    row(el,'🥅 Lepší síť (úroveň '+game.S.net+')','Dosah chytání '+game.catchR().toFixed(1)+' → '+(game.catchR()+0.3).toFixed(1),game.cost.net(),()=>{game.S.money-=game.cost.net();game.S.net++});
    row(el,'✨ Aura štěstí (úroveň '+game.S.aura+')','Prodej a příjem ×'+game.mult().toFixed(1)+' → ×'+(game.mult()+0.2).toFixed(1),game.cost.aura(),()=>{game.S.money-=game.cost.aura();game.S.aura++});
    el.insertAdjacentHTML('beforeend','<h3>Posilovače (klávesy 1 2 3)</h3>');
    row(el,'🧲 Magnet ×'+game.S.items.magnet,'8 s přitahuje Ozoboty do 14 jednotek',90,()=>{game.S.money-=90;game.S.items.magnet++});
    row(el,'❄️ Zmražení ×'+game.S.items.freeze,'Na 6 s zmrazí psy a býka v okolí',70,()=>{game.S.money-=70;game.S.items.freeze++});
    row(el,'🪤 Past na Ozoboty ×'+game.S.items.trap,'Láká Ozoboty a chytí je sama (30 s)',50,()=>{game.S.money-=50;game.S.items.trap++});
    el.insertAdjacentHTML('beforeend','<h3>Vozidla (klávesa V)</h3>');
    game.VEH.forEach(v=>{
      if(game.S.vehs.includes(v.id))row(el,v.icon+' '+v.n,'Máš ✔ – '+v.desc,null,()=>{},'✔');
      else row(el,v.icon+' '+v.n,v.desc+' Rychlost ×'+v.mult,v.price,()=>{game.S.money-=v.price;game.S.vehs.push(v.id);game.toast('Koupil jsi: '+v.n+'! Nasedni klávesou V','#ffe94a')});
    });
  },false);
}
function hatchModal(){
  openModal('🔧 Dílna',el=>{
    el.innerHTML='';
    if(!game.hatch)row(el,'Sestavit nového robota','Za 15 s z dílny vyjede náhodný pomocník, který ti vydělává.',game.cost.build(),()=>{game.S.money-=game.cost.build();game.hatch={t:15}});
    else if(game.hatch.t>0)row(el,'Sestavuje se…','Zbývá '+Math.ceil(game.hatch.t)+' s',null,()=>{},'⏳');
    else row(el,'Robot je hotový!','Klikni a uvidíš, co z dílny vyjelo.',null,()=>{
      const tot=game.HELP.reduce((a,p)=>a+p.w,0);let r=Math.random()*tot,i=0;
      for(;i<game.HELP.length;i++){r-=game.HELP[i].w;if(r<=0)break}
      i=Math.min(i,game.HELP.length-1);game.S.pets[i]++;game.S.built++;game.hatch=null;game.rebuildPets();game.checkBadges();
      game.toast('🔧 Nový pomocník: '+game.HELP[i].n+' (+'+(game.HELP[i].inc*game.mult()).toFixed(1)+' ⚡/s)','#ffe94a');
    },'🔧 Vyzvednout!');
    const have=game.HELP.map((p,i)=>game.S.pets[i]?p.n+' ×'+game.S.pets[i]:null).filter(Boolean).join(', ')||'zatím žádní';
    const d=document.createElement('p');d.innerHTML='<b>Tvoji pomocníci:</b> '+have+'<br><b>Příjem:</b> '+game.income().toFixed(1)+' ⚡/s';el.appendChild(d);
  },true);
}


  bind(game, "closeModal", () => closeModal);
  bind(game, "hatchModal", () => hatchModal);
  bindLet(game, "modalLive", () => modalLive, (v) => { modalLive = v; });
  bindLet(game, "modalOpen", () => modalOpen, (v) => { modalOpen = v; });
  bindLet(game, "modalRender", () => modalRender, (v) => { modalRender = v; });
  bind(game, "openModal", () => openModal);
  bind(game, "row", () => row);
  bind(game, "shopModal", () => shopModal);
}

export function initUvodniObrazovka() {
/* Úvodní obrazovka */
const prevRenderer=new THREE.WebGLRenderer({canvas:game.$('prev'),antialias:true,alpha:true});
prevRenderer.setPixelRatio(Math.min(devicePixelRatio,2));prevRenderer.setSize(220,250,false);
const prevScene=new THREE.Scene();
prevScene.add(new THREE.HemisphereLight(0xffffff,0x88aacc,1.0));
{const d=new THREE.DirectionalLight(0xffffff,0.8);d.position.set(3,6,5);prevScene.add(d)}
const prevCam=new THREE.PerspectiveCamera(32,220/250,0.1,60);prevCam.position.set(0,3.1,13.5);prevCam.lookAt(0,2.6,0);
let selChar=0,selColor=0,prevAv=null;
function showPrev(){
  if(prevAv)prevScene.remove(prevAv.g);
  prevAv=game.buildAvatar(game.CHARS[selChar],game.COLORS[selColor]);prevScene.add(prevAv.g);
}
function renderThumbs(){
  const tr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tr.setSize(110,120);
  const ts=new THREE.Scene();ts.add(new THREE.HemisphereLight(0xffffff,0x88aacc,1.0));const dl=new THREE.DirectionalLight(0xffffff,0.8);dl.position.set(3,6,5);ts.add(dl);
  const tc=new THREE.PerspectiveCamera(32,110/120,0.1,60);tc.position.set(0,3.1,13.5);tc.lookAt(0,2.6,0);
  const cbox=game.$('chars');cbox.innerHTML='';
  game.CHARS.forEach((ch,i)=>{
    const a=game.buildAvatar(ch,null);a.g.rotation.y=-0.4;ts.add(a.g);tr.render(ts,tc);ts.remove(a.g);
    const b=document.createElement('button');b.className='ch';b.innerHTML='<img src="'+tr.domElement.toDataURL()+'"><div>'+ch.n+'</div>';
    b.onclick=()=>{selChar=i;markSel();showPrev()};cbox.appendChild(b);
  });
  tr.dispose();
}
function markSel(){
  [...game.$('chars').children].forEach((b,i)=>b.classList.toggle('sel',i===selChar));
  [...game.$('swatches').children].forEach((b,i)=>b.classList.toggle('sel',i===selColor));
}
function buildSwatches(){
  const sw=game.$('swatches');sw.innerHTML='';
  game.COLORS.forEach((c,i)=>{
    const b=document.createElement('button');b.className='sw';
    b.style.background=c===null?'conic-gradient(#e33,#fd3,#3c5,#38f,#a4e,#e33)':'#'+c.toString(16).padStart(6,'0');
    b.title=c===null?'původní barva':'';b.onclick=()=>{selColor=i;markSel();showPrev()};sw.appendChild(b);
  });
}
function buildBoard(){
  const ix=Object.values(game.getIndex()).sort((a,b)=>b.caught-a.caught);
  game.$('board').innerHTML=ix.length?ix.slice(0,5).map((p,i)=>(i+1)+'. '+p.name.replace(/</g,'&lt;')+' – '+p.caught).join('<br>'):'<i>zatím nikdo – buď první!</i>';
  game.$('recent').innerHTML=ix.length?'<small>Už hrál(a):</small><br>'+ix.slice(0,8).map(p=>'<span class="chip" data-n="'+p.name.replace(/"/g,'')+'">'+p.name.replace(/</g,'&lt;')+'</span>').join(''):'';
  [...game.$('recent').querySelectorAll('.chip')].forEach(c=>c.onclick=()=>{
    const p=game.getIndex()[game.keyOf(c.dataset.n)];game.$('name').value=c.dataset.n;
    if(p){selChar=Math.max(0,game.CHARS.findIndex(x=>x.id===p.char));selColor=Math.max(0,game.COLORS.indexOf(p.color));markSel();showPrev()}
    game.$('go').disabled=false;
  });
}
game.$('name').addEventListener('input',()=>{game.$('go').disabled=!game.$('name').value.trim()});
game.$('name').addEventListener('keydown',e=>{if(e.key==='Enter'&&game.$('name').value.trim())game.$('go').click()});
game.$('go').onclick=()=>{
  const name=game.$('name').value.trim().slice(0,14);if(!name)return;
  game.S=game.loadState(name);game.S.name=name;game.S.char=game.CHARS[selChar].id;game.S.color=game.COLORS[selColor];
  game.setupPlayer(game.CHARS[selChar],game.COLORS[selColor],name);
  game.$('start').style.display='none';game.started=true;
  prevRenderer.dispose();
  game.pv.x=game.H.x;game.pv.z=game.H.z;
  game.setVehicle(-1);
  game.ensureMissions();
  game.refreshHud();game.rebuildPets();game.refreshCarry();game.save();game.X.onStart();
  game.toast('Ahoj '+name+'! Chytej Ozoboty – svítí a utíkají před tebou!','#ffffff');
};
buildSwatches();renderThumbs();showPrev();buildBoard();markSel();


function tickPreview(dt){
  if(prevAv){prevAv.g.rotation.y+=dt*1.1;prevAv.legL.rotation.x=Math.sin(game.time*3)*0.4;prevAv.legR.rotation.x=-Math.sin(game.time*3)*0.4;prevAv.armL.rotation.x=-Math.sin(game.time*3)*0.4;prevAv.armR.rotation.x=Math.sin(game.time*3)*0.4}
  prevRenderer.render(prevScene,prevCam);
  const a=game.time*0.12,ty=game.gy(game.H.x,game.H.z);
  game.camera.position.set(game.H.x+Math.cos(a)*70,42+ty,game.H.z+Math.sin(a)*70);
  game.camera.lookAt(game.H.x,ty+4,game.H.z);
}
api.tickPreview=tickPreview;

}
