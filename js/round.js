import { game, bind, bindLet } from './context.js';

export const api = {};


export function initRound() {
const fileMode=location.protocol==='file:';
const API_BASE=new URL('.', location.href).href;
  /* ---------- Režim kola (síť) ---------- */
  const Net={ok:false,phase:'idle',id:0,start:0,dur:0,seed:0,stopped:0,off:0,board:[],ip:'',port:0};
  const Round={entered:false,score:0,caught:0,backup:null,lastId:0,sched:[],sendT:0,finished:false,evDone:0};
  async function poll(){
    if(fileMode)return;
    try{
      const r=await fetch(new URL('api/state',API_BASE),{cache:'no-store'});const d=await r.json();
      Net.ok=true;Net.phase=d.round.phase;Net.id=d.round.id;Net.start=d.round.start;Net.dur=d.round.duration;Net.seed=d.round.seed;Net.stopped=d.round.stopped_at;
      Net.off=d.round.now-Date.now();Net.board=d.board;Net.ip=d.ip;Net.port=d.port;
    }catch(e){Net.ok=false}
    banner();
  }
  const mmss=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  const srvNow=()=>Date.now()+Net.off;
  function roundEnd(){return Math.min(Net.start+Net.dur*1000,Net.stopped||1e18)}
  function banner(){
    if(game.started){game.rb.style.display='none';return}
    if(!Net.ok){game.rb.style.display='none';return}
    let t='🏁 Režim kola je dostupný. ';
    if(Net.phase==='idle')t+='Čeká se, až učitel spustí kolo – zatím si můžeš hrát.';
    else if(Net.phase==='countdown')t+='Kolo č. '+Net.id+' za '+mmss((Net.start-srvNow())/1000)+'! Napiš jméno a dej Hrát.';
    else if(Net.phase==='running')t+='Kolo č. '+Net.id+' právě běží (zbývá '+mmss((roundEnd()-srvNow())/1000)+'). Připoj se!';
    else t+='Poslední kolo skončilo.';
    game.rb.textContent=t;game.rb.style.display='block';
  }
  function inRound(){return Round.entered}
  function locked(){return Round.entered&&Net.phase==='countdown'}
  function enterRound(){
    game.closeModal();Round.entered=true;Round.finished=false;Round.lastId=Net.id;Round.score=0;Round.caught=0;Round.backup=game.S;Round.evDone=0;Round.sendT=0;
    const n=game.newState();n.name=game.S.name;n.char=game.S.char;n.color=game.S.color;n.money=150;n.items={magnet:1,freeze:1,trap:1};n.visited={};game.S=n;
    game.carry=[];game.refreshCarry();game.setVehicle(-1);game.clearQuestRobots();game.hatch=null;game.rebuildPets();
    if(game.EV.cur)game.endEvent(true);game.buffs.zav=game.buffs.gul=0;
    // stejné rozmístění Ozobotů pro všechny
    game.RNG=game.rng(Net.seed);game.robots.forEach(r=>{if(!r.ev&&!r.quest)game.spawnRobot(r)});game.RNG=Math.random;
    game.pv.x=game.H.x;game.pv.z=game.H.z;game.pv.y=0;game.pv.vy=0;
    // plán událostí podle seedu (u všech stejný)
    const rr=game.rng(Net.seed^0x9e3779b9),types=['flock','gulas','boss','hunt'];
    for(let i=types.length-1;i>0;i--){const j=(rr()*(i+1))|0;[types[i],types[j]]=[types[j],types[i]]}
    Round.sched=types.map((t,i)=>({t,at:Net.dur*(0.14+i*0.22),dur:Math.min(game.EVDEF[t].dur,Net.dur*0.2),done:false}));
    game.refreshHud();
  }
  function exitRound(){
    Round.entered=false;
    if(game.EV.cur)game.endEvent(true);game.buffs.zav=game.buffs.gul=0;
    game.S=Round.backup;Round.backup=null;game.carry=[];game.refreshCarry();game.setVehicle(-1);game.rebuildPets();
    game.pv.x=game.H.x;game.pv.z=game.H.z;
    game.RNG=game.rng((Math.random()*1e9)|0);game.robots.forEach(r=>{if(!r.ev&&!r.quest)game.spawnRobot(r)});game.RNG=Math.random;
    game.ensureMissions();game.refreshHud();game.elRound.style.display='none';game.elBoard.style.display='none';game.elCount.style.display='none';
  }
  async function sendScore(final){
    try{await fetch(new URL('api/score',API_BASE),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:game.S.name,char:game.S.char,color:game.S.color,round:Round.lastId,score:Math.floor(Round.score),caught:Round.caught})})}catch(e){}
  }
  async function finishRound(){
    if(Round.finished)return;Round.finished=true;
    const myScore=Math.floor(Round.score),myCaught=Round.caught,name=game.S.backup?game.S.backup.name:game.S.name;
    await sendScore(true);await poll();
    exitRound();game.sfx.badge();
    const b=Net.board,pos=b.findIndex(p=>p.name.toLowerCase()===name.toLowerCase());
    game.openModal('🏁 Konec kola!',el=>{
      el.innerHTML='<p style="font-size:20px">Tvoje body: <b>'+myScore+'</b> (chyceno '+myCaught+')'+(pos>=0?' – <b>'+(pos+1)+'. místo</b> z '+b.length:'')+'</p>'
        +'<table style="width:100%;font-size:17px">'+b.slice(0,10).map((p,i)=>'<tr'+(i===pos?' style="background:#fff3c4;font-weight:800"':'')+'><td>'+(i+1)+'.</td><td>'+p.name.replace(/</g,'&lt;')+'</td><td style="text-align:right">'+p.caught+' ×</td><td style="text-align:right"><b>'+p.score+'</b></td></tr>').join('')+'</table>'
        +'<p style="margin-top:10px"><button id="dipb">🖨 Diplom</button></p>';
      el.querySelector('#dipb').onclick=()=>showDiploma(name,pos+1,myScore,myCaught);
    },false);
  }
  function showDiploma(name,rank,score,caught){
    game.dip.innerHTML='<div class="dip"><h1>DIPLOM</h1><p>Ozoboti z Bolehoště – kolo č. '+Net.id+'</p><div class="nm">'+name.replace(/</g,'&lt;')+'</div><p>obsadil(a) <b>'+rank+'. místo</b></p><p>chytil(a) '+caught+' Ozobotů a získal(a) '+score+' bodů</p><p style="margin-top:30px">'+new Date().toLocaleDateString('cs-CZ')+'</p><p><button onclick="window.print()">🖨 Tisk</button> <button onclick="document.getElementById(\'diploma\').style.display=\'none\'">Zavřít</button></p></div>';
    game.dip.style.display='block';
  }
  function onScore(p){if(Round.entered&&Net.phase==='running')Round.score+=p}
  function onCatch(id,m){
    if(!Round.entered||Net.phase!=='running')return;
    Round.score+=game.ROB[id].v*m;Round.caught++;
  }


function tickRound(dt){
if(Net.ok&&game.started){
      const serverNow=srvNow();
      if(!Round.entered&&(Net.phase==='countdown'||Net.phase==='running')&&Net.id!==Round.lastId){enterRound()}
      else if(Round.entered){
        if(Net.phase==='idle'){exitRound()}
        else if(Net.phase==='ended'){finishRound()}
        else if(Net.phase==='countdown'){
          const n=Math.ceil((Net.start-serverNow)/1000);game.elCount.style.display='block';game.elCount.textContent=n>0?n:'';game.pv.x=game.H.x;game.pv.z=game.H.z;
          game.elRound.style.display='block';game.elRound.textContent='🏁 Kolo č. '+Net.id+' – start za '+n+' s';
        }else if(Net.phase==='running'){
          game.elCount.style.display='none';
          const rem=(roundEnd()-serverNow)/1000,rank=Net.board.findIndex(p=>p.name.toLowerCase()===game.S.name.toLowerCase());
          game.elRound.style.display='block';game.elRound.textContent='🏁 '+mmss(rem)+'   ⭐ '+Math.floor(Round.score)+' b.'+(rank>=0?'   ('+(rank+1)+'. místo)':'');
          game.elBoard.style.display='block';game.elBoard.innerHTML='<b>🏆 Pořadí</b><br>'+Net.board.slice(0,6).map((p,i)=>(i+1)+'. '+p.name.replace(/</g,'&lt;')+' – '+p.score).join('<br>');
          Round.sendT-=dt;if(Round.sendT<=0){Round.sendT=2;sendScore()}
          const el=(serverNow-Net.start)/1000;
          Round.sched.forEach(e=>{if(!e.done&&el>=e.at){e.done=true;game.startEvent(e.t,e.dur)}});
        }
      }
    }
}
api.tick=tickRound;
setInterval(()=>{if(Net.ok||!fileMode)poll()},1500);poll();

  bind(game, "Net", () => Net);
  bind(game, "Round", () => Round);
  bind(game, "inRound", () => inRound);
  bind(game, "locked", () => locked);
  bind(game, "mmss", () => mmss);
  bind(game, "onCatch", () => onCatch);
  bind(game, "onScore", () => onScore);
  bind(game, "poll", () => poll);
}
