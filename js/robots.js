import { game, bind, bindLet } from './context.js';
import * as THREE from 'three';

export const api = {};


export function initOzoboti() {
/* Ozoboti */
const ROBO=[
  {id:'cerv',n:'červený',g:'červených',v:10,c:0xff2a2a,w:30,beh:'zigzag',hint:'Cik-cak: utíká klikatě.'},
  {id:'zel',n:'zelený',g:'zelených',v:10,c:0x2aff4a,w:0,beh:'herd',hint:'Stádo: běhá ve skupině a utíká společně.'},
  {id:'modr',n:'modrý',g:'modrých',v:15,c:0x2a7bff,w:22,beh:'hider',hint:'Schovávač: zalézá za domy, dokud nejsi u něj.'},
  {id:'zlut',n:'žlutý',g:'žlutých',v:25,c:0xffe62a,w:14,beh:'sprinter',hint:'Sprinter: je rychlý, ale po chvíli se unaví.'},
  {id:'fial',n:'fialový',g:'fialových',v:45,c:0xc04aff,w:8,beh:'blink',hint:'Blikač: když se přiblížíš, přeblikne jinam.'},
  {id:'duha',n:'duhový',g:'duhových',v:150,c:0xffffff,w:0,rainbow:true,beh:'blink2',hint:'Duhový: rychlý a často bliká na pastvině.'},
  {id:'evo',n:'Evo',g:'Evo',v:250,c:0xff7ac8,w:0,beh:'none',hint:'Robot Evo: ukradneš ho jen v garáži sousedů.'}
];
const ROB={};ROBO.forEach(r=>ROB[r.id]=r);
const ozoBody=new THREE.MeshLambertMaterial({color:0xf4f6fa}),ozoDark=new THREE.MeshLambertMaterial({color:0x22262e});
const domeGeo=new THREE.SphereGeometry(0.5,16,10,0,Math.PI*2,0,Math.PI/2),baseGeo=new THREE.CylinderGeometry(0.55,0.58,0.22,16),bandGeo=new THREE.CylinderGeometry(0.575,0.575,0.1,16),wheelGeo=new THREE.CylinderGeometry(0.2,0.2,0.12,10),ledGeo=new THREE.SphereGeometry(0.14,10,8);
function makeOzo(colorHex,sc=1){
  const g=new THREE.Group();
  const base=new THREE.Mesh(baseGeo,ozoDark);base.position.y=0.3;g.add(base);
  const band=new THREE.Mesh(bandGeo,ozoBody);band.position.y=0.46;g.add(band);
  const dome=new THREE.Mesh(domeGeo,ozoBody);dome.position.y=0.5;g.add(dome);
  for(const s of[-1,1]){const w=new THREE.Mesh(wheelGeo,ozoDark);w.rotation.z=Math.PI/2;w.position.set(s*0.56,0.2,0);g.add(w)}
  const lm=new THREE.MeshBasicMaterial({color:colorHex});
  const led=new THREE.Mesh(ledGeo,lm);led.position.set(0,0.98,0.12);g.add(led);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.12),ozoDark);visor.position.set(0,0.66,0.47);g.add(visor);
  const gm=new THREE.SpriteMaterial({map:game.GLOW,color:colorHex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false});
  const glow=new THREE.Sprite(gm);glow.position.set(0,0.95,0.1);glow.scale.set(2,2,1);g.add(glow);
  g.scale.setScalar(sc);
  g.traverse(m=>{if(m.isMesh)m.castShadow=true});
  return {g,led,lm,gm,glow};
}
const robots=[],groups=[];
function randomFree(){
  for(let t=0;t<60;t++){
    let x,z;
    if(Math.random()<0.75){const b=game.M.B[(Math.random()*game.M.B.length)|0],a=game.rnd(0,6.28),r=Math.max(b[2],b[3])/2+game.rnd(2.5,10);x=b[0]+Math.cos(a)*r;z=b[1]+Math.sin(a)*r}
    else{x=game.rnd(game.RX0,game.RX1);z=game.rnd(game.RZ0,game.RZ1)}
    if(x<game.RX0+3||x>game.RX1-3||z<game.RZ0+3||z>game.RZ1-3)continue;
    if(!game.freeAt(x,z,1.5))continue;
    if(Math.abs(x-game.H.x)<19&&Math.abs(z-game.H.z)<19)continue;
    if(Math.abs(x-game.PAST.x)<19&&Math.abs(z-game.PAST.z)<19)continue;
    return [x,z];
  }
  return [game.H.x+25,game.H.z];
}
function pickType(){const list=ROBO.filter(t=>t.w>0),tot=list.reduce((a,r)=>a+r.w,0);let r=Math.random()*tot;for(const t of list){r-=t.w;if(r<=0)return t.id}return 'cerv'}
function setType(r,id){const def=ROB[id];r.id=id;r.lm.color.setHex(def.c);r.gm.color.setHex(def.c)}
function spawnRobot(r){
  if(r.ev){setType(r,r.evType);r.x=r.ex+game.rnd(-5,5);r.z=r.ez+game.rnd(-5,5);r.hx=r.ex;r.hz=r.ez;r.leash=r.evLeash||25}
  else if(r.gold){setType(r,'duha');r.x=game.PAST.x+game.rnd(-12,12);r.z=game.PAST.z+game.rnd(-12,12);r.hx=game.PAST.x;r.hz=game.PAST.z;r.leash=14}
  else if(r.group){
    setType(r,'zel');const g=r.group,ld=g.members.find(m=>m.alive&&m!==r);
    if(ld){r.x=ld.x+game.rnd(-3,3);r.z=ld.z+game.rnd(-3,3);r.hx=ld.hx;r.hz=ld.hz}
    else{[r.x,r.z]=randomFree();r.hx=r.x;r.hz=r.z}
    r.leash=40;
  }
  else if(r.quest){setType(r,r.questType);r.leash=10}
  else{setType(r,pickType());[r.x,r.z]=randomFree();r.hx=r.x;r.hz=r.z;r.leash=40}
  r.heading=game.rnd(0,6.28);r.t=game.rnd(0.5,2);r.alive=true;r.g.visible=true;r.ph=game.rnd(0,6);
  r.cd=game.rnd(1,5);r.run=2.5;r.rest=0;r.zz=1;r.zt=0;r.stop=false;r.dart=0;r.hideT=0;r.hide=null;
  r.g.position.set(r.x,game.gy(r.x,r.z),r.z);
}
function addRobot(opts={}){
  const o=makeOzo(0xffffff,1.8);game.scene.add(o.g);
  const r=Object.assign(o,{gold:false,group:null,quest:false,alive:false,respawn:0,x:0,z:0},opts);
  robots.push(r);spawnRobot(r);return r;
}
/* Pomocníci z dílny */
const HELP=[
  {n:'Ozobot Bit',inc:0.6,c:0x2a7bff,w:48},
  {n:'Ozobot Evo',inc:1.8,c:0xff7ac8,w:28},
  {n:'Robo-pes',inc:5,c:0x9aa7b5,w:14},
  {n:'Robo-pavouk',inc:14,c:0x5a4a7a,w:7},
  {n:'Dron',inc:45,c:0x22b8c8,w:2.6},
  {n:'Zlatý robot',inc:160,c:0xffc400,w:0.4}
];
function makeHelper(i){
  const p=HELP[i],g=new THREE.Group();
  if(i<2){const o=makeOzo(p.c,i?1.3:1.0);g.add(o.g)}
  else if(i===2){game.box(1.3,0.7,0.7,p.c,0,0.5,0,g);game.box(0.6,0.5,0.6,p.c,0.8,0.9,0,g);game.box(0.1,0.6,0.1,0x666666,0.8,1.4,0,g);
    [[-0.45,0.2],[0.45,0.2],[-0.45,-0.2],[0.45,-0.2]].forEach(([a,b])=>game.box(0.18,0.5,0.18,0x555555,a,0,b,g));
    const l=new THREE.Mesh(ledGeo,new THREE.MeshBasicMaterial({color:0x33ffcc}));l.position.set(1.12,1.0,0);g.add(l)}
  else if(i===3){const b=new THREE.Mesh(new THREE.SphereGeometry(0.55,12,8),game.mat(p.c));b.position.y=0.8;b.scale.y=0.7;g.add(b);
    for(let k=0;k<6;k++){const a=k/6*6.283;game.box(0.12,0.9,0.12,0x333344,Math.cos(a)*0.75,0.1,Math.sin(a)*0.75,g).rotation.z=Math.cos(a)*0.6}
    const l=new THREE.Mesh(ledGeo,new THREE.MeshBasicMaterial({color:0xff3a3a}));l.position.set(0,1.0,0.4);g.add(l)}
  else if(i===4){game.box(0.9,0.35,0.9,p.c,0,1.3,0,g);g.userData.rot=[];
    for(const[a,b]of[[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]]){const r=game.box(0.7,0.05,0.12,0x222222,a,1.75,b,g);g.userData.rot.push(r)}
    g.userData.fly=1}
  else{game.box(0.9,1.0,0.6,p.c,0,0.7,0,g);game.box(0.7,0.7,0.6,p.c,0,1.7,0,g);game.box(0.15,0.15,0.1,0x111111,-0.15,1.95,0.32,g);game.box(0.15,0.15,0.1,0x111111,0.15,1.95,0.32,g);
    game.box(0.25,0.7,0.25,p.c,-0.65,0.75,0,g);game.box(0.25,0.7,0.25,p.c,0.65,0.75,0,g);game.box(0.3,0.7,0.3,p.c,-0.22,0,0,g);game.box(0.3,0.7,0.3,p.c,0.22,0,0,g)}
  game.shadowOn(g);return g;
}


  bind(game, "HELP", () => HELP);
  bind(game, "ROB", () => ROB);
  bind(game, "ROBO", () => ROBO);
  bind(game, "addRobot", () => addRobot);
  bind(game, "groups", () => groups);
  bind(game, "makeHelper", () => makeHelper);
  bind(game, "makeOzo", () => makeOzo);
  bind(game, "pickType", () => pickType);
  bind(game, "robots", () => robots);
  bind(game, "spawnRobot", () => spawnRobot);
}

export function initRobotAi() {
/* Chování Ozobotů */
function catchRobot(r,byTrap=false){
  const def=game.ROB[r.id],m=(game.isNight()?1.25:1)*(game.isRain()?1.15:1)*game.X.valueMult();
  game.carry.push({id:r.id,m});r.alive=false;r.g.visible=false;r.respawn=r.gold?45:game.rnd(14,28);
  game.S.caught++;game.S.album[r.id]=(game.S.album[r.id]||0)+1;
  if(game.isNight())game.S.stats.night++;if(game.isRain())game.S.stats.rain++;if(byTrap)game.S.stats.trap++;
  game.burst(r.x,game.gy(r.x,r.z)+1.2,r.z,def.rainbow?0xffffff:def.c);game.sfx.catch();
  game.mEvent('catch',{id:r.id,night:game.isNight(),ride:!!game.veh(),quest:r.quest?r.questIdx:-1});
  if(r.ev)game.S.stats.flock=(game.S.stats.flock||0)+1;
  game.X.onCatch(r.id,m);
  game.refreshCarry();game.refreshHud();game.checkBadges();
  if(r.quest){game.scene.remove(r.g);const i=game.robots.indexOf(r);if(i>=0)game.robots.splice(i,1);game.questRobots=game.questRobots.filter(q=>q!==r)}
}
function teleportBlink(r,far){
  const ox=r.x,oz=r.z;
  for(let t=0;t<8;t++){
    const a=game.rnd(0,6.28),d=game.rnd(far*0.6,far);const x=r.x+Math.cos(a)*d,z=r.z+Math.sin(a)*d;
    if(Math.hypot(x-r.hx,z-r.hz)>r.leash)continue;
    if(!game.freeAt(x,z,1.2)||x<game.RX0+3||x>game.RX1-3||z<game.RZ0+3||z>game.RZ1-3)continue;
    const c=game.ROB[r.id].rainbow?0xffffff:game.ROB[r.id].c;
    game.burst(ox,game.gy(ox,oz)+1,oz,c,10);r.x=x;r.z=z;game.burst(x,game.gy(x,z)+1,z,c,10);game.sfx.blink();return true;
  }
  return false;
}
function nearestHide(r,px,pz){
  const cx=(r.x/20)|0,cz=(r.z/20)|0;let best=null,bd=1e9;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
    const l=game.bgrid.get((cx+i)+','+(cz+j));if(!l)continue;
    for(const bi of l){
      const b=game.M.B[bi];let vx=b[0]-px,vz=b[1]-pz;const n=Math.hypot(vx,vz)||1;vx/=n;vz/=n;
      const off=Math.max(b[2],b[3])/2+2.0;const hx=b[0]+vx*off,hz=b[1]+vz*off;
      if(!game.freeAt(hx,hz,0.5))continue;
      const d=Math.hypot(hx-r.x,hz-r.z);if(d<bd){bd=d;best={x:hx,z:hz}}
    }
  }
  return best;
}
function updateRobots(dt){
  const rainMul=game.isRain()?0.85:1,rmag=game.magnetT>0;
  const ledMul=(1+0.9*game.night)*game.X.ledBoost();
  for(const r of game.robots){
    if(!r.alive){if(!r.quest&&!r.ev){r.respawn-=dt;if(r.respawn<=0)game.spawnRobot(r)}continue}
    const dx=r.x-game.pv.x,dz=r.z-game.pv.z,d=Math.hypot(dx,dz),def=game.ROB[r.id];
    if(d<150){
      const fr=r.gold?13:9,fleeing=d<fr;
      let sp=2.2*rainMul,hd=r.heading;
      r.t-=dt;if(r.t<=0){r.heading+=game.rnd(-1.4,1.4);r.t=game.rnd(1,3)}
      hd=r.heading;
      const away=Math.atan2(dz,dx);
      const grp=r.group;
      if(!fleeing&&!rmag){for(const t of game.traps){const td=Math.hypot(t.x-r.x,t.z-r.z);if(td<10&&!r.gold){hd=Math.atan2(t.z-r.z,t.x-r.x);sp=3.2*rainMul;break}}}
      if(grp&&!fleeing){
        const ld=grp.members.find(m=>m.alive);
        if(ld&&ld!==r){const ox=ld.x+Math.cos(r.ph*3)*2.5-r.x,oz=ld.z+Math.sin(r.ph*3)*2.5-r.z,od=Math.hypot(ox,oz);if(od>1.5){hd=Math.atan2(oz,ox);sp=Math.min(4,2+od*0.6)*rainMul}}
      }
      if(rmag&&d<14){hd=Math.atan2(-dz,-dx);sp=9}
      else if(fleeing){
        const base=(def.beh==='zigzag'?5.0:def.beh==='herd'?4.6:def.beh==='hider'?5.2:def.beh==='sprinter'?6.6:def.beh==='blink'?5.0:def.beh==='blink2'?6.6:4.8)*rainMul;
        sp=base;
        if(def.beh==='zigzag'){r.zt-=dt;if(r.zt<=0){r.zz=-r.zz;r.zt=0.35}hd=away+r.zz*0.95}
        else if(def.beh==='herd'){hd=away+Math.sin(game.time*2+r.ph)*0.25}
        else if(def.beh==='hider'){
          r.hideT-=dt;
          if(r.dart>0){r.dart-=dt;hd=r.heading;sp=7}
          else{
            if(r.hideT<=0){r.hide=nearestHide(r,game.pv.x,game.pv.z);r.hideT=0.4}
            if(r.hide){
              const hx=r.hide.x-r.x,hz=r.hide.z-r.z,hdist=Math.hypot(hx,hz);
              if(hdist<1.0){sp=0;r.stop=true;if(d<4.5){r.dart=0.9;r.heading=away+(Math.random()<0.5?1.2:-1.2);r.stop=false;r.hide=null}}
              else{hd=Math.atan2(hz,hx);sp=5.4*rainMul}
            }else hd=away;
          }
        }
        else if(def.beh==='sprinter'){
          if(r.rest>0){r.rest-=dt;sp=0.5;hd=away}
          else{r.run-=dt;hd=away;if(r.run<=0){r.rest=2.0;r.run=2.5}}
        }
        else if(def.beh==='blink'||def.beh==='blink2'){
          r.cd-=dt;hd=away;
          if(r.cd<=0&&d<fr-2){if(teleportBlink(r,def.beh==='blink2'?15:13))r.cd=def.beh==='blink2'?4.5:6.5}
        }
        else hd=away;
      }
      if(def.beh==='blink2'&&!fleeing){r.cd-=dt;if(r.cd<=0){if(teleportBlink(r,9))r.cd=game.rnd(5,9);else r.cd=2}}
      if(Math.hypot(r.x-r.hx,r.z-r.hz)>r.leash&&!rmag)hd=Math.atan2(r.hz-r.z,r.hx-r.x);
      if(sp>0){
        const q={x:r.x+Math.cos(hd)*sp*dt,z:r.z+Math.sin(hd)*sp*dt};
        const ox=q.x,oz=q.z;game.resolve(q,0.55);
        if(Math.abs(q.x-ox)>0.001||Math.abs(q.z-oz)>0.001)r.t=0;
        r.x=game.clamp(q.x,game.RX0+2,game.RX1-2);r.z=game.clamp(q.z,game.RZ0+2,game.RZ1-2);
      }
      const hop=fleeing&&sp>0.6?Math.abs(Math.sin(game.time*12+r.ph))*0.08:0;
      r.g.position.set(r.x,game.gy(r.x,r.z)+hop,r.z);
      if(sp>0.05){r.g.rotation.y=-hd+Math.PI/2}
      r.g.rotation.z=fleeing&&sp>0.6?Math.sin(game.time*18+r.ph)*0.12:0;
    }
    if(def.rainbow){game.tmp.setHSL((game.time*0.6+r.ph)%1,1,0.55);r.lm.color.copy(game.tmp);r.gm.color.copy(game.tmp)}
    const tired=def.beh==='sprinter'&&r.rest>0;
    const pulse=(d<(r.gold?13:9)?6:2.5);
    r.glow.scale.setScalar((tired?1.2:2.0+0.4*Math.sin(game.time*pulse+r.ph))*ledMul);
    if(d<game.catchR()&&Math.abs(game.pv.y)<2.2){
      if(game.carry.length<game.cap())catchRobot(r);
      else if(game.fullCd<=0){game.toast('Krabice je plná! Běž prodat do výkupu.','#ffb347');game.fullCd=2.5}
    }
    if(r.alive){for(const t of game.traps){if(Math.hypot(t.x-r.x,t.z-r.z)<1.9&&game.carry.length<game.cap()){catchRobot(r,true);break}}}
  }
}
api.tick=updateRobots;

}

export function initSvetOzoboti() {
/* Svět: Ozoboti */
for(let g=0;g<3;g++){const grp={members:[]};game.groups.push(grp);for(let k=0;k<6;k++){const r=game.addRobot({group:grp});grp.members.push(r)}}
for(let i=0;i<87;i++)game.addRobot();
for(let i=0;i<5;i++)game.addRobot({gold:true});
game.groups.forEach(g=>{const l=g.members[0];g.members.forEach(m=>{m.x=l.x+game.rnd(-3,3);m.z=l.z+game.rnd(-3,3);m.hx=l.hx;m.hz=l.hz;m.g.position.set(m.x,game.gy(m.x,m.z),m.z)})});


}
