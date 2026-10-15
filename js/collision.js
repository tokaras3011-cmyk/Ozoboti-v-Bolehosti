import { game, bind, bindLet } from './context.js';

export const api = {};


export function initKolize() {
/* Kolize */
const obs=[];
function addBoxObs(x,z,w,d,a=0){obs.push({x,z,hw:w/2,hd:d/2,a,c:Math.cos(a),s:Math.sin(a),R:Math.hypot(w,d)/2+2})}
const addCircObs=(x,z,r)=>obs.push({x,z,r,R:r+2});
function resolve(p,rad){
  for(const o of obs){
    const dx=p.x-o.x,dz=p.z-o.z;
    if(dx*dx+dz*dz>(o.R+rad)*(o.R+rad))continue;
    if(o.r!==undefined){
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
    if(o.r!==undefined){if(Math.hypot(dx,dz)<o.r+pad)return false}
    else{const lx=dx*o.c+dz*o.s,lz=-dx*o.s+dz*o.c;if(Math.abs(lx)<o.hw+pad&&Math.abs(lz)<o.hd+pad)return false}
  }
  return true;
}


  bind(game, "addBoxObs", () => addBoxObs);
  bind(game, "addCircObs", () => addCircObs);
  bind(game, "freeAt", () => freeAt);
  bind(game, "resolve", () => resolve);
}
