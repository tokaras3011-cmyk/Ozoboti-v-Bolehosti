import * as THREE from 'three';
import { MAP } from '../mapdata.js';
import { OKOLI, OKOLI_R, OKOLI_LM } from '../map-okoli.js';
import { game, bind, bindLet } from './context.js';
import { initTerenSkutecneVyskyLegoStyl, initOblohaHoryMrakyHvezdy, initStavbyPomocne, initBolehostPodleMapyOpenstreetmap, initGarazeSouseduPsiByk, initDomov, initStromyKvetiny, initDenNocAPocasi, initTownTick, api as world } from './world.js';
import { initPostavy, initHracAVozidla, initVstup, initPlayerMotion, api as player } from './player.js';
import { initOzoboti, initRobotAi, initSvetOzoboti, api as robots } from './robots.js';
import { initKolize, api as collision } from './collision.js';
import { initMinimapa, initVelkaMapaKlikNaMinimapuNeboKlavesaN, initHud, initModalniOkna, initUvodniObrazovka, api as hud } from './hud.js';
import { initStavHryUkladani, initMiseAlbumOdznaky, initInterakce, initPosilovace, api as state } from './game.js';
import { initExtras, api as extras } from './extras.js';
import { initRound, api as round } from './round.js';

MAP.B.push(...OKOLI);
MAP.R.push(...OKOLI_R);
MAP.LM.push(...OKOLI_LM);

function initZaklad() {
/* Základ */
const $=id=>document.getElementById(id);
let RNG=Math.random;
const rnd=(a,b)=>a+RNG()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const FOG=0xcfe8ff;
const M=MAP,H={x:M.H[0],z:M.H[1]};
const PAST=M.PAST?{x:M.PAST[0],z:M.PAST[1]}:{x:H.x+90,z:H.z};
const MAP_PAD=250;
const [rx0,rx1,rz0,rz1]=M.region;
const RX0=rx0-MAP_PAD,RX1=rx1+MAP_PAD,RZ0=rz0-MAP_PAD,RZ1=rz1+MAP_PAD;
const scene=new THREE.Scene();
scene.background=new THREE.Color(FOG);
scene.fog=new THREE.Fog(FOG,140,1100);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.insertBefore(renderer.domElement,document.body.firstChild);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,0.1,1800);
const hemi=new THREE.HemisphereLight(0xdff0ff,0x5a8a3a,0.75);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2d8,0.75);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0006;
Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:10,far:300});
scene.add(sun,sun.target);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});


  bind(game, "$", () => $);
  bind(game, "FOG", () => FOG);
  bind(game, "H", () => H);
  bind(game, "M", () => M);
  bind(game, "PAST", () => PAST);
  bindLet(game, "RNG", () => RNG, (v) => { RNG = v; });
  bind(game, "RX0", () => RX0);
  bind(game, "RX1", () => RX1);
  bind(game, "RZ0", () => RZ0);
  bind(game, "RZ1", () => RZ1);
  bind(game, "camera", () => camera);
  bind(game, "clamp", () => clamp);
  bind(game, "hemi", () => hemi);
  bind(game, "renderer", () => renderer);
  bind(game, "rnd", () => rnd);
  bind(game, "scene", () => scene);
  bind(game, "smooth", () => smooth);
  bind(game, "sun", () => sun);
}

function startLoop(){
  let last=performance.now(), hudT=0, slow=0;
  function tick(now){
    const dt=Math.min(0.05,(now-last)/1000); last=now; game.time+=dt;
    world.tick(dt);
    let tx=game.H.x, tz=game.H.z, ty=game.gy(game.H.x, game.H.z);
    if(game.started){
      if(!game.modalOpen){
        player.tick(dt);
        robots.tick(dt);
        world.tickTown(dt);
        player.tickPets(dt);
        hud.tickPrompt(dt);
      }
      const inc=game.income(); if(inc>0) game.S.money+=inc*dt;
      if(game.hatch&&game.hatch.t>0) game.hatch.t=Math.max(0, game.hatch.t-dt);
      game.workRobot.g.visible=!!game.hatch;
      if(game.hatch){
        game.workRobot.g.rotation.y+=dt*3;
        game.workRobot.g.position.y=game.gy(game.HATCH.x, game.HATCH.z)+Math.abs(Math.sin(game.time*6))*0.3;
        game.tmp.setHSL((game.time*1.5)%1, 1, 0.55);
        game.workRobot.lm.color.copy(game.tmp);
        game.workRobot.gm.color.copy(game.tmp);
      }
      hudT+=dt;
      if(hudT>0.25){
        hudT=0; game.refreshHud();
        if(game.modalOpen&&game.modalRender&&game.modalLive) game.modalRender();
        if(game.todayKey()!==game.S.day) game.ensureMissions();
      }
      slow+=dt; if(slow>10){slow=0; game.save();}
      hud.tick(dt);
      const cam=player.tickCamera(dt);
      tx=cam.tx; tz=cam.tz; ty=cam.ty;
    }else{
      hud.tickPreview(dt);
    }
    extras.tick(dt);
    round.tick(dt);
    game.sun.target.position.set(tx,ty,tz);
    game.sun.position.set(tx+game.lightDir.x, ty+game.lightDir.y, tz+game.lightDir.z);
    game.renderer.render(game.scene, game.camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

  initZaklad();
  initTerenSkutecneVyskyLegoStyl();
  initOblohaHoryMrakyHvezdy();
  initPostavy();
  initKolize();
  initStavbyPomocne();
  initBolehostPodleMapyOpenstreetmap();
  initOzoboti();
  initGarazeSouseduPsiByk();
  initDomov();
  initStromyKvetiny();
  initMinimapa();
  initVelkaMapaKlikNaMinimapuNeboKlavesaN();
  initHracAVozidla();
  initStavHryUkladani();
  initMiseAlbumOdznaky();
  initHud();
  initModalniOkna();
  initInterakce();
  initPosilovace();
  initVstup();
  initDenNocAPocasi();
  initPlayerMotion();
  initRobotAi();
  initTownTick();
  initExtras();
  initRound();
  initUvodniObrazovka();
  initSvetOzoboti();
  startLoop();
