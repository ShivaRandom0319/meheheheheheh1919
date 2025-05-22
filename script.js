/* =======================================================
   SOLO SLAYER – General Shadows pop-up fix
   ======================================================= */

/* ---------- CONSTANTS ---------- */
const NAMES = [
  "Temptress","Crave","Desire","Siren","Ecstasy",
  "Obsession","Flesh","Sin","Envy","Madness"
];
const ABILITIES = [
  { name: "Exchange",          unlock: 30 },
  { name: "SelfClone",         unlock: 60 },
  { name: "namedSoldersClone", unlock:100 }
];
const NAMED_COUNT = 10;

/* ---------- STATE ---------- */
let level      = +localStorage.getItem("level")      || 0;
let totalGen   = +localStorage.getItem("totalGen")   || 0;
let failures   = +localStorage.getItem("failures")   || 0;
let zenosLevel = +localStorage.getItem("zenosLevel") || 0;
let history    = JSON.parse(localStorage.getItem("hist")  || "[]");
let named      = JSON.parse(localStorage.getItem("named") || "[]");
while (named.length < NAMED_COUNT) named.push({ level:0 });
let abilityOk  = JSON.parse(localStorage.getItem("abilities") || "[]");
while (abilityOk.length < ABILITIES.length) abilityOk.push(false);

/* ---------- HELPERS ---------- */
const $    = id => document.getElementById(id);
const rank = lv => lv>=75?"S":lv>=50?"A":lv>=35?"B":lv>=20?"C":lv>=10?"D":"E";
const gLvl = lv => lv<125 ? 1 : 1+Math.floor((lv-100)/25);

/* ---------- UI POP-UPS ---------- */
function pop(html){ $("shadowReveal").innerHTML=html; $("shadowReveal").style.display="block"; }
function closePop(){ $("shadowReveal").style.display="none"; }
function banner(msg){
  const d=document.createElement("div");
  d.className="shadow-arrival"; d.textContent=msg;
  document.body.appendChild(d); setTimeout(()=>d.remove(),3000);
}

/* ---------- ABILITIES ---------- */
function checkAbility(prev,curr){
  ABILITIES.forEach((ab,i)=>{
    if(!abilityOk[i] && prev<ab.unlock && curr>=ab.unlock){
      abilityOk[i]=true; localStorage.setItem("abilities",JSON.stringify(abilityOk));
      $("abilityUnlock").innerHTML=
        `<strong>${ab.name}</strong> unlocked!<br><button onclick="$('abilityUnlock').style.display='none'">OK</button>`;
      $("abilityUnlock").style.display="block";
    }
  });
}

/* ---------- GENERAL SHADOWS ---------- */
function generalUpgradeMsg(prev,curr){
  const before=gLvl(prev), after=gLvl(curr);
  return after>before ? `General Shadows upgraded to <strong>Level ${after}</strong>` : null;
}

/* ---------- CORE UPDATE ---------- */
function updateUI(){
  $("level").textContent=level;
  $("rank").textContent=rank(level);
  $("shadows").textContent=totalGen;
  $("failures").textContent=failures;

  const res=history.filter(x=>x==="resist").length;
  const aura=history.length?Math.round((res/history.length)*100):100;
  $("aura").textContent=aura; $("toxicity").textContent=100-aura;
  $("auraFill").style.width=`${aura}%`; $("toxicityFill").style.width=`${100-aura}%`;

  if($("roadmapOverlay").style.display==="block")   buildRoadmap();
  if($("namedOverlay").style.display==="block")     buildNamed();
  if($("abilitiesOverlay").style.display==="block") buildAbilities();
  if($("armyOverlay").style.display==="block")      buildArmy();
}

/* ---------- RESIST / COLLECT ---------- */
function resist(){
  history.push("resist"); localStorage.setItem("hist",JSON.stringify(history));
  const next=level+1;
  const isNamed = (next<=100 && next%10===0) || (next>100 && (next-100)%5===0);

  if(isNamed){ performNamed(next); }
  else{ pop(`${next*2} shadow soldiers await<br><button onclick="collect()">Arise</button>`); }
}

function collect(){
  closePop();
  const prev=level; level++; localStorage.setItem("level",level);
  checkAbility(prev,level);

  const gMsg=generalUpgradeMsg(prev,level);
  if(gMsg){ pop(`${gMsg}<br><button onclick="closePop()">OK</button>`); }
  else{
    const gain=level*2; totalGen+=gain; localStorage.setItem("totalGen",totalGen);
    banner(`+${gain} soldiers`);
    pop(`Gained ${gain} soldiers<br><button onclick="closePop()">OK</button>`);
  }
  updateUI();
}

/* ---------- NAMED UPGRADE ---------- */
function performNamed(target){
  const idx = target<=100 ? target/10-1 : ((target-105)/5)%10;
  const nm  = NAMES[idx];
  const prev=level; level++; localStorage.setItem("level",level);

  checkAbility(prev,level);
  const gMsg=generalUpgradeMsg(prev,level);

  let text;
  if(named[idx].level===0){ named[idx].level=1; banner(`Summoned: ${nm}`);
    text=`Summoned <strong>${nm}</strong> (Lv.1)`; }
  else{ named[idx].level++; banner(`Upgraded: ${nm}`);
    text=`${nm} upgraded to <strong>Lv.${named[idx].level}</strong>`; }

  localStorage.setItem("named",JSON.stringify(named));
  pop(`${gMsg?gMsg+"<br><br>":""}${text}<br><button onclick="closePop()">OK</button>`);
  updateUI();
}

/* ---------- DEFEAT ---------- */
function defeat(){
  failures++; history.push("defeat");
  const lost=Math.floor(totalGen/2); totalGen-=lost;
  ["failures","totalGen","hist"].forEach((k,i)=>localStorage.setItem(k,[failures,totalGen,JSON.stringify(history)][i]));
  pop(`You gave in.<br>Lost <strong>${lost}</strong> soldiers.<br><button onclick="closePop()">OK</button>`);
  updateUI();
}

/* ---------- ZENOS ---------- */
function forgeZenos(){
  const cost=1000*Math.pow(2,zenosLevel);
  if(totalGen>=cost){
    totalGen-=cost; zenosLevel++;
    localStorage.setItem("totalGen",totalGen); localStorage.setItem("zenosLevel",zenosLevel);
    banner(`Zenos Lv.${zenosLevel}`); updateUI();
  }else{ pop(`Need ${cost} soldiers to upgrade Zenos.<br><button onclick="closePop()">OK</button>`); }
}

/* ---------- RESET ---------- */
function resetGame(){
  level=failures=zenosLevel=0; totalGen=0; history=[];
  named=NAMES.map(()=>({level:0})); abilityOk=ABILITIES.map(()=>false);
  localStorage.clear(); localStorage.setItem("abilities",JSON.stringify(abilityOk));
  document.querySelectorAll(".overlay").forEach(o=>o.style.display="none");
  closePop(); $("abilityUnlock").style.display="none";
  updateUI();
}

/* ---------- ROADMAP (list) ---------- */
function toggleRoadmap(){ const o=$("roadmapOverlay"); o.style.display=o.style.display==="block"?"none":"block"; if(o.style.display==="block") buildRoadmap(); }
function buildRoadmap(){
  $("roadmapMsg").textContent=level>=100?"You are good to go and named solders will get upgraded every fifth level":"";
  const list=$("roadmapList"); list.innerHTML="";
  NAMES.forEach((nm,i)=>{
    const unlock=(i+1)*10; const d=document.createElement("div");
    d.className="roadmap-item"; if(level>=unlock) d.classList.add("unlocked");
    d.innerHTML=`<span>${nm}</span><span>Level ${unlock}</span>`; list.appendChild(d);
  });
}

/* ---------- SHADOW ARMY ---------- */
function toggleNamed(){ const o=$("namedOverlay"); o.style.display=o.style.display==="block"?"none":"block"; if(o.style.display==="block") buildNamed(); }
function buildNamed(){
  const wrap=$("namedContainer"); wrap.innerHTML="";
  if(zenosLevel) wrap.appendChild(entry("Zenos",zenosLevel,"z-top"));
  for(let i=9;i>=0;i--) if(named[i].level) wrap.appendChild(entry(NAMES[i],named[i].level));
  if(totalGen) wrap.appendChild(entry("General Shadows",gLvl(level)));
}
const entry=(n,l,c)=>{const d=document.createElement("div");d.className="named-item";if(c)d.classList.add(c);d.innerHTML=`<span>${n}</span><span>Lv.${l}</span>`;return d;};

/* ---------- ABILITIES ---------- */
function toggleAbilities(){ const o=$("abilitiesOverlay"); o.style.display=o.style.display==="block"?"none":"block"; if(o.style.display==="block") buildAbilities(); }
function buildAbilities(){
  const list=$("abilitiesList"); list.innerHTML="";
  ABILITIES.forEach((ab,i)=>{
    const d=document.createElement("div"); d.className="ability-item"; if(level>=ab.unlock) d.classList.add("unlocked");
    d.innerHTML=`<span>${ab.name} (Unlocks at Level ${ab.unlock})</span><span>${level>=ab.unlock?"Unlocked":"Locked"}</span>`; list.appendChild(d);
  });
}

/* ---------- MY-ARMY (unchanged) ---------- */
function toggleArmy(){ const o=$("armyOverlay"); o.style.display=o.style.display==="block"?"none":"block"; if(o.style.display==="block") buildArmy(); }
function buildArmy(){
  const c=$("armyContainer"); c.innerHTML="";
  const rows=[["You"],["Envy (Magician)"],["Crave","Desire","Siren","Ecstasy","Obsession","Flesh","Sin"],["Temptress (Commander)"],["Shadow Soldiers"],["Zenos (Giant)","Madness (Dragon)"]];
  rows.forEach(r=>{const row=document.createElement("div");row.className="army-row";
    r.forEach(lbl=>{const it=document.createElement("div");it.className="army-item";if(lbl==="You")it.classList.add("me");
      const key=lbl.split(" ")[0];const ok=(key==="You")||(key==="Envy"&&named[8].level)||(key==="Crave"&&named[1].level)||(key==="Desire"&&named[2].level)||(key==="Siren"&&named[3].level)||(key==="Ecstasy"&&named[4].level)||(key==="Obsession"&&named[5].level)||(key==="Flesh"&&named[6].level)||(key==="Sin"&&named[7].level)||(key==="Temptress"&&named[0].level)||(key==="Madness"&&named[9].level)||(key==="Zenos"&&zenosLevel)||(key==="Shadow"&&totalGen);
      if(ok) it.classList.add("unlocked"); it.textContent=lbl; row.appendChild(it);});
    c.appendChild(row);});
}

/* ---------- INIT ---------- */
updateUI();
