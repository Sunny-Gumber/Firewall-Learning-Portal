/* Firewall Learning Portal — Study Flow v4
   Turns curated Week 1 guides into a calm, single-column learning sequence. */
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  let rendering=false;
  let checkState={};
  let activeVideo={};

  const moduleLabels={
    1:'MODULE 1 · PACKET & IP',
    2:'MODULE 2 · TCP/IP SERVICES',
    3:'MODULE 3 · VLAN, ROUTING & NAT',
    4:'FORTIGATE · FUNDAMENTALS',
    5:'FORTIGATE · POLICY & SECURITY',
    6:'FORTIGATE · VPN & TROUBLESHOOTING',
    7:'PALO ALTO · FUNDAMENTALS',
    8:'PALO ALTO · POLICY & APP-ID',
    9:'PALO ALTO · ADVANCED',
    10:'CHECK POINT · FUNDAMENTALS',
    11:'CHECK POINT · ADVANCED',
    12:'MASTERCLASS · MULTI-VENDOR'
  };

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmt(sec){const m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`;}
  function duration(a,b){const sec=Math.max(0,b-a);const m=Math.floor(sec/60),s=sec%60;return s?`${m}m ${s}s`:`${m} min`;}
  function currentSession(){
    const title=$('lessonTitle')?.textContent?.trim();
    return (window.COURSE_SESSIONS||[]).find(s=>s.title===title)||null;
  }

  function readingBlock(x){
    const tag=String(x.tag||'MUST').toLowerCase();
    return `<article class="study-reading-block"><div class="study-reading-meta"><span class="study-priority ${tag}">${esc(x.tag)}</span></div><h5>${esc(x.title)}</h5><p>${esc(x.body)}</p></article>`;
  }

  function topology(){
    return `<div class="study-topology" aria-label="Packet journey example"><div class="study-topology-label">Example packet path</div><div class="study-topology-row"><div class="study-node"><strong>PC</strong><small>192.168.1.10/24</small></div><span class="study-arrow">→</span><div class="study-node"><strong>Switch</strong><small>Layer 2</small></div><span class="study-arrow">→</span><div class="study-node"><strong>Firewall</strong><small>192.168.1.1</small></div><span class="study-arrow">→</span><div class="study-node"><strong>Internet</strong><small>Routed path</small></div><span class="study-arrow">→</span><div class="study-node"><strong>Web Server</strong><small>Remote IP</small></div></div></div>`;
  }

  function thinkingCheck(id){
    if(Number(id)!==1) return '';
    const state=checkState[id];
    let feedback='';
    if(state==='correct') feedback=`<div class="study-check-feedback"><strong>Correct.</strong> 8.8.8.8 is outside 192.168.1.0/24, so the PC treats it as remote and sends the Ethernet frame to its default gateway.</div>`;
    if(state==='wrong') feedback=`<div class="study-check-feedback"><strong>Not quite.</strong> Compare 8.8.8.8 with 192.168.1.0/24. It is outside the local subnet, so the next Layer-2 hop is the default gateway.</div>`;
    return `<div class="study-check"><span class="study-check-label">Check your thinking</span><h5>PC 192.168.1.10/24 wants to reach 8.8.8.8. Is 8.8.8.8 local?</h5><p>Answer before continuing. This local-vs-remote decision drives what the PC does next.</p><div class="study-check-options"><button type="button" class="study-check-option ${state==='wrong'?'wrong':''}" data-study-answer="wrong" data-study-id="1">Yes — send directly</button><button type="button" class="study-check-option ${state==='correct'?'correct':''}" data-study-answer="correct" data-study-id="1">No — use the default gateway</button></div>${feedback}</div>`;
  }

  function videosHtml(data,id){
    const active=activeVideo[id];
    const player=active?`<div class="study-inline-player"><div class="study-inline-player-head"><strong>${esc(active.label)}</strong><span>${fmt(active.start)}–${fmt(active.end)}</span></div><iframe src="https://www.youtube.com/embed/${encodeURIComponent(active.videoId)}?start=${Number(active.start)}&end=${Number(active.end)}&autoplay=1&rel=0" title="Tagged training video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`:'';
    return `${player}<div class="study-video-list">${data.videos.map(v=>{const tag=String(v.tag||'MUST').toLowerCase();return `<article class="study-video-item"><div class="study-video-top"><span class="study-priority ${tag}">${esc(v.tag)} KNOW</span><span class="study-time">${fmt(v.start)} → ${fmt(v.end)}</span><span class="study-duration">${duration(v.start,v.end)}</span></div><h5>${esc(v.label)}</h5><div class="study-video-source">${esc(v.source)}</div><p>${esc(v.focus)}</p><div class="study-video-actions"><button type="button" class="study-play" data-study-video="${esc(v.videoId)}" data-study-start="${Number(v.start)}" data-study-end="${Number(v.end)}" data-study-label="${esc(v.label)}" data-study-id="${Number(id)}">▶ Watch this part</button><a class="study-open" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.videoId)}&t=${Number(v.start)}s" target="_blank" rel="noopener">Open on YouTube ↗</a></div></article>`;}).join('')}</div>`;
  }

  function commandsHtml(data){
    return `<div class="study-command-list">${data.commands.map((c,i)=>`<div class="study-command"><span>${String(i+1).padStart(2,'0')}</span><code>${esc(c)}</code></div>`).join('')}</div>`;
  }

  function renderGuide(force=false){
    const session=currentSession();
    const panel=$('studyGuidePanel');
    if(!session||!panel) return;
    const data=window.FW_STUDY_CONTENT?.[session.id];
    if(!data){restoreDuplicates();return;}
    if(!force&&panel.querySelector('.study-v4-intro')&&panel.dataset.studyV4===String(session.id)) return;
    if(rendering) return;
    rendering=true;

    const first=data.reading.slice(0,Number(session.id)===1?2:data.reading.length);
    const rest=Number(session.id)===1?data.reading.slice(2):[];
    panel.classList.remove('hidden');
    panel.classList.add('study-linear-panel');
    panel.dataset.studyV4=String(session.id);
    panel.innerHTML=`
      <div class="study-v4-intro">
        <div class="study-v4-kicker"><span>WEEK ${session.week} · SESSION ${session.day} · ${esc(session.phase)}</span><span class="study-v4-estimate">${esc(data.estimated)}</span></div>
        <h3>Study this lesson in one continuous flow</h3>
        <p>Read → think → watch only what matters → try the tools → continue into the lab and break/fix work.</p>
      </div>
      <div class="study-v4-outcome"><strong>Session outcome</strong>${esc(data.outcome)}</div>
      <div class="study-v4-prereq"><h4>Prerequisites</h4><ul>${data.prerequisites.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>

      <section id="study-v4-understand" class="study-v4-section">
        <div class="study-v4-step"><span class="study-v4-step-num">01 · UNDERSTAND</span><h4>Read first</h4><small>Build the mental model</small></div>
        ${first.map(readingBlock).join('')}
        ${Number(session.id)===1?topology():''}
        ${thinkingCheck(session.id)}
        ${rest.map(readingBlock).join('')}
      </section>

      <section id="study-v4-watch" class="study-v4-section">
        <div class="study-v4-step"><span class="study-v4-step-num">02 · WATCH</span><h4>Only the tagged parts</h4><small>Focused video, not the whole playlist</small></div>
        ${videosHtml(data,session.id)}
      </section>

      <section id="study-v4-try" class="study-v4-section">
        <div class="study-v4-step"><span class="study-v4-step-num">03 · TRY</span><h4>Prove it with tools</h4><small>Commands you should actually run</small></div>
        ${commandsHtml(data)}
      </section>

      <div class="study-teachback"><strong>Teach-back checkpoint</strong>${esc(data.teachBack)}</div>`;

    hideDuplicates();
    setTimeout(()=>{simplifyRail();simplifyModules();},0);
    rendering=false;
  }

  function hideDuplicates(){
    ['lesson-objectives','lesson-understand','lesson-watch'].forEach(id=>$(id)?.classList.add('study-duplicate-hidden'));
  }
  function restoreDuplicates(){
    ['lesson-objectives','lesson-understand','lesson-watch'].forEach(id=>$(id)?.classList.remove('study-duplicate-hidden'));
  }

  function simplifyRail(){
    const rail=document.querySelector('.lesson-rail-card');
    if(!rail) return;
    const session=currentSession();
    const hasGuide=!!window.FW_STUDY_CONTENT?.[session?.id];
    const nav=rail.querySelector('nav');
    if(nav){
      const links=hasGuide?[
        ['Understand','#study-v4-understand'],['Watch','#study-v4-watch'],['Practise','#lesson-practice'],['Break / Fix','#lesson-breakfix'],['Check','#lesson-check'],['Assignment','#lesson-assignment']
      ]:[
        ['Understand','#lesson-understand'],['Packet flow','#lesson-visualize'],['Practise','#lesson-practice'],['Break / Fix','#lesson-breakfix'],['Check','#lesson-check'],['Assignment','#lesson-assignment']
      ];
      nav.innerHTML=links.map(([label,href])=>`<a href="${href}">${label}</a>`).join('');
    }
    const actions=rail.querySelector('.lesson-rail-actions');
    if(actions&&!actions.querySelector('.rail-bookmark-v4')){
      const b=document.createElement('button');b.type='button';b.className='rail-bookmark-v4';b.textContent='☆ Bookmark lesson';
      b.onclick=()=>{$('bookmarkBtn')?.click();syncRailBookmark();};
      actions.insertBefore(b,actions.firstChild);
    }
    syncRailBookmark();
  }

  function syncRailBookmark(){
    const b=document.querySelector('.rail-bookmark-v4');
    const src=$('bookmarkBtn'); if(!b||!src) return;
    const on=src.textContent.includes('★');
    b.textContent=on?'★ Bookmarked':'☆ Bookmark lesson';
    b.classList.toggle('bookmarked',on);
  }

  function simplifyModules(){
    document.querySelectorAll('.week-title').forEach(el=>{
      const raw=el.textContent||'';
      const m=raw.match(/Week\s+(\d+)/i);
      if(m&&moduleLabels[Number(m[1])]){
        el.textContent=moduleLabels[Number(m[1])];
        el.classList.add('module-title-v4');
        el.dataset.week=String(m[1]);
      }
    });
  }

  function scheduleRender(){setTimeout(()=>renderGuide(true),0);setTimeout(()=>simplifyModules(),20);setTimeout(()=>simplifyRail(),40);}

  function bindGlobal(){
    document.addEventListener('click',e=>{
      const ans=e.target.closest?.('[data-study-answer]');
      if(ans){
        checkState[ans.dataset.studyId]=ans.dataset.studyAnswer;
        scheduleRender();
        return;
      }
      const play=e.target.closest?.('[data-study-video]');
      if(play){
        activeVideo[Number(play.dataset.studyId)]={videoId:play.dataset.studyVideo,start:Number(play.dataset.studyStart),end:Number(play.dataset.studyEnd),label:play.dataset.studyLabel};
        scheduleRender();
        setTimeout(()=>document.querySelector('.study-inline-player')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
      }
    },true);
  }

  function observe(){
    const panel=$('studyGuidePanel');
    if(panel){
      new MutationObserver(()=>{
        if(rendering) return;
        if(!panel.querySelector('.study-v4-intro')) scheduleRender();
      }).observe(panel,{childList:true,subtree:true});
    }
    const title=$('lessonTitle');
    if(title)new MutationObserver(scheduleRender).observe(title,{childList:true,subtree:true,characterData:true});
    const nav=$('courseNav');
    if(nav)new MutationObserver(()=>setTimeout(simplifyModules,0)).observe(nav,{childList:true,subtree:true});
    const bookmark=$('bookmarkBtn');
    if(bookmark)new MutationObserver(syncRailBookmark).observe(bookmark,{childList:true,subtree:true,characterData:true});
  }

  function init(){
    bindGlobal();
    simplifyModules();
    renderGuide(true);
    simplifyRail();
    observe();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
  else setTimeout(init,0);
})();
