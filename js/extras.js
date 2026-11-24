import { game, bind, bindLet } from './context.js';
import * as THREE from 'three';
import { MAP } from '../mapdata.js';

export const api = {};


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
  hriste:'Na hřišti TJ Sokol Bolehošť je fotbalové hřiště. Sportovci se tu scházejí.',
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
  'Nebeský':'Rybník Nebeský leží severně od vsi.',
  'Lipiny':'Osada Lipiny vznikla roku 1709. SK Sokol Lipiny tu pořádá jezdecké a vozatajské závody.',
  'Bolehošťská Lhota':'Lhota je jedna ze tří částí obce. Stojí tu škola a nad ní lovecký zámeček rodu Colloredů z roku 1700.',
  'Lovecký zámek':'Lovecký zámeček rodu Colloredů nad Bolehošťskou Lhotou byl postaven v roce 1700.',
  'Šerka':'Pomístní jméno mezi Bolehoští a Bolehošťskou Lhotou.',
  'Jirsákův kopec':'Kopec východně od Bolehošťské Lhoty. Tak se to místo jmenuje v mapě.',
  'Březina':'Pomístní jméno v polích jižně od obce.',
  'U jezírka':'Pomístní jméno jihozápadně od Lipin.',
  'Čížek':'Pomístní jméno u osady Lipiny.',
  'Holdon':'Pomístní jméno mezi Lipinami a Bolehoští.',
  'Zelnice':'Pomístní jméno na severním okraji katastru.',
  'Na spraších':'Pomístní jméno severně od vsi. Spraše jsou naváté úrodné půdy.',
  'Pod skálou':'Pomístní jméno na severovýchodě katastru.'
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
  'Obec se skládá ze tří částí: Bolehošť, Bolehošťská Lhota a Lipiny.',
  'Nejstarší památka obce je zvon odlitý roku 1644 v Hradci Králové zvonařem Martinem Exnerem.',
  'Kamennou věžičku pro ten zvon postavili roku 1835. Nová zvonička byla hotová v červenci 2004 a od té doby zvoní každou neděli k poledni.',
  '26. června 1875 projel Bolehoští první osobní vlak.',
  '4. dubna 1921 se v Bolehošti poprvé rozsvítilo elektrické světlo. Ve Lhotě až před druhou světovou válkou a v Lipinách až po ní.',
  'Poštovní úřad otevřeli 1. dubna 1894. Nová budova pošty přišla až roku 1977.',
  'Obecní hostinec otevřeli 1. července 1900. Říkalo se mu Reprezenťák.',
  'Sokol Bolehošť vznikl 2. prosince 1902. Sokol Lipiny založili roku 1920.',
  'Učit se v Bolehošti začalo roku 1816. Předtím se učilo jen v zimě, a to na některém statku.',
  'Školu udělali z pastoušky. Stála na místě, kde je škola dodnes.',
  'Na průčelí školy je reliéf Jana Amose Komenského. V roce 2013 nahradilo uhelný kotel tepelné čerpadlo.',
  'Mateřská škola v obci vznikla roku 1939.',
  'V roce 1880 tu žilo 1141 lidí. V roce 2001 už jen 529.',
  'Domy dřív stály po obou stranách silnice z Týniště nad Orlicí do Opočna.',
  'Pamětní kniha píše, že na Spraších se rok co rok pěstovalo zelí. Zelárna pana Václava Bašeho ho posílala po celých Čechách až za moře.',
  'V zelárně ti kysané zelí naloží i do vlastní nádoby, když se předem domluvíš. Nese značku KLASA.',
  'V Bolehošti stály dvě tvrze. Tu starší dobyli a rozbořili ve 14. století.',
  'Severozápadně od obce se těžil bílý štukový písek, severně travertin na hnojení a v lomu opuka na stavby.',
  'V černozemi se dřív dobývala rašelina pro lázně.',
  'V Lipinách našli roku 2008 při kopání sklepa křemenný hrot. Je v Muzeu východních Čech v Hradci Králové.',
  '12. května 2002 projížděl obcí cyklistický Závod míru.',
  'Znak a prapor dostala obec v roce 2004. Nakreslil je Jan Tejkal.',
  'První gulášové slavnosti se konaly roku 2011.',
  'Divadelní spolek Čtenářská beseda vznikl roku 1891.',
  'Ženský hasičský sbor založili roku 1907. Hasiči ve Lhotě si v letech 1926 až 1927 založili vlastní sbor.',
  'První zásah bolehošťských hasičů byl 3. května 1882. Po blesku hořelo stavení číslo 64.',
  'Stará kývací stříkačka ze Lhoty se dochovala a bolehošťští hasiči ji mají dodnes.',
  'Památník padlým v první světové válce odhalili 2. září 1928.',
  'V roce 2013 Agrospol spustil bioplynovou stanici.',
  'Ze tří stran obec obklopují lesy. Na východě se zvedá hřbet Křivina.',
  'Stará pověst říká, že ves dostala jméno po zemanovi, kterého boleli hosté.'
];

/* ---------- Doplňky postav ---------- */
const ACC={
  dracek(g,ch){
    game.box(0.28,0.6,0.28,0xf5efd0,-0.4,4.5,0,g);game.box(0.28,0.6,0.28,0xf5efd0,0.4,4.5,0,g);          // růžky
    game.box(0.12,1.5,1.25,0x3a9a3a,-0.95,2.3,-0.7,g).rotation.z=0.45;game.box(0.12,1.5,1.25,0x3a9a3a,0.95,2.3,-0.7,g).rotation.z=-0.45; // křídla
    game.box(0.45,0.45,2.0,ch.skin,0,0.9,-1.5,g);game.box(0.3,0.5,0.3,0x2a8a2a,0,1.25,-2.4,g);            // ocas
    game.box(1.9,0.3,1.3,0xb6e07a,0,3.0,0,g);game.box(1.5,0.25,1.1,0x9bd86a,0,3.25,0,g);                   // zelný límec
    game.box(1.0,0.9,0.15,0xf2f7d8,0,1.7,0.52,g);                                                      // bříško
    const c=new THREE.Mesh(new THREE.SphereGeometry(0.5,10,8),game.mat(0x8fd05a));c.position.set(0,2.1,0.75);c.scale.y=0.85;g.add(c);    // hlávka zelí
    game.box(0.9,0.1,0.9,0xd7f0a0,0,2.3,0.75,g);
  },
  hasicka(g,ch){
    game.box(1.3,0.5,1.3,ch.hair,0,4.2,-0.05,g);game.box(1.3,0.8,0.3,ch.hair,0,3.7,-0.55,g);
    game.box(0.35,1.0,0.35,ch.hair,-0.9,3.0,-0.2,g);game.box(0.35,1.0,0.35,ch.hair,0.9,3.0,-0.2,g);
    game.box(1.5,0.5,1.5,0xd93a2a,0,4.35,0,g);game.box(1.5,0.08,0.45,0xffd21a,0,4.6,0.8,g);game.box(1.65,0.12,1.65,0xb02a1a,0,4.3,0,g);
  },
  starosta(g,ch){
    for(const [i,c] of [[0,0xffffff],[1,0x2a4fd0],[2,0xd93a2a]]){const s=game.box(0.3,2.3,0.12,c,-0.45+i*0.3,1.7,0.5,g);s.rotation.z=0.6}  // šerpa
    game.box(0.3,0.9,0.1,0xd93a2a,0,2.0,0.5,g);game.box(0.9,0.14,0.14,0xffd21a,0,3.3,0.5,g);            // kravata, řetěz
    game.box(1.3,0.45,1.3,ch.hair,0,4.2,-0.05,g);
  },
  bolex(g){
    let armL=null;
    g.children.forEach(c=>{
      if(!c.isGroup)return;
      if(Math.abs(c.position.y-1.6)<0.05)c.visible=false;
      if(Math.abs(c.position.y-3.3)<0.05&&c.position.x<0)armL=c;
      if(Math.abs(c.position.y-3.3)<0.05){
        game.box(0.7,0.22,0.7,0xf28a12,0,-0.28,0,c);
        game.box(0.68,0.2,0.68,0xf28a12,0,-1.7,0,c);
      }
    });
    const wheel=new THREE.Group();wheel.position.set(0,0.72,0);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(0.72,0.72,0.42,16),game.mat(0x2a3340));tire.rotation.z=Math.PI/2;wheel.add(tire);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.5,12),game.mat(0x3a7ec8));hub.rotation.z=Math.PI/2;wheel.add(hub);
    g.add(wheel);
    game.box(0.16,0.55,0.16,0x1f8fe8,-0.28,1.15,0,g);game.box(0.16,0.55,0.16,0x1f8fe8,0.28,1.15,0,g);
    game.box(1.35,0.22,1.05,0xf28a12,0,3.15,0,g);
    game.box(1.28,0.16,1.28,0xf28a12,0,4.38,0,g);
    game.box(0.08,0.7,0.08,0x4aa3e8,0,4.5,0,g);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8),new THREE.MeshBasicMaterial({color:0xff9a1a}));ball.position.set(0,5.36,0);g.add(ball);
    game.box(0.26,0.26,0.26,0xf28a12,-0.78,3.55,0,g);game.box(0.26,0.26,0.26,0xf28a12,0.78,3.55,0,g);
    game.box(1.28,0.78,0.16,0xf28a12,0,3.42,0.52,g);
    game.box(1.05,0.58,0.12,0x10233f,0,3.5,0.6,g);
    game.box(0.26,0.28,0.08,0x3cf0ff,-0.26,3.68,0.68,g);game.box(0.26,0.28,0.08,0x3cf0ff,0.26,3.68,0.68,g);
    game.box(0.36,0.08,0.08,0x3cf0ff,0,3.48,0.68,g);
    const badge=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.1,14),game.mat(0x123a6a));badge.rotation.x=Math.PI/2;badge.position.set(0,2.45,0.5);g.add(badge);
    game.box(0.12,0.28,0.06,0x3cf0ff,0.04,2.32,0.56,g);
    if(armL){
      const cab=new THREE.Mesh(new THREE.SphereGeometry(0.4,10,8),game.mat(0x7dce4a));cab.scale.y=0.82;cab.position.set(-0.05,-1.95,0.35);armL.add(cab);
      game.box(0.5,0.1,0.5,0xc6ee78,-0.05,-1.58,0.35,armL);
    }
  }
};
const VEHMODELS={
  kun(g){
    const coat=0x8a4e28,dark=0x4a2a16,mane=0x24160e,hoof=0x241810;
    game.box(0.95,1.15,2.25,coat,0,1.2,0.15,g);
    game.box(0.72,0.16,0.78,0x7a2218,0,2.35,-0.15,g);
    const neck=game.box(0.48,1.2,0.52,coat,0,2.25,1.55,g);neck.rotation.x=-0.42;
    game.box(0.52,0.5,1.05,coat,0,3.15,2.15,g);
    game.box(0.38,0.32,0.48,0xd7a06a,0,2.95,2.7,g);
    game.box(0.12,0.42,0.12,dark,-0.15,3.55,1.85,g);
    game.box(0.12,0.42,0.12,dark,0.15,3.55,1.85,g);
    game.box(0.1,0.12,0.08,0x1a120c,-0.24,3.25,2.55,g);
    game.box(0.1,0.12,0.08,0x1a120c,0.24,3.25,2.55,g);
    game.box(0.1,0.28,0.08,0xf4f1ea,0,3.28,2.62,g);
    game.box(0.16,0.9,0.22,mane,0,2.55,1.25,g);
    const tail=new THREE.Group();tail.position.set(0,2.15,-0.95);tail.rotation.x=0.4;g.add(tail);
    game.box(0.18,1.15,0.18,mane,0,-1.05,0,tail);
    const legs=[];
    const addLeg=(x,z,phase)=>{
      const p=new THREE.Group();p.position.set(x,1.2,z);g.add(p);
      game.box(0.24,1.05,0.24,dark,0,-1.05,0.02,p);
      game.box(0.28,0.16,0.34,hoof,0,-1.18,0.06,p);
      legs.push({p,phase,gallop:true,amp:0.55});
    };
    addLeg(-0.32,0.85,0);addLeg(0.32,0.85,Math.PI);addLeg(-0.32,-0.7,Math.PI);addLeg(0.32,-0.7,0);
    legs.push({p:tail,swish:true});
    g.userData.legs=legs;
    g.scale.setScalar(1.5);
  },
  povoz(g,wheel){
    wheel(0.95,0.25,1.15,0.95,-1.2,0x6a4020);wheel(0.95,0.25,-1.15,0.95,-1.2,0x6a4020);
    game.box(2.0,0.35,2.6,0x8a5a2a,0,0.95,-1.2,g);
    game.box(2.0,0.6,0.2,0x7a4a1a,0,1.3,-2.4,g);game.box(0.2,0.6,2.4,0x7a4a1a,1.0,1.3,-1.2,g);game.box(0.2,0.6,2.4,0x7a4a1a,-1.0,1.3,-1.2,g);
    game.box(0.25,0.25,5.1,0x5a3a1a,0,0.95,2.55,g);
    for(const s of[-0.75,0.75]){
      const h=new THREE.Group();h.scale.setScalar(1.5);g.add(h);
      const c=s<0?0x8a5a2e:0x5a3a22;
      game.box(0.8,1.1,2.0,c,s,1.3,3.3,h);game.box(0.4,1.1,0.5,c,s,2.2,4.4,h).rotation.x=-0.35;game.box(0.45,0.45,0.95,c,s,2.95,4.95,h);
      game.box(0.15,0.8,0.25,0x222222,s,2.4,4.0,h);game.box(0.12,0.12,0.6,0x222222,s,1.9,2.2,h).rotation.x=0.5;
      for(const [a,b] of [[-0.25,0.7],[0.25,0.7],[-0.25,-0.7],[0.25,-0.7]])game.box(0.2,1.3,0.2,0x3a2a1a,s+a,0,3.3+b,h);
    }
  },
  tatra(g,wheel){
    for(const z of[-2.2,-0.6,1.9])for(const x of[-1.25,1.25])wheel(1.1,0.7,x,1.1,z,0x1a1a1a);
    game.box(2.4,0.5,6.4,0x2a2a2a,0,1.0,-0.2,g);
    game.box(2.4,1.0,1.9,0xd93a2a,0,1.4,2.1,g);game.box(2.0,0.85,0.12,0x9fd8ff,0,2.4,3.05,g);game.box(2.4,0.16,1.9,0x9a2a1a,0,3.3,2.1,g);
    game.box(0.12,1.0,0.12,0x444444,-1.1,2.4,1.3,g);game.box(0.12,1.0,0.12,0x444444,1.1,2.4,1.3,g);
    game.box(2.35,1.9,3.7,0xd93a2a,0,1.4,-1.4,g);game.box(2.4,0.2,3.7,0xffffff,0,2.6,-1.4,g);game.box(2.4,0.6,0.3,0x888888,0,1.6,-3.3,g);
    const bm=(c,x)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.25,0.35),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,3.55,2.4);g.add(m)};
    bm(0x3a7aff,-0.6);bm(0xff3a3a,0.6);
  }
};


game.GARAGE_NAMES=GARAGE_NAMES;
game.PLACE_FACTS=PLACE_FACTS;
game.TICKER_FACTS=TICKER_FACTS;
game.ACC=ACC;
window.ACC=ACC;
game.VEHMODELS=VEHMODELS;
window.VEHMODELS=VEHMODELS;

export function initExtras(){
  /* ---------- Pomocníci ---------- */
  const $=id=>document.getElementById(id);
  const fileMode=location.protocol==='file:';
  const API_BASE=new URL('.', location.href).href;
  const css=document.createElement('style');
  css.textContent=`
  #xbar{left:50%;top:66px;transform:translateX(-50%);font-size:22px;text-align:center;background:#7a2aa0cc;padding:5px 18px;border-radius:12px;display:none;white-space:nowrap}
  #roundbox{left:50%;top:38px;transform:translateX(-50%);font-size:20px;text-align:center;background:#0a6bd8cc;padding:4px 16px;border-radius:12px;display:none;white-space:nowrap}
  #xboard{right:12px;top:276px;width:210px;font-size:14px;line-height:1.25;font-weight:700;background:#0a1a3acc;padding:8px 10px 8px;border-radius:12px;display:none;pointer-events:auto;text-shadow:0 1px 2px #000a}
  #xboard .xh{color:#ffe94a;font-size:14px;margin:0 0 4px}
  #xboard .xu{display:block;color:#c9d6ea;font-size:11px;font-weight:700}
  #xboard .xe{opacity:.8;font-size:13px}
  #xboard .xr{display:flex;gap:6px;align-items:baseline;padding:2px 4px;border-radius:6px}
  #xboard .xr.me{background:#ffe94a33}
  #xboard .xk{width:1.6em;flex:0 0 auto;opacity:.85}
  #xboard .xn{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #xboard .xs{flex:0 0 auto;font-variant-numeric:tabular-nums}
  #xboard button{display:block;width:100%;margin-top:6px;padding:4px 8px;font-size:13px;border-radius:8px}
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
  game.CHARS.push({id:'bolex',n:'Bolex',skin:0xe7eef6,hair:0x2a7be4,shirt:0x1f8fe8,pants:0x163a72,acc:'bolex'});
  game.CHARS.push({id:'dracek',n:'Dráček Kyseláč',skin:0x6fcf4a,hair:0x3a9a3a,shirt:0x9bd86a,pants:0x3a8a3a,acc:'dracek'});
  game.CHARS.push({id:'hasicka',n:'Hasička',skin:0xf5d0b0,hair:0xc0702a,shirt:0xd93a2a,pants:0x2a2a3a,acc:'hasicka'});
  game.VEH.push({id:'kun',n:'Kůň',icon:'🐎',price:420,mult:1.7,jump:false,rad:0.7,catchAdd:0,capAdd:0,sprint:1.2,seat:[2.32,-0.3],legs:-1.15,arms:-0.7,neigh:true,noCargo:true,desc:'Rychlý jako kolo a umí řehtat. Neuveze žádné Ozoboty.'});
  game.VEH.push({id:'povoz',n:'Vozatajský povoz',icon:'🐴',price:1080,mult:1.5,jump:false,rad:1.3,catchAdd:0.8,capAdd:5,sprint:0,seat:[-0.1,-0.4],legs:-1.4,arms:-0.6,clop:true,desc:'Dva koně jako na závodech SK Sokol Lipiny. +5 míst.'});
  game.VEH.push({id:'tatra',n:'Hasičská Tatra 138',icon:'🚒',price:3000,mult:1.35,jump:false,rad:1.4,catchAdd:1.6,capAdd:6,sprint:0,seat:[0.7,1.9],legs:-1.5,arms:-0.9,dogsFear:true,siren:true,desc:'Jako ta od bolehošťských hasičů! Houká a psi se bojí. +6 míst.'});
  game.BADGES.find(b=>b.id==='rider').d='Vyzkoušej všechna vozidla';
  game.BADGES.push({id:'fest',n:'Na slavnosti',d:'Ochutnej guláš na Gulášové slavnosti',tier:'mid',t:()=>(game.S.stats.gulas||0)>=1});
  game.BADGES.push({id:'zav',n:'Závitkový mistr',d:'Dej si 3× bolehošťský závitek',tier:'mid',t:()=>(game.S.stats.zav||0)>=3});
  game.BADGES.push({id:'znalec',n:'Znalec Bolehoště',d:'Navštiv 8 míst v obci',tier:'rare',t:()=>Object.keys(game.S.visited||{}).length>=8});
  game.BADGES.push({id:'hejno',n:'Hejno na návsi',d:'Chyť 10 Ozobotů z hejna',tier:'rare',t:()=>(game.S.stats.flock||0)>=10});
  game.BADGES.push({id:'boss',n:'Hrdina obce',d:'Poraz Mega-Ozobota starosty',tier:'ultra',t:()=>(game.S.stats.boss||0)>=1});
  game.BADGES.push({id:'boss10',n:'Neporazitelný',d:'Poraz Mega-Ozobota na úrovni 10',tier:'legend',t:()=>(game.S.stats.bossBest||0)>=10});

  /* ---------- Místní prvky ---------- */
  const PL={};MAP.PLACES.forEach(p=>PL[p.id]=p);
  const lab=(t,c,sc,x,y,z)=>game.placeLabel(game.label(t,c,sc),x,y,z);
  function freeSpot(cx,cz,r0,r1,pad){for(let t=0;t<60;t++){const a=game.rnd(0,6.28),r=game.rnd(r0,r1),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(game.freeAt(x,z,pad)&&x>game.RX0+4&&x<game.RX1-4&&z>game.RZ0+4&&z<game.RZ1-4)return[x,z]}return null}
  // hospoda
  {
    const p=PL.hospoda;lab('Obecní hostinec'+(p.approx?' *':''),'#ffe0a0',0.95,p.x,9.5,p.z);
    for(let i=0;i<3;i++){const s=freeSpot(p.x,p.z,7,12,1.5);if(!s)continue;
      game.shadowOn(game.box(1.3,0.1,1.3,0x8a5a2a,s[0],0.9,s[1]));game.shadowOn(game.box(0.15,0.9,0.15,0x5a3a1a,s[0],0,s[1]));
      const u=new THREE.Mesh(new THREE.ConeGeometry(1.5,0.8,8),game.mat(i%2?0xd93a2a:0xf5c400));u.position.set(s[0],game.gy(s[0],s[1])+3.1,s[1]);u.castShadow=true;game.scene.add(u);game.box(0.1,2.0,0.1,0x888888,s[0],0,s[1]);game.addCircObs(s[0],s[1],0.8)}
  }
  // zvonička (věž)
  {
    const p=PL.vez;game.shadowOn(game.box(2.2,5,2.2,0xf3efe0,p.x,0,p.z));game.shadowOn(game.box(2.6,1.8,2.6,0xe8e2d0,p.x,5,p.z));
    const r=new THREE.Mesh(new THREE.ConeGeometry(2.2,2.6,4),game.mat(0x8a3a1a));r.rotation.y=Math.PI/4;r.position.set(p.x,game.gy(p.x,p.z)+8.1,p.z);r.castShadow=true;game.scene.add(r);
    const bell=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.6,0.8,10),game.mat(0xd9a520));bell.position.set(p.x,game.gy(p.x,p.z)+5.9,p.z);game.scene.add(bell);
    game.addBoxObs(p.x,p.z,2.2,2.2);lab('Zvonička'+(p.approx?' *':''),'#fff',0.9,p.x,12,p.z);
  }
  // fotbalová hřiště (Sokol, Lhota, Lipiny) a u Lhoty a Lipin stánky
  function mark(x1,z1,x2,z2){
    const len=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.ceil(len/1.35)),horiz=Math.abs(x2-x1)>=Math.abs(z2-z1);
    for(let i=0;i<n;i++){
      const t=(i+0.5)/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t,seg=len/n+0.04;
      game.box(horiz?seg:0.22,0.05,horiz?0.22:seg,0xffffff,x,0.07,z);
    }
  }
  function goal(x,z,dir){
    const hw=1.55,back=1.15*dir;
    [[0,-hw],[0,hw],[back,-hw],[back,hw]].forEach(([dx,dz])=>game.shadowOn(game.box(0.16,1.85,0.16,0xffffff,x+dx,0,z+dz)));
    game.shadowOn(game.box(0.16,0.14,hw*2+0.16,0xffffff,x,1.85,z));
    game.shadowOn(game.box(0.16,0.14,hw*2+0.16,0xffffff,x+back,1.85,z));
    game.shadowOn(game.box(Math.abs(back),0.1,0.1,0xffffff,x+back/2,1.85,z-hw));
    game.shadowOn(game.box(Math.abs(back),0.1,0.1,0xffffff,x+back/2,1.85,z+hw));
    for(let i=-2;i<=2;i++)game.box(0.05,1.15,0.05,0xe7eef8,x+back*0.55,0.25,z+i*hw/2.5);
    [[0,-hw],[0,hw]].forEach(([dx,dz])=>game.addCircObs(x+dx,z+dz,0.34));
  }
  function footballPitch(p){
    const {x:cx,z:cz,w,d}=p,nx=Math.max(8,Math.round(w/2)),nz=Math.max(6,Math.round(d/2));
    const pos=[],col=[],idx=[],c1=[0.16,0.58,0.22],c2=[0.26,0.74,0.28];
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const x=cx-w/2+w*i/nx,z=cz-d/2+d*j/nz,stripe=((i/2)|0)%2,c=stripe?c2:c1;
      pos.push(x,game.gy(x,z)+0.05,z);col.push(c[0],c[1],c[2]);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
      const a=j*(nx+1)+i,b=a+1,c=a+(nx+1),e=c+1;idx.push(a,c,b,b,c,e);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    geo.setIndex(idx);geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    mesh.receiveShadow=true;game.scene.add(mesh);
    const x0=cx-w/2,x1=cx+w/2,z0=cz-d/2,z1=cz+d/2;
    mark(x0,z0,x1,z0);mark(x1,z0,x1,z1);mark(x1,z1,x0,z1);mark(x0,z1,x0,z0);mark(cx,z0,cx,z1);
    const R=Math.min(3.3,d*0.2),steps=16;
    for(let i=0;i<steps;i++){const a=i/steps*6.2832,b=(i+1)/steps*6.2832;mark(cx+Math.cos(a)*R,cz+Math.sin(a)*R,cx+Math.cos(b)*R,cz+Math.sin(b)*R)}
    game.box(0.35,0.08,0.35,0xffffff,cx,0.08,cz);
    const pw=Math.min(d*0.5,9),pd=Math.min(w*0.16,4.5);
    [[x0,-1],[x1,1]].forEach(([gx,out])=>{
      const ix=gx-pd*out;
      mark(gx,cz-pw/2,ix,cz-pw/2);mark(ix,cz-pw/2,ix,cz+pw/2);mark(ix,cz+pw/2,gx,cz+pw/2);
      goal(gx+0.2*out,cz,out);
    });
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.38,12,8),game.mat(0xffffff));
    ball.position.set(cx+1.2,game.gy(cx,cz)+0.42,cz+0.4);ball.castShadow=true;game.scene.add(ball);
    const side=p.shops==='s'?-1:(p.shops?1:0);
    lab(p.name,'#d8ffd8',p.shops?0.85:0.9,cx,8,cz-(side||1)*(d/2+1.5));
    if(!side)return;
    const sz=cz+side*(d/2+4.2),sell={x:cx-4.2,z:sz},shop={x:cx+4.2,z:sz};
    game.stall(sell.x,sell.z,0xf5c400,'Výkup Ozobotů');
    game.stall(shop.x,shop.z,0x2a7be4,'Obchod');
    game.interact.push({x:sell.x,z:sell.z-side*2.6,r:4.4,text:()=>game.carry.length?'E – Prodat Ozoboty ('+game.carry.length+')':'E – Výkup (nemáš žádné Ozoboty)',act:()=>game.sellAt(sell.x,sell.z)});
    game.interact.push({x:shop.x,z:shop.z-side*2.6,r:4.4,text:()=>'E – Obchod',act:game.shopModal});
  }
  (game.pitches||[]).forEach(p=>footballPitch(p));
  // obchod, pomník, kříž
  lab('Obchod','#fff',0.8,PL.obchod.x,8,PL.obchod.z);
  {const p=PL.pomnik;game.shadowOn(game.box(1.6,0.6,1.6,0x888888,p.x,0,p.z));game.shadowOn(game.box(0.9,3.4,0.9,0xaaaaaa,p.x,0.6,p.z));game.addCircObs(p.x,p.z,1.1);lab('Pomník','#ddd',0.7,p.x,6,p.z)}
  {const p=PL.kriz;game.shadowOn(game.box(0.35,3.2,0.35,0x6a4020,p.x,0,p.z));game.shadowOn(game.box(1.6,0.35,0.35,0x6a4020,p.x,2.0,p.z));game.addCircObs(p.x,p.z,0.6);lab('Boží muka','#ddd',0.65,p.x,5.5,p.z)}
  // zelárna
  {
    const p=PL.zelarna;
    for(const s of[-3,3]){game.shadowOn(game.box(3,8,3,0xb0b7bf,p.x+s*1.3,0,p.z-3));game.addCircObs(p.x+s*1.3,p.z-3,1.8)}
    for(let i=0;i<6;i++){const a=i*1.05,bx=p.x+Math.cos(a)*5+2,bz=p.z+5+Math.sin(a)*1.5;const b=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,1.6,12),game.mat(0x8a5a2a));b.position.set(bx,game.gy(bx,bz)+0.8,bz);b.castShadow=true;game.scene.add(b)}
    game.shadowOn(game.box(6,0.4,0.3,0xf2e2b8,p.x,4,p.z+3));game.box(0.3,4,0.3,0x6a4020,p.x-3,0,p.z+3);game.box(0.3,4,0.3,0x6a4020,p.x+3,0,p.z+3);
    lab('Agrospol – zelárna','#b6f07a',1.0,p.x,11,p.z);lab('Bolehošťské zelí','#fff',0.7,p.x,4.6,p.z+3);
  }
  // zelné pole
  {
    const p=PL.pole,items=[];
    for(let i=0;i<14;i++)for(let j=0;j<8;j++){const x=p.x-13+i*2,z=p.z-8+j*2.2;items.push({x,y:game.gy(x,z),z,sx:1.1,sy:0.95,sz:1.1,color:(i+j)%3?0x8fd05a:0x6fb04a})}
    const sg=new THREE.IcosahedronGeometry(0.5,1);sg.translate(0,0.45,0);game.instanced(sg,game.white,items,true);
    const lf=items.map(it=>({x:it.x,y:it.y+0.1,z:it.z,sx:1.45,sy:0.25,sz:1.45,color:0x4a9a3a}));game.instanced(game.unitBox,game.white,lf);
    lab('Zelné pole','#b6f07a',0.9,p.x,4.5,p.z);
  }
  // Dráček Kyseláč u domova
  {
    const dc=game.CHARS.find(c=>c.id==='dracek'),a=game.buildAvatar(dc,null);a.g.scale.setScalar(1.15);a.g.position.set(game.H.x+11,game.gy(game.H.x+11,game.H.z-14),game.H.z-14);a.g.rotation.y=-0.4;game.scene.add(a.g);
    game.addCircObs(game.H.x+11,game.H.z-14,1.4);lab('Dráček Kyseláč','#b6f07a',0.85,game.H.x+11,7,game.H.z-14);
  }

  /* ---------- Hasiči za úřadem, na straně k louce ---------- */
  const hasici=(()=>{
    const ch=game.CHARS.find(c=>c.id==='hasic');
    const men=[{x:-75.6,z:-157.4,hose:true},{x:-75.6,z:-161.2,hose:false}];
    const bale={x:-82.0,z:-159.3};
    const face=(x,z)=>Math.atan2(bale.x-x,bale.z-z);
    const crew=[];
    for(const s of men){
      const a=game.buildAvatar(ch,null);
      a.g.scale.setScalar(0.7);
      a.g.position.set(s.x,game.gy(s.x,s.z),s.z);
      a.g.rotation.y=face(s.x,s.z);
      a.armR.rotation.x=s.hose?-1.35:-0.7;
      a.armL.rotation.x=-0.45;
      const blueM=new THREE.MeshBasicMaterial({color:0x3a7aff});
      const redM=new THREE.MeshBasicMaterial({color:0xff3030});
      const blue=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,6),blueM);blue.position.set(-0.46,4.58,0.95);
      const red=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,6),redM);red.position.set(0.46,4.58,0.95);
      a.g.add(blue,red);game.scene.add(a.g);game.addCircObs(s.x,s.z,0.75);
      crew.push({g:a.g,arm:a.armR,blueM,redM,hose:s.hose,x:s.x,z:s.z});
    }
    game.shadowOn(game.box(2.3,1.05,1.35,0xd7a441,bale.x,0,bale.z));
    game.shadowOn(game.box(2.05,0.32,1.15,0xc4842a,bale.x,1.05,bale.z));
    game.addBoxObs(bale.x,bale.z,2.5,1.7);
    const flames=[];
    const fire=new THREE.Group();
    for(const [h,col,sc] of [[1.45,0xff4d1a,1],[0.95,0xffb020,0.62],[0.5,0xfff2b0,0.34]]){
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.48*sc,h,7),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.92}));
      m.position.y=1.35+h*0.35;fire.add(m);flames.push(m);
    }
    fire.position.set(bale.x,game.gy(bale.x,bale.z),bale.z);game.scene.add(fire);
    const holder=crew[0];
    const ay=holder.g.rotation.y,s=0.7;
    const hand={x:holder.x+Math.cos(ay)*1.05*s+Math.sin(ay)*0.7*s,z:holder.z-Math.sin(ay)*1.05*s+Math.cos(ay)*0.7*s,y:holder.g.position.y+1.45};
    const nozzle={x:bale.x+1.7,z:bale.z+0.15,y:game.gy(bale.x,bale.z)+1.7};
    const hosePts=[];
    for(let i=0;i<=7;i++){
      const t=i/7;
      hosePts.push({
        x:hand.x+(nozzle.x-hand.x)*t,
        z:hand.z+(nozzle.z-hand.z)*t,
        y:hand.y+(nozzle.y-hand.y)*t-Math.sin(t*Math.PI)*0.85
      });
    }
    for(let i=0;i<hosePts.length-1;i++){
      const a=hosePts[i],b=hosePts[i+1],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz)||0.01;
      const m=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,len,6),game.mat(0x1c1c1c));
      m.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx/len,dy/len,dz/len));
      m.castShadow=true;game.scene.add(m);
    }
    const mid=hosePts[3];game.addCircObs(mid.x,mid.z,0.45);
    const jet=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.2,1,6),new THREE.MeshBasicMaterial({color:0xb7e4ff,transparent:true,opacity:0.8}));
    const aim=new THREE.Vector3();game.scene.add(jet);
    const drops=[];
    for(let i=0;i<9;i++){
      const m=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,5),new THREE.MeshBasicMaterial({color:0xd6f3ff,transparent:true,opacity:0.9}));
      game.scene.add(m);drops.push(m);
    }
    return {crew,flames,fire,jet,aim,drops,nozzle,bale};
  })();

  /* ---------- Starosta ---------- */
  const uradLM=game.M.LM.find(l=>l[0]==='Obecní úřad')||game.M.LM[0];
  const mayorPos=freeSpot(uradLM[1],uradLM[2],5,11,1.5)||[uradLM[1]+8,uradLM[2]];
  const mayorCh={id:'starosta',skin:0xe8b890,hair:0x6a6a6a,shirt:0x24345a,pants:0x1e2230,acc:'starosta'};
  const mayor=game.buildAvatar(mayorCh,null);mayor.g.scale.setScalar(0.75);mayor.g.position.set(mayorPos[0],game.gy(mayorPos[0],mayorPos[1]),mayorPos[1]);game.scene.add(mayor.g);
  game.addCircObs(mayorPos[0],mayorPos[1],0.8);lab('Starosta Jakub Šimerda','#ffe94a',0.6,mayorPos[0],5.0,mayorPos[1]);
  let bossCd=0;
  function bossLevel(){
    const n=game.S&&game.S.stats&&+game.S.stats.bossLvl;
    return Math.max(1,Math.min(10,n||1));
  }
  function bossTune(lvl){
    const k=lvl-1;
    return {hp:4+lvl,flee:7.2+k*0.5,blink:Math.max(1.35,3.25-k*0.2),inv:2.2+k*0.15,near:16+k*0.8,jump0:14+k*0.5,jump1:24+k};
  }
  game.interact.push({x:mayorPos[0],z:mayorPos[1],r:5,text:()=>'E – Promluvit se starostou',act:mayorModal});
  function mayorModal(){
    game.openModal('🎩 Starosta Jakub Šimerda',el=>{
      const lvl=bossLevel(),hp=bossTune(lvl).hp;
      const lines=['Vítej v Bolehošti! Zelí, hasiči, rybníky – na to jsme pyšní. A teď ještě Ozoboti!','Mega-Ozobot má úrovně 1 až 10. Každá další má víc životů, běhá rychleji a častěji zmizí.','Za poražení Mega-Ozobota dostaneš odměnu od obce. Desátá úroveň je nejtěžší.'];
      el.innerHTML='<p>'+lines[(Date.now()/10000|0)%lines.length]+'</p>';
      const canBoss=!boss&&!EV.cur&&bossCd<=0&&!game.Round.entered;
      const desc=game.Round.entered?'V kole ho starosta pustí sám v pravý čas.':(boss?'Mega-Ozobot už běhá po obci!':(bossCd>0?'Starosta ho musí nejdřív sehnat zpátky ('+Math.ceil(bossCd)+' s).':'Úroveň '+lvl+' z 10. Má '+hp+' životů. Když ho zasáhneš, přeskočí jinam.'));
      game.row(el,'👑 Vyzvat Mega-Ozobota (úroveň '+lvl+'/10)',desc,null,()=>{if(canBoss){startEvent('boss');game.closeModal()}},canBoss?'Do toho!':'—');
      el.lastChild.querySelector('button').disabled=!canBoss;
    },false);
  }

  /* ---------- Hospoda, zelárna, guláš – interakce ---------- */
  const buffs={zav:0,gul:0};
  game.interact.push({x:PL.hospoda.x,z:PL.hospoda.z,r:10,text:()=>'E – Bolehošťský závitek (⚡60)',act:()=>{
    if(game.S.money<60){game.toast('Na závitek potřebuješ ⚡60','#ffb347');return}
    game.S.money-=60;buffs.zav=45;game.stam=100;game.S.stats.zav=(game.S.stats.zav||0)+1;game.sfx.buy();game.toast('🥟 Bolehošťský závitek! Rychlost +20 % na 45 s','#ffe0a0');game.refreshHud();game.checkBadges();
  }});
  let zelCd=0;
  game.interact.push({x:PL.zelarna.x,z:PL.zelarna.z+4,r:8,text:()=>zelCd>0?'Zelí je dojedeno… ('+Math.ceil(zelCd)+' s)':'E – Ochutnat bolehošťské zelí (zdarma)',act:()=>{
    if(zelCd>0)return;zelCd=90;game.stam=100;game.S.money+=20;if(!(game.inRound&&game.inRound())&&game.hallEnergy)game.hallEnergy(20);game.sfx.sell();game.toast('🥬 Kysané zelí! Stamina na plno a +⚡20','#b6f07a');game.refreshHud();
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
  function clearEvRobots(){evRobots.forEach(r=>{game.scene.remove(r.g);const i=game.robots.indexOf(r);if(i>=0)game.robots.splice(i,1)});evRobots=[]}
  function spawnEvRobots(n,cx,cz,leash,followGroup){
    const grp=followGroup?{members:[]}:null;
    for(let i=0;i<n;i++){
      const r=game.addRobot({ev:true,evType:game.pickType(),ex:cx,ez:cz,evLeash:leash,group:grp});
      if(grp)grp.members.push(r);evRobots.push(r);
    }
  }
  function startEvent(type,dur){
    if(EV.cur)endEvent(true);
    const d=EVDEF[type],duration=dur||d.dur;
    EV.cur={type,t:duration,dur:duration,pos:null,label:d.name};
    game.sfx.badge();game.toast(d.name,'#ffe94a');
    if(type==='flock'){
      const p=game.M.LM.find(l=>l[0]==='Pošta')||[game.H.x+20,game.H.z];const s=freeSpot(p[1],p[2],4,14,3)||[p[1],p[2]];
      EV.cur.pos={x:s[0],z:s[1]};spawnEvRobots(24,s[0],s[1],26,true);
    }else if(type==='gulas'){
      const p=PL.hriste,s=freeSpot(p.x,p.z,4,12,2.5)||[p.x,p.z];EV.cur.pos={x:s[0],z:s[1]};
      spawnEvRobots(14,p.x,p.z,22,false);
      const g=new THREE.Group();
      const pot=new THREE.Mesh(new THREE.CylinderGeometry(1.1,0.9,1.0,14),game.mat(0x222222));pot.position.y=1.6;g.add(pot);
      game.box(0.15,1.0,0.15,0x444444,-0.9,0,0,g);game.box(0.15,1.0,0.15,0x444444,0.9,0,0,g);
      const fl=new THREE.Mesh(new THREE.ConeGeometry(0.6,1.0,6),new THREE.MeshBasicMaterial({color:0xff7a1a}));fl.position.y=0.6;g.add(fl);
      const sm=game.label('🍲 Guláš!','#ffd27a',0.7);sm.position.y=4;g.add(sm);
      g.position.set(s[0],game.gy(s[0],s[1]),s[1]);game.shadowOn(g);game.scene.add(g);
      gulasStand={g,x:s[0],z:s[1],taken:false};
      game.interact.push(gulasStand.it={x:s[0],z:s[1],r:5,text:()=>gulasStand.taken?'Už sis dal guláš':'E – Ochutnat guláš (zdarma)',act:()=>{
        if(gulasStand.taken)return;gulasStand.taken=true;buffs.gul=45;game.stam=100;game.S.money+=50;if(!(game.inRound&&game.inRound())&&game.hallEnergy)game.hallEnergy(50);game.S.stats.gulas=(game.S.stats.gulas||0)+1;game.sfx.sell();game.toast('🍲 Guláš! Rychlost +25 % a +⚡50','#ffd27a');game.refreshHud();game.checkBadges();
      }});
    }else if(type==='boss'){
      const lvl=bossLevel();
      EV.cur.dur=EV.cur.t=100+lvl*12;
      EV.cur.label='👑 Mega-Ozobot – úroveň '+lvl+'!';
      spawnBoss(lvl);
    }else if(type==='hunt'){EV.hunt=duration}
  }
  function endEvent(silent){
    const c=EV.cur;if(!c)return;
    if(c.type==='flock'||c.type==='gulas')clearEvRobots();
    if(gulasStand){game.scene.remove(gulasStand.g);const i=game.interact.indexOf(gulasStand.it);if(i>=0)game.interact.splice(i,1);gulasStand=null}
    if(c.type==='boss'&&boss){game.scene.remove(boss.g);boss=null;elBoss.style.display='none';if(!silent)game.toast('Mega-Ozobot utekl… Zkus to příště!','#ffb347');bossCd=120}
    if(c.type==='hunt')EV.hunt=0;
    EV.cur=null;elBar.style.display='none';
  }
  /* Mega-Ozobot */
  function spawnBoss(lvl){
    lvl=lvl||bossLevel();
    const tune=bossTune(lvl);
    const o=game.makeOzo(0xffffff,5.2+lvl*0.08);game.scene.add(o.g);
    const lb=game.label('ÚROVEŇ '+lvl,'#ffe94a',0.34);lb.position.set(0,2.05,0);o.g.add(lb);
    let s=freeSpot(uradLM[1],uradLM[2],14,36,5)||[uradLM[1]+20,uradLM[2]];
    boss=Object.assign(o,{x:s[0],z:s[1],hp:tune.hp,max:tune.hp,lvl,tune,hitCd:0,heading:game.rnd(0,6.28),t:0,cd:1.4,ph:0});
    o.g.position.set(s[0],game.gy(s[0],s[1]),s[1]);EV.cur.pos={x:s[0],z:s[1]};
  }
  function updateBoss(dt){
    const b=boss;if(!b)return;
    const tune=b.tune,dx=b.x-game.pv.x,dz=b.z-game.pv.z,d=Math.hypot(dx,dz);
    b.t-=dt;if(b.t<=0){b.heading+=game.rnd(-1.5,1.5);b.t=game.rnd(0.8,2.2)}
    let hd=b.heading,sp=3+ (b.lvl-1)*0.12;
    if(d<18+b.lvl*0.4){hd=Math.atan2(dz,dx)+Math.sin(game.time*(1.6+b.lvl*0.12))*0.45;sp=tune.flee}
    b.cd-=dt;
    if(b.cd<=0&&d<tune.near){for(let t=0;t<8;t++){const a=game.rnd(0,6.28),dd=game.rnd(tune.jump0,tune.jump1),x=b.x+Math.cos(a)*dd,z=b.z+Math.sin(a)*dd;if(game.freeAt(x,z,4)&&x>game.RX0+6&&x<game.RX1-6&&z>game.RZ0+6&&z<game.RZ1-6){game.burst(b.x,game.gy(b.x,b.z)+4,b.z,0xffffff,14);b.x=x;b.z=z;game.burst(x,game.gy(x,z)+4,z,0xffffff,14);game.sfx.blink();break}}b.cd=tune.blink}
    const q={x:b.x+Math.cos(hd)*sp*dt,z:b.z+Math.sin(hd)*sp*dt},ox=q.x,oz=q.z;game.resolve(q,2.6);if(Math.abs(q.x-ox)+Math.abs(q.z-oz)>0.001)b.t=0;
    b.x=game.clamp(q.x,game.RX0+4,game.RX1-4);b.z=game.clamp(q.z,game.RZ0+4,game.RZ1-4);
    b.g.position.set(b.x,game.gy(b.x,b.z)+Math.abs(Math.sin(game.time*6))*0.3,b.z);b.g.rotation.y=-hd+Math.PI/2;
    game.tmp.setHSL((game.time*(0.55+b.lvl*0.05))%1,1,0.55);b.lm.color.copy(game.tmp);b.gm.color.copy(game.tmp);b.glow.scale.setScalar(2.4+0.4*Math.sin(game.time*5));
    b.hitCd-=dt;
    if(d<game.catchR()+3.6&&b.hitCd<=0&&Math.abs(game.pv.y)<3.5&&!game.locked()){
      b.hp--;b.hitCd=tune.inv;b.cd=0;game.burst(b.x,game.gy(b.x,b.z)+4,b.z,0xffffff,24);game.sfx.catch();
      if(b.hp<=0){
        const next=Math.min(10,b.lvl+1);
        game.S.stats.bossLvl=next;game.S.stats.bossBest=Math.max(game.S.stats.bossBest||0,b.lvl);
        const rew=game.Round.entered?0:1300+b.lvl*200;game.S.money+=rew;if(rew&&game.hallEnergy)game.hallEnergy(rew);game.S.stats.boss=(game.S.stats.boss||0)+1;game.onScore(400+b.lvl*80);
        game.burst(b.x,game.gy(b.x,b.z)+5,b.z,0xffffff,50);game.sfx.badge();
        game.toast('🎉 Úroveň '+b.lvl+' poražena! '+(b.lvl<10?'Další je úroveň '+next+'. ':'Desátá úroveň je maximum. ')+(rew?'+⚡'+rew+' od obce':'+'+(400+b.lvl*80)+' bodů'),'#ffe94a',4.2);
        game.scene.remove(b.g);boss=null;elBoss.style.display='none';EV.cur=null;elBar.style.display='none';bossCd=180;game.refreshHud();game.checkBadges();game.save();return;
      }
      game.toast('Zásah! Úroveň '+b.lvl+' – zbývá '+b.hp+' z '+b.max,'#ffb347');
    }
    elBoss.style.display='block';elBoss.innerHTML='👑 ÚROVEŇ '+b.lvl+'/10 · '+b.hp+'/'+b.max+'<div class="b"><i style="width:'+(b.hp/b.max*100)+'%"></i></div>';
  }

  /* ---------- Hudba a zvuky ---------- */
  const TRACKS=['audio/zaklad.mp3','audio/skladba-2.mp3','audio/skladba-3.mp3'];
  const FADE=3.6;
  const Mu={ctx:null,master:null,on:true,noise:null,rainG:null,siren:null,sirenT:0,clopT:0,neighT:0,players:null,active:0,track:0,fading:false,preloaded:false,failAt:0};
  try{Mu.on=localStorage.getItem('ozo_mute')!=='1'}catch(e){}
  function ramp(param,from,to,t0,dur){
    param.cancelScheduledValues(t0);
    param.setValueAtTime(from,t0);
    param.linearRampToValueAtTime(to,t0+dur);
  }
  function muInit(){
    if(Mu.ctx)return;
    try{
      game.AC=game.AC||new (window.AudioContext||window.webkitAudioContext)();Mu.ctx=game.AC;
      if(Mu.ctx.state==='suspended')Mu.ctx.resume();
      Mu.master=game.AC.createGain();Mu.master.gain.value=Mu.on?0.7:0;Mu.master.connect(game.AC.destination);
      const len=game.AC.sampleRate*2,buf=game.AC.createBuffer(1,len,game.AC.sampleRate),dd=buf.getChannelData(0);for(let i=0;i<len;i++)dd[i]=Math.random()*2-1;Mu.noise=buf;
      const src=game.AC.createBufferSource();src.buffer=buf;src.loop=true;const lp=game.AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1800;Mu.rainG=game.AC.createGain();Mu.rainG.gain.value=0;
      src.connect(lp);lp.connect(Mu.rainG);Mu.rainG.connect(Mu.master);src.start();
      Mu.players=[0,1].map(i=>{
        const el=new Audio();el.preload='auto';
        const node=Mu.ctx.createMediaElementSource(el),g=Mu.ctx.createGain();
        g.gain.value=0;node.connect(g);g.connect(Mu.master);
        const p={el,g,i,trying:false};
        el.addEventListener('timeupdate',()=>onTrackTime(p));
        el.addEventListener('ended',()=>onTrackEnded(p));
        return p;
      });
      beginTrack(0,0,1.2);
    }catch(e){}
  }
  function beginTrack(trackIndex,playerIndex,fadeIn){
    const p=Mu.players[playerIndex],src=TRACKS[trackIndex];
    if(p.el.dataset.src!==src){p.el.src=src;p.el.dataset.src=src}
    try{p.el.currentTime=0}catch(e){}
    ramp(p.g.gain,0,1,Mu.ctx.currentTime,fadeIn);
    Mu.track=trackIndex;Mu.active=playerIndex;Mu.fading=false;Mu.preloaded=false;
    const play=p.el.play();if(play&&play.catch)play.catch(()=>{});
  }
  function preloadNext(){
    const nxt=Mu.players[1-Mu.active],src=TRACKS[(Mu.track+1)%TRACKS.length];
    if(nxt.el.dataset.src!==src){nxt.el.src=src;nxt.el.dataset.src=src}
    Mu.preloaded=true;
  }
  function crossToNext(){
    if(Mu.fading||!Mu.players||!Mu.ctx)return;
    if(performance.now()-(Mu.failAt||0)<1500)return;
    const cur=Mu.players[Mu.active];
    const nextTrack=(Mu.track+1)%TRACKS.length;
    const nxt=Mu.players[1-Mu.active],src=TRACKS[nextTrack];
    Mu.fading=true;
    if(nxt.el.dataset.src!==src){nxt.el.src=src;nxt.el.dataset.src=src}
    try{nxt.el.currentTime=0}catch(e){}
    const t0=Mu.ctx.currentTime;
    ramp(nxt.g.gain,0,1,t0,FADE);
    ramp(cur.g.gain,1,0,t0,FADE);
    const finish=()=>{
      Mu.track=nextTrack;Mu.active=nxt.i;Mu.fading=false;Mu.preloaded=false;
      setTimeout(()=>{
        if(!Mu.ctx||Mu.active===cur.i)return;
        cur.el.pause();
        cur.g.gain.cancelScheduledValues(Mu.ctx.currentTime);
        cur.g.gain.setValueAtTime(0,Mu.ctx.currentTime);
      },FADE*1000+160);
    };
    const play=nxt.el.play();
    if(play&&play.then)play.then(finish).catch(()=>{Mu.fading=false;Mu.failAt=performance.now()});
    else finish();
  }
  function onTrackTime(p){
    if(!Mu.ctx||Mu.active!==p.i||Mu.fading)return;
    const d=p.el.duration;if(!d||!isFinite(d))return;
    const left=d-p.el.currentTime;
    if(!Mu.preloaded&&left<22)preloadNext();
    if(left<=FADE+0.08)crossToNext();
  }
  function onTrackEnded(p){
    if(Mu.active!==p.i||Mu.fading)return;
    crossToNext();
  }
  function tone(t,f,dur,type,vol,att=0.02){
    const c=Mu.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(Mu.master);o.start(t);o.stop(t+dur+0.05);
  }
  function neigh(t){
    const c=Mu.ctx,o=c.createOscillator(),lfo=c.createOscillator(),lg=c.createGain(),f=c.createBiquadFilter(),g=c.createGain();
    o.type='sawtooth';
    o.frequency.setValueAtTime(460,t);
    o.frequency.linearRampToValueAtTime(740,t+0.14);
    o.frequency.linearRampToValueAtTime(520,t+0.32);
    o.frequency.linearRampToValueAtTime(780,t+0.48);
    o.frequency.exponentialRampToValueAtTime(260,t+1.05);
    lfo.frequency.setValueAtTime(8,t);lfo.frequency.linearRampToValueAtTime(15,t+0.45);
    lg.gain.setValueAtTime(16,t);lg.gain.linearRampToValueAtTime(48,t+0.4);
    lfo.connect(lg);lg.connect(o.frequency);
    f.type='lowpass';f.frequency.setValueAtTime(1600,t);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.05,t+0.05);g.gain.setValueAtTime(0.04,t+0.55);g.gain.exponentialRampToValueAtTime(0.0001,t+1.12);
    o.connect(f);f.connect(g);g.connect(Mu.master);o.start(t);lfo.start(t);o.stop(t+1.16);lfo.stop(t+1.16);
  }
  game.playNeigh=()=>{if(!Mu.ctx)return;neigh(Mu.ctx.currentTime);Mu.neighT=game.rnd(2.4,4.2)};
  function muTick(dt){
    if(!Mu.ctx)return;
    if(Mu.ctx.state==='suspended')Mu.ctx.resume();
    const p=Mu.players&&Mu.players[Mu.active];
    if(p&&game.started&&Mu.on&&p.el.paused&&!Mu.fading&&!p.trying){
      p.trying=true;
      const play=p.el.play();
      if(play&&play.finally)play.finally(()=>{p.trying=false});
      else p.trying=false;
    }
    Mu.rainG.gain.setTargetAtTime(game.W.rain*0.07,Mu.ctx.currentTime,0.5);
    const v=game.veh();
    if(game.started&&v&&(game.keys.KeyW||game.keys.KeyS||game.keys.KeyA||game.keys.KeyD||(game.stick&&game.stick.on))&&!game.modalOpen){
      if(v.siren){Mu.sirenT-=dt;if(Mu.sirenT<=0){Mu.sirenT=0.55;const t=Mu.ctx.currentTime;tone(t,Math.random()<2?(Math.floor(game.time*1.8)%2?660:880):660,0.5,'sawtooth',0.03,0.03)}}
      if(v.clop){Mu.clopT-=dt;if(Mu.clopT<=0){Mu.clopT=0.22;const t=Mu.ctx.currentTime;tone(t,180,0.06,'sine',0.09,0.002);tone(t+0.09,140,0.06,'sine',0.07,0.002)}}
      if(v.neigh){Mu.neighT-=dt;if(Mu.neighT<=0){Mu.neighT=game.rnd(2.6,4.6);neigh(Mu.ctx.currentTime)}}
    }
  }
  const muteBtn=document.getElementById('mute');
  function paintMute(){
    if(!muteBtn)return;
    muteBtn.classList.toggle('off',!Mu.on);
    const label=Mu.on?'Vypnout hudbu (M)':'Zapnout hudbu (M)';
    muteBtn.title=label;muteBtn.setAttribute('aria-label',label);muteBtn.setAttribute('aria-pressed',Mu.on?'false':'true');
  }
  function toggleMute(){
    Mu.on=!Mu.on;try{localStorage.setItem('ozo_mute',Mu.on?'0':'1')}catch(e){}
    if(Mu.master)Mu.master.gain.value=Mu.on?0.7:0;
    if(Mu.on&&Mu.ctx&&Mu.ctx.state==='suspended')Mu.ctx.resume();
    if(!game.started&&window.uvodAudio&&window.stopUvod){
      if(Mu.on){const p=window.uvodAudio.play();if(p&&p.catch)p.catch(()=>{})}
      else window.uvodAudio.pause();
    }
    paintMute();
    game.toast(Mu.on?'🔊 Hudba zapnuta':'🔇 Hudba vypnuta','#fff');
  }
  if(muteBtn)muteBtn.onclick=e=>{e.stopPropagation();toggleMute()};
  paintMute();

  /* ---------- Objevování míst a zajímavosti ---------- */
  const DISC=[];
  const shore={};game.ponds.forEach(p=>{if(p.name)shore[p.name]=p});
  MAP.PLACES.forEach(p=>DISC.push({id:p.id,name:p.n,x:p.x,z:p.z,r:p.id==='pole'?14:9,fact:PLACE_FACTS[p.id]}));
  game.M.LM.forEach(l=>{
    if(!PLACE_FACTS[l[0]])return;
    const pond=shore[l[0]];
    const r=pond?7:(/Lhota|Lipiny/.test(l[0])?30:/zámek|Šerka|Jirsák|Březina|jezírka|Čížek|Holdon|Zelnice|spraších|skálou/.test(l[0])?18:9);
    DISC.push({id:'lm:'+l[0],name:l[0],x:pond?pond.cx:l[1],z:pond?pond.cz:l[2],r,pond:pond||null,fact:PLACE_FACTS[l[0]]});
  });
  function checkDiscover(){
    if(!game.S.visited)game.S.visited={};
    for(const d of DISC){
      if(game.S.visited[d.id])continue;
      const close=d.pond?game.pondDist(d.pond.ring,game.pv.x,game.pv.z)<d.r:Math.hypot(d.x-game.pv.x,d.z-game.pv.z)<d.r;
      if(close){game.S.visited[d.id]=1;game.S.money+=25;if(game.hallPlace)game.hallPlace(d.id);if(!(game.inRound&&game.inRound())&&game.hallEnergy)game.hallEnergy(25);game.sfx.badge();game.toast('📍 '+d.name+': '+d.fact+' (+⚡25)','#bfe8ff',7);game.refreshHud();game.checkBadges();break}
    }
  }
  function albumHtml(){
    const v=game.S.visited||{};const got=DISC.filter(d=>v[d.id]);
    return '<h3>Zajímavosti o Bolehošti ('+got.length+' / '+DISC.length+' míst navštíveno)</h3>'+DISC.map(d=>v[d.id]
      ?'<div class="row"><div><b style="color:#1a9a4a">✅ '+d.name+'</b><small>'+d.fact+'</small></div></div>'
      :'<div class="row"><div><b>'+d.name+'</b><small>Ještě jsi tu nebyl.</small></div></div>').join('')
      +'<p style="font-size:12px;color:#889">* poloha hospody a zvoničky je odhadnutá podle mapy.</p>';
  }

  /* ---------- Hlavní tick ---------- */
  function tick(dt){
    const cycle=(game.time%5)/5;
    const water=cycle<0.4?0:Math.sin((cycle-0.4)/0.6*Math.PI);
    const burn=0.16+0.84*(1-water);
    hasici.crew.forEach((c,i)=>{
      const on=Math.sin(game.time*9+i*Math.PI)>0;
      c.blueM.color.setHex(on?0x4aa0ff:0x142038);
      c.redM.color.setHex(on?0x142038:0xff2a2a);
      if(c.hose)c.arm.rotation.x=-1.35+Math.sin(game.time*6)*0.06;
    });
    hasici.flames.forEach((m,i)=>{
      const f=Math.max(0.12,burn*(0.78+0.22*Math.sin(game.time*13+i*1.7)));
      m.scale.set(f,f*(0.9+0.15*Math.sin(game.time*17+i)),f);
      m.material.opacity=0.25+0.7*burn;
    });
    const by=game.gy(hasici.bale.x,hasici.bale.z)+1.85;
    const nx=hasici.nozzle.x,ny=hasici.nozzle.y,nz=hasici.nozzle.z;
    hasici.aim.set(hasici.bale.x-nx,by-ny,hasici.bale.z-nz);
    const jlen=hasici.aim.length()||1;
    hasici.jet.position.set((nx+hasici.bale.x)/2,(ny+by)/2,(nz+hasici.bale.z)/2);
    hasici.jet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),hasici.aim.multiplyScalar(1/jlen));
    hasici.jet.scale.set(0.7+water,jlen,0.7+water);
    hasici.jet.material.opacity=0.15+0.75*water;
    hasici.drops.forEach((m,i)=>{
      const t=(game.time*1.6+i/hasici.drops.length)%1;
      m.position.set(nx+(hasici.bale.x-nx)*t,ny+(by-ny)*t+Math.sin(t*Math.PI)*0.35,nz+(hasici.bale.z-nz)*t);
      m.visible=water>0.05;m.material.opacity=water*0.95;m.scale.setScalar(0.55+water*0.7);
    });
    if(game.started){
      buffs.zav=Math.max(0,buffs.zav-dt);buffs.gul=Math.max(0,buffs.gul-dt);zelCd=Math.max(0,zelCd-dt);bossCd=Math.max(0,bossCd-dt);
      // událost běží
      if(EV.cur){
        EV.cur.t-=dt;
        elBar.style.display='block';elBar.textContent=EV.cur.label+'  '+game.mmss(EV.cur.t);
        if(EV.cur.type==='boss')updateBoss(dt);
        if(EV.cur&&EV.cur.t<=0)endEvent(false);
      }else if(!game.Round.entered){
        EV.next-=dt;if(EV.next<=0){const r=Math.random();startEvent(r<0.35?'flock':r<0.6?'gulas':r<0.8?'boss':'hunt');EV.next=game.rnd(200,320)}
      }
      if(EV.hunt>0)EV.hunt-=dt;
      // mayor mává
      mayor.armR.rotation.x=-2.4+Math.sin(game.time*5)*0.4;mayor.g.rotation.y=Math.atan2(game.pv.x-mayor.g.position.x,game.pv.z-mayor.g.position.z);
      discT-=dt;if(discT<=0){discT=0.4;checkDiscover()}
      factT-=dt;if(factT<=0&&!game.modalOpen){factT=game.rnd(80,120);game.toast('📰 Víš, že… '+TICKER_FACTS[(Math.random()*TICKER_FACTS.length)|0],'#d8f0ff',6)}
      if(game.Round.entered&&game.Net.phase==='running'&&EV.cur){elBar.style.top='66px'}
    }
    muTick(dt);
  }
  function compassTarget(){
    if(!game.started)return null;
    if(EV.cur&&EV.cur.pos){const p=(EV.cur.type==='boss'&&boss)?{x:boss.x,z:boss.z}:EV.cur.pos;return{x:p.x,z:p.z,label:EV.cur.label.replace(/^\S+\s/,'')}}
    return null;
  }
  function onStart(){
    if(window.stopUvod)window.stopUvod();
    if(!game.S.visited)game.S.visited={};
    muInit();EV.next=game.rnd(130,200);factT=40;
    game.poll();
  }

  const apiX={
    tick, onStart, toggleMute, compassTarget, albumHtml, startEvent,
    locked(){return game.locked()},
    inRound(){return game.inRound()},
    onScore(p){return game.onScore(p)},
    onCatch(id,m){return game.onCatch(id,m)},
    speedMult:()=>(buffs.zav>0?1.2:1)*(buffs.gul>0?1.25:1),
    valueMult:()=>EV.hunt>0?2:1,
    ledBoost:()=>EV.hunt>0?1.8:1,
    missionsHtml:()=>game.Round.entered?'<div style="font-size:12px;opacity:.85">KOLO – soutěž!</div><div>• Chytej Ozoboty, body se počítají za každého chyceného.</div><div>• Události přicházejí všem ve stejný čas.</div>':null
  };
  game.X=apiX;
  api.tick=tick;
  bind(game, "EV", () => EV);
  bind(game, "EVDEF", () => EVDEF);
  bind(game, "buffs", () => buffs);
  bind(game, "dip", () => dip);
  bind(game, "elBoard", () => elBoard);
  let sideSig='';
  game.sideListOpen=false;
  const sideEsc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  function paintSideList(title, unit, rows){
    const open=!!game.sideListOpen;
    const extra=rows.length>10;
    const shown=(open||!extra)?rows:rows.slice(0,10);
    const sig=title+'|'+unit+'|'+(open?1:0)+'|'+rows.length+'|'+shown.map(r=>(r.me?1:0)+'|'+r.name+'|'+r.score).join(';');
    elBoard.style.display='block';
    if(sig===sideSig)return;
    sideSig=sig;
    let html='<div class="xh">'+sideEsc(title)+'<span class="xu">'+sideEsc(unit)+'</span></div>';
    if(!shown.length)html+='<div class="xe">Zatím nikdo</div>';
    shown.forEach((r,i)=>{
      html+='<div class="xr'+(r.me?' me':'')+'"><span class="xk">'+(i+1)+'.</span><span class="xn">'+sideEsc(r.name)+'</span><span class="xs">'+r.score+'</span></div>';
    });
    if(extra)html+='<button type="button" id="xmore">'+(open?'Zmenšit':'Zvětšit ('+rows.length+')')+'</button>';
    elBoard.innerHTML=html;
    const btn=elBoard.querySelector('#xmore');
    if(btn)btn.onclick=ev=>{ev.stopPropagation();game.sideListOpen=!game.sideListOpen;sideSig='';};
  }
  bind(game, "paintSideList", () => paintSideList);
  bind(game, "elCount", () => elCount);
  bind(game, "elRound", () => elRound);
  bind(game, "endEvent", () => endEvent);
  bind(game, "rb", () => rb);
  bind(game, "st", () => st);
  bind(game, "startEvent", () => startEvent);
}
