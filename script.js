/* =======================================================
   SOLO SLAYER  –  SCRIPT (General Shadows upgrades added)
   ======================================================= */

/* ---------- CONSTANTS ---------- */
const NAMES = [
  "Temptress","Crave","Desire","Siren","Ecstasy",
  "Obsession","Flesh","Sin","Envy","Madness"
];
const NAMED_COUNT = 10;

const ABILITIES = [
  { name: "Exchange",          unlock: 30 },
  { name: "SelfClone",         unlock: 60 },
  { name: "namedSoldersClone", unlock:100 }
];

/* ---------- PERSISTED STATE ---------- */
let level        = +localStorage.getItem("level")      || 0;
let totalGen     = +localStorage.getItem("totalGen")   || 0;
let failures     = +localStorage.getItem("failures")   || 0;
let zenosLevel   = +localStorage.getItem("zenosLevel") || 0;
let history      = JSON.parse(localStorage.getItem("hist")   || "[]");
let named        = JSON.parse(localStorage.getItem("named")  || "[]");
while (named.length < NAMED_COUNT) named.push({ level:0 });

let abilityStatus = JSON.parse(localStorage.getItem("abilities") || "[]");
while (abilityStatus.length < ABILITIES.length) abilityStatus.push(false);

/* ---------- HELPERS ---------- */
const $ = id => document.getElementById(id);
const rank = lv => lv>=75?"S":lv>=50?"A":lv>=35?"B":lv>=20?"C":lv>=10?"D":"E";
const gsLevel = lv => lv<100 ? 0 : 1 + Math.floor((lv-100)/25);

/* ---------- POP-UPS ---------- */
function showPopup(html){
  $("shadowReveal").innerHTML=html;
  $("shadowReveal").style.display="block";
}
function closePopup(){ $("shadowReveal").style.display="none"; }
function banner(msg){
  const d=document.createElement("div");
  d.className="shadow-arrival";
  d.textContent=msg;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),3000);
}

/* ---------- ABILITY UNLOCK ---------- */
function notifyAbility(idx){
  $("abilityUnlock").innerHTML=
    `<strong>${ABILITIES[idx].name}</strong> unlocked!<br><button onclick="$('abilityUnlock').style.display='none'">OK</button>`;
  $("abilityUnlock").style.display="block";
}
function checkAbility(prev,curr){
  ABILITIES.forEach((ab,i)=>{
    if(!abilityStatus[i] && prev<ab.unlock && curr>=ab.unlock){
      abilityStatus[i]=true;
      localStorage.setItem("abilities",JSON.stringify(abilityStatus));
      notifyAbility(i);
    }
  });
}

/* ---------- GENERAL SHADOWS UPGRADE ---------- */
function checkGSUpgrade(prev,curr){
  const prevGS = gsLevel(prev);
  const currGS = gsLevel(curr);
  if(currGS > prevGS){
    banner(`General Shadows Lv.${currGS}`);
    showPopup(`General Shadows upgraded to <strong>Lv.${currGS}</strong><br><button onclick="closePopup()">OK</button>`);
  }
}

/* ---------- UI REFRESH ---------- */
function updateUI(){
  $("level").textContent=level;
  $("rank").textContent=rank(level);
  $("shadows").textContent=totalGen;
  $("failures").textContent=failures;

  const res=history.filter(x=>x==="resist").length;
  const aura=history.length?Math.round((res/history.length)*100):100;
  $("aura").textContent=aura;
  $("toxicity").textContent=100-aura;
  $("auraFill").style.width=`${aura}%`;
  $("toxicityFill").style.width=`${100-aura}%`;

  if($("roadmapOverlay").style.display==="block")   buildRoadmap();
  if($("namedOverlay").style.display==="block")     buildNamed();
  if($("abilitiesOverlay").style.display==="block") buildAbilities();
  if($("armyOverlay").style.display==="block")      buildArmy();
}

/* ---------- CORE GAMEPLAY ---------- */
function resist(){
  history.push("resist"); localStorage.setItem("hist",JSON.stringify(history));
  const next=level+1;

  if(next%10===0 && next<=100){          // named (≤100)
    performNamedUpgrade(next,true);
  }else if(next>100 && (next-100)%5===0){
    performNamedUpgrade(next,true);
  }else{
    showPopup(`${next*2} shadow soldiers await<br><button onclick="collectSoldiers()">Arise</button>`);
  }
}
function collectSoldiers(){
  closePopup();
  const prev=level;
  level++; localStorage.setItem("level",level);
  checkAbility(prev,level); checkGSUpgrade(prev,level);

  const gain=level*2;
  totalGen+=gain; localStorage.setItem("totalGen",totalGen);

  banner(`+${gain} soldiers`);
  showPopup(`Gained ${gain} soldiers<br><button onclick="closePopup()">OK</button>`);
  updateUI();
}
function performNamedUpgrade(targetLevel,auto){
  const idx = targetLevel<=100 ? targetLevel/10-1 : ( (targetLevel-105)/5 )%10;
  const nm  = NAMES[idx];
  const prev=level;
  level++; if(auto) localStorage.setItem("level",level);
  checkAbility(prev,level); checkGSUpgrade(prev,level);

  if(named[idx].level===0){
    named[idx].level=1;
    banner(`Summoned: ${nm}`);
    showPopup(`Summoned <strong>${nm}</strong> (Lv.1)<br><button onclick="closePopup()">OK</button>`);
  }else{
    named[idx].level++;
    banner(`Upgraded: ${nm}`);
    showPopup(`${nm} upgraded to <strong>Lv.${named[idx].level}</strong><br><button onclick="closePopup()">OK</button>`);
  }
  localStorage.setItem("named",JSON.stringify(named));
  updateUI();
}
function defeat(){
  failures++; history.push("defeat");
  const lost=Math.floor(totalGen/2); totalGen-=lost;
  localStorage.setItem("failures",failures);
  localStorage.setItem("totalGen",totalGen);
  localStorage.setItem("hist",JSON.stringify(history));

  showPopup(`You gave in.<br>Lost <strong>${lost}</strong> soldiers.<br><button onclick="closePopup()">OK</button>`);
  updateUI();
}
function forgeZenos(){
  const cost=1000*Math.pow(2,zenosLevel);
  if(totalGen>=cost){
    totalGen-=cost; zenosLevel++;
    localStorage.setItem("totalGen",totalGen);
    localStorage.setItem("zenosLevel",zenosLevel);
    banner(`Zenos Lv.${zenosLevel}`);
    updateUI();
  }else{
    showPopup(`Need ${cost} soldiers to upgrade Zenos.<br><button onclick="closePopup()">OK</button>`);
  }
}
function resetGame(){
  level=failures=zenosLevel=0; totalGen=0; history=[];
  named=Array.from({length:NAMED_COUNT},()=>({level:0}));
  abilityStatus=ABILITIES.map(()=>false);
  localStorage.clear();
  localStorage.setItem("abilities",JSON.stringify(abilityStatus));
  document.querySelectorAll(".overlay").forEach(o=>o.style.display="none");
  closePopup(); $("abilityUnlock").style.display="none";
  updateUI();
}

/* ---------- ROADMAP (list) ---------- */
function toggleRoadmap(){
  const ov=$("roadmapOverlay");
  ov.style.display=ov.style.display==="block"?"none":"block";
  if(ov.style.display==="block") buildRoadmap();
}
function buildRoadmap(){
  $("roadmapMsg").textContent = level>=100
    ? "You are good to go and named solders will get upgraded every fifth level"
    : "";

  const list=$("roadmapList"); list.innerHTML="";
  NAMES.forEach((nm,i)=>{
    const unlock=(i+1)*10;
    const div=document.createElement("div");
    div.className="roadmap-item";
    if(level>=unlock) div.classList.add("unlocked");
    div.innerHTML=`<span>${nm}</span><span>Level ${unlock}</span>`;
    list.appendChild(div);
  });
}

/* ---------- SHADOW ARMY LIST ---------- */
function toggleNamed(){
  const ov=$("namedOverlay");
  ov.style.display=ov.style.display==="block"?"none":"block";
  if(ov.style.display==="block") buildNamed();
}
function buildNamed(){
  const wrap=$("namedContainer"); wrap.innerHTML="";
  if(zenosLevel>0){
    const z=document.createElement("div");
    z.className="named-item z-top";
    z.innerHTML=`<span>Zenos</span><span>Lv.${zenosLevel}</span>`;
    wrap.appendChild(z);
  }
  for(let i=NAMED_COUNT-1;i>=0;i--){
    if(named[i].level>0){
      const div=document.createElement("div");
      div.className="named-item";
      div.innerHTML=`<span>${NAMES[i]}</span><span>Lv.${named[i].level}</span>`;
      wrap.appendChild(div);
    }
  }
  /* --- General Shadows row --- */
  const gs=gsLevel(level);
  const gDiv=document.createElement("div");
  gDiv.className="named-item general";
  if(gs>0) gDiv.classList.add("unlocked");
  gDiv.innerHTML=`<span>General Shadows</span><span>Lv.${gs}</span>`;
  wrap.appendChild(gDiv);
}

/* ---------- ABILITIES LIST ---------- */
function toggleAbilities(){
  const ov=$("abilitiesOverlay");
  ov.style.display=ov.style.display==="block"?"none":"block";
  if(ov.style.display==="block") buildAbilities();
}
function buildAbilities(){
  const list=$("abilitiesList"); list.innerHTML="";
  ABILITIES.forEach((ab,i)=>{
    const div=document.createElement("div");
    div.className="ability-item";
    if(level>=ab.unlock) div.classList.add("unlocked");
    div.innerHTML=`<span>${ab.name} (Unlocks at Level ${ab.unlock})</span><span>${level>=ab.unlock?"Unlocked":"Locked"}</span>`;
    list.appendChild(div);
  });
}

/* ---------- MY-ARMY VISUAL ---------- */
function toggleArmy(){
  const ov=$("armyOverlay");
  ov.style.display=ov.style.display==="block"?"none":"block";
  if(ov.style.display==="block") buildArmy();
}
function buildArmy(){
  const container=$("armyContainer"); container.innerHTML="";
  const rows=[
    ["You"],
    ["Envy (Magician)"],
    ["Crave","Desire","Siren","Ecstasy","Obsession","Flesh","Sin"],
    ["Temptress (Commander)"],
    ["Shadow Soldiers"],
    ["Zenos (Giant)","Madness (Dragon)"]
  ];
  rows.forEach(r=>{
    const rowDiv=document.createElement("div"); rowDiv.className="army-row";
    r.forEach(lbl=>{
      const it=document.createElement("div"); it.className="army-item";
      if(lbl==="You") it.classList.add("me");
      const key=lbl.split(" ")[0];
      const unlocked=(key==="You")||
        (key==="Envy"      && named[8].level>0)||
        (key==="Crave"     && named[1].level>0)||
        (key==="Desire"    && named[2].level>0)||
        (key==="Siren"     && named[3].level>0)||
        (key==="Ecstasy"   && named[4].level>0)||
        (key==="Obsession" && named[5].level>0)||
        (key==="Flesh"     && named[6].level>0)||
        (key==="Sin"       && named[7].level>0)||
        (key==="Temptress" && named[0].level>0)||
        (key==="Madness"   && named[9].level>0)||
        (key==="Zenos"     && zenosLevel>0)    ||
        (key==="Shadow"    && totalGen>0);
      if(unlocked) it.classList.add("unlocked");
      it.textContent=lbl; rowDiv.appendChild(it);
    });
    container.appendChild(rowDiv);
  });
}

/* ---------- INIT ---------- */
updateUI();
