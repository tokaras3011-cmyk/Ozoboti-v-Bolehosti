import { game, bind, bindLet } from './context.js';
import * as THREE from 'three';

export const api = {};


export function initPostavy() {
/* Postavy */
const CHARS=[
  {id:'kuba',n:'Kuba',skin:0xf1c6a0,hair:0x8a4a22,shirt:0x3b2a7a,pants:0x26468a,acc:'hair'},
  {id:'bara',n:'Bára',skin:0xf5d0b0,hair:0xf2b84a,shirt:0xe0457a,pants:0x5a3a8a,acc:'pigtails'},
  {id:'sportak',n:'Sportovec',skin:0xe0b088,hair:0x222222,shirt:0x2fa03a,pants:0x222222,acc:'cap'},
  {id:'robot',n:'Robot',skin:0xbfc9d6,hair:0x888888,shirt:0x2a7be4,pants:0x556677,acc:'antenna'},
  {id:'dino',n:'Dino',skin:0x5fd05a,hair:0x3a9a3a,shirt:0xf5a623,pants:0x3a7a3a,acc:'dino'},
  {id:'kocka',n:'Kočka',skin:0xf0a050,hair:0xe08030,shirt:0x7a4aa0,pants:0x3a3a5a,acc:'cat'},
  {id:'astro',n:'Astronaut',skin:0xf1c6a0,hair:0x444444,shirt:0xeeeeee,pants:0xdddddd,acc:'astro'},
  {id:'hasic',n:'Hasič',skin:0xe8b890,hair:0x5a3a22,shirt:0xd93a2a,pants:0x2a2a3a,acc:'fire'}
];
const COLORS=[null,0xd93a2a,0xf5a623,0xf0d020,0x2fa03a,0x22b8c8,0x2a7be4,0x8a3ad0,0xe0457a,0x222222,0xffffff];
function buildAvatar(ch,color){
  const g=new THREE.Group(),shirt=color||ch.shirt;
  const av={g};
  game.box(1.6,1.8,0.9,shirt,0,1.6,0,g);
  game.box(1.3,0.25,0.95,ch.pants,0,1.6,0,g);
  game.box(1.2,1.2,1.2,ch.skin,0,3.3,0,g);
  const eyeC=ch.acc==='antenna'?0x00e5ff:0x111111;
  game.box(0.16,0.26,0.1,eyeC,-0.3,3.75,0.6,g);game.box(0.16,0.26,0.1,eyeC,0.3,3.75,0.6,g);
  game.box(0.42,0.08,0.1,ch.acc==='antenna'?0x00e5ff:0x8a2a2a,0,3.45,0.6,g);
  const limb=(x,y,w,h,c,shoe)=>{const p=new THREE.Group();p.position.set(x,y,0);game.box(w,h,w,c,0,-h,0,p);if(shoe)game.box(w+0.1,0.3,w+0.3,0x222222,0,-h,0.1,p);g.add(p);return p};
  av.legL=limb(-0.4,1.6,0.7,1.6,ch.pants,true);av.legR=limb(0.4,1.6,0.7,1.6,ch.pants,true);
  av.armL=limb(-1.1,3.3,0.55,1.7,shirt,false);av.armR=limb(1.1,3.3,0.55,1.7,shirt,false);
  const hc=ch.hair;
  switch(ch.acc){
    case 'hair':game.box(1.3,0.5,1.3,hc,0,4.2,-0.05,g);game.box(1.3,0.9,0.3,hc,0,3.6,-0.55,g);break;
    case 'pigtails':game.box(1.3,0.5,1.3,hc,0,4.2,-0.05,g);game.box(1.3,0.8,0.3,hc,0,3.7,-0.55,g);
      game.box(0.35,1.0,0.35,hc,-0.9,3.0,-0.2,g);game.box(0.35,1.0,0.35,hc,0.9,3.0,-0.2,g);
      game.box(0.4,0.3,0.3,0xff3a8a,-0.9,4.0,-0.2,g);game.box(0.4,0.3,0.3,0xff3a8a,0.9,4.0,-0.2,g);break;
    case 'cap':game.box(1.35,0.45,1.35,0xd93a2a,0,4.25,0,g);game.box(1.3,0.1,0.7,0xb02a1a,0,4.25,0.8,g);break;
    case 'antenna':{game.box(0.12,0.9,0.12,0x666666,0,4.5,0,g);const b=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,8),new THREE.MeshBasicMaterial({color:0xff3a3a}));b.position.set(0,5.55,0);g.add(b);
      game.box(1.3,0.25,1.3,0x99a5b5,0,4.4,0,g);break}
    case 'dino':for(let i=0;i<4;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(0.28,0.6,4),game.mat(0x2a8a2a));c.position.set(0,4.6-i*0.05,0.4-i*0.4);g.add(c)}
      game.box(0.5,0.5,1.1,ch.skin,0,0.9,-1.3,g);break;
    case 'cat':{for(const s of[-1,1]){const c=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.6,4),game.mat(0xe08030));c.position.set(s*0.45,4.75,0);g.add(c)}
      game.box(0.2,0.2,1.2,0xe08030,0,1.0,-1.1,g).rotation.x=-0.5;
      game.box(1.3,0.35,1.3,0xe08030,0,4.3,-0.05,g);break}
    case 'astro':{const gl=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.7,1.7),new THREE.MeshLambertMaterial({color:0x9fd8ff,transparent:true,opacity:0.33}));gl.position.set(0,3.9,0);g.add(gl);
      game.box(0.9,1.0,0.5,0xcccccc,0,1.9,-0.7,g);break}
    case 'fire':game.box(1.45,0.5,1.45,0xd93a2a,0,4.2,0,g);game.box(1.45,0.08,0.4,0xffd21a,0,4.45,0.75,g);game.box(1.6,0.12,1.6,0xb02a1a,0,4.15,0,g);break;
    default:if(window.ACC&&game.ACC[ch.acc])game.ACC[ch.acc](g,ch);
  }
  game.shadowOn(g);return av;
}


  bind(game, "CHARS", () => CHARS);
  bind(game, "COLORS", () => COLORS);
  bind(game, "buildAvatar", () => buildAvatar);
}

export function initHracAVozidla() {
/* Hráč a vozidla */
const player=new THREE.Group();let av=null;
player.scale.setScalar(0.6);game.scene.add(player);
const vehHolder=new THREE.Group();player.add(vehHolder);
const aura=new THREE.Mesh(new THREE.RingGeometry(1.3,1.9,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.7,side:THREE.DoubleSide}));
aura.rotation.x=-Math.PI/2;aura.scale.setScalar(0.6);aura.visible=false;game.scene.add(aura);
const magRing=new THREE.Mesh(new THREE.RingGeometry(13,14,48),new THREE.MeshBasicMaterial({color:0xff5a9a,transparent:true,opacity:0.5,side:THREE.DoubleSide,depthWrite:false}));
magRing.rotation.x=-Math.PI/2;magRing.visible=false;game.scene.add(magRing);
const carryGroup=new THREE.Group();carryGroup.scale.setScalar(0.6);game.scene.add(carryGroup);
function setupPlayer(ch,color,name){
  while(player.children.length>1)player.remove(player.children[player.children.length-1]);
  av=game.buildAvatar(ch,color);player.add(av.g);
  const t=game.label(name,'#ffffff',0.5);t.position.set(0,5.15,0);av.g.add(t);
}
const VEH=[
  {id:'kolo',n:'Kolo',icon:'🚲',price:300,mult:1.7,jump:true,rad:0.5,catchAdd:0.3,capAdd:0,sprint:1.2,seat:[0.85,-0.2],legs:-1.3,arms:-0.9,desc:'Rychlé, můžeš skákat.'},
  {id:'kolob',n:'Koloběžka',icon:'🛴',price:150,mult:1.4,jump:true,rad:0.45,catchAdd:0.2,capAdd:0,sprint:1.2,seat:[0.5,-0.3],legs:0,arms:-1.1,desc:'Levná a hbitá.'},
  {id:'traktor',n:'Traktor',icon:'🚜',price:1500,mult:1.25,jump:false,rad:1.25,catchAdd:1.3,capAdd:4,sprint:0,seat:[1.9,-0.6],legs:-1.5,arms:-1.0,dogsFear:true,desc:'+4 místa v krabici, větší dosah, psi se ho bojí.'},
  {id:'valec',n:'Hutní válec',icon:'🛞',price:3200,mult:0.8,jump:false,rad:1.5,catchAdd:3.6,capAdd:8,sprint:0,seat:[2.4,-0.7],legs:-1.5,arms:-1.0,dogsFear:true,desc:'Pomalý, ale ohromný dosah chytání a +8 míst. Psi i býk utíkají.'}
];
let curVeh=-1,vehWheels=[];
function makeVeh(id){
  const g=new THREE.Group(),wheels=[];
  const wheel=(r,w,x,y,z,c=0x222222)=>{
    const p=new THREE.Group();p.position.set(x,y,z);
    const cy=new THREE.Mesh(new THREE.CylinderGeometry(r,r,w,16),game.mat(c));cy.rotation.z=Math.PI/2;p.add(cy);
    const sp=new THREE.Mesh(new THREE.BoxGeometry(w+0.06,r*1.5,0.12),game.mat(0x999999));p.add(sp);
    g.add(p);wheels.push({p,r});
  };
  if(id==='kolo'){
    wheel(0.85,0.18,0,0.85,1.2);wheel(0.85,0.18,0,0.85,-1.2);
    game.box(0.15,0.15,2.4,0xd93a2a,0,1.4,0,g);game.box(0.15,1.2,0.15,0xd93a2a,0,0.85,-0.6,g);game.box(0.15,1.3,0.15,0x888888,0,0.8,1.2,g);
    game.box(1.0,0.12,0.12,0x333333,0,2.0,1.0,g);game.box(0.5,0.12,0.8,0x222222,0,1.5,-0.5,g);
  }else if(id==='kolob'){
    wheel(0.35,0.14,0,0.35,1.0);wheel(0.35,0.14,0,0.35,-1.0);
    game.box(0.7,0.14,2.4,0x22b8c8,0,0.4,0,g);game.box(0.12,2.0,0.12,0x888888,0,0.4,1.05,g);game.box(0.9,0.12,0.12,0x333333,0,2.35,1.05,g);
  }else if(id==='traktor'){
    wheel(1.5,0.7,1.3,1.5,-1.0,0x1a1a1a);wheel(1.5,0.7,-1.3,1.5,-1.0,0x1a1a1a);wheel(0.85,0.45,1.0,0.85,1.9,0x1a1a1a);wheel(0.85,0.45,-1.0,0.85,1.9,0x1a1a1a);
    game.box(1.8,1.2,3.6,0x2fa03a,0,1.2,0.3,g);game.box(1.4,1.0,1.7,0x2a8a2a,0,1.4,1.8,g);
    game.box(0.15,2.3,0.15,0x444444,-0.9,2.4,-1.4,g);game.box(0.15,2.3,0.15,0x444444,0.9,2.4,-1.4,g);game.box(2.0,0.15,2.0,0xeeeeee,0,4.7,-0.6,g);
    game.box(0.25,1.4,0.25,0x333333,0.5,2.4,1.8,g);game.box(0.8,0.3,0.7,0x222222,0,2.35,-0.6,g);
  }else if(id==='valec'){
    wheel(1.2,0.9,1.15,1.2,-1.6,0x1a1a1a);wheel(1.2,0.9,-1.15,1.2,-1.6,0x1a1a1a);
    const dr=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,2.8,20),game.mat(0x9aa0a8));dr.rotation.z=Math.PI/2;
    const dp=new THREE.Group();dp.position.set(0,1.3,2.0);dp.add(dr);dp.add(new THREE.Mesh(new THREE.BoxGeometry(2.9,0.3,0.15),game.mat(0x666a70)));g.add(dp);wheels.push({p:dp,r:1.3});
    game.box(2.0,1.5,3.4,0xf5c400,0,1.6,-0.3,g);game.box(1.6,1.0,0.8,0xe0b000,0,1.6,1.3,g);
    game.box(0.15,2.2,0.15,0x444444,-1.0,2.6,-1.3,g);game.box(0.15,2.2,0.15,0x444444,1.0,2.6,-1.3,g);game.box(2.3,0.15,2.0,0xf5c400,0,4.8,-0.6,g);
    game.box(0.25,1.3,0.25,0x333333,0.6,2.6,1.4,g);game.box(1.3,0.06,0.4,0xd93a2a,0,2.65,-2.0,g);
  }else if(window.VEHMODELS&&game.VEHMODELS[id])game.VEHMODELS[id](g,wheel);
  game.shadowOn(g);return {g,wheels};
}
function setVehicle(i){
  curVeh=i;vehHolder.clear();vehWheels=[];
  const v=i>=0?VEH[i]:null;
  if(v){const m=makeVeh(v.id);vehHolder.add(m.g);vehWheels=m.wheels;av.g.position.set(0,v.seat[0],v.seat[1]);
    if(game.S&&!game.S.ridden[v.id]){game.S.ridden[v.id]=1;game.checkBadges()}}
  else av.g.position.set(0,0,0);
}
const veh=()=>curVeh>=0?VEH[curVeh]:null;


  bind(game, "VEH", () => VEH);
  bind(game, "aura", () => aura);
  bindLet(game, "av", () => av, (v) => { av = v; });
  bind(game, "carryGroup", () => carryGroup);
  bindLet(game, "curVeh", () => curVeh, (v) => { curVeh = v; });
  bind(game, "magRing", () => magRing);
  bind(game, "player", () => player);
  bind(game, "setVehicle", () => setVehicle);
  bind(game, "setupPlayer", () => setupPlayer);
  bind(game, "veh", () => veh);
  bindLet(game, "vehWheels", () => vehWheels, (v) => { vehWheels = v; });
}

export function initVstup() {
/* Vstup */
let started=false;
const keys={};
addEventListener('keydown',e=>{
  if(!started)return;
  keys[e.code]=true;
  if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();
  if(e.code==='KeyN'||(e.code==='Escape'&&game.bigOpen)){game.toggleBig();return}
  if(e.code==='KeyE'||e.code==='Escape'||e.code==='KeyQ'){
    if(game.modalOpen){game.closeModal();return}
    if(e.code==='KeyQ'){game.albumModal();return}
    if(e.code==='KeyE'&&game.nearest)game.nearest.act();
  }
  if(e.code==='KeyM')game.X.toggleMute();
  if(game.modalOpen)return;
  if(e.key==='+'||e.key==='='||e.code==='NumpadAdd'){nudgeZoom(-0.14);e.preventDefault();return}
  if(e.key==='-'||e.code==='Minus'||e.code==='NumpadSubtract'){nudgeZoom(0.14);e.preventDefault();return}
  if(e.code==='Digit1')game.useItem('magnet');
  if(e.code==='Digit2')game.useItem('freeze');
  if(e.code==='Digit3')game.useItem('trap');
  if(e.code==='KeyV'){
    if(!game.S.vehs.length){game.toast('Nemáš žádné vozidlo – kup v obchodě','#ffb347');return}
    const owned=game.S.vehs.map(id=>game.VEH.findIndex(v=>v.id===id));
    const pos=owned.indexOf(game.curVeh);
    game.setVehicle(pos+1>=owned.length?-1:owned[pos+1]);game.refreshHud();game.sfx.item();
  }
});
addEventListener('keyup',e=>keys[e.code]=false);
let yaw=Math.PI,pitch=0.42,dragging=false,zoom=1,zoomT=1;
function nudgeZoom(d){if(game.modalOpen||game.bigOpen)return;zoomT=game.clamp(zoomT+d,0.42,2.4)}
addEventListener('wheel',e=>{
  if(!started||game.modalOpen||game.bigOpen)return;
  e.preventDefault();
  const dy=e.deltaMode===1?e.deltaY*32:e.deltaY;
  nudgeZoom(game.clamp(dy,-140,140)*0.0015);
},{passive:false});
game.renderer.domElement.addEventListener('mousedown',()=>dragging=true);
addEventListener('mouseup',()=>dragging=false);
addEventListener('mousemove',e=>{if(!dragging)return;yaw-=e.movementX*0.006;pitch=game.clamp(pitch+e.movementY*0.005,0.08,1.2)});


  bind(game, "keys", () => keys);
  bindLet(game, "pitch", () => pitch, (v) => { pitch = v; });
  bindLet(game, "started", () => started, (v) => { started = v; });
  bindLet(game, "yaw", () => yaw, (v) => { yaw = v; });
  bindLet(game, "zoom", () => zoom, (v) => { zoom = v; });
  bindLet(game, "zoomT", () => zoomT, (v) => { zoomT = v; });
}

export function initPlayerMotion() {
/* Herní smyčka – hráč */
const pv={x:game.H.x,z:game.H.z,y:0,vy:0,face:0};
let immune=0,walkT=0,time=0,fullCd=0,edgeTold=false;
function caughtBy(g){
  game.sfx.hit();
  if(game.carry.length)game.toast('🐕 '+(g.kind==='pes'?'Pes':'Býk')+' tě chytil! Přišel jsi o '+game.carry.length+' Ozobotů.','#ff6060');
  else game.toast('Chytil tě '+(g.kind==='pes'?'pes':'býk')+'! Zpátky domů.','#ff6060');
  game.carry=[];game.refreshCarry();game.refreshHud();
  pv.x=game.H.x;pv.z=game.H.z;pv.y=0;pv.vy=0;immune=3;
}
function tickPlayer(dt){
  const vh=game.veh();
  const f=(game.keys.KeyW||game.keys.ArrowUp?1:0)-(game.keys.KeyS||game.keys.ArrowDown?1:0);
  const r=(game.keys.KeyD?1:0)-(game.keys.KeyA?1:0);
  if(game.keys.ArrowLeft)game.yaw+=1.8*dt;if(game.keys.ArrowRight)game.yaw-=1.8*dt;
  const fx=-Math.sin(game.yaw),fz=-Math.cos(game.yaw),rx=Math.cos(game.yaw),rz=-Math.sin(game.yaw);
  let dx=fx*f+rx*r,dz=fz*f+rz*r;const len=Math.hypot(dx,dz);
  const moving=len>0.01&&!game.modalOpen&&!game.X.locked();
  const wantSprint=(game.keys.ShiftLeft||game.keys.ShiftRight)&&moving&&(!vh||vh.sprint>0);
  let sprinting=false;
  if(wantSprint&&game.stam>0&&game.stamCd<=0){sprinting=true;game.stam=Math.max(0,game.stam-32*dt);if(game.stam<=0)game.stamCd=1.4;game.S.stats.sprint+=dt;game.mEvent('sprint',{dt})}
  else game.stam=Math.min(100,game.stam+(game.stamCd>0?0:22)*dt);
  game.stamCd-=dt;
  game.$('stamf').style.width=game.stam+'%';
  if(moving){
    dx/=len;dz/=len;
    const sp=game.speed()*(vh?vh.mult:1)*(sprinting?(vh?vh.sprint:1.5):1)*game.X.speedMult();
    pv.x+=dx*sp*dt;pv.z+=dz*sp*dt;
    let a=Math.atan2(dx,dz),d=a-pv.face;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
    pv.face+=d*Math.min(1,dt*(vh&&vh.dogsFear?6:14));walkT+=dt*sp*0.9;
    game.vehWheels.forEach(w=>w.p.rotation.x+=sp*dt/w.r);
  }
  if(pv.y<=0.001&&game.keys.Space&&!game.modalOpen&&!game.X.locked()&&(!vh||vh.jump)){pv.vy=11}
  pv.vy-=30*dt;pv.y+=pv.vy*dt;if(pv.y<0){pv.y=0;pv.vy=0}
  game.resolve(pv,vh?vh.rad:0.45);
  pv.x=game.clamp(pv.x,game.RX0+2,game.RX1-2);pv.z=game.clamp(pv.z,game.RZ0+2,game.RZ1-2);
  const ground=game.gy(pv.x,pv.z);
  game.player.position.set(pv.x,ground+pv.y,pv.z);game.player.rotation.y=pv.face;
  if(vh){
    game.av.legL.rotation.x=game.av.legR.rotation.x=vh.legs;game.av.armL.rotation.x=game.av.armR.rotation.x=vh.arms;
    if(vh.id==='kolo'&&moving){game.av.legL.rotation.x=vh.legs+Math.sin(walkT*1.3)*0.5;game.av.legR.rotation.x=vh.legs-Math.sin(walkT*1.3)*0.5}
  }else{
    const sw=moving?Math.sin(walkT)*(sprinting?1.2:0.9):0;
    game.av.legL.rotation.x=sw;game.av.legR.rotation.x=-sw;game.av.armL.rotation.x=-sw;game.av.armR.rotation.x=sw;
    if(pv.y>0.1){game.av.armL.rotation.x=game.av.armR.rotation.x=-2.6}
  }
  game.aura.position.set(pv.x,ground+0.12,pv.z);game.aura.rotation.z+=dt*2;
  const cdx=Math.sin(game.yaw),cdz=Math.cos(game.yaw),foot=1.15+(vh?vh.rad*0.35:0);
  game.carryGroup.position.set(pv.x+cdx*foot,ground+0.22,pv.z+cdz*foot);
  game.carryGroup.rotation.y=game.yaw;
  game.carryGroup.children.forEach((e,i)=>{e.position.y=Math.abs(Math.sin(time*5+i))*0.08;if(e.userData.id==='duha')e.material.color.setHSL((time*0.8+i*0.15)%1,1,0.6)});
  if(game.magnetT>0){game.magnetT-=dt;game.magRing.position.set(pv.x,ground+0.2,pv.z);game.magRing.scale.setScalar(0.85+0.15*Math.sin(time*8));if(game.magnetT<=0){game.magRing.visible=false;game.refreshHud()}}
  for(let i=game.traps.length-1;i>=0;i--){const t=game.traps[i];t.t-=dt;t.m.material.color.setHSL((time*0.8)%1,1,0.55);t.m.material.opacity=0.45+0.3*Math.sin(time*6);if(t.t<=0){game.scene.remove(t.m);game.traps.splice(i,1)}}
  fullCd-=dt;
  if(!edgeTold){
    const d=Math.min(pv.x-(game.RX0+2),game.RX1-2-pv.x,pv.z-(game.RZ0+2),game.RZ1-2-pv.z);
    if(d<14){edgeTold=true;game.toast('Tady mapa končí.','#ffd27a',5)}
  }
}
function tickPets(dt){  const vh=game.veh();
  const dirX=Math.sin(pv.face),dirZ=Math.cos(pv.face);
  game.petMeshes.forEach((p,i)=>{
    const back=2.6+i*1.5+(vh?vh.rad*2:0),side=(i%2?1:-1)*(1.2+(i>>1)*0.3);
    const tx=pv.x-dirX*back+dirZ*side,tz=pv.z-dirZ*back-dirX*side;
    p.position.x+=(tx-p.position.x)*Math.min(1,dt*4);p.position.z+=(tz-p.position.z)*Math.min(1,dt*4);
    p.position.y=game.gy(p.position.x,p.position.z)+(p.userData.fly?1.2:0)+Math.abs(Math.sin(time*8+i))*0.15;
    p.rotation.y=Math.atan2(pv.x-p.position.x,pv.z-p.position.z);
    if(p.userData.rot)p.userData.rot.forEach(r=>r.rotation.y+=dt*40);
  });
}
function tickCamera(dt){
  game.zoom+=(game.zoomT-game.zoom)*Math.min(1,dt*8);
  const vv=game.veh(),cd=(8.5+(vv&&vv.dogsFear?2.5:0))*game.zoom,cx=pv.x+Math.sin(game.yaw)*Math.cos(game.pitch)*cd,gyp=game.gy(pv.x,pv.z)+pv.y,cy=gyp+1.6+Math.sin(game.pitch)*cd,cz=pv.z+Math.cos(game.yaw)*Math.cos(game.pitch)*cd;
  const moving=game.keys.KeyW||game.keys.KeyS||game.keys.KeyA||game.keys.KeyD;
  const shake=vv&&vv.id==='valec'&&!game.modalOpen&&moving?Math.sin(time*60)*0.03:0;
  game.camera.position.set(cx,Math.max(game.gy(cx,cz)+0.8,cy)+shake,cz);game.camera.lookAt(pv.x,gyp+1.6,pv.z);
  return {tx:pv.x,tz:pv.z,ty:gyp};
}
api.tick=tickPlayer;
api.tickPets=tickPets;
api.tickCamera=tickCamera;

  bind(game, "caughtBy", () => caughtBy);
  bindLet(game, "fullCd", () => fullCd, (v) => { fullCd = v; });
  bindLet(game, "immune", () => immune, (v) => { immune = v; });
  bind(game, "pv", () => pv);
  bindLet(game, "time", () => time, (v) => { time = v; });
}
