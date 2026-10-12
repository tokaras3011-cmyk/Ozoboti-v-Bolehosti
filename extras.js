/* ============================================================
   extras.js – místní prvky Bolehoště, starosta a Mega-Ozobot,
   události, hudba a režim kola (soutěž více počítačů).
   Načítá se PŘED hlavním skriptem; hra na něj sahá přes extrasInit().
   ============================================================ */
const GARAGE_NAMES=['Garáž pana Zelenky','Garáž tety Kyselé','Garáž strýce Kvasnice','Garáž Pepy Závitka','Garáž paní Gulášové','Garáž vozataje Vojty','Garáž dědy Hasiče','Garáž Mrkvičků'];

/* Zajímavosti (zdroje: web obce Bolehošť, Wikipedie, Agrospol Bolehošť) */
const PLACE_FACTS={
  hospoda:'Obecní hostinec (čp. 30) má i společenskou místnost na oslavy a školení. Zkus bolehošťský závitek – místní specialitu!',
  obchod:'V Bolehošti je obchod, pošta, knihovna, základní škola i školka – nemusí se dojíždět do města.',
  hriste:'Na hřišti se scházejí sportovci z TJ Sokol Bolehošť.',
  vez:'Zvonička připomíná, že obec je stará – první písemná zmínka o Bolehošti je z roku 1394.',
  pomnik:'Pomníky připomínají lidi a události z dějin obce. V roce 2024 slavila Bolehošť 630 let od založení!',
  kriz:'Boží muka a kříže u cest dřív označovaly cesty a pole. Bolehošť je ve starých listinách od roku 1394.',
  zelarna:'Bolehošťské kysané zelí se dělá z hlávkového zelí z černozemních polí. Tradice je asi sto let a zelí nese značku KLASA!',
  pole:'Zelí roste na černozemi – půda kolem Bolehoště je mimořádně úrodná.',
  'Hasiči':'Sbor dobrovolných hasičů v Bolehošti založilo 17. března 1878 dvacet tři členů, prvním velitelem byl Jan Schejbal. Nová zbrojnice vznikla roku 1964.',
  'Obecní úřad':'Starostou obce je Jakub Šimerda. Obec tvoří tři části: Bolehošť, Bolehošťská Lhota a Lipiny.',
  'Škola':'V Bolehošti je základní i mateřská škola. Děti chodí i do kroužků – třeba hasičů!',
  'Pošta':'Pošta Bolehošť má PSČ 517 31. Před obecním úřadem stojí Z-Box na balíky.',
  'Baba':'Rybník Baba je jeden z rybníků kolem obce – dál jsou Malý a Velký Nadýmač a Nebeský.',
  'Malý Nadýmač':'Malý a Velký Nadýmač jsou rybníky hned u vsi.',
  'Velký Nadýmač':'Velký Nadýmač je největší rybník přímo u Bolehoště.',
  'Nebeský':'Rybník Nebeský leží severně od vsi.'
};
const TICKER_FACTS=[
  'Obec Bolehošť slavila v roce 2024 630 let od založení (první zmínka 1394).',
  'Osada Lipiny vznikla roku 1709.',
  'Lovecký zámeček rodu Colloredů nad Bolehošťskou Lhotou byl postaven v roce 1700.',
  'Bolehošťští hasiči dostali v roce 1935 motorovou stříkačku a v 90. letech Avii a Tatru 138.',
  'SK Sokol Lipiny pořádá jezdecké a vozatajské závody.',
  'V Bolehošti se pořádají Gulášové slavnosti.',
  'V obci hrají divadlo ochotníci z divadelního spolku.',
  'Nedaleko je přírodní rezervace Chropotínský háj.',
  'Bolehošť leží na úpatí Orlických hor, asi 260–270 m nad mořem.',
  'Obec měla v roce 2023 přibližně 619 obyvatel.',
  'Bolehošťský závitek je vyhlášená místní specialita.',
  'Bolehošťské kysané zelí se prodává i ve velkých obchodních řetězcích.',
  'Obec se skládá ze tří částí: Bolehošť, Bolehošťská Lhota a Lipiny.'
];

/* ---------- Doplňky postav ---------- */
window.ACC={
  dracek(g,ch){
    box(0.28,0.6,0.28,0xf5efd0,-0.4,4.5,0,g);box(0.28,0.6,0.28,0xf5efd0,0.4,4.5,0,g);          // růžky
    box(0.12,1.5,1.25,0x3a9a3a,-0.95,2.3,-0.7,g).rotation.z=0.45;box(0.12,1.5,1.25,0x3a9a3a,0.95,2.3,-0.7,g).rotation.z=-0.45; // křídla
    box(0.45,0.45,2.0,ch.skin,0,0.9,-1.5,g);box(0.3,0.5,0.3,0x2a8a2a,0,1.25,-2.4,g);            // ocas
    box(1.9,0.3,1.3,0xb6e07a,0,3.0,0,g);box(1.5,0.25,1.1,0x9bd86a,0,3.25,0,g);                   // zelný límec
    box(1.0,0.9,0.15,0xf2f7d8,0,1.7,0.52,g);                                                      // bříško
    const c=new THREE.Mesh(new THREE.SphereGeometry(0.5,10,8),mat(0x8fd05a));c.position.set(0,2.1,0.75);c.scale.y=0.85;g.add(c);    // hlávka zelí
    box(0.9,0.1,0.9,0xd7f0a0,0,2.3,0.75,g);
  },
  hasicka(g,ch){
    box(1.3,0.5,1.3,ch.hair,0,4.2,-0.05,g);box(1.3,0.8,0.3,ch.hair,0,3.7,-0.55,g);
    box(0.35,1.0,0.35,ch.hair,-0.9,3.0,-0.2,g);box(0.35,1.0,0.35,ch.hair,0.9,3.0,-0.2,g);
    box(1.5,0.5,1.5,0xd93a2a,0,4.35,0,g);box(1.5,0.08,0.45,0xffd21a,0,4.6,0.8,g);box(1.65,0.12,1.65,0xb02a1a,0,4.3,0,g);
  },
  starosta(g,ch){
    for(const [i,c] of [[0,0xffffff],[1,0x2a4fd0],[2,0xd93a2a]]){const s=box(0.3,2.3,0.12,c,-0.45+i*0.3,1.7,0.5,g);s.rotation.z=0.6}  // šerpa
    box(0.3,0.9,0.1,0xd93a2a,0,2.0,0.5,g);box(0.9,0.14,0.14,0xffd21a,0,3.3,0.5,g);            // kravata, řetěz
    box(1.3,0.45,1.3,ch.hair,0,4.2,-0.05,g);
  }
};
window.VEHMODELS={
  povoz(g,wheel){
    wheel(0.95,0.25,1.15,0.95,-1.2,0x6a4020);wheel(0.95,0.25,-1.15,0.95,-1.2,0x6a4020);
    box(2.0,0.35,2.6,0x8a5a2a,0,0.95,-1.2,g);
    box(2.0,0.6,0.2,0x7a4a1a,0,1.3,-2.4,g);box(0.2,0.6,2.4,0x7a4a1a,1.0,1.3,-1.2,g);box(0.2,0.6,2.4,0x7a4a1a,-1.0,1.3,-1.2,g);
    box(0.25,0.25,3.4,0x5a3a1a,0,0.95,1.7,g);
    for(const s of[-0.75,0.75]){
      const c=s<0?0x8a5a2e:0x5a3a22;
      box(0.8,1.1,2.0,c,s,1.3,3.3,g);box(0.4,1.1,0.5,c,s,2.2,4.4,g).rotation.x=-0.35;box(0.45,0.45,0.95,c,s,2.95,4.95,g);
      box(0.15,0.8,0.25,0x222222,s,2.4,4.0,g);box(0.12,0.12,0.6,0x222222,s,1.9,2.2,g).rotation.x=0.5;
      for(const [a,b] of [[-0.25,0.7],[0.25,0.7],[-0.25,-0.7],[0.25,-0.7]])box(0.2,1.3,0.2,0x3a2a1a,s+a,0,3.3+b,g);
    }
  },
  tatra(g,wheel){
    for(const z of[-2.2,-0.6,1.9])for(const x of[-1.25,1.25])wheel(1.1,0.7,x,1.1,z,0x1a1a1a);
    box(2.4,0.5,6.4,0x2a2a2a,0,1.0,-0.2,g);
    box(2.4,1.0,1.9,0xd93a2a,0,1.4,2.1,g);box(2.0,0.85,0.12,0x9fd8ff,0,2.4,3.05,g);box(2.4,0.16,1.9,0x9a2a1a,0,3.3,2.1,g);
    box(0.12,1.0,0.12,0x444444,-1.1,2.4,1.3,g);box(0.12,1.0,0.12,0x444444,1.1,2.4,1.3,g);
    box(2.35,1.9,3.7,0xd93a2a,0,1.4,-1.4,g);box(2.4,0.2,3.7,0xffffff,0,2.6,-1.4,g);box(2.4,0.6,0.3,0x888888,0,1.6,-3.3,g);
    const bm=(c,x)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.25,0.35),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,3.55,2.4);g.add(m)};
    bm(0x3a7aff,-0.6);bm(0xff3a3a,0.6);
  }
};

function extrasInit(){
  /* ---------- Pomocníci ---------- */
  const $=id=>document.getElementById(id);
  const fileMode=location.protocol==='file:';
  const css=document.createElement('style');
  css.textContent=`
  #xbar{left:50%;top:66px;transform:translateX(-50%);font-size:22px;text-align:center;background:#7a2aa0cc;padding:5px 18px;border-radius:12px;display:none;white-space:nowrap}
  #roundbox{left:50%;top:38px;transform:translateX(-50%);font-size:20px;text-align:center;background:#0a6bd8cc;padding:4px 16px;border-radius:12px;display:none;white-space:nowrap}
  #xboard{right:12px;top:272px;font-size:14px;line-height:1.3;background:#0a1a3acc;padding:6px 10px;border-radius:10px;min-width:150px;display:none}
  #bossbar{left:50%;top:100px;transform:translateX(-50%);width:320px;display:none;text-align:center;font-size:16px}
  #bossbar div.b{height:16px;background:#0008;border:2px solid #fff;border-radius:10px;overflow:hidden;margin-top:2px}
  #bossbar i{display:block;height:100%;background:linear-gradient(90deg,#ff3a3a,#ffb347)}
  #countdown{left:0;right:0;top:28%;text-align:center;font-size:150px;display:none;color:#ffe94a;-webkit-text-stroke:4px #000}
  #roundbanner{margin:8px 0;padding:8px 12px;border-radius:12px;background:#e4f0ff;font-weight:700;font-size:15px;display:none}
  #diploma{position:fixed;inset:0;background:#fff;z-index:99;display:none;overflow:auto}
  #diploma .dip{width:100%;height:96vh;box-sizing:border-box;border:14px double #0a6bd8;padding:30px;text-align:center;color:#123;display:flex;flex-direction:column;justify-content:center}
  #diploma h1{font-size:64px;color:#0a6bd8;margin:0}
  #diploma .nm{font-size:72px;font-weight:900;margin:20px 0}
  #diploma p{font-size:26px;margin:8px 0}
  @media print{body>*:not(#diploma){display:none!important}#diploma{display:block!important;position:static}}
  `;
  document.head.appendChild(css);
  const mkhud=(id,cls='hud')=>{const d=document.createElement('div');d.id=id;d.className=cls;document.body.appendChild(d);return d};
  const elBar=mkhud('xbar'),elRound=mkhud('roundbox'),elBoard=mkhud('xboard'),elBoss=mkhud('bossbar'),elCount=mkhud('countdown');
  const dip=document.createElement('div');dip.id='diploma';document.body.appendChild(dip);
  // banner na úvodní obrazovce
  const rb=document.createElement('div');rb.id='roundbanner';
  const st=$('start').querySelector('#setup');st.parentNode.insertBefore(rb,st);

  /* ---------- Nové postavy a vozidla ---------- */
  CHARS.push({id:'dracek',n:'Dráček Zelnáček',skin:0x6fcf4a,hair:0x3a9a3a,shirt:0x9bd86a,pants:0x3a8a3a,acc:'dracek'});
  CHARS.push({id:'hasicka',n:'Hasička',skin:0xf5d0b0,hair:0xc0702a,shirt:0xd93a2a,pants:0x2a2a3a,acc:'hasicka'});
  VEH.push({id:'povoz',n:'Vozatajský povoz',icon:'🐴',price:900,mult:1.5,jump:false,rad:1.3,catchAdd:0.8,capAdd:5,sprint:0,seat:[-0.1,-0.4],legs:-1.4,arms:-0.6,clop:true,desc:'Dva koně jako na závodech SK Sokol Lipiny. +5 míst.'});
  VEH.push({id:'tatra',n:'Hasičská Tatra 138',icon:'🚒',price:2500,mult:1.35,jump:false,rad:1.4,catchAdd:1.6,capAdd:6,sprint:0,seat:[0.7,1.9],legs:-1.5,arms:-0.9,dogsFear:true,siren:true,desc:'Jako ta od bolehošťských hasičů! Houká a psi se bojí. +6 míst.'});
  BADGES.find(b=>b.id==='rider').d='Vyzkoušej všechna vozidla';
  BADGES.push({id:'boss',n:'Hrdina obce',d:'Poraz Mega-Ozobota starosty',t:()=>(S.stats.boss||0)>=1});
  BADGES.push({id:'znalec',n:'Znalec Bolehoště',d:'Navštiv 8 míst v obci',t:()=>Object.keys(S.visited||{}).length>=8});
  BADGES.push({id:'zav',n:'Závitkový mistr',d:'Dej si 3× bolehošťský závitek',t:()=>(S.stats.zav||0)>=3});
  BADGES.push({id:'fest',n:'Na slavnosti',d:'Ochutnej guláš na Gulášové slavnosti',t:()=>(S.stats.gulas||0)>=1});
  BADGES.push({id:'hejno',n:'Hejno na návsi',d:'Chyť 10 Ozobotů z hejna',t:()=>(S.stats.flock||0)>=10});

  /* ---------- Místní prvky ---------- */
  const PL={};MAP.PLACES.forEach(p=>PL[p.id]=p);
  const lab=(t,c,sc,x,y,z)=>placeLabel(label(t,c,sc),x,y,z);
  function freeSpot(cx,cz,r0,r1,pad){for(let t=0;t<60;t++){const a=rnd(0,6.28),r=rnd(r0,r1),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(freeAt(x,z,pad)&&x>RX0+4&&x<RX1-4&&z>RZ0+4&&z<RZ1-4)return[x,z]}return null}
  // hospoda
  {
    const p=PL.hospoda;lab('Obecní hostinec'+(p.approx?' *':''),'#ffe0a0',0.95,p.x,9.5,p.z);
    for(let i=0;i<3;i++){const s=freeSpot(p.x,p.z,7,12,1.5);if(!s)continue;
      shadowOn(box(1.3,0.1,1.3,0x8a5a2a,s[0],0.9,s[1]));shadowOn(box(0.15,0.9,0.15,0x5a3a1a,s[0],0,s[1]));
      const u=new THREE.Mesh(new THREE.ConeGeometry(1.5,0.8,8),mat(i%2?0xd93a2a:0xf5c400));u.position.set(s[0],gy(s[0],s[1])+3.1,s[1]);u.castShadow=true;scene.add(u);box(0.1,2.0,0.1,0x888888,s[0],0,s[1]);addCircObs(s[0],s[1],0.8)}
  }
  // zvonička (věž)
  {
    const p=PL.vez;shadowOn(box(2.2,5,2.2,0xf3efe0,p.x,0,p.z));shadowOn(box(2.6,1.8,2.6,0xe8e2d0,p.x,5,p.z));
    const r=new THREE.Mesh(new THREE.ConeGeometry(2.2,2.6,4),mat(0x8a3a1a));r.rotation.y=Math.PI/4;r.position.set(p.x,gy(p.x,p.z)+8.1,p.z);r.castShadow=true;scene.add(r);
    const bell=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.6,0.8,10),mat(0xd9a520));bell.position.set(p.x,gy(p.x,p.z)+5.9,p.z);scene.add(bell);
    addBoxObs(p.x,p.z,2.2,2.2);lab('Zvonička'+(p.approx?' *':''),'#fff',0.9,p.x,12,p.z);
  }
  // hřiště
  {const p=PL.hriste;for(const s of[-11,11]){shadowOn(box(0.25,2.2,0.25,0xffffff,p.x+s,0,p.z-1.8));shadowOn(box(0.25,2.2,0.25,0xffffff,p.x+s,0,p.z+1.8));shadowOn(box(0.25,0.25,3.85,0xffffff,p.x+s,2.2,p.z))}
   lab('Hřiště TJ Sokol','#d8ffd8',0.9,p.x,7,p.z)}
  // obchod, pomník, kříž
  lab('Obchod','#fff',0.8,PL.obchod.x,8,PL.obchod.z);
  {const p=PL.pomnik;shadowOn(box(1.6,0.6,1.6,0x888888,p.x,0,p.z));shadowOn(box(0.9,3.4,0.9,0xaaaaaa,p.x,0.6,p.z));addCircObs(p.x,p.z,1.1);lab('Pomník','#ddd',0.7,p.x,6,p.z)}
  {const p=PL.kriz;shadowOn(box(0.35,3.2,0.35,0x6a4020,p.x,0,p.z));shadowOn(box(1.6,0.35,0.35,0x6a4020,p.x,2.0,p.z));addCircObs(p.x,p.z,0.6);lab('Boží muka','#ddd',0.65,p.x,5.5,p.z)}
  // zelárna
  {
    const p=PL.zelarna;
    for(const s of[-3,3]){shadowOn(box(3,8,3,0xb0b7bf,p.x+s*1.3,0,p.z-3));addCircObs(p.x+s*1.3,p.z-3,1.8)}
    for(let i=0;i<6;i++){const a=i*1.05,bx=p.x+Math.cos(a)*5+2,bz=p.z+5+Math.sin(a)*1.5;const b=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,1.6,12),mat(0x8a5a2a));b.position.set(bx,gy(bx,bz)+0.8,bz);b.castShadow=true;scene.add(b)}
    shadowOn(box(6,0.4,0.3,0xf2e2b8,p.x,4,p.z+3));box(0.3,4,0.3,0x6a4020,p.x-3,0,p.z+3);box(0.3,4,0.3,0x6a4020,p.x+3,0,p.z+3);
    lab('Agrospol – zelárna','#b6f07a',1.0,p.x,11,p.z);lab('Bolehošťské zelí','#fff',0.7,p.x,4.6,p.z+3);
  }
  // zelné pole
  {
    const p=PL.pole,items=[];
    for(let i=0;i<14;i++)for(let j=0;j<8;j++){const x=p.x-13+i*2,z=p.z-8+j*2.2;items.push({x,y:gy(x,z),z,sx:1.1,sy:0.95,sz:1.1,color:(i+j)%3?0x8fd05a:0x6fb04a})}
    const sg=new THREE.IcosahedronGeometry(0.5,1);sg.translate(0,0.45,0);instanced(sg,white,items,true);
    const lf=items.map(it=>({x:it.x,y:it.y+0.1,z:it.z,sx:1.45,sy:0.25,sz:1.45,color:0x4a9a3a}));instanced(unitBox,white,lf);
    lab('Zelné pole','#b6f07a',0.9,p.x,4.5,p.z);
  }
  // Dráček Zelnáček u domova
  {
    const dc=CHARS.find(c=>c.id==='dracek'),a=buildAvatar(dc,null);a.g.scale.setScalar(1.15);a.g.position.set(H.x+11,gy(H.x+11,H.z-14),H.z-14);a.g.rotation.y=-0.4;scene.add(a.g);
    addCircObs(H.x+11,H.z-14,1.4);lab('Dráček Zelnáček','#b6f07a',0.85,H.x+11,7,H.z-14);
  }

  /* ---------- Starosta ---------- */
  const uradLM=M.LM.find(l=>l[0]==='Obecní úřad')||M.LM[0];
  const mayorPos=freeSpot(uradLM[1],uradLM[2],5,11,1.5)||[uradLM[1]+8,uradLM[2]];
  const mayorCh={id:'starosta',skin:0xe8b890,hair:0x6a6a6a,shirt:0x24345a,pants:0x1e2230,acc:'starosta'};
  const mayor=buildAvatar(mayorCh,null);mayor.g.scale.setScalar(0.75);mayor.g.position.set(mayorPos[0],gy(mayorPos[0],mayorPos[1]),mayorPos[1]);scene.add(mayor.g);
  addCircObs(mayorPos[0],mayorPos[1],0.8);lab('Starosta Jakub Šimerda','#ffe94a',0.6,mayorPos[0],5.0,mayorPos[1]);
  let bossCd=0;
  interact.push({x:mayorPos[0],z:mayorPos[1],r:5,text:()=>'E – Promluvit se starostou',act:mayorModal});
  function mayorModal(){
    openModal('🎩 Starosta Jakub Šimerda',el=>{
      const lines=['Vítej v Bolehošti! Zelí, hasiči, rybníky – na to jsme pyšní. A teď ještě Ozoboti!','Prý se po obci toulá Mega-Ozobot. Chytíš ho? Musíš ho zasáhnout pětkrát – pokaždé přeblikne jinam.','Za chycení Mega-Ozobota dostaneš odměnu od obce a odznak Hrdina obce.'];
      el.innerHTML='<p>'+lines[(Date.now()/10000|0)%lines.length]+'</p>';
      const canBoss=!boss&&!EV.cur&&bossCd<=0&&!Round.entered;
      row(el,'👑 Vyzvat Mega-Ozobota',Round.entered?'V kole ho starosta pustí sám v pravý čas.':(boss?'Mega-Ozobot už běhá po obci!':(bossCd>0?'Starosta ho musí nejdřív sehnat zpátky ('+Math.ceil(bossCd)+' s).':'Starosta pustí obřího Ozobota. Pozor, je rychlý!')),null,()=>{if(canBoss){startEvent('boss');closeModal()}},canBoss?'Do toho!':'—');
      el.lastChild.querySelector('button').disabled=!canBoss;
    },false);
  }

  /* ---------- Hospoda, zelárna, guláš – interakce ---------- */
  const buffs={zav:0,gul:0};
  interact.push({x:PL.hospoda.x,z:PL.hospoda.z,r:10,text:()=>'E – Bolehošťský závitek (⚡60)',act:()=>{
    if(S.money<60){toast('Na závitek potřebuješ ⚡60','#ffb347');return}
    S.money-=60;buffs.zav=45;stam=100;S.stats.zav=(S.stats.zav||0)+1;sfx.buy();toast('🥟 Bolehošťský závitek! Rychlost +20 % na 45 s','#ffe0a0');refreshHud();checkBadges();
  }});
  let zelCd=0;
  interact.push({x:PL.zelarna.x,z:PL.zelarna.z+4,r:8,text:()=>zelCd>0?'Zelí je dojedeno… ('+Math.ceil(zelCd)+' s)':'E – Ochutnat bolehošťské zelí (zdarma)',act:()=>{
    if(zelCd>0)return;zelCd=90;stam=100;S.money+=20;sfx.sell();toast('🥬 Kysané zelí! Stamina na plno a +⚡20','#b6f07a');refreshHud();
  }});

  /* ---------- Události ---------- */
  const EV={cur:null,next:0,hunt:0};
  let evRobots=[],gulasStand=null,boss=null,factT=60,discT=0;
  const EVDEF={
    flock:{name:'🌀 Hejno Ozobotů na návsi!',dur:75},
    gulas:{name:'🍲 Gulášová slavnost na hřišti!',dur:80},
    boss:{name:'👑 Mega-Ozobot starosty!',dur:110},
    hunt:{name:'🌟 Noční hon – zářící Ozoboti, dvojnásobné body!',dur:45}
  };
  function clearEvRobots(){evRobots.forEach(r=>{scene.remove(r.g);const i=robots.indexOf(r);if(i>=0)robots.splice(i,1)});evRobots=[]}
  function spawnEvRobots(n,cx,cz,leash,followGroup){
    const grp=followGroup?{members:[]}:null;
    for(let i=0;i<n;i++){
      const r=addRobot({ev:true,evType:pickType(),ex:cx,ez:cz,evLeash:leash,group:grp});
      if(grp)grp.members.push(r);evRobots.push(r);
    }
  }
  function startEvent(type,dur){
    if(EV.cur)endEvent(true);
    const d=EVDEF[type],duration=dur||d.dur;
    EV.cur={type,t:duration,dur:duration,pos:null,label:d.name};
    sfx.badge();toast(d.name,'#ffe94a');
    if(type==='flock'){
      const p=M.LM.find(l=>l[0]==='Pošta')||[H.x+20,H.z];const s=freeSpot(p[1],p[2],4,14,3)||[p[1],p[2]];
      EV.cur.pos={x:s[0],z:s[1]};spawnEvRobots(24,s[0],s[1],26,true);
    }else if(type==='gulas'){
      const p=PL.hriste,s=freeSpot(p.x,p.z,4,12,2.5)||[p.x,p.z];EV.cur.pos={x:s[0],z:s[1]};
      spawnEvRobots(14,p.x,p.z,22,false);
      const g=new THREE.Group();
      const pot=new THREE.Mesh(new THREE.CylinderGeometry(1.1,0.9,1.0,14),mat(0x222222));pot.position.y=1.6;g.add(pot);
      box(0.15,1.0,0.15,0x444444,-0.9,0,0,g);box(0.15,1.0,0.15,0x444444,0.9,0,0,g);
      const fl=new THREE.Mesh(new THREE.ConeGeometry(0.6,1.0,6),new THREE.MeshBasicMaterial({color:0xff7a1a}));fl.position.y=0.6;g.add(fl);
      const sm=label('🍲 Guláš!','#ffd27a',0.7);sm.position.y=4;g.add(sm);
      g.position.set(s[0],gy(s[0],s[1]),s[1]);shadowOn(g);scene.add(g);
      gulasStand={g,x:s[0],z:s[1],taken:false};
      interact.push(gulasStand.it={x:s[0],z:s[1],r:5,text:()=>gulasStand.taken?'Už sis dal guláš':'E – Ochutnat guláš (zdarma)',act:()=>{
        if(gulasStand.taken)return;gulasStand.taken=true;buffs.gul=45;stam=100;S.money+=50;S.stats.gulas=(S.stats.gulas||0)+1;sfx.sell();toast('🍲 Guláš! Rychlost +25 % a +⚡50','#ffd27a');refreshHud();checkBadges();
      }});
    }else if(type==='boss'){
      spawnBoss();
    }else if(type==='hunt'){EV.hunt=duration}
  }
  function endEvent(silent){
    const c=EV.cur;if(!c)return;
    if(c.type==='flock'||c.type==='gulas')clearEvRobots();
    if(gulasStand){scene.remove(gulasStand.g);const i=interact.indexOf(gulasStand.it);if(i>=0)interact.splice(i,1);gulasStand=null}
    if(c.type==='boss'&&boss){scene.remove(boss.g);boss=null;elBoss.style.display='none';if(!silent)toast('Mega-Ozobot utekl… Zkus to příště!','#ffb347');bossCd=120}
    if(c.type==='hunt')EV.hunt=0;
    EV.cur=null;elBar.style.display='none';
  }
  /* Mega-Ozobot */
  function spawnBoss(){
    const o=makeOzo(0xffffff,5.5);scene.add(o.g);
    const lb=label('MEGA-OZOBOT','#ffe94a',0.32);lb.position.set(0,2.0,0);o.g.add(lb);
    let s=freeSpot(uradLM[1],uradLM[2],14,36,5)||[uradLM[1]+20,uradLM[2]];
    boss=Object.assign(o,{x:s[0],z:s[1],hp:5,max:5,hitCd:0,heading:rnd(0,6.28),t:0,cd:2,ph:0});
    o.g.position.set(s[0],gy(s[0],s[1]),s[1]);EV.cur.pos={x:s[0],z:s[1]};
  }
  function updateBoss(dt){
    const b=boss;if(!b)return;
    const dx=b.x-pv.x,dz=b.z-pv.z,d=Math.hypot(dx,dz);
    b.t-=dt;if(b.t<=0){b.heading+=rnd(-1.5,1.5);b.t=rnd(1,2.5)}
    let hd=b.heading,sp=3;
    if(d<20){hd=Math.atan2(dz,dx)+Math.sin(time*2)*0.5;sp=7.2}
    b.cd-=dt;
    if(b.cd<=0&&d<16){for(let t=0;t<8;t++){const a=rnd(0,6.28),dd=rnd(14,24),x=b.x+Math.cos(a)*dd,z=b.z+Math.sin(a)*dd;if(freeAt(x,z,4)&&x>RX0+6&&x<RX1-6&&z>RZ0+6&&z<RZ1-6){burst(b.x,gy(b.x,b.z)+4,b.z,0xffffff,14);b.x=x;b.z=z;burst(x,gy(x,z)+4,z,0xffffff,14);sfx.blink();break}}b.cd=3.2}
    const q={x:b.x+Math.cos(hd)*sp*dt,z:b.z+Math.sin(hd)*sp*dt},ox=q.x,oz=q.z;resolve(q,2.6);if(Math.abs(q.x-ox)+Math.abs(q.z-oz)>0.001)b.t=0;
    b.x=clamp(q.x,RX0+4,RX1-4);b.z=clamp(q.z,RZ0+4,RZ1-4);
    b.g.position.set(b.x,gy(b.x,b.z)+Math.abs(Math.sin(time*6))*0.3,b.z);b.g.rotation.y=-hd+Math.PI/2;
    tmp.setHSL((time*0.7)%1,1,0.55);b.lm.color.copy(tmp);b.gm.color.copy(tmp);b.glow.scale.setScalar(2.4+0.4*Math.sin(time*5));
    b.hitCd-=dt;
    if(d<catchR()+3.6&&b.hitCd<=0&&Math.abs(pv.y)<3.5&&!locked()){
      b.hp--;b.hitCd=2.2;b.cd=0;burst(b.x,gy(b.x,b.z)+4,b.z,0xffffff,24);sfx.catch();
      if(b.hp<=0){
        const rew=Round.entered?0:1500;S.money+=rew;S.stats.boss=(S.stats.boss||0)+1;onScore(600);
        burst(b.x,gy(b.x,b.z)+5,b.z,0xffffff,50);sfx.badge();toast('🎉 Mega-Ozobot poražen! '+(rew?'+⚡'+rew+' od obce':'+600 bodů'),'#ffe94a');
        scene.remove(b.g);boss=null;elBoss.style.display='none';EV.cur=null;elBar.style.display='none';bossCd=180;refreshHud();checkBadges();return;
      }
      toast('Zásah! Mega-Ozobotovi zbývá '+b.hp+' z '+b.max,'#ffb347');
    }
    elBoss.style.display='block';elBoss.innerHTML='👑 MEGA-OZOBOT '+b.hp+'/'+b.max+'<div class="b"><i style="width:'+(b.hp/b.max*100)+'%"></i></div>';
  }

  /* ---------- Režim kola (síť) ---------- */
  const Net={ok:false,phase:'idle',id:0,start:0,dur:0,seed:0,stopped:0,off:0,board:[],ip:'',port:0};
  const Round={entered:false,score:0,caught:0,backup:null,lastId:0,sched:[],sendT:0,finished:false,evDone:0};
  async function poll(){
    if(fileMode)return;
    try{
      const r=await fetch('/api/state',{cache:'no-store'});const d=await r.json();
      Net.ok=true;Net.phase=d.round.phase;Net.id=d.round.id;Net.start=d.round.start;Net.dur=d.round.duration;Net.seed=d.round.seed;Net.stopped=d.round.stopped_at;
      Net.off=d.round.now-Date.now();Net.board=d.board;Net.ip=d.ip;Net.port=d.port;
    }catch(e){Net.ok=false}
    banner();
  }
  const mmss=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  const srvNow=()=>Date.now()+Net.off;
  function roundEnd(){return Math.min(Net.start+Net.dur*1000,Net.stopped||1e18)}
  function banner(){
    if(started){rb.style.display='none';return}
    if(!Net.ok){rb.style.display='none';return}
    let t='🏁 Režim kola je dostupný. ';
    if(Net.phase==='idle')t+='Čeká se, až učitel spustí kolo – zatím si můžeš hrát.';
    else if(Net.phase==='countdown')t+='Kolo č. '+Net.id+' za '+mmss((Net.start-srvNow())/1000)+'! Napiš jméno a dej Hrát.';
    else if(Net.phase==='running')t+='Kolo č. '+Net.id+' právě běží (zbývá '+mmss((roundEnd()-srvNow())/1000)+'). Připoj se!';
    else t+='Poslední kolo skončilo.';
    rb.textContent=t;rb.style.display='block';
  }
  function inRound(){return Round.entered}
  function locked(){return Round.entered&&Net.phase==='countdown'}
  function enterRound(){
    closeModal();Round.entered=true;Round.finished=false;Round.lastId=Net.id;Round.score=0;Round.caught=0;Round.backup=S;Round.evDone=0;Round.sendT=0;
    const n=newState();n.name=S.name;n.char=S.char;n.color=S.color;n.money=150;n.items={magnet:1,freeze:1,trap:1};n.visited={};S=n;
    carry=[];refreshCarry();setVehicle(-1);clearQuestRobots();hatch=null;rebuildPets();
    if(EV.cur)endEvent(true);buffs.zav=buffs.gul=0;
    // stejné rozmístění Ozobotů pro všechny
    RNG=rng(Net.seed);robots.forEach(r=>{if(!r.ev&&!r.quest)spawnRobot(r)});RNG=Math.random;
    pv.x=H.x;pv.z=H.z;pv.y=0;pv.vy=0;
    // plán událostí podle seedu (u všech stejný)
    const rr=rng(Net.seed^0x9e3779b9),types=['flock','gulas','boss','hunt'];
    for(let i=types.length-1;i>0;i--){const j=(rr()*(i+1))|0;[types[i],types[j]]=[types[j],types[i]]}
    Round.sched=types.map((t,i)=>({t,at:Net.dur*(0.14+i*0.22),dur:Math.min(EVDEF[t].dur,Net.dur*0.2),done:false}));
    refreshHud();
  }
  function exitRound(){
    Round.entered=false;
    if(EV.cur)endEvent(true);buffs.zav=buffs.gul=0;
    S=Round.backup;Round.backup=null;carry=[];refreshCarry();setVehicle(-1);rebuildPets();
    pv.x=H.x;pv.z=H.z;
    RNG=rng((Math.random()*1e9)|0);robots.forEach(r=>{if(!r.ev&&!r.quest)spawnRobot(r)});RNG=Math.random;
    ensureMissions();refreshHud();elRound.style.display='none';elBoard.style.display='none';elCount.style.display='none';
  }
  async function sendScore(final){
    try{await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:S.name,char:S.char,color:S.color,round:Round.lastId,score:Math.floor(Round.score),caught:Round.caught})})}catch(e){}
  }
  async function finishRound(){
    if(Round.finished)return;Round.finished=true;
    const myScore=Math.floor(Round.score),myCaught=Round.caught,name=S.backup?S.backup.name:S.name;
    await sendScore(true);await poll();
    exitRound();sfx.badge();
    const b=Net.board,pos=b.findIndex(p=>p.name.toLowerCase()===name.toLowerCase());
    openModal('🏁 Konec kola!',el=>{
      el.innerHTML='<p style="font-size:20px">Tvoje body: <b>'+myScore+'</b> (chyceno '+myCaught+')'+(pos>=0?' – <b>'+(pos+1)+'. místo</b> z '+b.length:'')+'</p>'
        +'<table style="width:100%;font-size:17px">'+b.slice(0,10).map((p,i)=>'<tr'+(i===pos?' style="background:#fff3c4;font-weight:800"':'')+'><td>'+(i+1)+'.</td><td>'+p.name.replace(/</g,'&lt;')+'</td><td style="text-align:right">'+p.caught+' ×</td><td style="text-align:right"><b>'+p.score+'</b></td></tr>').join('')+'</table>'
        +'<p style="margin-top:10px"><button id="dipb">🖨 Diplom</button></p>';
      el.querySelector('#dipb').onclick=()=>showDiploma(name,pos+1,myScore,myCaught);
    },false);
  }
  function showDiploma(name,rank,score,caught){
    dip.innerHTML='<div class="dip"><h1>DIPLOM</h1><p>Ozoboti z Bolehoště – kolo č. '+Net.id+'</p><div class="nm">'+name.replace(/</g,'&lt;')+'</div><p>obsadil(a) <b>'+rank+'. místo</b></p><p>chytil(a) '+caught+' Ozobotů a získal(a) '+score+' bodů</p><p style="margin-top:30px">'+new Date().toLocaleDateString('cs-CZ')+'</p><p><button onclick="window.print()">🖨 Tisk</button> <button onclick="document.getElementById(\'diploma\').style.display=\'none\'">Zavřít</button></p></div>';
    dip.style.display='block';
  }
  function onScore(p){if(Round.entered&&Net.phase==='running')Round.score+=p}
  function onCatch(id,m){
    if(!Round.entered||Net.phase!=='running')return;
    Round.score+=ROB[id].v*m;Round.caught++;
  }

  /* ---------- Hudba a zvuky ---------- */
  const Mu={ctx:null,master:null,on:true,mode:'day',step:0,nextT:0,noise:null,rainG:null,siren:null,sirenT:0,clopT:0};
  try{Mu.on=localStorage.getItem('ozo_mute')!=='1'}catch(e){}
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function muInit(){
    if(Mu.ctx)return;
    try{
      AC=AC||new (window.AudioContext||window.webkitAudioContext)();Mu.ctx=AC;
      Mu.master=AC.createGain();Mu.master.gain.value=Mu.on?0.7:0;Mu.master.connect(AC.destination);
      const len=AC.sampleRate*2,buf=AC.createBuffer(1,len,AC.sampleRate),dd=buf.getChannelData(0);for(let i=0;i<len;i++)dd[i]=Math.random()*2-1;Mu.noise=buf;
      const src=AC.createBufferSource();src.buffer=buf;src.loop=true;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1800;Mu.rainG=AC.createGain();Mu.rainG.gain.value=0;
      src.connect(lp);lp.connect(Mu.rainG);Mu.rainG.connect(Mu.master);src.start();
      Mu.nextT=AC.currentTime+0.2;
      setInterval(muSched,100);
    }catch(e){}
  }
  function tone(t,f,dur,type,vol,att=0.02){
    const c=Mu.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(Mu.master);o.start(t);o.stop(t+dur+0.05);
  }
  function hit(t,dur,vol,freq){
    const c=Mu.ctx,s=c.createBufferSource();s.buffer=Mu.noise;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=freq;const g=c.createGain();
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(hp);hp.connect(g);g.connect(Mu.master);s.start(t,Math.random());s.stop(t+dur+0.02);
  }
  function kick(t){const c=Mu.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(40,t+0.15);g.gain.setValueAtTime(0.22,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.2);o.connect(g);g.connect(Mu.master);o.start(t);o.stop(t+0.22)}
  const MODES={
    day:{bpm:88,scale:[0,2,4,7,9],roots:[0,-3,-7,-5],types:['M','m','M','M'],base:60,arp:0.55,arpW:'triangle',arpV:0.05,padW:'triangle'},
    night:{bpm:62,scale:[0,3,5,7,10],roots:[0,-4,3,-2],types:['m','M','M','M'],base:57,arp:0.28,arpW:'sine',arpV:0.05,padW:'sine',oct:12},
    event:{bpm:140,scale:[0,3,5,7,10],roots:[0,-2,-4,-5],types:['m','M','M','M'],base:62,arp:0.9,arpW:'square',arpV:0.028,padW:'sawtooth',drums:1},
    fest:{bpm:112,scale:[0,2,4,7,9],roots:[0,-3,-7,-5],types:['M','m','M','M'],base:60,arp:0.35,arpW:'triangle',arpV:0.05,padW:'triangle',oompah:1}
  };
  const CHORD={M:[0,4,7],m:[0,3,7]};
  function curMode(){
    if(EV.cur&&(EV.cur.type==='boss'||EV.cur.type==='hunt'))return'event';
    if(EV.cur)return'fest';
    return night>0.55?'night':'day';
  }
  function muSched(){
    if(!Mu.ctx||!started)return;
    const c=Mu.ctx;if(c.state==='suspended')c.resume();
    while(Mu.nextT<c.currentTime+0.3){
      if(Mu.step%8===0)Mu.mode=curMode();
      const m=MODES[Mu.mode],s=Mu.step%8,bar=(Mu.step/8|0)%4,t=Mu.nextT,dur=60/m.bpm/2;
      const root=m.roots[bar],type=m.types[bar];
      if(s===0){
        CHORD[type].forEach(iv=>tone(t,mtof(m.base-12+root+iv),dur*8,m.padW,0.03,0.25));
        tone(t,mtof(m.base-24+root),dur*4,'sine',0.09,0.03);
      }
      if(m.oompah){if(s%4===0)tone(t,mtof(m.base-24+root+(s===4?7:0)),dur*1.6,'sine',0.1,0.01);if(s%4===2)CHORD[type].forEach(iv=>tone(t,mtof(m.base-12+root+iv),dur*0.8,'triangle',0.03,0.01));hit(t,0.04,0.05,6000)}
      if(m.drums){if(s%2===0)kick(t);else hit(t,0.04,0.06,7000);if(s===4)hit(t,0.12,0.12,1500);tone(t,mtof(m.base-24+root),dur*0.9,'sawtooth',0.04,0.01)}
      if(Math.random()<m.arp){const n=m.scale[(Math.random()*m.scale.length)|0]+(m.oct||0)+12*((Math.random()<0.3)?1:0);tone(t,mtof(m.base+root+n),dur*(Mu.mode==='night'?3:1.4),m.arpW,m.arpV,0.01)}
      Mu.nextT+=dur;Mu.step++;
    }
  }
  function muTick(dt){
    if(!Mu.ctx)return;
    Mu.rainG.gain.setTargetAtTime(W.rain*0.07,Mu.ctx.currentTime,0.5);
    const v=veh();
    if(started&&v&&(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD)&&!modalOpen){
      if(v.siren){Mu.sirenT-=dt;if(Mu.sirenT<=0){Mu.sirenT=0.55;const t=Mu.ctx.currentTime;tone(t,Math.random()<2?(Math.floor(time*1.8)%2?660:880):660,0.5,'sawtooth',0.03,0.03)}}
      if(v.clop){Mu.clopT-=dt;if(Mu.clopT<=0){Mu.clopT=0.22;const t=Mu.ctx.currentTime;tone(t,180,0.06,'sine',0.09,0.002);tone(t+0.09,140,0.06,'sine',0.07,0.002)}}
    }
  }
  function toggleMute(){Mu.on=!Mu.on;try{localStorage.setItem('ozo_mute',Mu.on?'0':'1')}catch(e){}if(Mu.master)Mu.master.gain.value=Mu.on?0.7:0;toast(Mu.on?'🔊 Hudba zapnuta':'🔇 Hudba vypnuta (M)','#fff')}

  /* ---------- Objevování míst a zajímavosti ---------- */
  const DISC=[];
  MAP.PLACES.forEach(p=>DISC.push({id:p.id,name:p.n,x:p.x,z:p.z,r:p.id==='pole'?14:9,fact:PLACE_FACTS[p.id]}));
  M.LM.forEach(l=>{if(PLACE_FACTS[l[0]])DISC.push({id:'lm:'+l[0],name:l[0],x:l[1],z:l[2],r:/Nadýmač|Baba|Nebeský/.test(l[0])?16:9,fact:PLACE_FACTS[l[0]]})});
  function checkDiscover(){
    if(!S.visited)S.visited={};
    for(const d of DISC){
      if(S.visited[d.id])continue;
      if(Math.hypot(d.x-pv.x,d.z-pv.z)<d.r){S.visited[d.id]=1;S.money+=25;sfx.badge();toast('📍 '+d.name+': '+d.fact+' (+⚡25)','#bfe8ff',7);refreshHud();checkBadges();break}
    }
  }
  function albumHtml(){
    const v=S.visited||{};const got=DISC.filter(d=>v[d.id]);
    return '<h3>Zajímavosti o Bolehošti ('+got.length+' / '+DISC.length+' míst navštíveno)</h3>'+(got.length?got.map(d=>'<div class="row"><div><b>'+d.name+'</b><small>'+d.fact+'</small></div></div>').join(''):'<p>Procházej obec a objevuj místa – každé prozradí zajímavost.</p>')
      +'<p style="font-size:12px;color:#889">* poloha hospody a zvoničky je odhadnutá podle mapy.</p>';
  }

  /* ---------- Hlavní tick ---------- */
  function tick(dt){
    if(Net.ok&&started){
      const serverNow=srvNow();
      if(!Round.entered&&(Net.phase==='countdown'||Net.phase==='running')&&Net.id!==Round.lastId){enterRound()}
      else if(Round.entered){
        if(Net.phase==='idle'){exitRound()}
        else if(Net.phase==='ended'){finishRound()}
        else if(Net.phase==='countdown'){
          const n=Math.ceil((Net.start-serverNow)/1000);elCount.style.display='block';elCount.textContent=n>0?n:'';pv.x=H.x;pv.z=H.z;
          elRound.style.display='block';elRound.textContent='🏁 Kolo č. '+Net.id+' – start za '+n+' s';
        }else if(Net.phase==='running'){
          elCount.style.display='none';
          const rem=(roundEnd()-serverNow)/1000,rank=Net.board.findIndex(p=>p.name.toLowerCase()===S.name.toLowerCase());
          elRound.style.display='block';elRound.textContent='🏁 '+mmss(rem)+'   ⭐ '+Math.floor(Round.score)+' b.'+(rank>=0?'   ('+(rank+1)+'. místo)':'');
          elBoard.style.display='block';elBoard.innerHTML='<b>🏆 Pořadí</b><br>'+Net.board.slice(0,6).map((p,i)=>(i+1)+'. '+p.name.replace(/</g,'&lt;')+' – '+p.score).join('<br>');
          Round.sendT-=dt;if(Round.sendT<=0){Round.sendT=2;sendScore()}
          const el=(serverNow-Net.start)/1000;
          Round.sched.forEach(e=>{if(!e.done&&el>=e.at){e.done=true;startEvent(e.t,e.dur)}});
        }
      }
    }
    if(started){
      buffs.zav=Math.max(0,buffs.zav-dt);buffs.gul=Math.max(0,buffs.gul-dt);zelCd=Math.max(0,zelCd-dt);bossCd=Math.max(0,bossCd-dt);
      // událost běží
      if(EV.cur){
        EV.cur.t-=dt;
        elBar.style.display='block';elBar.textContent=EV.cur.label+'  '+mmss(EV.cur.t);
        if(EV.cur.type==='boss')updateBoss(dt);
        if(EV.cur&&EV.cur.t<=0)endEvent(false);
      }else if(!Round.entered){
        EV.next-=dt;if(EV.next<=0){const r=Math.random();startEvent(r<0.35?'flock':r<0.6?'gulas':r<0.8?'boss':'hunt');EV.next=rnd(200,320)}
      }
      if(EV.hunt>0)EV.hunt-=dt;
      // mayor mává
      mayor.armR.rotation.x=-2.4+Math.sin(time*5)*0.4;mayor.g.rotation.y=Math.atan2(pv.x-mayor.g.position.x,pv.z-mayor.g.position.z);
      discT-=dt;if(discT<=0){discT=0.4;checkDiscover()}
      factT-=dt;if(factT<=0&&!modalOpen){factT=rnd(80,120);toast('📰 Víš, že… '+TICKER_FACTS[(Math.random()*TICKER_FACTS.length)|0],'#d8f0ff',6)}
      if(Round.entered&&Net.phase==='running'&&EV.cur){elBar.style.top='66px'}
    }
    muTick(dt);
  }
  function compassTarget(){
    if(!started)return null;
    if(EV.cur&&EV.cur.pos){const p=(EV.cur.type==='boss'&&boss)?{x:boss.x,z:boss.z}:EV.cur.pos;return{x:p.x,z:p.z,label:EV.cur.label.replace(/^\S+\s/,'')}}
    return null;
  }
  function onStart(){
    if(!S.visited)S.visited={};
    muInit();EV.next=rnd(130,200);factT=40;
    poll();
  }
  setInterval(()=>{if(Net.ok||!fileMode)poll()},1500);poll();

  return{tick,locked,inRound,onScore,onCatch,onStart,toggleMute,compassTarget,albumHtml,
    speedMult:()=>(buffs.zav>0?1.2:1)*(buffs.gul>0?1.25:1),
    valueMult:()=>EV.hunt>0?2:1,
    ledBoost:()=>EV.hunt>0?1.8:1,
    missionsHtml:()=>Round.entered?'<div style="font-size:12px;opacity:.85">KOLO – soutěž!</div><div>• Chytej Ozoboty, body se počítají za každého chyceného.</div><div>• Události přicházejí všem ve stejný čas.</div>':null,
    startEvent};
}
