const sessions = window.COURSE_SESSIONS;
const KEY = "firewallPortalProgressV2";
let state = loadState();
let currentId = null;
let currentView = "dashboard";

const $ = (id) => document.getElementById(id);
const nav = $("courseNav");

function defaultState(){ return {completed:{},notes:{},assignments:{},quiz:{},bookmarks:{},packetBest:0}; }
function loadState(){
  try {
    const v2 = JSON.parse(localStorage.getItem(KEY));
    if(v2) return Object.assign(defaultState(), v2);
    const v1 = JSON.parse(localStorage.getItem("firewallPortalProgressV1"));
    return v1 ? Object.assign(defaultState(), v1) : defaultState();
  } catch { return defaultState(); }
}
function saveState(){
  localStorage.setItem(KEY, JSON.stringify(state));
  updateProgress();
  renderNav($("searchInput").value);
  renderBookmarks();
}
function progress(){
  const done = sessions.filter(s => state.completed[s.id]).length;
  return {done, pct: Math.round(done/sessions.length*100)};
}
function updateProgress(){
  const p = progress();
  $("progressText").textContent = `${p.pct}%`;
  $("progressBar").style.width = `${p.pct}%`;
  $("completedText").textContent = `${p.done} of ${sessions.length} sessions completed`;
  $("packetBest").textContent = `${state.packetBest || 0}%`;
}
function renderNav(filter=""){
  nav.innerHTML="";
  const f = filter.toLowerCase().trim();
  for(let w=1; w<=12; w++){
    const subset=sessions.filter(s=>s.week===w && (!f || `${s.title} ${s.phase}`.toLowerCase().includes(f)));
    if(!subset.length) continue;
    const h=document.createElement("div");
    h.className="week-title";
    h.textContent=`Week ${w} · ${subset[0].phase}`;
    nav.appendChild(h);
    subset.forEach(s=>{
      const b=document.createElement("button");
      b.className=`nav-session ${state.completed[s.id]?"done":""} ${currentId===s.id?"active":""}`;
      b.innerHTML=`<span>${state.bookmarks[s.id]?"★":""}</span>D${s.day} · ${s.title}`;
      b.onclick=()=>openLesson(s.id);
      nav.appendChild(b);
    });
  }
}

function setView(name){
  currentView=name;
  currentId = name === "lesson" ? currentId : null;
  document.querySelectorAll(".view-panel").forEach(el=>el.classList.add("hidden"));
  const target = name === "dashboard" ? $("dashboard") : name === "practice" ? $("practiceView") : name === "bookmarks" ? $("bookmarksView") : name === "glossary" ? $("glossaryView") : $("lessonView");
  target.classList.remove("hidden");
  document.querySelectorAll(".nav-pill").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  if(name==="bookmarks") renderBookmarks();
  if(name==="glossary") renderGlossary($("glossarySearch").value || "");
  renderNav($("searchInput").value);
  window.scrollTo({top:0,behavior:"smooth"});
}
function showDashboard(){ setView("dashboard"); }

function openLesson(id){
  const s=sessions.find(x=>x.id===id); if(!s) return;
  currentId=id;
  $("lessonMeta").textContent=`WEEK ${s.week} · DAY ${s.day} · ${s.phase.toUpperCase()}`;
  $("lessonTitle").textContent=s.title;
  $("lessonGoal").textContent=s.goal;
  $("watchTarget").textContent=s.watch;
  $("videoFrame").src=s.video;
  $("resourceLinks").innerHTML=s.links.map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join("");
  $("objectives").innerHTML=s.objectives.map(x=>`<li>${x}</li>`).join("");
  $("concepts").innerHTML=s.concepts.map(([h,p])=>`<div class="concept"><h4>${h}</h4><p>${p}</p></div>`).join("");
  $("packetFlow").textContent=s.packetFlow;
  $("labSteps").innerHTML=s.lab.map(x=>`<li>${x}</li>`).join("");
  $("troubleshooting").textContent=s.troubleshooting;
  $("troubleshootingSteps").innerHTML=s.troubleshootingSteps.map(x=>`<li>${x}</li>`).join("");
  $("faqs").innerHTML=s.faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join("");
  renderQuiz(s);
  $("assignmentText").textContent=s.assignment;
  $("assignmentInput").value=state.assignments[id]||"";
  $("notesInput").value=state.notes[id]||"";
  refreshLessonButtons();
  $("prevBtn").disabled=id===sessions[0].id;
  $("nextBtn").disabled=id===sessions[sessions.length-1].id;
  setView("lesson");
  currentId=id;
  renderNav($("searchInput").value);
}
function refreshLessonButtons(){
  if(!currentId) return;
  $("completeBtn").textContent=state.completed[currentId]?"✓ Completed":"Mark Complete";
  $("completeBtn").className=`btn ${state.completed[currentId]?"secondary":"primary"}`;
  $("bookmarkBtn").textContent=state.bookmarks[currentId]?"★ Bookmarked":"☆ Bookmark";
  $("bookmarkBtn").className=`btn ${state.bookmarks[currentId]?"bookmark-active":"secondary"}`;
}
function renderQuiz(s){
  const form=$("quizForm"); form.innerHTML="";
  s.quiz.forEach((q,i)=>{
    const div=document.createElement("div"); div.className="quiz-q";
    div.innerHTML=`<p>${i+1}. ${q.question}</p>`+q.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${o}</label>`).join("")+`<small id="exp${i}"></small>`;
    form.appendChild(div);
  });
  $("quizResult").textContent = state.quiz[s.id] !== undefined ? `Previous: ${state.quiz[s.id]}/${s.quiz.length}` : "";
}

function renderBookmarks(){
  const list=$("bookmarkList");
  const items=sessions.filter(s=>state.bookmarks[s.id]);
  if(!items.length){ list.innerHTML=`<div class="empty-state"><div>☆</div><h3>No bookmarks yet</h3><p>Open any lesson and tap <b>Bookmark</b> to build your revision queue.</p></div>`; return; }
  list.innerHTML=items.map(s=>`<button class="review-card" data-id="${s.id}"><span class="eyebrow">WEEK ${s.week} · ${s.phase}</span><h3>${s.title}</h3><p>${s.goal}</p><small>${state.completed[s.id]?"✓ Completed":"Continue learning"}</small></button>`).join("");
  list.querySelectorAll(".review-card").forEach(b=>b.onclick=()=>openLesson(Number(b.dataset.id)));
}

function renderGlossary(filter=""){
  const f=filter.toLowerCase().trim();
  const items=window.FW_GLOSSARY.filter(([t,d])=>!f || `${t} ${d}`.toLowerCase().includes(f));
  $("glossaryList").innerHTML=items.length ? items.map(([t,d])=>`<article class="glossary-card"><h3>${t}</h3><p>${d}</p></article>`).join("") : `<div class="empty-state"><h3>No matching term</h3><p>Try a broader keyword.</p></div>`;
}

let simScenarioIndex=0, simStep=0, simCorrect=0, simAnswered=false;
function initSimulator(){
  const sel=$("scenarioSelect");
  sel.innerHTML=window.FW_PACKET_SCENARIOS.map((s,i)=>`<option value="${i}">${s.name}</option>`).join("");
  sel.onchange=()=>{simScenarioIndex=Number(sel.value);startScenario();};
  $("restartScenarioBtn").onclick=startScenario;
  $("simNextBtn").onclick=nextSimStep;
  startScenario();
}
function startScenario(){
  simStep=0; simCorrect=0; simAnswered=false;
  $("evidenceLog").innerHTML=`<p class="hint">Evidence appears as you make decisions.</p>`;
  $("simNextBtn").onclick=nextSimStep;
  drawNetwork(); renderSimStep();
}
function drawNetwork(activeIndex=-1){
  const s=window.FW_PACKET_SCENARIOS[simScenarioIndex];
  $("networkCanvas").innerHTML=`<div class="scenario-subtitle">${s.subtitle}</div><div class="network-row">${s.nodes.map((n,i)=>`<div class="net-wrap"><div class="net-node ${i<=activeIndex?"active":""}"><span>${nodeIcon(n)}</span><strong>${n}</strong></div>${i<s.nodes.length-1?`<div class="net-link ${i<activeIndex?"active":""}"><span>→</span></div>`:""}</div>`).join("")}</div>`;
}
function nodeIcon(n){
  const x=n.toLowerCase();
  if(x.includes("firewall")) return "🛡";
  if(x.includes("switch")) return "⇄";
  if(x.includes("server")) return "▣";
  if(x.includes("internet")) return "◎";
  return "▰";
}
function renderSimStep(){
  const s=window.FW_PACKET_SCENARIOS[simScenarioIndex];
  const step=s.steps[simStep];
  if(!step){ finishScenario(); return; }
  simAnswered=false;
  $("simStepBadge").textContent=`STEP ${simStep+1}`;
  $("simProgressText").textContent=`${simStep+1} of ${s.steps.length}`;
  $("simQuestion").textContent=step.q;
  $("simContext").textContent=step.context;
  $("simFeedback").className="sim-feedback hidden";
  $("simFeedback").innerHTML="";
  $("simNextBtn").disabled=true;
  $("simNextBtn").textContent=simStep===s.steps.length-1?"Finish Scenario":"Next Step →";
  $("simScore").textContent=`${simCorrect} / ${simStep}`;
  $("simOptions").innerHTML=step.options.map((o,i)=>`<button class="sim-option" data-i="${i}"><span>${String.fromCharCode(65+i)}</span>${o}</button>`).join("");
  $("simOptions").querySelectorAll(".sim-option").forEach(b=>b.onclick=()=>answerSim(Number(b.dataset.i)));
  drawNetwork(Math.min(simStep, s.nodes.length-1));
}
function answerSim(choice){
  if(simAnswered) return;
  simAnswered=true;
  const s=window.FW_PACKET_SCENARIOS[simScenarioIndex];
  const step=s.steps[simStep];
  const correct=choice===step.answer;
  if(correct) simCorrect++;
  $("simOptions").querySelectorAll(".sim-option").forEach((b,i)=>{
    b.disabled=true;
    if(i===step.answer) b.classList.add("correct-option");
    else if(i===choice) b.classList.add("wrong-option");
  });
  const fb=$("simFeedback");
  fb.className=`sim-feedback ${correct?"ok":"bad"}`;
  fb.innerHTML=`<strong>${correct?"✓ Correct":"✗ Not quite"}</strong><p>${step.explain}</p>`;
  $("simNextBtn").disabled=false;
  $("simScore").textContent=`${simCorrect} / ${simStep+1}`;
  const log=$("evidenceLog");
  const row=document.createElement("div"); row.className="evidence-item"; row.innerHTML=`<span>${simStep+1}</span><p>${step.evidence}</p>`; log.appendChild(row);
}
function nextSimStep(){ simStep++; renderSimStep(); }
function finishScenario(){
  const s=window.FW_PACKET_SCENARIOS[simScenarioIndex];
  const pct=Math.round(simCorrect/s.steps.length*100);
  if(pct>(state.packetBest||0)){state.packetBest=pct;saveState();}
  $("simStepBadge").textContent="COMPLETE";
  $("simProgressText").textContent=`${s.steps.length} steps`;
  $("simQuestion").textContent=pct>=80?"Strong packet-flow thinking.":"Good attempt—repeat it and explain each decision aloud.";
  $("simContext").textContent=`Final score: ${simCorrect}/${s.steps.length} (${pct}%). Best score: ${state.packetBest||pct}%.`;
  $("simOptions").innerHTML=`<div class="result-meter"><div style="width:${pct}%"></div></div>`;
  $("simFeedback").className="sim-feedback ok";
  $("simFeedback").innerHTML=`<strong>${pct>=80?"Ready to move on":"Repeat recommended"}</strong><p>The goal is not memorising the answer. You should be able to justify every hop using subnet, ARP, routing, policy, NAT and state.</p>`;
  $("simNextBtn").disabled=false; $("simNextBtn").textContent="Run Again"; $("simNextBtn").onclick=()=>{ startScenario(); };
  drawNetwork(s.nodes.length-1);
}

$("gradeQuizBtn").onclick=()=>{
  const s=sessions.find(x=>x.id===currentId); if(!s) return;
  let score=0;
  s.quiz.forEach((q,i)=>{
    const choice=document.querySelector(`input[name="q${i}"]:checked`);
    const exp=$(`exp${i}`);
    if(choice && Number(choice.value)===q.answer){score++; exp.className="correct"; exp.textContent=` ✓ Correct — ${q.explain}`;}
    else {exp.className="wrong"; exp.textContent=` ✗ ${q.explain}`;}
  });
  state.quiz[s.id]=score; saveState(); $("quizResult").textContent=`Score: ${score}/${s.quiz.length}`;
};
$("completeBtn").onclick=()=>{ if(!currentId)return; state.completed[currentId]=!state.completed[currentId]; saveState(); refreshLessonButtons(); };
$("bookmarkBtn").onclick=()=>{ if(!currentId)return; state.bookmarks[currentId]=!state.bookmarks[currentId]; saveState(); refreshLessonButtons(); };
$("notesInput").addEventListener("input",()=>{ if(!currentId)return; state.notes[currentId]=$("notesInput").value; saveState(); flash("notesSaved"); });
$("assignmentInput").addEventListener("input",()=>{ if(!currentId)return; state.assignments[currentId]=$("assignmentInput").value; saveState(); flash("assignmentSaved"); });
function flash(id){ $(id).textContent="Saved locally"; clearTimeout($(id)._t); $(id)._t=setTimeout(()=>$(id).textContent="",900); }
$("prevBtn").onclick=()=>openLesson(Math.max(1,currentId-1));
$("nextBtn").onclick=()=>openLesson(Math.min(sessions.length,currentId+1));
$("homeBtn").onclick=showDashboard;
$("practiceHomeBtn").onclick=showDashboard;
$("bookmarksHomeBtn").onclick=showDashboard;
$("glossaryHomeBtn").onclick=showDashboard;
$("lessonPracticeBtn").onclick=()=>setView("practice");
$("continueBtn").onclick=$("quickContinue").onclick=()=>{ const next=sessions.find(s=>!state.completed[s.id])||sessions[0]; openLesson(next.id); };
$("heroPracticeBtn").onclick=$("quickPractice").onclick=()=>setView("practice");
$("quickBookmarks").onclick=()=>setView("bookmarks");
$("quickGlossary").onclick=()=>setView("glossary");
$("brandHome").onclick=showDashboard;
$("brandHome").onkeydown=e=>{if(e.key==="Enter"||e.key===" ")showDashboard();};
document.querySelectorAll(".nav-pill").forEach(b=>b.onclick=()=>setView(b.dataset.view));
$("searchInput").addEventListener("input",e=>renderNav(e.target.value));
$("glossarySearch").addEventListener("input",e=>renderGlossary(e.target.value));

$("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="firewall-learning-progress.json"; a.click(); URL.revokeObjectURL(a.href);
};
$("importInput").addEventListener("change",async(e)=>{
  const f=e.target.files[0]; if(!f)return;
  try{const obj=JSON.parse(await f.text()); state=Object.assign(defaultState(),obj.state||obj); saveState(); if(currentId)openLesson(currentId); alert("Progress imported.");}
  catch{alert("Invalid progress file.");}
  e.target.value="";
});
$("resetBtn").onclick=()=>{
  if(confirm("Reset all local progress, bookmarks, notes, assignment answers, quiz scores and simulator best score?")){localStorage.removeItem(KEY);state=defaultState();showDashboard();saveState();}
};

updateProgress(); renderNav(); renderBookmarks(); renderGlossary(); initSimulator(); setView("dashboard");
