/* Firewall Learning Portal — Reader UI v3
   Presentation/enhancement layer. Existing course logic remains untouched. */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const UI_KEY = 'firewallReaderUiV3';
  let ui = loadUi();
  let lastLessonId = null;
  let tocObserver = null;

  function loadUi(){
    try{return Object.assign({theme:'light',focus:false},JSON.parse(localStorage.getItem(UI_KEY))||{});}catch{return {theme:'light',focus:false};}
  }
  function saveUi(){localStorage.setItem(UI_KEY,JSON.stringify(ui));}
  function courseState(){
    try{return JSON.parse(localStorage.getItem('firewallPortalProgressV2'))||{};}catch{return {};}
  }
  function sessions(){return window.COURSE_SESSIONS||[];}
  function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  function init(){
    document.body.classList.add('reader-v3');
    applyTheme();
    buildHeader();
    buildMobileOverlay();
    simplifyDashboard();
    transformLesson();
    wireContextualTools();
    updateHeaderProgress();
    setupReadingProgress();
    setupLessonWatcher();
    setupEscapeHandling();
  }

  function applyTheme(){
    document.body.classList.toggle('dark-study',ui.theme==='dark');
    document.body.classList.toggle('focus-reading',!!ui.focus);
    const themeBtn=$('readerThemeBtn');
    if(themeBtn) themeBtn.textContent=ui.theme==='dark'?'☀':'☾';
    const focusBtn=$('readerFocusBtn');
    if(focusBtn) focusBtn.textContent=ui.focus?'Exit focus':'Focus mode';
  }

  function buildHeader(){
    const header=document.querySelector('.topbar');
    if(!header||$('readerHeaderActions')) return;

    const brandTitle=header.querySelector('.brand h1');
    const brandSub=header.querySelector('.brand p');
    if(brandTitle) brandTitle.textContent='Firewall Engineer Path';
    if(brandSub) brandSub.textContent='Learn → Practise → Troubleshoot';

    const actions=document.createElement('div');
    actions.id='readerHeaderActions';
    actions.className='reader-header-actions';
    actions.innerHTML=`
      <button id="readerCourseBtn" class="reader-course-btn" type="button">☰ <span>Course</span></button>
      <span id="readerProgressChip" class="reader-progress-chip"><b>0%</b> complete</span>
      <div class="reader-tools-wrap">
        <button id="readerToolsBtn" class="reader-tools-btn" type="button">Practice <span>⌄</span></button>
        <div id="readerToolsMenu" class="reader-tools-menu hidden" role="menu">
          <button type="button" data-reader-view="practice"><span>◎</span><span>Guided Packet Lab<small class="tool-desc">Step-by-step packet decisions</small></span></button>
          <button type="button" data-reader-view="engine"><span>⚙</span><span>Packet Engine<small class="tool-desc">Build and trace a real flow</small></span></button>
          <button type="button" data-reader-view="troubleshoot"><span>⌁</span><span>Troubleshooting<small class="tool-desc">Evidence-driven incidents</small></span></button>
          <div class="reader-tools-divider"></div>
          <button type="button" data-reader-view="bookmarks"><span>☆</span><span>Bookmarks</span></button>
          <button type="button" data-reader-view="glossary"><span>A↔Z</span><span>Glossary</span></button>
          <div class="reader-tools-divider"></div>
          <button type="button" id="readerExportBtn"><span>⇩</span><span>Export progress</span></button>
          <button type="button" id="readerImportBtn"><span>⇧</span><span>Import progress</span></button>
        </div>
      </div>
      <button id="readerThemeBtn" class="reader-icon-btn" type="button" title="Toggle study theme">☾</button>
    `;
    header.appendChild(actions);

    $('readerToolsBtn').onclick=e=>{e.stopPropagation();$('readerToolsMenu').classList.toggle('hidden');};
    actions.querySelectorAll('[data-reader-view]').forEach(b=>b.onclick=()=>{
      $('readerToolsMenu').classList.add('hidden');
      rememberCurrentLesson();
      if(typeof window.setView==='function') window.setView(b.dataset.readerView);
      injectReturnToLesson(b.dataset.readerView);
    });
    $('readerThemeBtn').onclick=()=>{ui.theme=ui.theme==='dark'?'light':'dark';saveUi();applyTheme();};
    $('readerCourseBtn').onclick=toggleMobileCourse;
    $('readerExportBtn').onclick=()=>{$('readerToolsMenu').classList.add('hidden');$('exportBtn')?.click();};
    $('readerImportBtn').onclick=()=>{$('readerToolsMenu').classList.add('hidden');$('importInput')?.click();};
    document.addEventListener('click',e=>{if(!$('readerToolsMenu')?.contains(e.target)&&e.target!==$('readerToolsBtn')) $('readerToolsMenu')?.classList.add('hidden');});

    const brand=$('brandHome');
    if(brand) brand.title='Back to learning path';
    applyTheme();
  }

  function buildMobileOverlay(){
    if($('readerMobileOverlay')) return;
    const overlay=document.createElement('div');
    overlay.id='readerMobileOverlay';overlay.className='reader-mobile-overlay';
    overlay.onclick=closeMobileCourse;
    document.body.appendChild(overlay);
  }
  function toggleMobileCourse(){document.querySelector('.sidebar')?.classList.toggle('mobile-open');$('readerMobileOverlay')?.classList.toggle('open');}
  function closeMobileCourse(){document.querySelector('.sidebar')?.classList.remove('mobile-open');$('readerMobileOverlay')?.classList.remove('open');}

  function simplifyDashboard(){
    const dash=$('dashboard'); if(!dash||$('readerNextCard')) return;
    const state=courseState();
    const next=sessions().find(s=>!(state.completed||{})[s.id])||sessions()[0];
    if(!next) return;
    const card=document.createElement('button');
    card.id='readerNextCard';
    card.type='button';
    card.style.cssText='width:100%;text-align:left;border:1px solid var(--study-line);background:var(--study-surface);border-radius:12px;padding:18px 20px;margin:20px 0 4px;cursor:pointer;color:var(--study-text);display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;';
    card.innerHTML=`<div><span style="display:block;color:var(--study-blue);font-size:10px;font-weight:800;letter-spacing:.08em;margin-bottom:6px">CONTINUE · WEEK ${next.week} / DAY ${next.day}</span><strong style="display:block;font-size:19px;margin-bottom:5px">${escapeHtml(next.title)}</strong><span style="color:var(--study-muted);font-size:12px;line-height:1.45">${escapeHtml(next.goal)}</span></div><span style="font-size:22px;color:var(--study-blue)">→</span>`;
    card.onclick=()=>{if(typeof window.openLesson==='function') window.openLesson(next.id); else $('continueBtn')?.click();};
    const hero=dash.querySelector('.hero');
    hero?.insertAdjacentElement('afterend',card);
  }

  function transformLesson(){
    const lesson=$('lessonView'); if(!lesson||lesson.querySelector('.lesson-layout-v3')) return;

    const head=lesson.querySelector('.lesson-head');
    const oldGrid=lesson.querySelector('.lesson-grid');
    const video=lesson.querySelector('.video-panel');
    const objectives=$('objectives')?.closest('.panel');
    const concepts=$('concepts')?.closest('.panel');
    const packet=$('packetFlow')?.closest('.panel');
    const lab=$('labSteps')?.closest('.panel');
    const trouble=$('troubleshooting')?.closest('.panel');
    const faq=$('faqs')?.closest('.panel');
    const quiz=$('quizForm')?.closest('.panel');
    const assignment=$('assignmentInput')?.closest('.panel');
    const notes=$('notesInput')?.closest('.panel');
    const nav=lesson.querySelector('.lesson-nav');

    const shell=document.createElement('div'); shell.className='lesson-layout-v3';
    const reader=document.createElement('main'); reader.className='lesson-reader';
    const rail=document.createElement('aside'); rail.className='lesson-rail'; rail.setAttribute('aria-label','Lesson navigation');

    const order=[head,objectives,concepts,packet,video,lab,trouble,faq,quiz,assignment,notes,nav].filter(Boolean);
    order.forEach(el=>reader.appendChild(el));
    if(oldGrid&&oldGrid.parentNode) oldGrid.remove();

    shell.append(reader,rail); lesson.appendChild(shell);

    configureSection(objectives,'lesson-objectives','01 · Start here','Learning objectives');
    configureSection(concepts,'lesson-understand','02 · Read','Understand the concept');
    configureSection(packet,'lesson-visualize','03 · See it','Packet flow');
    configureSection(video,'lesson-watch','04 · Watch','Recommended video');
    configureSection(lab,'lesson-practice','05 · Do','Hands-on lab');
    configureSection(trouble,'lesson-breakfix','06 · Break / Fix','Troubleshooting');
    configureSection(faq,'lesson-faq','07 · Clarify','FAQ');
    configureSection(quiz,'lesson-check','08 · Check','Checkpoint');
    configureSection(assignment,'lesson-assignment','09 · Apply','Assignment');
    configureSection(notes,'lesson-notes','10 · Capture','My notes');

    prepareVideoPanel(video);
    appendPracticeCallout(packet);
    appendBreakFixCallout(trouble);
    buildLessonRail(rail);
  }

  function configureSection(panel,id,kicker,label){
    if(!panel) return;
    panel.id=id;
    panel.dataset.tocLabel=label;
    if(panel.querySelector('.reader-section-kicker')) return;
    const k=document.createElement('span');
    k.className='reader-section-kicker eyebrow';
    k.textContent=kicker;
    const anchor=panel.querySelector('.section-head')||panel.querySelector('h3');
    if(anchor) panel.insertBefore(k,anchor);
  }

  function prepareVideoPanel(video){
    if(!video||video.querySelector('.video-toggle')) return;
    video.classList.add('video-collapsed');
    const btn=document.createElement('button');
    btn.type='button';btn.className='btn secondary video-toggle';btn.textContent='▶ Show selected video';
    const wrap=video.querySelector('.video-wrap');
    if(wrap) video.insertBefore(btn,wrap);
    btn.onclick=()=>{
      const collapsed=video.classList.toggle('video-collapsed');
      btn.textContent=collapsed?'▶ Show selected video':'▾ Hide video';
      if(!collapsed) setTimeout(()=>wrap?.scrollIntoView({behavior:'smooth',block:'center'}),60);
    };
  }

  function appendPracticeCallout(packet){
    if(!packet||packet.querySelector('.reader-callout.practice')) return;
    const c=document.createElement('div');c.className='reader-callout practice';
    c.innerHTML=`<span class="reader-callout-icon">🔧</span><div><strong>Practise this idea</strong><p>Use the guided lab when you want coaching, or the Packet Engine when you want to experiment freely.</p><div class="reader-callout-actions"><button type="button" data-tool="practice">Guided Packet Lab</button><button type="button" data-tool="engine">Open Packet Engine</button></div></div>`;
    packet.appendChild(c);
  }
  function appendBreakFixCallout(trouble){
    if(!trouble||trouble.querySelector('.reader-callout.breakfix')) return;
    const c=document.createElement('div');c.className='reader-callout breakfix';
    c.innerHTML=`<span class="reader-callout-icon">🧪</span><div><strong>Ready for an incident?</strong><p>Use the troubleshooting simulator after you can explain the expected packet path without looking at the answer.</p><div class="reader-callout-actions"><button type="button" data-tool="troubleshoot">Open Troubleshooting Simulator</button></div></div>`;
    trouble.appendChild(c);
  }

  function wireContextualTools(){
    document.addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-tool]');
      if(!btn) return;
      rememberCurrentLesson();
      if(typeof window.setView==='function') window.setView(btn.dataset.tool);
      injectReturnToLesson(btn.dataset.tool);
    });
  }

  function currentSessionId(){
    const title=$('lessonTitle')?.textContent?.trim();
    if(!title) return null;
    return sessions().find(s=>s.title===title)?.id||null;
  }
  function rememberCurrentLesson(){const id=currentSessionId();if(id) lastLessonId=id;}

  function buildLessonRail(rail){
    if(!rail) return;
    const sections=[...document.querySelectorAll('#lessonView .lesson-reader [data-toc-label]')];
    rail.innerHTML=`<div class="lesson-rail-card"><h4>On this page</h4><nav>${sections.map(s=>`<a href="#${s.id}" data-toc="${s.id}">${escapeHtml(s.dataset.tocLabel)}</a>`).join('')}</nav><div class="lesson-rail-actions"><button id="readerFocusBtn" type="button">${ui.focus?'Exit focus':'Focus mode'}</button><button type="button" data-rail-jump="lesson-notes">Open notes</button><button type="button" data-rail-jump="lesson-assignment">Assignment</button></div></div>`;
    rail.querySelectorAll('[data-rail-jump]').forEach(b=>b.onclick=()=>$(b.dataset.railJump)?.scrollIntoView({behavior:'smooth',block:'start'}));
    $('readerFocusBtn').onclick=()=>{ui.focus=!ui.focus;saveUi();applyTheme();};
    setupTocObserver();
  }

  function setupTocObserver(){
    tocObserver?.disconnect();
    const links=[...document.querySelectorAll('.lesson-rail [data-toc]')];
    const sections=links.map(a=>$(a.dataset.toc)).filter(Boolean);
    if(!('IntersectionObserver' in window)||!sections.length) return;
    tocObserver=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if(!visible) return;
      links.forEach(a=>a.classList.toggle('active',a.dataset.toc===visible.target.id));
    },{rootMargin:'-20% 0px -70% 0px',threshold:[0,.1,1]});
    sections.forEach(s=>tocObserver.observe(s));
  }

  function setupLessonWatcher(){
    const title=$('lessonTitle'); if(!title) return;
    const mo=new MutationObserver(()=>{
      closeMobileCourse();
      rememberCurrentLesson();
      updateHeaderProgress();
      const rail=document.querySelector('.lesson-rail');
      if(rail) buildLessonRail(rail);
      window.setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),30);
    });
    mo.observe(title,{childList:true,subtree:true,characterData:true});

    const completed=$('completedText');
    if(completed){new MutationObserver(updateHeaderProgress).observe(completed,{childList:true,subtree:true,characterData:true});}
  }

  function updateHeaderProgress(){
    const text=$('progressText')?.textContent?.trim()||'0%';
    const chip=$('readerProgressChip'); if(chip) chip.innerHTML=`<b>${escapeHtml(text)}</b> complete`;
  }

  function setupReadingProgress(){
    if($('readerScrollProgress')) return;
    const p=document.createElement('div');p.id='readerScrollProgress';p.className='reader-scroll-progress';p.innerHTML='<div></div>';document.body.appendChild(p);
    const update=()=>{
      const lesson=$('lessonView');
      if(!lesson||lesson.classList.contains('hidden')){p.firstElementChild.style.width='0%';return;}
      const rect=lesson.getBoundingClientRect();
      const total=Math.max(1,lesson.scrollHeight-window.innerHeight+110);
      const passed=Math.max(0,Math.min(total,64-rect.top));
      p.firstElementChild.style.width=`${Math.round(passed/total*100)}%`;
    };
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update,{passive:true});
    update();
  }

  function injectReturnToLesson(view){
    if(!lastLessonId) return;
    const map={practice:'practiceView',engine:'engineView',troubleshoot:'troubleshootView'};
    const root=$(map[view]); if(!root) return;
    let btn=root.querySelector('.reader-return-btn');
    if(btn) return;
    btn=document.createElement('button');btn.type='button';btn.className='btn secondary reader-return-btn';btn.textContent='← Return to lesson';
    btn.style.marginBottom='16px';
    btn.onclick=()=>{if(typeof window.openLesson==='function') window.openLesson(lastLessonId);};
    root.insertBefore(btn,root.firstChild);
  }

  function setupEscapeHandling(){
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){
        closeMobileCourse();
        $('readerToolsMenu')?.classList.add('hidden');
      }
      if((e.key==='f'||e.key==='F')&&(e.ctrlKey||e.metaKey)){
        const target=e.target;
        if(target&&['INPUT','TEXTAREA'].includes(target.tagName)) return;
        e.preventDefault();ui.focus=!ui.focus;saveUi();applyTheme();
      }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
