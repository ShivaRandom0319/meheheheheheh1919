/* =======================================================
   SOLO SLAYER – COMPLETE SCRIPT (2025-05-22)
   • Added Abilities overlay + button
   • Abilities unlock at Lv 30, 60, 100
   ======================================================= */

/* ---------- CONSTANTS ---------- */
const NAMES = [
  "Temptress","Crave","Desire","Siren","Ecstasy",
  "Obsession","Flesh","Sin","Envy","Madness"
];
const NAMED_COUNT = 10;

const ABILITIES = [
  { name: "Exchange",           unlock: 30 },
  { name: "SelfClone",          unlock: 60 },
  { name: "namedSoldersClone",  unlock:100 }
];

/* ---------- PERSISTED STATE ---------- */
let level     = +localStorage.getItem("level")     || 0;
let totalGen  = +localStorage.getItem("totalGen")  || 0;
let failures  = +localStorage.getItem("failures")  || 0;
let zenoLevel = +localStorage.getItem("zenoLevel") || 0;
let history   = JSON.parse(localStorage.getItem("hist") || "[]");      // resist | defeat

/* fixed-length named array → [{level:0}, …] */
let named = JSON.parse(localStorage.getItem("named") || "[]");
while (named.length < NAMED_COUNT) named.push({ level : 0 });

/* ---------- SHORTCUTS ---------- */
const $ = id => document.getElementById(id);
const rank = lv => lv>=75?"S":lv>=50?"A":lv>=35?"B":lv>=20?"C":lv>=10?"D":"E";

/* ---------- NAMED-LEVEL MATH ---------- */
const isNamedLevel = lv =>
  (lv<=100 && lv%10===0) || (lv>100 && (lv-100)%5===0);

const idxFor = lv =>
  lv<=100 ? lv/10 - 1                         // 10→0 … 100→9
          : ((lv-105)/5) % NAMED_COUNT;       // 105→0 … 150→9, 155→0 …

/* ---------- UI REFRESH ---------- */
function updateUI() {
  $("level").textContent    = level;
  $("rank").textContent     = rank(level);
  $("shadows").textContent  = totalGen;
  $("failures").textContent = failures;

  const res  = history.filter(x=>x==="resist").length,
        aura = history.length ? Math.round((res/history.length)*100) : 100;
  $("aura").textContent     = aura;
  $("toxicity").textContent = 100 - aura;
  $("auraFill").style.width     = `${aura}%`;
  $("toxicityFill").style.width = `${100-aura}%`;

  if ($("roadmapOverlay").style.display==="block")   buildRoadmap();
  if ($("namedOverlay").style.display==="block")     buildNamed();
  if ($("abilitiesOverlay").style.display==="block") buildAbilities();
}
function banner(msg){
  const d=document.createElement("div");
  d.className="shadow-arrival";
  d.textContent=msg;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),3000);
}
function closeReveal(){ $("shadowReveal").style.display="none"; }

/* ---------- CORE GAMEPLAY ---------- */
function resist(){
  history.push("resist"); localStorage.setItem("hist",JSON.stringify(history));
  const next = level + 1;

  if (isNamedLevel(next)) {
    performNamedUpgrade(next, true);          // instant summon / upgrade
  } else {
    $("notification").innerHTML =
      `${next*2} shadow soldiers await<br><button onclick="collectSoldiers()">Arise</button>`;
    $("notification").style.display="block";
  }
}
function collectSoldiers(){
  $("notification").style.display="none";
  level++;  localStorage.setItem("level", level);

  const gain = level * 2;
  totalGen  += gain;
  localStorage.setItem("totalGen", totalGen);

  banner(`+${gain} soldiers`);
  $("shadowReveal").innerHTML =
    `Gained ${gain} soldiers<br><button onclick="closeReveal()">OK</button>`;
  $("shadowReveal").style.display="block";
  updateUI();
}

function performNamedUpgrade(targetLevel, auto){
  const idx = idxFor(targetLevel),
        nm  = NAMES[idx];

  level++; if (auto) localStorage.setItem("level", level);

  if (named[idx].level === 0) {        // first summon
    named[idx].level = 1;
    banner(`Summoned: ${nm}`);
    $("shadowReveal").innerHTML =
      `Summoned <strong>${nm}</strong> (Lv.1)<br><button onclick="closeReveal()">OK</button>`;
  } else {                             // upgrade
    named[idx].level++;
    banner(`Upgraded: ${nm}`);
    $("shadowReveal").innerHTML =
      `${nm} upgraded to <strong>Lv.${named[idx].level}</strong><br><button onclick="closeReveal()">OK</button>`;
  }
  localStorage.setItem("named", JSON.stringify(named));
  $("shadowReveal").style.display="block";
  updateUI();
}

function defeat(){
  failures++;
  history.push("defeat");
  const lost = Math.floor(totalGen / 2);
  totalGen  -= lost;
  localStorage.setItem("failures", failures);
  localStorage.setItem("totalGen", totalGen);
  localStorage.setItem("hist", JSON.stringify(history));

  $("shadowReveal").innerHTML =
    `You gave in.<br>Lost <strong>${lost}</strong> soldiers.<br><button onclick="closeReveal()">OK</button>`;
  $("shadowReveal").style.display="block";
  updateUI();
}

function forgeZeno(){
  const cost = 1000 * Math.pow(2, zenoLevel);
  if (totalGen >= cost) {
    totalGen -= cost;
    zenoLevel++;
    localStorage.setItem("totalGen", totalGen);
    localStorage.setItem("zenoLevel", zenoLevel);
    banner(`Zeno Lv.${zenoLevel}`);
    updateUI();
  } else {
    $("shadowReveal").innerHTML =
      `Need ${cost} soldiers to upgrade Zeno.<br><button onclick="closeReveal()">OK</button>`;
    $("shadowReveal").style.display="block";
  }
}

function resetGame(){
  level = failures = zenoLevel = 0;
  totalGen = 0; history = [];
  named = Array.from({length:NAMED_COUNT}, () => ({level:0}));
  localStorage.clear();
  document.querySelectorAll(".overlay").forEach(o=>o.style.display="none");
  updateUI();
}

/* ---------- ROADMAP ---------- */
function toggleRoadmap(){
  const ov = $("roadmapOverlay");
  ov.style.display = ov.style.display==="block" ? "none" : "block";
  if (ov.style.display==="block"){
    $("roadmapDialog").style.display="none";
    buildRoadmap();
  }
}
function buildRoadmap(){
  const msg=$("roadmapMsg"), grid=$("roadmapGrid");
  if(level>=101){
    msg.textContent="You are beyond Level 100 — forge your own path!";
    grid.style.display="none";
    return;
  }
  msg.textContent="";grid.style.display="grid";grid.innerHTML="";
  const base=level===0?1:Math.floor(level/100)*100+1;
  for(let i=base;i<base+100;i++){
    const box=document.createElement("div");
    box.className="grid-box";
    box.textContent=i;
    if(i<=level) box.classList.add("highlight");
    if(isNamedLevel(i)) box.classList.add("named");
    box.onclick=()=>roadmapClick(i);
    grid.appendChild(box);
  }
}
function roadmapClick(lv){
  const dlg=$("roadmapDialog"),
        txt=$("roadmapDialogMsg");
  if(isNamedLevel(lv)){
    const idx=idxFor(lv), nm=NAMES[idx], cur=named[idx].level;
    txt.textContent = lv<=level
      ? `${nm} is Level ${cur||1}`
      : `${nm} gets upgraded to Level ${cur+1}`;
  }else{
    const val=lv*2;
    txt.textContent = lv<=level
      ? `Gained ${val} soldiers at Level ${lv}`
      : `Will gain ${val} soldiers`;
  }
  dlg.style.display="block";
}
function closeRoadmapDialog(){ $("roadmapDialog").style.display="none"; }

/* ---------- SHADOW ARMY LIST ---------- */
function toggleNamed(){
  const ov = $("namedOverlay");
  ov.style.display = ov.style.display==="block" ? "none" : "block";
  if (ov.style.display==="block") buildNamed();
}
function buildNamed(){
  const wrap=$("namedContainer"); wrap.innerHTML="";

  /* Zeno (if any) first */
  if (zenoLevel > 0){
    const z = document.createElement("div");
    z.className="named-item z-top";
    z.innerHTML=`<span>Zenos</span><span>Lv.${zenoLevel}</span>`;
    wrap.appendChild(z);
  }

  /* unlocked named shadows sorted by index DESC (Madness→Temptress) */
  const unlocked = [];
  for (let i = NAMED_COUNT-1; i >= 0; i--){
    if (named[i].level > 0){
      unlocked.push({name:NAMES[i], lvl:named[i].level});
    }
  }
  unlocked.forEach(obj=>{
    const div=document.createElement("div");
    div.className="named-item";
    div.innerHTML=`<span>${obj.name}</span><span>Lv.${obj.lvl}</span>`;
    wrap.appendChild(div);
  });
}

/* ---------- ABILITIES (NEW) ---------- */
function toggleAbilities(){
  const ov = $("abilitiesOverlay");
  ov.style.display = ov.style.display==="block" ? "none" : "block";
  if (ov.style.display==="block") buildAbilities();
}
function buildAbilities(){
  const list=$("abilitiesList"); list.innerHTML="";
  ABILITIES.forEach(ab=>{
    const div=document.createElement("div");
    div.className="ability-item";
    const unlocked = level >= ab.unlock;
    if (unlocked) div.classList.add("unlocked");
    div.innerHTML = `<span>${ab.name} (Unlocks at Level ${ab.unlock})</span>
                     <span>${unlocked?"Unlocked":"Locked"}</span>`;
    list.appendChild(div);
  });
}

/* ---------- INITIALISATION ---------- */
updateUI();

/* intercept click on the *very next* named square (Lv>100) so upgrade happens instantly */
document.addEventListener("click",e=>{
  if (e.target.classList.contains("grid-box")){
    const val = +e.target.textContent;
    if (isNamedLevel(val) && val === level + 1 && val > 100){
      performNamedUpgrade(val, true);
    }
  }
});
