import { game, bind, bindLet } from './context.js';

export const api = {};


export function initKolize() {
/* Kolize */
const obs=[];
function addBoxObs(x,z,w,d,a=0){const o={x,z,hw:w/2,hd:d/2,a,c:Math.cos(a),s:Math.sin(a),R:Math.hypot(w,d)/2+2};obs.push(o);return o}
const addCircObs=(x,z,r)=>{const o={x,z,r,R:r+2};obs.push(o);return o};
function insideRing(x,z,ring){
  let c=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const xi=ring[i][0],zi=ring[i][1],xj=ring[j][0],zj=ring[j][1];
    if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/((zj-zi)||1e-12)+xi)c=!c;
  }
  return c;
}
function closestEdge(x,z,ring){
  let best=1e9,qx=x,qz=z,nx=0,nz=1;
  for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],vx=b[0]-a[0],vz=b[1]-a[1],L=vx*vx+vz*vz||1e-9;
    let t=((x-a[0])*vx+(z-a[1])*vz)/L;if(t<0)t=0;else if(t>1)t=1;
    const px=a[0]+vx*t,pz=a[1]+vz*t,d=Math.hypot(x-px,z-pz);
    if(d<best){best=d;qx=px;qz=pz;const il=Math.hypot(vx,vz)||1;nx=vz/il;nz=-vx/il}
  }
  return {d:best,qx,qz,nx,nz};
}
function polyTouch(o,x,z){
  const hit=closestEdge(x,z,o.outer);
  if(o.holes)for(const h of o.holes){const q=closestEdge(x,z,h);if(q.d<hit.d)Object.assign(hit,q)}
  const solid=insideRing(x,z,o.outer)&&!(o.holes&&o.holes.some(h=>insideRing(x,z,h)));
  return {solid,hit};
}
function addPolyObs(outer,holes=[]){
  let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
  for(const p of outer){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<z0)z0=p[1];if(p[1]>z1)z1=p[1]}
  obs.push({x:(x0+x1)/2,z:(z0+z1)/2,R:Math.hypot(x1-x0,z1-z0)/2+2,outer,holes});
}
function resolve(p,rad){
  for(const o of obs){
    const dx=p.x-o.x,dz=p.z-o.z;
    if(dx*dx+dz*dz>(o.R+rad)*(o.R+rad))continue;
    if(o.outer){
      const {solid,hit}=polyTouch(o,p.x,p.z);
      if(solid||hit.d<rad){
        let ux=hit.nx,uz=hit.nz;
        if(!solid){const sx=p.x-hit.qx,sz=p.z-hit.qz;if(sx*hit.nx+sz*hit.nz>0){const l=Math.hypot(sx,sz)||1;ux=sx/l;uz=sz/l}}
        p.x=hit.qx+ux*rad;p.z=hit.qz+uz*rad;
      }
    }else if(o.r!==undefined){
      const d=Math.hypot(dx,dz),m=o.r+rad;
      if(d<m&&d>0.0001){p.x=o.x+dx/d*m;p.z=o.z+dz/d*m}
    }else{
      const lx=dx*o.c+dz*o.s,lz=-dx*o.s+dz*o.c;
      const cx=game.clamp(lx,-o.hw,o.hw),cz=game.clamp(lz,-o.hd,o.hd);
      const ex=lx-cx,ez=lz-cz,d=Math.hypot(ex,ez);
      if(d<rad){
        let nx,nz;
        if(d>0.0001){nx=cx+ex/d*rad;nz=cz+ez/d*rad}
        else{const px=o.hw-Math.abs(lx),pz=o.hd-Math.abs(lz);
          if(px<pz){nx=(lx<0?-1:1)*(o.hw+rad);nz=lz}else{nx=lx;nz=(lz<0?-1:1)*(o.hd+rad)}}
        p.x=o.x+nx*o.c-nz*o.s;p.z=o.z+nx*o.s+nz*o.c;
      }
    }
  }
}
function freeAt(x,z,pad){
  for(const o of obs){
    const dx=x-o.x,dz=z-o.z;
    if(dx*dx+dz*dz>(o.R+pad)*(o.R+pad))continue;
    if(o.outer){const {solid,hit}=polyTouch(o,x,z);if(solid||hit.d<pad)return false}
    else if(o.r!==undefined){if(Math.hypot(dx,dz)<o.r+pad)return false}
    else{const lx=dx*o.c+dz*o.s,lz=-dx*o.s+dz*o.c;if(Math.abs(lx)<o.hw+pad&&Math.abs(lz)<o.hd+pad)return false}
  }
  return true;
}


  bind(game, "addBoxObs", () => addBoxObs);
  bind(game, "addPolyObs", () => addPolyObs);
  bind(game, "addCircObs", () => addCircObs);
  bind(game, "freeAt", () => freeAt);
  bind(game, "resolve", () => resolve);
}
