import { game, bind, bindLet } from './context.js';
import * as THREE from 'three';

export const api = {};


export function initTerenSkutecneVyskyLegoStyl() {
/* Terén (skutečné výšky, lego styl) */
const HT=game.M.HT;
function baseH(x,z){
  const fx=(x-HT.x0)/HT.step,fz=(z-HT.z0)/HT.step;
  const cx=game.clamp(fx,0,HT.nx-1.001),cz=game.clamp(fz,0,HT.nz-1.001);
  const i=cx|0,j=cz|0,tx=cx-i,tz=cz-j,h=(a,b)=>HT.h[(j+b)*HT.nx+(i+a)];
  let v=(h(0,0)*(1-tx)+h(1,0)*tx)*(1-tz)+(h(0,1)*(1-tx)+h(1,1)*tx)*tz;
  const ox=Math.max(0,HT.x0-x,x-(HT.x0+(HT.nx-1)*HT.step)),oz=Math.max(0,HT.z0-z,z-(HT.z0+(HT.nz-1)*HT.step));
  const o=Math.hypot(ox,oz);if(o>0)v*=Math.max(0,1-o/90);
  return v;
}
const pads=[{x:game.H.x,z:game.H.z-5,r:22,b:14,h:baseH(game.H.x,game.H.z-5)},{x:game.PAST.x,z:game.PAST.z,r:22,b:12,h:baseH(game.PAST.x,game.PAST.z)}];
const ponds=game.M.W.map(([name,pts])=>{
  const xs=pts.filter((_,i)=>i%2===0),zs=pts.filter((_,i)=>i%2===1);
  const cx=xs.reduce((a,b)=>a+b)/xs.length,cz=zs.reduce((a,b)=>a+b)/zs.length;
  const r=xs.reduce((a,x,i)=>a+Math.hypot(x-cx,zs[i]-cz),0)/xs.length;
  const wy=Math.min(...xs.map((x,i)=>baseH(x,zs[i])))-0.15;
  return {name,pts,cx,cz,r,wy};
});
function heightAt(x,z){
  let v=baseH(x,z);
  for(const p of pads){const d=Math.hypot(x-p.x,z-p.z);if(d<p.r+p.b)v+=(p.h-v)*(1-game.smooth(p.r,p.r+p.b,d))}
  for(const p of ponds){const d=Math.hypot(x-p.cx,z-p.cz);if(d<p.r*1.05+5){const t=1-game.smooth(p.r*1.05,p.r*1.05+5,d);v=Math.min(v,v+((p.wy-0.9)-v)*t)}}
  return v;
}
const gy=heightAt;

const mats={};
const mat=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));
function box(w,h,d,c,x=0,y=0,z=0,parent=game.scene){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));
  m.position.set(x,y+h/2+(parent===game.scene?gy(x,z):0),z);parent.add(m);return m;
}
function label(text,color='#fff',scale=1){
  const c=document.createElement('canvas');
  const g=c.getContext('2d');g.font='bold 60px Arial';
  const tw=Math.ceil(g.measureText(text).width);
  c.width=Math.max(512,tw+40);c.height=128;
  g.font='bold 60px Arial';g.textAlign='center';g.textBaseline='middle';
  g.lineWidth=14;g.strokeStyle='#000';g.lineJoin='round';g.strokeText(text,c.width/2,64);g.fillStyle=color;g.fillText(text,c.width/2,64);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false,fog:false}));
  s.scale.set(9*scale*(c.width/512),2.25*scale,1);s.renderOrder=10;return s;
}
const placeLabel=(l,x,y,z)=>{l.position.set(x,y+gy(x,z),z);game.scene.add(l);return l};
function glowTex(){
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'#fff');gr.addColorStop(0.3,'#fffa');gr.addColorStop(1,'#fff0');
  g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
}
const GLOW=glowTex();
const shadowOn=o=>{o.traverse(m=>{if(m.isMesh)m.castShadow=true});return o};

/* Zvuky */
let AC=null;
function beep(f=660,d=0.09,type='square',vol=0.04){
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.value=vol;
    o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+d);o.stop(AC.currentTime+d);
  }catch(e){}
}
const sfx={catch:()=>{beep(880,.07);setTimeout(()=>beep(1320,.09),70)},sell:()=>{beep(988,.07,'triangle',.06);setTimeout(()=>beep(1480,.12,'triangle',.06),80)},
  hit:()=>{beep(180,.25,'sawtooth',.06)},buy:()=>{beep(520,.06,'triangle',.06);setTimeout(()=>beep(780,.1,'triangle',.06),60)},
  badge:()=>{[660,880,1100,1320].forEach((f,i)=>setTimeout(()=>beep(f,.12,'triangle',.06),i*90))},blink:()=>beep(1800,.05,'sine',.03),
  item:()=>{beep(440,.05,'sawtooth',.05);setTimeout(()=>beep(880,.12,'sawtooth',.05),50)}};


  bindLet(game, "AC", () => AC, (v) => { AC = v; });
  bind(game, "GLOW", () => GLOW);
  bind(game, "box", () => box);
  bind(game, "gy", () => gy);
  bind(game, "label", () => label);
  bind(game, "mat", () => mat);
  bind(game, "placeLabel", () => placeLabel);
  bind(game, "ponds", () => ponds);
  bind(game, "sfx", () => sfx);
  bind(game, "shadowOn", () => shadowOn);
}

export function initOblohaHoryMrakyHvezdy() {
/* Obloha, hory, mraky, hvězdy */
const skyU={top:{value:new THREE.Color(0x2f7fe0)},mid:{value:new THREE.Color(0x8fc4f5)},hor:{value:new THREE.Color(game.FOG)}};
let sunSprite,moonSprite,stars,cloudMat;const clouds=[];
{
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,24,16),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
    vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 top,mid,hor;varying float h;void main(){float t=clamp(h,0.,1.);vec3 c=mix(hor,mid,smoothstep(0.,.25,t));c=mix(c,top,smoothstep(.2,.9,t));gl_FragColor=vec4(c,1.);}'}));
  sky.renderOrder=-10;game.scene.add(sky);
  sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:game.GLOW,color:0xfff0b0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true}));
  sunSprite.scale.set(420,420,1);game.scene.add(sunSprite);
  moonSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:game.GLOW,color:0xcfdcff,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true}));
  moonSprite.scale.set(180,180,1);game.scene.add(moonSprite);
  const sp=new Float32Array(500*3);
  for(let i=0;i<500;i++){const a=game.rnd(0,6.283),e=Math.acos(game.rnd(0.05,1));sp[i*3]=Math.sin(e)*Math.cos(a)*1300;sp[i*3+1]=Math.cos(e)*1300;sp[i*3+2]=Math.sin(e)*Math.sin(a)*1300}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:2.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));game.scene.add(stars);
  cloudMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.93,fog:false});
  const sph=new THREE.SphereGeometry(1,10,8);
  for(let i=0;i<22;i++){
    const g=new THREE.Group(),n=3+(Math.random()*4|0);
    for(let k=0;k<n;k++){const m=new THREE.Mesh(sph,cloudMat);m.scale.set(game.rnd(14,26),game.rnd(7,11),game.rnd(10,18));m.position.set(k*game.rnd(12,20)-n*8,game.rnd(-3,4),game.rnd(-8,8));g.add(m)}
    g.position.set(game.rnd(-700,700),game.rnd(120,190),game.rnd(-600,500));game.scene.add(g);clouds.push(g);
  }
  // Orlické hory na východě (x je zrcadlově → východ = -x) a kopce dokola
  const cone=new THREE.ConeGeometry(1,1,7);cone.translate(0,0.5,0);
  const hills=new THREE.InstancedMesh(cone,new THREE.MeshLambertMaterial({color:0xffffff}),46);
  const col=new THREE.Color(),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s3=new THREE.Vector3();
  let k=0;
  for(let i=0;i<24;i++){
    const th=-0.5+i/23*2.2,r=game.rnd(980,1120),R=game.rnd(110,180),Hh=game.rnd(70,140);
    p.set(-r*Math.cos(th),0,-75+r*Math.sin(th));s3.set(R,Hh,R);q.setFromAxisAngle(new THREE.Vector3(0,1,0),game.rnd(0,3));
    hills.setMatrixAt(k,m4.compose(p,q,s3));hills.setColorAt(k,col.setHex(i%3?0x4f8a66:0x44795a));k++;
  }
  for(let i=0;i<22;i++){
    const a=i/22*6.283,r=game.rnd(1040,1220),R=game.rnd(100,170);
    p.set(Math.cos(a)*r,0,-75+Math.sin(a)*r);s3.set(R,game.rnd(18,42),R);q.identity();
    hills.setMatrixAt(k,m4.compose(p,q,s3));hills.setColorAt(k,col.setHex(0x6fa070));k++;
  }
  hills.frustumCulled=false;game.scene.add(hills);
}

/* Podlaha: terén z výškové mřížky, lego "cvočky" */
{
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  g.fillStyle='#46c832';g.fillRect(0,0,64,64);
  g.fillStyle='#37a526';g.beginPath();g.arc(33,35,17,0,7);g.fill();
  g.fillStyle='#63e04a';g.beginPath();g.arc(31,31,17,0,7);g.fill();
  g.fillStyle='#57d240';g.beginPath();g.arc(31,31,11,0,7);g.fill();
  g.strokeStyle='#3cb62a';g.lineWidth=2;g.strokeRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;
  const step=3,mg=100,x0=game.RX0-mg,z0=game.RZ0-mg;
  const nx=Math.ceil((game.RX1+mg-x0)/step)+1,nz=Math.ceil((game.RZ1+mg-z0)/step)+1;
  {// dálková rovina s otvorem pro terén (terén může být pod nulou)
    const far=t.clone();far.needsUpdate=true;far.repeat.set(0.5,0.5);
    const x1=x0+(nx-1)*step,z1=z0+(nz-1)*step,B=1300;
    const sh=new THREE.Shape([new THREE.Vector2(-B,-B),new THREE.Vector2(B,-B),new THREE.Vector2(B,B),new THREE.Vector2(-B,B)]);
    sh.holes.push(new THREE.Path([new THREE.Vector2(x0,-z0),new THREE.Vector2(x0,-z1),new THREE.Vector2(x1,-z1),new THREE.Vector2(x1,-z0)]));
    const fp=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshLambertMaterial({map:far,side:THREE.DoubleSide}));
    fp.rotation.x=-Math.PI/2;fp.position.y=-0.03;fp.receiveShadow=true;game.scene.add(fp);
  }
  const pos=new Float32Array(nx*nz*3),uv=new Float32Array(nx*nz*2),cl=new Float32Array(nx*nz*3);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const x=x0+i*step,z=z0+j*step,y=game.gy(x,z),k=j*nx+i;
    pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;uv[k*2]=x/2;uv[k*2+1]=z/2;
    const sh=0.86+game.clamp((y+8)/40,0,0.3)+Math.sin(x*0.11)*Math.cos(z*0.09)*0.05;
    cl[k*3]=sh*0.97;cl[k*3+1]=sh;cl[k*3+2]=sh*0.9;
  }
  const idx=[];
  for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=(j+1)*nx+i,cc=j*nx+i+1,d=(j+1)*nx+i+1;idx.push(a,b,cc,cc,b,d)}
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setAttribute('color',new THREE.BufferAttribute(cl,3));
  geo.setIndex(idx);geo.computeVertexNormals();
  const tm=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:t,vertexColors:true}));tm.receiveShadow=true;game.scene.add(tm);
}


  bindLet(game, "cloudMat", () => cloudMat, (v) => { cloudMat = v; });
  bind(game, "clouds", () => clouds);
  bindLet(game, "moonSprite", () => moonSprite, (v) => { moonSprite = v; });
  bind(game, "skyU", () => skyU);
  bindLet(game, "stars", () => stars, (v) => { stars = v; });
  bindLet(game, "sunSprite", () => sunSprite, (v) => { sunSprite = v; });
}

export function initStavbyPomocne() {
/* Stavby (pomocné) */
function fence(x,z,w,d,c=0xd9a578){
  const px=3;
  const side=(x1,z1,x2,z2)=>{
    const len=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.round(len/px));
    const horiz=Math.abs(z2-z1)<0.01;
    game.shadowOn(game.box(horiz?len:0.25,0.25,horiz?0.25:len,c,(x1+x2)/2,1.1,(z1+z2)/2));
    for(let i=0;i<=n;i++)game.shadowOn(game.box(0.6,1.9,0.6,0xa77a4c,x1+(x2-x1)*i/n,0,z1+(z2-z1)*i/n));
  };
  side(x-w/2,z-d/2,x+w/2,z-d/2);side(x-w/2,z+d/2,x+w/2,z+d/2);
  side(x-w/2,z-d/2,x-w/2,z+d/2);side(x+w/2,z-d/2,x+w/2,z+d/2);
}
function stall(x,z,c1,title){
  game.shadowOn(game.box(6,1.2,2.2,0xb98855,x,0,z));
  [[-2.8,-1],[2.8,-1],[-2.8,1],[2.8,1]].forEach(([a,b])=>game.shadowOn(game.box(0.3,3.6,0.3,0x8a5a2a,x+a,0,z+b)));
  for(let i=0;i<6;i++)game.shadowOn(game.box(1.1,0.25,3.2,i%2?0xffffff:c1,x-2.75+i*1.1,3.6,z));
  game.placeLabel(game.label(title),x,5.6,z);
  game.addBoxObs(x,z,6,2.2);
}


  bind(game, "fence", () => fence);
  bind(game, "stall", () => stall);
}

export function initBolehostPodleMapyOpenstreetmap() {
/* Bolehošť podle mapy (OpenStreetMap) */
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_p=new THREE.Vector3(),_s=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0),_c=new THREE.Color();
function instanced(geo,material,items,cast=false,recv=false){
  const im=new THREE.InstancedMesh(geo,material,Math.max(1,items.length));im.count=items.length;
  items.forEach((it,i)=>{
    _q.setFromAxisAngle(_up,it.ry||0);_p.set(it.x,it.y||0,it.z);_s.set(it.sx,it.sy,it.sz);
    _m4.compose(_p,_q,_s);im.setMatrixAt(i,_m4);
    if(it.color!==undefined)im.setColorAt(i,_c.setHex(it.color));
  });
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
  im.frustumCulled=false;im.castShadow=cast;im.receiveShadow=recv;game.scene.add(im);return im;
}
const unitBox=new THREE.BoxGeometry(1,1,1);unitBox.translate(0,0.5,0);
const unitRoof=new THREE.ConeGeometry(Math.SQRT1_2,1,4);unitRoof.rotateY(Math.PI/4);unitRoof.translate(0,0.5,0);
const white=new THREE.MeshLambertMaterial({color:0xffffff});

/* Pás po terénu (silnice, potok) */
function ribbon(lines,halfW,yoff,material,receive=true){
  const P=[],I=[];
  lines.forEach(pts=>{
    const pp=[];
    for(let i=0;i<pts.length-2;i+=2){
      const ax=pts[i],az=pts[i+1],bx=pts[i+2],bz=pts[i+3],len=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(len/4));
      for(let k=0;k<n;k++)pp.push([ax+(bx-ax)*k/n,az+(bz-az)*k/n]);
    }
    pp.push([pts[pts.length-2],pts[pts.length-1]]);
    const base=P.length/3;
    for(let i=0;i<pp.length;i++){
      const a=pp[Math.max(0,i-1)],b=pp[Math.min(pp.length-1,i+1)];
      let tx=b[0]-a[0],tz=b[1]-a[1];const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
      const nx=-tz,nz=tx,[x,z]=pp[i];
      for(const s of[-1,1]){const px=x+nx*halfW*s,pz=z+nz*halfW*s;P.push(px,game.gy(px,pz)+yoff,pz)}
      if(i>0){const k=base+i*2;I.push(k-2,k-1,k,k,k-1,k+1)}
    }
  });
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));geo.setIndex(I);geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,material);m.receiveShadow=receive;game.scene.add(m);return m;
}
const roadSegs=[];
{
  const major=[],minor=[];
  game.M.R.forEach(([k,pts])=>{
    (k===0?major:minor).push(pts);
    for(let i=0;i<pts.length-2;i+=2)roadSegs.push([pts[i],pts[i+1],pts[i+2],pts[i+3],k===0?1.8:0.9]);
  });
  const pm=(c)=>new THREE.MeshLambertMaterial({color:c,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:THREE.DoubleSide});
  ribbon(major,1.8,0.07,pm(0x8d8a84));ribbon(minor,0.9,0.06,pm(0xb0915e));
}
function nearRoad(x,z,pad){
  for(const [ax,az,bx,bz,hw] of roadSegs){
    const vx=bx-ax,vz=bz-az,L=vx*vx+vz*vz||1e-9,t=game.clamp(((x-ax)*vx+(z-az)*vz)/L,0,1);
    if(Math.hypot(x-ax-vx*t,z-az-vz*t)<hw+pad)return true;
  }
  return false;
}
// Vodní plochy (rybníky) a potok
const waterMat=new THREE.MeshPhongMaterial({color:0x2e8fe0,shininess:120,specular:0xbfe3ff,transparent:true,opacity:0.93,side:THREE.DoubleSide});
game.ponds.forEach(p=>{
  const sh=new THREE.Shape();
  for(let i=0;i<p.pts.length;i+=2){i?sh.lineTo(p.pts[i],-p.pts[i+1]):sh.moveTo(p.pts[i],-p.pts[i+1])}
  const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),waterMat);m.rotation.x=-Math.PI/2;m.position.y=p.wy;m.receiveShadow=true;game.scene.add(m);
  game.addCircObs(p.cx,p.cz,p.r*0.85);
  const reeds=[];for(let i=0;i<p.pts.length;i+=4)reeds.push({x:p.pts[i],y:game.gy(p.pts[i],p.pts[i+1]),z:p.pts[i+1],sx:0.25,sy:game.rnd(1.2,2.2),sz:0.25,color:0x7a8a3a});
  instanced(unitBox,white,reeds,true);
});
ribbon(game.M.ST,0.65,0.1,new THREE.MeshLambertMaterial({color:0x3aa0ff,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,side:THREE.DoubleSide}));

// Budovy (na svahu se základem, okna, dveře, komíny)
const winMat=new THREE.MeshBasicMaterial({color:0x86c2ee});
const bgrid=new Map();
{
  const walls=[],roofs=[],wins=[],doors=[],chims=[];
  const wallPal=[0xf4e3b0,0xf7c6c6,0xc9e4f2,0xf0ede6,0xf2d7a0,0xe3f0c8,0xffe0b8];
  const roofPal=[0xb5432a,0x8a3a1a,0x6b3a2a,0xa8452e,0x7a4a3a,0x9a3a2a];
  game.M.B.forEach((b,i)=>{
    const [x,z,w,d,a,ty]=b,h0=(i*7%10)/10,c=Math.cos(a),s=Math.sin(a);
    let h,wc,rc,rh;
    if(ty===2){h=5;wc=0xf0e0c0;rc=0xd93a2a;rh=2.6}
    else if(ty===3){h=6;wc=0xfff3b0;rc=0x3a6fd9;rh=2.6}
    else if(ty===1){h=4.2+h0*2.2;wc=0xc9b08a;rc=0x777777;rh=1.6}
    else if(ty===4){h=2.4;wc=0xdddddd;rc=0x666666;rh=0.9}
    else{h=3.6+h0*1.6;wc=wallPal[i%wallPal.length];rc=roofPal[(i*3)%roofPal.length];rh=2.3+h0}
    const ry=-a,loc=(lx,lz)=>[x+lx*c-lz*s,z+lx*s+lz*c];
    const gs=[[0,0],[w/2,d/2],[-w/2,d/2],[w/2,-d/2],[-w/2,-d/2]].map(([lx,lz])=>{const [px,pz]=loc(lx,lz);return game.gy(px,pz)});
    const gmin=Math.min(...gs),gmax=Math.max(...gs);
    walls.push({x,y:gmin-0.5,z,ry,sx:w,sy:(gmax-gmin)+0.5+h,sz:d,color:wc});
    roofs.push({x,y:gmax+h,z,ry,sx:w*1.12,sy:rh,sz:d*1.12,color:rc});
    game.addBoxObs(x,z,w,d,a);
    const key=((x/20)|0)+','+((z/20)|0);if(!bgrid.has(key))bgrid.set(key,[]);bgrid.get(key).push(i);
    if(ty===4)return;
    const n=Math.max(1,Math.min(5,Math.floor(w/3.2)));
    for(const side of[-1,1])for(let k=0;k<n;k++){
      const lx=(k-(n-1)/2)*(w/n);
      if(side===-1&&Math.abs(lx)<1.2)continue;
      const [gx,gz]=loc(lx,side*(d/2+0.05));
      wins.push({x:gx,y:game.gy(gx,gz)+h*0.35+0.3,z:gz,ry,sx:ty===1?0.6:1.0,sy:h*0.3,sz:0.22});
    }
    const [dx,dz]=loc(0,-(d/2+0.06));
    doors.push(ty===1?{x:dx,y:game.gy(dx,dz),z:dz,ry,sx:2.6,sy:2.7,sz:0.25,color:0x8a8a90}:{x:dx,y:game.gy(dx,dz),z:dz,ry,sx:1.1,sy:2.1,sz:0.25,color:0x6b3f1f});
    if(ty===0||ty===2){const [cx,cz]=loc(w*0.25,0);chims.push({x:cx,y:gmax+h+rh*0.35,z:cz,ry,sx:0.7,sy:rh*0.75+0.5,sz:0.7,color:0x8a5a4a})}
  });
  instanced(unitBox,white,walls,true,true);
  instanced(unitRoof,white,roofs,true,true);
  instanced(unitBox,winMat,wins);
  instanced(unitBox,white,doors);
  instanced(unitBox,white,chims,true);
}
// Popisky míst
game.M.LM.forEach(([name,x,z])=>{
  const ves=/Lhota|Lipiny|zámek/.test(name),mist=/Šerka|Jirsák|Březina|jezírka|Čížek|Holdon|Zelnice|spraších|skálou/.test(name);
  const col=ves?'#ffe9a0':mist?'#e7ffc2':(name==='Hasiči'||name==='Obecní úřad'?'#ffd0d0':(name==='Škola'?'#fff2a0':'#bfe8ff'));
  game.placeLabel(game.label(name,col,ves?1.2:mist?1:0.9),x,ves?16:mist?12:(name==='Hasiči'?11.5:9),z);
});


  bind(game, "bgrid", () => bgrid);
  bind(game, "instanced", () => instanced);
  bind(game, "nearRoad", () => nearRoad);
  bind(game, "unitBox", () => unitBox);
  bind(game, "white", () => white);
  bind(game, "winMat", () => winMat);
}

export function initGarazeSouseduPsiByk() {
/* Garáže sousedů, psi, býk */
const garages=[],guards=[];
function makeDog(x,z){
  const g=new THREE.Group();
  game.box(1.4,0.9,0.7,0x8a5a2e,0,0.7,0,g);game.box(0.6,0.6,0.6,0x8a5a2e,0.85,1.1,0,g);
  game.box(0.15,0.4,0.25,0x4a2a10,0.85,1.5,0.25,g);game.box(0.15,0.4,0.25,0x4a2a10,0.85,1.5,-0.25,g);
  game.box(0.12,0.12,0.12,0x000000,1.18,1.2,0,g);
  [[-0.5,0.2],[0.5,0.2],[-0.5,-0.2],[0.5,-0.2]].forEach(([a,b])=>game.box(0.2,0.7,0.2,0x6a4020,a,0,b,g));
  const t=game.box(0.15,0.15,0.6,0x8a5a2e,-0.85,1.2,0,g);t.rotation.x=0.6;
  const ice=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.2,1.6),new THREE.MeshLambertMaterial({color:0x9fe6ff,transparent:true,opacity:0.55}));ice.position.y=1.1;ice.visible=false;g.add(ice);g.userData.ice=ice;
  g.position.set(x,game.gy(x,z),z);game.shadowOn(g);game.scene.add(g);return g;
}
function makeBull(x,z){
  const g=new THREE.Group();
  game.box(3,1.8,1.6,0x2a2a2a,0,1.2,0,g);game.box(1.1,1.1,1.1,0x2a2a2a,1.9,1.9,0,g);
  game.box(0.15,0.15,0.9,0xffffff,2.05,3.0,0,g);
  game.box(0.15,0.5,0.15,0xffffff,2.05,2.95,0.6,g);game.box(0.15,0.5,0.15,0xffffff,2.05,2.95,-0.6,g);
  game.box(0.3,0.3,0.3,0xff3030,2.5,2.0,0,g);
  [[-1,0.5],[1,0.5],[-1,-0.5],[1,-0.5]].forEach(([a,b])=>game.box(0.4,1.2,0.4,0x1a1a1a,a,0,b,g));
  const ice=new THREE.Mesh(new THREE.BoxGeometry(4.2,3.4,2.4),new THREE.MeshLambertMaterial({color:0x9fe6ff,transparent:true,opacity:0.55}));ice.position.set(1,1.7,0);ice.visible=false;g.add(ice);g.userData.ice=ice;
  g.position.set(x,game.gy(x,z),z);g.scale.setScalar(1.15);game.shadowOn(g);game.scene.add(g);return g;
}
game.M.NB.forEach((n,ni)=>{
  const [bx,bz,hx,hz,a]=n;
  game.shadowOn(game.box(4.2,2.6+1.6,3.2,0xc8ccd4,hx,-1.6,hz));game.shadowOn(game.box(4.6,0.3,3.6,0x556070,hx,2.6,hz));
  game.box(3.0,2.0,0.1,0x9aa3b0,hx,0,hz+1.65);for(let k=0;k<4;k++)game.box(3.0,0.06,0.12,0x7a8390,hx,0.4+k*0.45,hz+1.66);
  game.addBoxObs(hx,hz,4.2,3.2);
  const h={x:hx,z:hz,stock:3,timer:0,evos:[]};
  for(let k=0;k<3;k++){const o=game.makeOzo(0xff7ac8,1.3);o.g.position.set(hx-1.3+k*1.3,game.gy(hx,hz)+2.9,hz);game.scene.add(o.g);h.evos.push(o.g)}
  game.placeLabel(game.label(game.GARAGE_NAMES[ni%game.GARAGE_NAMES.length],"#ff9ad8",0.75),hx,6.2,hz);
  garages.push(h);
  const dog=makeDog(hx+3*Math.cos(a+1.5),hz+3*Math.sin(a+1.5));
  guards.push({m:dog,hx:hx,hz:hz,spd:6.6,sight:12,leash:26,kind:'pes',frozen:0});
});
game.fence(game.PAST.x,game.PAST.z,34,34,0xbbbbbb);
game.placeLabel(game.label('Pastvina – pozor, býk!',"#ffd21a",0.9),game.PAST.x,6,game.PAST.z-17);
guards.push({m:makeBull(game.PAST.x,game.PAST.z),hx:game.PAST.x,hz:game.PAST.z,spd:7.4,sight:15,leash:22,kind:'býk',frozen:0});


  bind(game, "garages", () => garages);
  bind(game, "guards", () => guards);
}

export function initDomov() {
/* Domov */
const SELL={x:game.H.x-9,z:game.H.z-3},SHOP={x:game.H.x+9,z:game.H.z-3},HATCH={x:game.H.x,z:game.H.z-12};
game.fence(game.H.x,game.H.z-5,32,27);
game.placeLabel(game.label('DOMOV',"#ffe94a",1.2),game.H.x,8,game.H.z+8.5);
game.stall(SELL.x,SELL.z,0xf5c400,'Výkup Ozobotů');
game.stall(SHOP.x,SHOP.z,0x2a7be4,'Obchod');
game.shadowOn(game.box(7,3.4,4.5,0xd8dde6,HATCH.x,0,HATCH.z));game.shadowOn(game.box(7.8,0.5,5.2,0x2a7be4,HATCH.x,3.4,HATCH.z));
game.box(2.2,1.6,0.1,0x22b8c8,HATCH.x,0.8,HATCH.z+2.28);
game.addBoxObs(HATCH.x,HATCH.z,7,4.5);
game.placeLabel(game.label('Dílna',"#ffe94a"),HATCH.x,6.5,HATCH.z);
const workRobot=game.makeOzo(0x22ffaa,1.6);workRobot.g.position.set(HATCH.x+3.3,game.gy(HATCH.x,HATCH.z),HATCH.z+3);game.scene.add(workRobot.g);workRobot.g.visible=false;


  bind(game, "HATCH", () => HATCH);
  bind(game, "SELL", () => SELL);
  bind(game, "SHOP", () => SHOP);
  bind(game, "workRobot", () => workRobot);
}

export function initStromyKvetiny() {
/* Stromy, květiny */
{
  const x0=game.RX0+1.4,x1=game.RX1-1.4,z0=game.RZ0+1.4,z1=game.RZ1-1.4,step=12;
  const posts=[],rails=[];
  const side=(ax,az,bx,bz)=>{
    const len=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.round(len/step)),dx=(bx-ax)/n,dz=(bz-az)/n,horiz=Math.abs(dx)>Math.abs(dz);
    for(let i=0;i<n;i++){
      const x=ax+dx*i,z=az+dz*i,span=Math.hypot(dx,dz);
      posts.push({x,y:game.gy(x,z),z,sx:0.75,sy:5.4,sz:0.75,color:i%2?0xe23b2b:0xf7f7f7});
      const mx=x+dx/2,mz=z+dz/2,my=game.gy(mx,mz);
      rails.push({x:mx,y:my+1.7,z:mz,sx:horiz?span:0.32,sy:0.32,sz:horiz?0.32:span,color:0xf7f7f7});
      rails.push({x:mx,y:my+3.6,z:mz,sx:horiz?span:0.32,sy:0.32,sz:horiz?0.32:span,color:0xe23b2b});
    }
  };
  side(x0,z0,x1,z0);side(x1,z0,x1,z1);side(x1,z1,x0,z1);side(x0,z1,x0,z0);
  game.instanced(game.unitBox,game.white,posts,true);
  game.instanced(game.unitBox,game.white,rails,true);
  [[(x0+x1)/2,z0+8],[(x0+x1)/2,z1-8],[x0+8,(z0+z1)/2],[x1-8,(z0+z1)/2]].forEach(([x,z])=>game.placeLabel(game.label('KONEC MAPY','#ffe94a',0.85),x,7.2,z));
}
{
  const trunks=[],spruce1=[],spruce2=[],round=[];
  const [ox0,ox1,oz0,oz1]=game.M.region;
  for(let i=0,tries=0;i<300&&tries<5000;tries++){
    const x=game.rnd(ox0+6,ox1-6),z=game.rnd(oz0+6,oz1-6),s=game.rnd(0.8,1.4);
    if(!game.freeAt(x,z,3.5)||game.nearRoad(x,z,2.5))continue;
    if(Math.abs(x-game.H.x)<22&&Math.abs(z-game.H.z)<24)continue;
    if(Math.abs(x-game.PAST.x)<20&&Math.abs(z-game.PAST.z)<20)continue;
    const y=game.gy(x,z);
    trunks.push({x,y,z,sx:0.7*s,sy:2.4*s,sz:0.7*s,color:0x7a4a22});
    if(i%3===0){round.push({x,y:y+1.6*s,z,sx:4.2*s,sy:4.2*s,sz:4.2*s,color:[0x3a9a3a,0x52b040,0x2f8a3a][(i>>1)%3]})}
    else{spruce1.push({x,y:y+1.6*s,z,sx:4.4*s,sy:3.6*s,sz:4.4*s,color:0x1f7a2e});spruce2.push({x,y:y+3.6*s,z,sx:3.2*s,sy:3.2*s,sz:3.2*s,color:0x2a9038})}
    game.addCircObs(x,z,0.8*s);i++;
  }
  game.instanced(game.unitBox,game.white,trunks,true);
  const cg=new THREE.ConeGeometry(0.5,1,8);cg.translate(0,0.5,0);
  game.instanced(cg,game.white,spruce1,true);game.instanced(cg,game.white,spruce2,true);
  const sg=new THREE.IcosahedronGeometry(0.5,1);sg.translate(0,0.5,0);
  game.instanced(sg,game.white,round,true);
}
{
  const [ox0,ox1,oz0,oz1]=game.M.region;
  const meadow=[];
  const inMeadow=(x,z)=>x>game.RX0+18&&x<game.RX1-18&&z>game.RZ0+18&&z<game.RZ1-18&&(x<ox0-8||x>ox1+8||z<oz0-8||z>oz1+8);
  const trunks=[],spruce1=[],spruce2=[],round=[],bush=[],rock=[],hay=[],crop=[];
  const treeAt=(x,z,s,i)=>{
    if(!inMeadow(x,z)||!game.freeAt(x,z,2))return false;
    const y=game.gy(x,z);
    trunks.push({x,y,z,sx:0.7*s,sy:2.4*s,sz:0.7*s,color:0x7a4a22});
    if(i%4===0)round.push({x,y:y+1.6*s,z,sx:4.2*s,sy:4.2*s,sz:4.2*s,color:[0x3a9a3a,0x52b040,0x2f8a3a][i%3]});
    else{spruce1.push({x,y:y+1.6*s,z,sx:4.4*s,sy:3.6*s,sz:4.4*s,color:0x1f7a2e});spruce2.push({x,y:y+3.6*s,z,sx:3.2*s,sy:3.2*s,sz:3.2*s,color:0x2a9038});}
    game.addCircObs(x,z,0.75*s);
    return true;
  };
  const grove=(cx,cz,n)=>{
    let got=0;
    for(let k=0;k<n*3&&got<n;k++){
      const x=cx+game.rnd(-18,18),z=cz+game.rnd(-18,18);
      if(treeAt(x,z,game.rnd(0.85,1.45),got))got++;
    }
    if(got>2)meadow.push({x:cx,z:cz,k:'tree'});
  };
  [[game.RX0+46,game.RZ0+46],[game.RX1-46,game.RZ0+46],[game.RX0+46,game.RZ1-46],[game.RX1-46,game.RZ1-46]].forEach(([x,z])=>grove(x,z,18));
  for(let g=0,t=0;g<28&&t<600;t++){
    const x=game.rnd(game.RX0+36,game.RX1-36),z=game.rnd(game.RZ0+36,game.RZ1-36);
    if(!inMeadow(x,z))continue;
    grove(x,z,7+(t%6));
    g++;
  }
  for(let i=0,t=0;i<160&&t<1000;t++){
    const x=game.rnd(game.RX0+22,game.RX1-22),z=game.rnd(game.RZ0+22,game.RZ1-22);
    if(!inMeadow(x,z)||!game.freeAt(x,z,1.2))continue;
    const y=game.gy(x,z),s=game.rnd(0.7,1.35);
    bush.push({x,y,z,sx:1.7*s,sy:1.15*s,sz:1.7*s,color:i%2?0x3c9a34:0x2f7a2c});
    i++;
  }
  for(let i=0,t=0;i<55&&t<400;t++){
    const x=game.rnd(game.RX0+26,game.RX1-26),z=game.rnd(game.RZ0+26,game.RZ1-26);
    if(!inMeadow(x,z)||!game.freeAt(x,z,1.6))continue;
    const y=game.gy(x,z),s=game.rnd(0.85,1.7);
    rock.push({x,y,z,sx:1.6*s,sy:game.rnd(0.55,1.15)*s,sz:1.45*s,color:i%3?0x8b8f88:0x6e726c});
    game.addCircObs(x,z,0.7*s);
    i++;
  }
  for(let g=0,t=0;g<16&&t<240;t++){
    const x=game.rnd(game.RX0+30,game.RX1-30),z=game.rnd(game.RZ0+30,game.RZ1-30);
    if(!inMeadow(x,z))continue;
    let n=0;
    for(let k=0;k<4;k++){
      const hx=x+game.rnd(-3.2,3.2),hz=z+game.rnd(-3.2,3.2);
      if(!inMeadow(hx,hz)||!game.freeAt(hx,hz,1.1))continue;
      hay.push({x:hx,y:game.gy(hx,hz),z:hz,sx:1.4,sy:0.9,sz:0.95,ry:game.rnd(0,3.14),color:k%2?0xd7a441:0xc4842a});
      game.addCircObs(hx,hz,0.7);
      n++;
    }
    if(n){meadow.push({x,z,k:'hay'});g++;}
  }
  for(let g=0,t=0;g<14&&t<220;t++){
    const x=game.rnd(game.RX0+40,game.RX1-40),z=game.rnd(game.RZ0+40,game.RZ1-40);
    if(!inMeadow(x,z)||!game.freeAt(x,z,7))continue;
    const wheat=g%2===0;
    let n=0;
    for(let i=0;i<6;i++)for(let j=0;j<4;j++){
      const px=x-5+i*2,pz=z-3+j*2;
      if(!inMeadow(px,pz))continue;
      crop.push({x:px,y:game.gy(px,pz),z:pz,sx:1.05,sy:wheat?0.72:0.95,sz:1.05,color:wheat?((i+j)%2?0xe6c84a:0xc9a63a):((i+j)%3?0x8fd05a:0x6fb04a)});
      n++;
    }
    if(n>8){meadow.push({x,z,k:wheat?'wheat':'field'});g++;}
  }
  if(trunks.length)game.instanced(game.unitBox,game.white,trunks,true);
  if(hay.length)game.instanced(game.unitBox,game.white,hay,true);
  const cg=new THREE.ConeGeometry(0.5,1,8);cg.translate(0,0.5,0);
  if(spruce1.length)game.instanced(cg,game.white,spruce1,true);
  if(spruce2.length)game.instanced(cg,game.white,spruce2,true);
  const sg=new THREE.IcosahedronGeometry(0.5,1);sg.translate(0,0.5,0);
  if(round.length)game.instanced(sg,game.white,round,true);
  if(bush.length)game.instanced(sg,game.white,bush,true);
  if(rock.length)game.instanced(sg,game.white,rock,true);
  if(crop.length)game.instanced(sg,game.white,crop,true);
  bind(game,'meadow',()=>meadow);
}


}

export function initDenNocAPocasi() {
/* Den, noc a počasí */
const DAY_LEN=480;let dayT=0.32,night=0,dayF=1;
const W={rain:0,fog:0,tRain:0,tFog:0,timer:game.rnd(50,100)};
const cTopD=new THREE.Color(0x2f7fe0),cTopN=new THREE.Color(0x050b22),cMidD=new THREE.Color(0x8fc4f5),cMidN=new THREE.Color(0x0a1438),cHorD=new THREE.Color(0xcfe8ff),cHorN=new THREE.Color(0x0f1a3c),cDusk=new THREE.Color(0xff9a5a);
const cGrayD=new THREE.Color(0x8d98a6),cGrayN=new THREE.Color(0x151a24),tmp=new THREE.Color();
const sunDir=new THREE.Vector3(),moonDir=new THREE.Vector3(),lightDir=new THREE.Vector3();
const rainGeo=new THREE.BufferGeometry(),RN=1400,rainPos=new Float32Array(RN*6);
for(let i=0;i<RN;i++){const x=game.rnd(-35,35),y=game.rnd(0,40),z=game.rnd(-35,35);rainPos.set([x,y,z,x+0.3,y-1.6,z+0.1],i*6)}
rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rainMesh=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xbfd4ff,transparent:true,opacity:0,fog:false}));rainMesh.frustumCulled=false;game.scene.add(rainMesh);
function updateDay(dt){
  dayT=(dayT+dt/DAY_LEN)%1;
  const ang=2*Math.PI*(dayT-0.25),e=Math.sin(ang),ce=Math.cos(ang);
  dayF=game.smooth(-0.1,0.25,e);night=1-dayF;
  const dusk=Math.max(0,1-Math.abs(e)/0.3)*0.85;
  W.timer-=dt;
  if(W.timer<=0){
    const r=Math.random();W.tRain=0;W.tFog=0;
    if(r<0.3){W.tRain=1;if(game.started)game.toast('🌧 Začalo pršet – Ozoboti jsou pomalejší a body navíc!','#9fd0ff')}
    else if(r<0.45){W.tFog=1;if(game.started)game.toast('🌫 Padá mlha…','#dde')}
    else if(game.started&&(W.rain>0.3||W.fog>0.3))game.toast('☀ Počasí se umoudřilo','#fff');
    W.timer=game.rnd(60,140);
  }
  W.rain+=game.clamp(W.tRain-W.rain,-dt*0.2,dt*0.2);W.fog+=game.clamp(W.tFog-W.fog,-dt*0.2,dt*0.2);
  const wk=Math.max(W.rain,W.fog*0.8);
  const top=cTopN.clone().lerp(cTopD,dayF),mid=cMidN.clone().lerp(cMidD,dayF),hor=cHorN.clone().lerp(cHorD,dayF).lerp(cDusk,dusk*0.75);
  const gray=cGrayN.clone().lerp(cGrayD,dayF);
  top.lerp(gray,wk*0.75);mid.lerp(gray,wk*0.75);hor.lerp(gray,wk*0.65+W.fog*0.2);
  game.skyU.top.value.copy(top);game.skyU.mid.value.copy(mid);game.skyU.hor.value.copy(hor);
  game.scene.background.copy(hor);game.scene.fog.color.copy(hor);
  game.scene.fog.near=140-wk*120;game.scene.fog.far=1100-W.rain*280-W.fog*480;
  sunDir.set(-ce,e,-0.35).normalize();moonDir.set(ce,-e,0.35).normalize();
  lightDir.copy(e>=0?sunDir:moonDir);lightDir.y=Math.max(lightDir.y,0.3);lightDir.normalize().multiplyScalar(100);
  const si=e>=0?0.85*game.clamp(e*2.4,0,1)+0.12:0.32*game.clamp(-e*3,0,1)+0.14;
  game.sun.intensity=si*(1-0.4*wk);
  game.sun.color.setHex(0xfff2d8).lerp(tmp.setHex(0xffa060),dusk).lerp(tmp.setHex(0x7a9aff),night*0.85);
  game.hemi.intensity=(0.5+0.35*dayF)*(1-0.25*wk);
  game.hemi.color.setHex(0x5a6aa8).lerp(tmp.setHex(0xdff0ff),dayF);
  game.hemi.groundColor.setHex(0x2a3a2a).lerp(tmp.setHex(0x5a8a3a),dayF);
  game.sunSprite.position.copy(sunDir).multiplyScalar(1200);game.sunSprite.visible=e>-0.15;game.sunSprite.material.opacity=(1-wk)*game.clamp(e*3+0.5,0,1);
  game.moonSprite.position.copy(moonDir).multiplyScalar(1200);game.moonSprite.visible=e<0.1;game.moonSprite.material.opacity=(1-wk)*night;
  game.stars.material.opacity=night*(1-wk*0.9);
  game.cloudMat.color.setHex(0x2b3450).lerp(tmp.setHex(0xffffff),dayF).lerp(tmp.setHex(0x8a909a),W.rain*0.6).lerp(tmp.setHex(0xff9a7a),dusk*0.3);
  game.winMat.color.setHex(0x86c2ee).lerp(tmp.setHex(0xffd27a),night);
  const hh=Math.floor(dayT*24),mi=Math.floor((dayT*24-hh)*60);
  game.$('clock').textContent=(night>0.5?'🌙 ':(dusk>0.4?'🌇 ':'☀️ '))+String(hh).padStart(2,'0')+':'+String(mi).padStart(2,'0')+(W.rain>0.4?'  🌧':W.fog>0.4?'  🌫':'');
  rainMesh.material.opacity=W.rain*0.55;rainMesh.visible=W.rain>0.02;
  if(rainMesh.visible){
    rainMesh.position.set(game.camera.position.x,game.camera.position.y-18,game.camera.position.z);
    const p=rainGeo.attributes.position.array;
    for(let i=0;i<RN;i++){const k=i*6,d=38*dt;p[k+1]-=d;p[k+4]-=d;if(p[k+1]<-5){const x=game.rnd(-35,35),z=game.rnd(-35,35),y=game.rnd(35,42);p[k]=x;p[k+1]=y;p[k+2]=z;p[k+3]=x+0.3;p[k+4]=y-1.6;p[k+5]=z+0.1}}
    rainGeo.attributes.position.needsUpdate=true;
  }
}
const isNight=()=>night>0.55,isRain=()=>W.rain>0.4;


function tickAmbient(dt){
  game.clouds.forEach(c=>{c.position.x+=dt*4;if(c.position.x>760)c.position.x=-760});
  updateDay(dt);
}
api.tick=tickAmbient;

  bind(game, "W", () => W);
  bind(game, "isNight", () => isNight);
  bind(game, "isRain", () => isRain);
  bind(game, "lightDir", () => lightDir);
  bindLet(game, "night", () => night, (v) => { night = v; });
  bind(game, "tmp", () => tmp);
}

export function initTownTick() {
/* Garáže, psi a býk v čase */
function tickTown(dt){  const vh=game.veh();
  game.garages.forEach(h=>{
    if(h.stock<3){h.timer+=dt;if(h.timer>30){h.timer=0;h.stock++}}
    h.evos.forEach((e,i)=>{e.visible=i<h.stock;e.rotation.y+=dt*1.5;e.position.y=game.gy(h.x,h.z)+2.9});
  });
  game.immune=Math.max(0,game.immune-dt);
  const nightK=game.isNight()?1:0;
  for(const g of game.guards){
    const gp=g.m.position,dP=Math.hypot(game.pv.x-gp.x,game.pv.z-gp.z),dH=Math.hypot(gp.x-g.hx,gp.z-g.hz);
    if(g.frozen>0){g.frozen-=dt;if(g.frozen<=0)g.m.userData.ice.visible=false;continue}
    const sight=g.sight*(1+0.45*nightK),spd=g.spd*(1+0.12*nightK);
    let tx=null,tz=null,sp=spd;
    if(vh&&vh.dogsFear&&dP<9){tx=gp.x-(game.pv.x-gp.x);tz=gp.z-(game.pv.z-gp.z);sp=spd*0.8}
    else if(dP<sight&&dH<g.leash&&game.immune<=0){tx=game.pv.x;tz=game.pv.z}
    else if(dH>3){tx=g.hx;tz=g.hz;sp=spd*0.6}
    if(tx!==null){
      const ax=tx-gp.x,az=tz-gp.z,ad=Math.hypot(ax,az);
      if(ad>0.3){gp.x+=ax/ad*sp*dt;gp.z+=az/ad*sp*dt;g.m.rotation.y=Math.atan2(ax,az)-Math.PI/2}
      gp.y=game.gy(gp.x,gp.z)+Math.abs(Math.sin(game.time*14))*0.25;
    }else gp.y=game.gy(gp.x,gp.z);
    if(dP<1.5+(vh?vh.rad:0)&&game.pv.y<1.2&&game.immune<=0&&!(vh&&vh.dogsFear)){game.caughtBy(g);break}
  }
}
api.tickTown=tickTown;

}
