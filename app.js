const sessions = window.COURSE_SESSIONS;
const KEY = "firewallPortalProgressV1";
let state = loadState();
let currentId = null;

const $ = (id) => document.getElementById(id);
const nav = $("courseNav");

function loadState(){
  try { return JSON.parse(localStorage.getItem(KEY)) || {completed:{},notes:{},assignments:{},quiz:{}}; }
  catch { return {completed:{},notes:{},assignments:{},quiz:{}}; }
}
function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); updateProgress(); renderNav($("searchInput").value); }
function progress(){
  const done = sessions.filter(s => state.completed[s.id]).length;
  return {done, pct: Math.round(done/sessions.length*100)};
}
function updateProgress(){
  const p = progress();
  $("progressText").textContent = `${p.pct}%`;
  $("progressBar").style.width = `${p.pct}%`;
  $("completedText").textContent = `${p.done} of ${sessions.length} sessions completed`;
}
function renderNav(filter=""){
  nav.innerHTML="";
  const f = filter.toLowerCase().trim();
  for(let w=1; w<=12; w++){
    const subset=sessions.filter(s=>s.week===w && (!f || `${s.title} ${s.phase}`.toLowerCase().includes(f)));
    if(!subset.length) continue;
    const h=document.createElement("div"); h.className="week-title"; h.textContent=`Week ${w} · ${subset[0].phase}`; nav.appendChild(h);
    subset.forEach(s=>{
      const b=document.createElement("button");
      b.className=`nav-session ${state.completed[s.id]?"done":""} ${currentId===s.id?"active":""}`;
      b.textContent=`D${s.day} · ${s.title}`;
      b.onclick=()=>openLesson(s.id); nav.appendChild(b);
    });
  }
}
function showDashboard(){
  currentId=null; $("dashboard").classList.remove("hidden"); $("lessonView").classList.add("hidden"); renderNav($("searchInput").value); window.scrollTo({top:0,behavior:"smooth"});
}
function openLesson(id){
  const s=sessions.find(x=>x.id===id); if(!s) return; currentId=id;
  $("dashboard").classList.add("hidden"); $("lessonView").classList.remove("hidden");
  $("lessonMeta").textContent=`WEEK ${s.week} · DAY ${s.day} · ${s.phase.toUpperCase()}`;
  $("lessonTitle").textContent=s.title; $("lessonGoal").textContent=s.goal;
  $("watchTarget").textContent=s.watch; $("videoFrame").src=s.video;
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
  $("completeBtn").textContent=state.completed[id]?"✓ Completed":"Mark Complete";
  $("completeBtn").className=`btn ${state.completed[id]?"secondary":"primary"}`;
  $("prevBtn").disabled=id===sessions[0].id; $("nextBtn").disabled=id===sessions[sessions.length-1].id;
  renderNav($("searchInput").value);
  window.scrollTo({top:0,behavior:"smooth"});
}
function renderQuiz(s){
  const form=$("quizForm"); form.innerHTML="";
  s.quiz.forEach((q,i)=>{
    const div=document.createElement("div"); div.className="quiz-q";
    div.innerHTML=`<p>${i+1}. ${q.question}</p>`+q.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${o}</label>`).join("")+`<small id="exp${i}"></small>`;
    form.appendChild(div);
  });
  $("quizResult").textContent = state.quiz[s.id] ? `Previous: ${state.quiz[s.id]}/${s.quiz.length}` : "";
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
$("completeBtn").onclick=()=>{ if(!currentId) return; state.completed[currentId]=!state.completed[currentId]; saveState(); openLesson(currentId); };
$("notesInput").addEventListener("input",()=>{ if(!currentId)return; state.notes[currentId]=$("notesInput").value; saveState(); flash("notesSaved"); });
$("assignmentInput").addEventListener("input",()=>{ if(!currentId)return; state.assignments[currentId]=$("assignmentInput").value; saveState(); flash("assignmentSaved"); });
function flash(id){ $(id).textContent="Saved locally"; clearTimeout($(id)._t); $(id)._t=setTimeout(()=>$(id).textContent="",900); }
$("prevBtn").onclick=()=>openLesson(Math.max(1,currentId-1));
$("nextBtn").onclick=()=>openLesson(Math.min(sessions.length,currentId+1));
$("homeBtn").onclick=showDashboard;
$("continueBtn").onclick=()=>{ const next=sessions.find(s=>!state.completed[s.id])||sessions[0]; openLesson(next.id); };
$("searchInput").addEventListener("input",e=>renderNav(e.target.value));
$("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="firewall-learning-progress.json"; a.click(); URL.revokeObjectURL(a.href);
};
$("importInput").addEventListener("change",async(e)=>{
  const f=e.target.files[0]; if(!f)return;
  try{const obj=JSON.parse(await f.text()); state=obj.state||obj; saveState(); if(currentId)openLesson(currentId); alert("Progress imported.");}
  catch{alert("Invalid progress file.");}
  e.target.value="";
});
$("resetBtn").onclick=()=>{
  if(confirm("Reset all local progress, notes, assignment answers and quiz scores?")){localStorage.removeItem(KEY);state=loadState();showDashboard();updateProgress();}
};
updateProgress(); renderNav();
