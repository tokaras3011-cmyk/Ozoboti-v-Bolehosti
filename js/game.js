import { game, bind, bindLet } from './context.js';
import * as THREE from 'three';

export const api = {};


export function initStavHryUkladani() {
/* Stav hry, ukládání */
let S=null,carry=[],hatch=null,stam=100,stamCd=0;
const newState=()=>({money:100,boots:0,bag:0,aura:0,net:0,built:0,pets:game.HELP.map(()=>0),caught:0,items:{magnet:1,freeze:1,trap:2},vehs:[],ridden:{},stars:0,album:{},badges:{},stats:{night:0,rain:0,freeze:0,trap:0,sprint:0,earned:0,missions:0,steal:0},day:'',missions:[]});
const keyOf=n=>'ozo_'+n.trim().toLowerCase();
function getIndex(){try{return JSON.parse(localStorage.getItem('ozo_index')||'{}')}catch(e){return{}}}
function save(){
  if(!S||game.X.inRound())return;
  try{localStorage.setItem(keyOf(S.name),JSON.stringify(S));
    const ix=getIndex();ix[keyOf(S.name)]={name:S.name,char:S.char,color:S.color,caught:S.caught};
    localStorage.setItem('ozo_index',JSON.stringify(ix))}catch(e){}
}
function loadState(name){
  const d=newState();
  try{const s=JSON.parse(localStorage.getItem(keyOf(name))||'null');
    if(s&&s.pets&&s.pets.length===game.HELP.length){const o=Object.assign(d,s);o.items=Object.assign(newState().items,s.items||{});o.stats=Object.assign(newState().stats,s.stats||{});return o}}catch(e){}
  return d;
}
const speed=()=>8+0.8*S.boots;
const cap=()=>3+S.bag+(game.veh()?game.veh().capAdd:0);
const mult=()=>1+0.2*S.aura;
const catchR=()=>1.6+0.3*S.net+(game.veh()?game.veh().catchAdd:0);
const income=()=>S.pets.reduce((a,c,i)=>a+c*game.HELP[i].inc,0)*mult();
const cost={
  boots:()=>Math.round(50*Math.pow(1.6,S.boots)),
  bag:()=>Math.round(80*Math.pow(1.75,S.bag)),
  aura:()=>Math.round(250*Math.pow(2.1,S.aura)),
  net:()=>Math.round(120*Math.pow(1.9,S.net)),
  build:()=>Math.round(150*Math.pow(1.45,S.built))
};
const fmt=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':Math.floor(n).toString();
let toastT=0;
function toast(t,c='#fff',d=2.6){const e=game.$('toast');e.textContent=t;e.style.color=c;e.style.opacity=1;toastT=d}


  bindLet(game, "S", () => S, (v) => { S = v; });
  bind(game, "cap", () => cap);
  bindLet(game, "carry", () => carry, (v) => { carry = v; });
  bind(game, "catchR", () => catchR);
  bind(game, "cost", () => cost);
  bind(game, "fmt", () => fmt);
  bind(game, "getIndex", () => getIndex);
  bindLet(game, "hatch", () => hatch, (v) => { hatch = v; });
  bind(game, "income", () => income);
  bind(game, "keyOf", () => keyOf);
  bind(game, "loadState", () => loadState);
  bind(game, "mult", () => mult);
  bind(game, "newState", () => newState);
  bind(game, "save", () => save);
  bind(game, "speed", () => speed);
  bindLet(game, "stam", () => stam, (v) => { stam = v; });
  bindLet(game, "stamCd", () => stamCd, (v) => { stamCd = v; });
  bind(game, "toast", () => toast);
  bindLet(game, "toastT", () => toastT, (v) => { toastT = v; });
}

export function initMiseAlbumOdznaky() {
/* Mise, album, odznaky */
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const todayKey=()=>new Date().toLocaleDateString('sv-SE');
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
let questRobots=[];
function missionText(m){
  switch(m.k){
    case 'color':return 'Chyť '+m.n+' '+game.ROB[m.id].g+' Ozobotů';
    case 'any':return 'Chyť '+m.n+' Ozobotů (kdykoli)';
    case 'visit':return 'Najdi a chyť Ozobota poblíž: '+m.place;
    case 'earn':return 'Vydělej prodejem ⚡'+m.n;
    case 'steal':return 'Ukradni '+m.n+'× robota Evo ze soused. garáže';
    case 'night':return 'Chyť '+m.n+' Ozoboty v noci';
    case 'sprint':return 'Sprintuj celkem '+m.n+' s';
    case 'item':return 'Použij '+m.n+' posilovače';
    case 'ride':return 'Chyť '+m.n+' Ozoboty z vozidla';
  }
}
function genMissions(){
  const R=rng(hashStr(game.S.name+game.S.day));const pick=a=>a[(R()*a.length)|0];
  const out=[];
  if(R()<0.6){const id=pick(['cerv','zel','modr','zlut']);out.push({k:'color',id,n:3+((R()*4)|0)})}
  else out.push({k:'any',n:8+((R()*8)|0)});
  const t2=pick(['visit','visit','earn','steal']);
  if(t2==='visit'){const lm=game.M.LM.filter(l=>l[0]!=='Hasiči');const L=pick(lm);out.push({k:'visit',place:L[0],x:L[1],z:L[2],n:1})}
  else if(t2==='earn')out.push({k:'earn',n:150+((R()*6)|0)*50});
  else out.push({k:'steal',n:1+((R()*2)|0)});
  const t3=['night','sprint','item'];if(game.S.vehs.length)t3.push('ride');
  const k3=pick(t3);out.push(k3==='night'?{k:'night',n:3}:k3==='sprint'?{k:'sprint',n:15+((R()*3)|0)*5}:k3==='item'?{k:'item',n:2}:{k:'ride',n:3});
  out.forEach(m=>{m.p=0;m.done=false;m.reward=m.k==='visit'?120:m.k==='steal'?150*m.n:m.k==='earn'?Math.round(m.n*0.4):m.k==='sprint'?m.n*6:m.k==='night'?120:m.k==='item'?80:m.k==='ride'?110:Math.round(m.n*25)});
  return out;
}
function clearQuestRobots(){questRobots.forEach(r=>{game.scene.remove(r.g);const i=game.robots.indexOf(r);if(i>=0)game.robots.splice(i,1)});questRobots=[]}
function spawnQuestRobots(){
  clearQuestRobots();
  game.S.missions.forEach((m,i)=>{
    if(m.k!=='visit'||m.done)return;
    let x=m.x,z=m.z;
    for(let t=0;t<40;t++){const a=game.rnd(0,6.28),r=game.rnd(6,13),px=m.x+Math.cos(a)*r,pz=m.z+Math.sin(a)*r;if(game.freeAt(px,pz,1.5)&&px>game.RX0+3&&px<game.RX1-3&&pz>game.RZ0+3&&pz<game.RZ1-3){x=px;z=pz;break}}
    const r=game.addRobot({quest:true,questType:['cerv','modr','zlut'][i%3],questIdx:i});
    r.x=x;r.z=z;r.hx=m.x;r.hz=m.z;r.g.position.set(x,game.gy(x,z),z);
    const bm=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,14,8),new THREE.MeshBasicMaterial({color:0xff4fb8,transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending}));
    bm.position.y=7;r.g.add(bm);questRobots.push(r);
  });
}
function ensureMissions(){
  if(game.X.inRound())return;
  const d=todayKey();
  if(game.S.day!==d||!game.S.missions.length){game.S.day=d;game.S.missions=genMissions();spawnQuestRobots();game.save();if(game.started)game.toast('Nové denní mise! (Q = přehled)','#ffe94a')}
  else if(!questRobots.length)spawnQuestRobots();
}
function mEvent(type,a={}){
  let changed=false;
  game.S.missions.forEach((m,i)=>{
    if(m.done)return;
    let inc=0;
    if(type==='catch'){
      if(m.k==='color'&&a.id===m.id)inc=1;
      else if(m.k==='any')inc=1;
      else if(m.k==='night'&&a.night)inc=1;
      else if(m.k==='ride'&&a.ride)inc=1;
      else if(m.k==='visit'&&a.quest===i)inc=1;
    }else if(type==='sell'&&m.k==='earn')inc=a.v;
    else if(type==='steal'&&m.k==='steal')inc=1;
    else if(type==='item'&&m.k==='item')inc=1;
    else if(type==='sprint'&&m.k==='sprint')inc=a.dt;
    if(!inc)return;
    m.p+=inc;changed=true;
    if(m.p>=m.n){
      m.done=true;m.p=m.n;game.S.money+=m.reward;game.S.stars++;game.S.stats.missions++;game.sfx.badge();
      game.toast('✅ Mise splněna! +⚡'+m.reward+' a ⭐','#7dffb0');
      if(game.S.missions.every(x=>x.done)){game.S.items.magnet++;game.S.items.freeze++;game.S.items.trap+=2;setTimeout(()=>game.toast('🎁 Všechny denní mise! Bonus: posilovače','#ffe94a'),2600)}
      if(m.k==='visit')clearQuestRobots();
    }
  });
  if(changed){game.refreshHud();checkBadges()}
}
const BADGES=[
  {id:'first',n:'První Ozobot',d:'Chyť prvního Ozobota',t:()=>game.S.caught>=1},
  {id:'c10',n:'Začátečník',d:'10 chycených',t:()=>game.S.caught>=10},
  {id:'c50',n:'Lovec',d:'50 chycených',t:()=>game.S.caught>=50},
  {id:'c100',n:'Mistr lovu',d:'100 chycených',t:()=>game.S.caught>=100},
  {id:'c250',n:'Legenda',d:'250 chycených',t:()=>game.S.caught>=250},
  {id:'all',n:'Celá duha',d:'Chyť všech 7 druhů',t:()=>game.ROBO.every(r=>game.S.album[r.id]>0)},
  {id:'night',n:'Noční lovec',d:'10 Ozobotů v noci',t:()=>game.S.stats.night>=10},
  {id:'rain',n:'I v dešti',d:'5 Ozobotů za deště',t:()=>game.S.stats.rain>=5},
  {id:'rider',n:'Řidič',d:'Vyzkoušej všechna 4 vozidla',t:()=>game.VEH.every(v=>game.S.ridden[v.id])},
  {id:'rich',n:'Boháč',d:'Vydělej celkem ⚡10 000',t:()=>game.S.stats.earned>=10000},
  {id:'mis',n:'Plnič misí',d:'Splň 10 misí',t:()=>game.S.stats.missions>=10},
  {id:'dog',n:'Psí kamarád',d:'Zmraz psa 5×',t:()=>game.S.stats.freeze>=5},
  {id:'trap',n:'Lovec s pastí',d:'10 Ozobotů z pasti',t:()=>game.S.stats.trap>=10},
  {id:'sprint',n:'Sprinter',d:'Sprintuj celkem 60 s',t:()=>game.S.stats.sprint>=60},
  {id:'thief',n:'Garážový zloděj',d:'Ukradni 5× robota Evo',t:()=>game.S.stats.steal>=5},
  {id:'build',n:'Konstruktér',d:'Sestav 5 robotů v dílně',t:()=>game.S.built>=5}
];
function checkBadges(){
  BADGES.forEach(b=>{if(!game.S.badges[b.id]&&b.t()){game.S.badges[b.id]=1;game.sfx.badge();game.toast('🏅 Odznak: '+b.n,'#ffe94a')}});
}
function albumModal(){
  game.openModal('📖 Album, mise a odznaky',el=>{
    el.innerHTML='<h3>Denní mise ('+game.S.day+') – ⭐ '+game.S.stars+'</h3>'+game.S.missions.map(m=>'<div class="row"><div><b'+(m.done?' style="color:#1a9a4a"':'')+'>'+(m.done?'✅ ':'')+missionText(m)+'</b><small>Odměna: ⚡'+m.reward+' + ⭐</small><div class="prog"><i style="width:'+Math.min(100,m.p/m.n*100)+'%"></i></div></div><div>'+Math.floor(m.p)+' / '+m.n+'</div></div>').join('')
      +'<h3>Album Ozobotů</h3><div class="dex">'+game.ROBO.map(r=>{const n=game.S.album[r.id]||0;const col='#'+r.c.toString(16).padStart(6,'0');
        return '<div class="dexc'+(n?'':' no')+'"><span class="led" style="background:'+(r.rainbow?'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)':col)+';color:'+col+'"></span><b>'+(n?r.n:'???')+'</b><br>chyceno: '+n+'<br><small>'+(n?r.hint:'Ještě jsi ho nechytil.')+'</small></div>'}).join('')+'</div>'
      +'<h3>Odznaky ('+Object.keys(game.S.badges).length+' / '+BADGES.length+')</h3>'+BADGES.map(b=>'<span class="badge'+(game.S.badges[b.id]?' got':'')+'" title="'+b.d+'">'+(game.S.badges[b.id]?'🏅 ':'🔒 ')+b.n+' <small>– '+b.d+'</small></span>').join('')+game.X.albumHtml();
  },false);
}


  bind(game, "BADGES", () => BADGES);
  bind(game, "albumModal", () => albumModal);
  bind(game, "checkBadges", () => checkBadges);
  bind(game, "clearQuestRobots", () => clearQuestRobots);
  bind(game, "ensureMissions", () => ensureMissions);
  bind(game, "mEvent", () => mEvent);
  bind(game, "missionText", () => missionText);
  bindLet(game, "questRobots", () => questRobots, (v) => { questRobots = v; });
  bind(game, "rng", () => rng);
  bind(game, "todayKey", () => todayKey);
}

export function initInterakce() {
/* Interakce */
const interact=[
  {x:game.SELL.x,z:game.SELL.z+2.4,r:4.2,text:()=>game.carry.length?'E – Prodat Ozoboty ('+game.carry.length+')':'E – Výkup (nemáš žádné Ozoboty)',act:()=>{
    if(!game.carry.length){game.toast('Nemáš co prodat – nachytej Ozoboty!');return}
    const v=Math.round(game.carry.reduce((a,t)=>a+game.ROB[t.id].v*t.m,0)*game.mult());
    game.S.money+=v;game.S.stats.earned+=v;game.toast('+⚡'+game.fmt(v),'#7dffb0');game.sfx.sell();game.burst(game.SELL.x,game.gy(game.SELL.x,game.SELL.z)+3,game.SELL.z+1.5,0xffe94a,20);
    game.carry=[];game.refreshCarry();game.refreshHud();game.mEvent('sell',{v});game.checkBadges();game.save();
  }},
  {x:game.SHOP.x,z:game.SHOP.z+2.4,r:4.2,text:()=>'E – Obchod',act:game.shopModal},
  {x:game.HATCH.x,z:game.HATCH.z+3.6,r:4.2,text:()=>'E – Dílna',act:game.hatchModal}
];
game.garages.forEach(h=>interact.push({x:h.x,z:h.z+2.4,r:4.5,
  text:()=>h.stock>0?'E – Ukrást robota Evo ('+h.stock+')':'Garáž je prázdná…',
  act:()=>{
    if(h.stock<=0){game.toast('Garáž je prázdná, vrať se později');return}
    if(game.carry.length>=game.cap()){game.toast('Krabice je plná! Odnes Ozoboty do výkupu','#ffb347');return}
    h.stock--;game.carry.push({id:'evo',m:1});game.S.album.evo=(game.S.album.evo||0)+1;game.S.stats.steal++;game.S.caught++;game.X.onScore(250);
    game.refreshCarry();game.refreshHud();game.sfx.catch();game.mEvent('steal');game.checkBadges();game.toast('Ukradl jsi robota Evo! Utíkej!','#ff9ad8');
  }}));
let nearest=null;


  bind(game, "interact", () => interact);
  bindLet(game, "nearest", () => nearest, (v) => { nearest = v; });
}

export function initPosilovace() {
/* Posilovače */
let magnetT=0;const traps=[];
function useItem(k){
  if(game.modalOpen||!game.S)return;
  if(game.S.items[k]<=0){game.toast('Nemáš žádný – kup v obchodě','#ffb347');return}
  if(k==='magnet'){if(magnetT>0)return;magnetT=8;game.magRing.visible=true}
  else if(k==='freeze'){
    let n=0;game.guards.forEach(g=>{if(Math.hypot(g.m.position.x-game.pv.x,g.m.position.z-game.pv.z)<28){g.frozen=6;g.m.userData.ice.visible=true;n++}});
    if(!n){game.toast('Žádný pes ani býk poblíž','#ffb347');return}
    game.S.stats.freeze+=n;game.toast('❄️ Zmrazil jsi '+n+'!','#9fe6ff');
  }else if(k==='trap'){
    if(traps.length>=3){game.toast('Můžeš mít nejvýš 3 pasti','#ffb347');return}
    const m=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,0.15,20),new THREE.MeshBasicMaterial({color:0x22ffee,transparent:true,opacity:0.7}));
    m.position.set(game.pv.x,game.gy(game.pv.x,game.pv.z)+0.12,game.pv.z);game.scene.add(m);
    traps.push({x:game.pv.x,z:game.pv.z,t:30,m});game.toast('🪤 Past položena (30 s)','#22ffee');
  }
  game.S.items[k]--;game.sfx.item();game.mEvent('item');game.refreshHud();game.save();game.checkBadges();
}


  bindLet(game, "magnetT", () => magnetT, (v) => { magnetT = v; });
  bind(game, "traps", () => traps);
  bind(game, "useItem", () => useItem);
}
