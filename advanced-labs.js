(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const ADV_KEY='firewallPortalAdvancedV1';
  let advState=loadAdv();
  function loadAdv(){try{return Object.assign({engineRuns:0,trBest:0,trCompleted:0},JSON.parse(localStorage.getItem(ADV_KEY))||{});}catch{return {engineRuns:0,trBest:0,trCompleted:0};}}
  function saveAdv(){localStorage.setItem(ADV_KEY,JSON.stringify(advState)); updateBadges();}
  function updateBadges(){ if($('engineRunsStat')) $('engineRunsStat').textContent=advState.engineRuns||0; if($('trBestStat')) $('trBestStat').textContent=`${advState.trBest||0}%`; }

  const baseSetView=window.setView;
  window.setView=function(name){
    if(name!=='engine'&&name!=='troubleshoot') return baseSetView(name);
    document.querySelectorAll('.view-panel').forEach(el=>el.classList.add('hidden'));
    const target=name==='engine'?$('engineView'):$('troubleshootView');
    if(target) target.classList.remove('hidden');
    document.querySelectorAll('.nav-pill').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const presets={
    https:{name:'HTTPS to Internet — working',source:'192.168.10.25',prefix:24,gateway:'192.168.10.1',ingress:'lan',dest:'8.8.8.8',proto:'TCP',sport:51544,dport:443,route:true,snat:true,policy:'web',dnat:false,inbound:true},
    ssh:{name:'SSH to Internet — policy blocked',source:'192.168.10.25',prefix:24,gateway:'192.168.10.1',ingress:'lan',dest:'8.8.8.8',proto:'TCP',sport:51545,dport:22,route:true,snat:true,policy:'web',dnat:false,inbound:true},
    noroute:{name:'Internet access — missing default route',source:'192.168.10.25',prefix:24,gateway:'192.168.10.1',ingress:'lan',dest:'1.1.1.1',proto:'TCP',sport:51546,dport:443,route:false,snat:true,policy:'allow',dnat:false,inbound:true},
    nonat:{name:'Internet access — SNAT disabled',source:'192.168.10.25',prefix:24,gateway:'192.168.10.1',ingress:'lan',dest:'8.8.8.8',proto:'TCP',sport:51547,dport:443,route:true,snat:false,policy:'allow',dnat:false,inbound:true},
    local:{name:'Same subnet — firewall bypassed',source:'192.168.10.25',prefix:24,gateway:'192.168.10.1',ingress:'lan',dest:'192.168.10.50',proto:'TCP',sport:51548,dport:443,route:true,snat:true,policy:'allow',dnat:false,inbound:true},
    dnat:{name:'Inbound DNAT — published HTTPS server',source:'198.51.100.9',prefix:24,gateway:'',ingress:'wan',dest:'203.0.113.2',proto:'TCP',sport:51000,dport:8443,route:true,snat:true,policy:'allow',dnat:true,inbound:true},
    dnatblock:{name:'Inbound DNAT — security policy missing',source:'198.51.100.9',prefix:24,gateway:'',ingress:'wan',dest:'203.0.113.2',proto:'TCP',sport:51001,dport:8443,route:true,snat:true,policy:'allow',dnat:true,inbound:false}
  };

  function buildFirewall(values){
    const policies=[];
    if(values.policy==='allow') policies.push({name:'LAN-Internet-Allow',from:'LAN',to:'WAN',src:'192.168.10.0/24',dst:'any',protocol:'any',dstPort:'any',action:'allow'});
    if(values.policy==='web'){
      policies.push({name:'LAN-Web',from:'LAN',to:'WAN',src:'192.168.10.0/24',dst:'any',protocol:'TCP',dstPort:[80,443],action:'allow'});
      policies.push({name:'LAN-DNS-UDP',from:'LAN',to:'WAN',src:'192.168.10.0/24',dst:'any',protocol:'UDP',dstPort:53,action:'allow'});
      policies.push({name:'LAN-DNS-TCP',from:'LAN',to:'WAN',src:'192.168.10.0/24',dst:'any',protocol:'TCP',dstPort:53,action:'allow'});
      policies.push({name:'LAN-ICMP',from:'LAN',to:'WAN',src:'192.168.10.0/24',dst:'any',protocol:'ICMP',dstPort:'any',action:'allow'});
    }
    if(values.policy==='deny') policies.push({name:'LAN-Deny',from:'LAN',to:'WAN',src:'any',dst:'any',protocol:'any',dstPort:'any',action:'deny'});
    if(values.inbound) policies.push({name:'WAN-Published-HTTPS',from:'WAN',to:'DMZ',src:'any',dst:'10.0.20.10',protocol:'TCP',dstPort:443,action:'allow'});
    return {
      lanInterface:'lan',wanInterface:'wan',
      interfaces:[
        {name:'lan',ip:'192.168.10.1',prefix:24,zone:'LAN'},
        {name:'dmz',ip:'10.0.20.1',prefix:24,zone:'DMZ'},
        {name:'wan',ip:'203.0.113.2',prefix:30,zone:'WAN'}
      ],
      routes:values.route?[{cidr:'0.0.0.0/0',nextHop:'203.0.113.1',iface:'wan',metric:10}]:[],
      policies,
      snat:{enabled:values.snat,publicIp:'203.0.113.2',name:'Internet-SNAT'},
      dnat:values.dnat?[{name:'Publish-Web',enabled:true,publicIp:'203.0.113.2',publicPort:8443,internalIp:'10.0.20.10',internalPort:443,protocol:'TCP'}]:[]
    };
  }
  function currentEngineValues(){
    return {source:$('engSourceIp').value.trim(),prefix:Number($('engPrefix').value),gateway:$('engGateway').value.trim(),ingress:$('engIngress').value,dest:$('engDestIp').value.trim(),proto:$('engProtocol').value,sport:Number($('engSrcPort').value||0),dport:Number($('engDstPort').value||0),route:$('engDefaultRoute').checked,snat:$('engSnat').checked,policy:$('engPolicy').value,dnat:$('engDnat').checked,inbound:$('engInboundPolicy').checked};
  }
  function applyPreset(key){
    const p=presets[key]||presets.https;
    $('engSourceIp').value=p.source;$('engPrefix').value=p.prefix;$('engGateway').value=p.gateway;$('engIngress').value=p.ingress;$('engDestIp').value=p.dest;$('engProtocol').value=p.proto;$('engSrcPort').value=p.sport;$('engDstPort').value=p.dport;$('engDefaultRoute').checked=p.route;$('engSnat').checked=p.snat;$('engPolicy').value=p.policy;$('engDnat').checked=p.dnat;$('engInboundPolicy').checked=p.inbound;
    renderEngineConfig();
  }
  function renderEngineConfig(){
    const v=currentEngineValues(),fw=buildFirewall(v);
    $('engConfigSummary').innerHTML=`<div class="mini-table"><div><b>Interfaces</b><span>LAN 192.168.10.1/24 · DMZ 10.0.20.1/24 · WAN 203.0.113.2/30</span></div><div><b>Default route</b><span>${v.route?'0.0.0.0/0 → 203.0.113.1 via WAN':'Not configured'}</span></div><div><b>Outbound policy</b><span>${v.policy==='web'?'Web/DNS/ICMP only':v.policy==='allow'?'Allow all lab traffic':'Explicit deny'}</span></div><div><b>SNAT</b><span>${v.snat?'192.168.10.0/24 → 203.0.113.2':'Disabled'}</span></div><div><b>DNAT</b><span>${v.dnat?'203.0.113.2:8443 → 10.0.20.10:443':'Disabled'}</span></div><div><b>Inbound policy</b><span>${v.inbound?'WAN → DMZ TCP/443 allow':'Missing / disabled'}</span></div></div>`;
    $('engPolicyTable').innerHTML=fw.policies.length?fw.policies.map(p=>`<tr><td>${p.name}</td><td>${p.from} → ${p.to}</td><td>${p.protocol}${p.dstPort!=='any'?'/'+(Array.isArray(p.dstPort)?p.dstPort.join(','):p.dstPort):''}</td><td><span class="status-chip ${p.action}">${p.action.toUpperCase()}</span></td></tr>`).join(''):`<tr><td colspan="4">No matching security rules configured.</td></tr>`;
  }
  function engineConfigFromValues(v){return {host:{ip:v.source,prefix:v.prefix,gateway:v.gateway},packet:{src:v.source,dst:v.dest,protocol:v.proto,srcPort:v.sport,dstPort:v.dport},ingress:v.ingress,firewall:buildFirewall(v)};}
  function runEngine(values=null,render=true){
    const v=values||currentEngineValues(); const r=window.PacketEngine.simulate(engineConfigFromValues(v));
    if(!render) return r;
    advState.engineRuns=(advState.engineRuns||0)+1;saveAdv();
    const verdict=$('engVerdict'); verdict.className=`engine-verdict ${r.ok?'allow':'drop'}`; verdict.innerHTML=`<span>${r.verdict}</span><div><strong>${r.reason}</strong><small>${r.ok?'Packet path completed in the deterministic model.':'Trace stopped at the first blocking condition.'}</small></div>`;
    $('engTrace').innerHTML=r.steps.map((s,i)=>`<article class="trace-step ${s.status}"><div class="trace-num">${i+1}</div><div><span class="trace-stage">${s.stage}</span><h4>${s.title}</h4><p>${s.detail}</p>${s.packet?`<code>${window.PacketEngine.packetText(s.packet)}</code>`:''}</div></article>`).join('');
    $('engBefore').textContent=r.packetOriginal?window.PacketEngine.packetText(r.packetOriginal):'—';
    $('engAfter').textContent=r.packetFinal?window.PacketEngine.packetText(r.packetFinal):(r.nat?.after?window.PacketEngine.packetText(r.nat.after):'—');
    $('engRouteResult').textContent=r.route?`${r.route.cidr} → ${r.route.nextHop||'connected'} via ${r.route.iface}`:'No selected route';
    $('engPolicyResult').textContent=r.policy?`${r.policy.name} (${String(r.policy.action).toUpperCase()})`:'No matched policy';
    $('engNatResult').textContent=r.nat?`${r.nat.type}: ${window.PacketEngine.packetText(r.nat.before)} → ${window.PacketEngine.packetText(r.nat.after)}`:'No translation';
    $('engSessionResult').textContent=r.session?`#${r.session.id} · ${r.session.fromZone}→${r.session.toZone} · ${r.session.state}`:'No session created';
    return r;
  }

  const incidents=[
    {id:'dns',title:'Websites fail by name',difficulty:'Foundation',symptom:'User 192.168.10.25 can ping 8.8.8.8, but google.com does not open.',root:'DNS resolution is blocked to the configured resolver.',diagnosis:'DNS failure / DNS policy block',actions:[
      ['Ping default gateway','Reply from 192.168.10.1. Local L3 connectivity is healthy.',3,false],
      ['Ping 8.8.8.8','Replies received. Routing, outbound policy and SNAT work for ICMP.',1,true],
      ['Run nslookup google.com','DNS request times out. No answer from configured resolver 10.10.10.53.',1,true],
      ['Inspect DNS firewall log','DENY: LAN → DNS-SERVER, UDP/53, rule=Cleanup-Deny.',1,true],
      ['Inspect NAT table','Normal outbound SNAT entries are present; nothing points to NAT failure.',4,false],
      ['Reboot firewall','No change. Rebooting without evidence wastes time and adds operational risk.',15,false]
    ],options:['DNS failure / DNS policy block','Missing default route','SNAT disabled','HTTPS certificate problem'],ideal:['Ping public IP to separate routing from name resolution','Test DNS directly with nslookup/dig','Inspect DNS policy/logs']},
    {id:'route',title:'No Internet after WAN change',difficulty:'Routing',symptom:'Clients reach the firewall gateway. DNS and web traffic both fail after an ISP migration.',root:'The firewall has no usable default route.',diagnosis:'Missing default route',engine:'noroute',actions:[
      ['Ping default gateway','Reply received from 192.168.10.1.',3,false],['Inspect firewall routing table','Connected routes exist, but there is no 0.0.0.0/0 route.',1,true],['Run deterministic packet trace','ENGINE',1,true],['Inspect security policy','LAN-Internet-Allow exists and permits the test traffic.',4,false],['Inspect SNAT','SNAT is configured correctly.',4,false],['Add any-any policy','This does not fix the routing failure and weakens security.',15,false]
    ],options:['DNS failure / DNS policy block','Missing default route','SNAT disabled','Wrong VLAN tag'],ideal:['Verify local gateway','Inspect route / longest-prefix match','Confirm policy/NAT only after routing']},
    {id:'nat',title:'Packets leave WAN, no replies',difficulty:'NAT',symptom:'HTTPS session is allowed and routed out WAN, but the client receives no response.',root:'SNAT is disabled, so a private RFC1918 source leaves the WAN.',diagnosis:'SNAT disabled',engine:'nonat',actions:[
      ['Inspect traffic log','Policy action=ALLOW; bytes sent increment, return bytes remain 0.',2,true],['Capture on WAN','Outbound SYN is visible with source 192.168.10.25 — a private address.',1,true],['Inspect SNAT rule','Outbound SNAT is disabled for the LAN policy.',1,true],['Run deterministic packet trace','ENGINE',1,true],['Change DNS server','No effect; the failing test already uses destination IP.',10,false],['Disable firewall inspection','No evidence supports an inspection problem.',10,false]
    ],options:['SNAT disabled','Missing default route','DNS failure / DNS policy block','MTU issue'],ideal:['Check allow log/session','Capture WAN to inspect translated source','Verify SNAT mapping']},
    {id:'policy',title:'Internet works, SSH blocked',difficulty:'Policy',symptom:'Client can ping Internet, DNS resolves, and HTTPS works, but SSH TCP/22 to 8.8.8.8 times out.',root:'The active Internet policy permits web, DNS and ICMP traffic but does not permit SSH TCP/22.',diagnosis:'Security policy blocks the application/port',engine:'ssh',engineOverride:{dport:22},actions:[
      ['Ping 8.8.8.8','ICMP succeeds. Basic route and return path exist.',3,false],['Test TCP destination port','TCP connection attempt receives no successful handshake.',1,true],['Inspect policy logs','DENY on cleanup rule for the tested TCP service.',1,true],['Run deterministic packet trace','ENGINE',1,true],['Inspect DNS','DNS resolves normally. This is not a name-resolution issue.',5,false],['Create temporary any-any allow','It may mask the cause and creates unnecessary exposure.',15,false]
    ],options:['Security policy blocks the application/port','SNAT disabled','ARP failure','Default gateway missing'],ideal:['Prove IP reachability','Test the actual TCP service','Read policy logs / matched rule']},
    {id:'dnat',title:'Published server unreachable',difficulty:'DNAT',symptom:'External client connects to 203.0.113.2:8443. DNAT exists, but the DMZ web server never receives traffic.',root:'DNAT translates correctly, but the required WAN→DMZ security policy is missing.',diagnosis:'DNAT exists but WAN→DMZ policy is missing',engine:'dnatblock',actions:[
      ['Inspect DNAT mapping','203.0.113.2:8443 correctly maps to 10.0.20.10:443.',1,true],['Inspect WAN→DMZ policy','No allow rule matches WAN → DMZ TCP/443. Implicit deny applies.',1,true],['Run deterministic packet trace','ENGINE',1,true],['Ping internal server from firewall','10.0.20.10 is reachable from the firewall DMZ interface.',4,false],['Change public IP','No evidence suggests the public IP is wrong.',10,false],['Disable DNAT','This removes the required translation and makes the service less reachable.',15,false]
    ],options:['DNAT exists but WAN→DMZ policy is missing','Wrong DNS resolver','SNAT disabled','Client subnet mask wrong'],ideal:['Verify translation mapping','Verify route to translated destination','Verify inbound security policy']},
    {id:'return',title:'SYN leaves, server reply never returns',difficulty:'Advanced',symptom:'LAN capture shows SYN. WAN capture shows the same connection leaving. Remote server receives it, but the firewall never sees a SYN/ACK.',root:'The remote side has no valid return route toward the translated/client network.',diagnosis:'Remote return-path routing problem',actions:[
      ['Capture firewall LAN side','Client SYN reaches the firewall.',2,true],['Capture firewall WAN side','SYN leaves WAN. No SYN/ACK is seen returning.',1,true],['Check firewall policy hit','Allow rule is hit and session is created.',3,false],['Check remote server route','Remote server uses a gateway that has no route back toward the source path.',1,true],['Add broader firewall rule','The packet already leaves the firewall; broader access control does not fix the return path.',15,false],['Restart client','No change; the network path remains asymmetric/broken.',10,false]
    ],options:['Remote return-path routing problem','Firewall never received the SYN','DNS failure / DNS policy block','ARP failure on client'],ideal:['Capture ingress and egress','Prove request leaves firewall','Investigate remote/return routing rather than changing allow rules']}
  ];

  let trIndex=0,trUsed=new Set(),trCost=0,trWrong=0,trHint=0,trEvidence=[];
  function initTroubleshooter(){
    $('incidentSelect').innerHTML=incidents.map((x,i)=>`<option value="${i}">${x.title}</option>`).join('');
    $('incidentSelect').onchange=()=>{trIndex=Number($('incidentSelect').value);startIncident();};
    $('newIncidentBtn').onclick=startIncident;$('trHintBtn').onclick=useHint;
    startIncident();
  }
  function startIncident(){trUsed=new Set();trCost=0;trWrong=0;trHint=0;trEvidence=[];renderIncident();}
  function renderIncident(){
    const inc=incidents[trIndex];
    $('incidentDifficulty').textContent=inc.difficulty;$('incidentTitle').textContent=inc.title;$('incidentSymptom').textContent=inc.symptom;
    $('trScore').textContent='100';$('trStatus').textContent='Investigating';$('trStatus').className='status-chip investigating';
    $('trEvidence').innerHTML='<p class="hint">Choose diagnostic actions. Strong engineers collect evidence before changing configuration.</p>';
    $('trActions').innerHTML=inc.actions.map((a,i)=>`<button class="diagnostic-action" data-i="${i}"><span>${actionIcon(a[0])}</span><div><strong>${a[0]}</strong><small>Cost ${a[2]} pts</small></div></button>`).join('');
    $('trActions').querySelectorAll('button').forEach(b=>b.onclick=()=>runDiagnostic(Number(b.dataset.i)));
    $('diagnosisOptions').innerHTML=inc.options.map((o,i)=>`<button class="diagnosis-option" data-i="${i}">${o}</button>`).join('');
    $('diagnosisOptions').querySelectorAll('button').forEach(b=>b.onclick=()=>submitDiagnosis(Number(b.dataset.i)));
    $('trOutcome').classList.add('hidden');$('trOutcome').innerHTML=''; updateTrScore();
  }
  function actionIcon(label){const s=label.toLowerCase();if(s.includes('capture'))return '⌁';if(s.includes('route'))return '↗';if(s.includes('policy')||s.includes('log'))return '☷';if(s.includes('nat'))return '⇄';if(s.includes('ping')||s.includes('test'))return '◎';if(s.includes('engine'))return '⚙';return '›';}
  function engineIncidentResult(inc){
    const p=presets[inc.engine]; const v={...p,...(inc.engineOverride||{})};
    const r=runEngine(v,false); const fail=[...r.steps].reverse().find(s=>s.status==='fail');
    return fail?`Packet engine stops at ${fail.stage}: ${fail.detail}`:`Packet engine verdict ${r.verdict}: ${r.reason}`;
  }
  function runDiagnostic(i){
    if(trUsed.has(i))return; const inc=incidents[trIndex],a=inc.actions[i];trUsed.add(i);trCost+=a[2];
    const result=a[1]==='ENGINE'?engineIncidentResult(inc):a[1]; trEvidence.push({label:a[0],result,good:a[3]});
    const btn=$('trActions').querySelector(`[data-i="${i}"]`);btn.disabled=true;btn.classList.add(a[3]?'useful':'used');
    const row=document.createElement('article');row.className=`evidence-card ${a[3]?'useful':''}`;row.innerHTML=`<span>${a[3]?'EVIDENCE':'CHECK'}</span><h4>${a[0]}</h4><p>${result}</p>`;$('trEvidence').appendChild(row);updateTrScore();
  }
  function useHint(){
    const inc=incidents[trIndex];const idx=inc.actions.findIndex((a,i)=>a[3]&&!trUsed.has(i));trHint++;trCost+=8;
    const text=idx>=0?`Next useful evidence: ${inc.actions[idx][0]}`:'You already collected the key evidence. Make a diagnosis.';
    const row=document.createElement('article');row.className='evidence-card hint-card';row.innerHTML=`<span>HINT</span><p>${text} (-8 pts)</p>`;$('trEvidence').appendChild(row);updateTrScore();
  }
  function currentTrScore(){return Math.max(0,100-trCost-(trWrong*15));}
  function updateTrScore(){$('trScore').textContent=currentTrScore();}
  function submitDiagnosis(i){
    const inc=incidents[trIndex],choice=inc.options[i];
    if(choice!==inc.diagnosis){trWrong++;updateTrScore();const row=document.createElement('article');row.className='evidence-card wrong-diagnosis';row.innerHTML=`<span>DIAGNOSIS</span><p><b>${choice}</b> does not fit all collected evidence. Continue investigating. (-15 pts)</p>`;$('trEvidence').appendChild(row);return;}
    const score=currentTrScore();advState.trCompleted=(advState.trCompleted||0)+1;if(score>(advState.trBest||0))advState.trBest=score;saveAdv();
    $('trStatus').textContent='Root cause found';$('trStatus').className='status-chip solved';
    $('trActions').querySelectorAll('button').forEach(b=>b.disabled=true);$('diagnosisOptions').querySelectorAll('button').forEach(b=>b.disabled=true);
    $('trOutcome').classList.remove('hidden');$('trOutcome').innerHTML=`<div class="outcome-score"><strong>${score}%</strong><span>Troubleshooting score</span></div><div><span class="eyebrow">ROOT CAUSE</span><h3>${inc.diagnosis}</h3><p>${inc.root}</p><h4>Efficient investigation path</h4><ol>${inc.ideal.map(x=>`<li>${x}</li>`).join('')}</ol><p class="hint">Actions used: ${trUsed.size} · hints: ${trHint} · wrong diagnoses: ${trWrong}</p></div>`;
  }

  if($('enginePreset')){
    $('enginePreset').innerHTML=Object.entries(presets).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join('');
    $('enginePreset').onchange=e=>applyPreset(e.target.value);
    ['engIngress','engProtocol','engPolicy'].forEach(id=>$(id).addEventListener('change',renderEngineConfig));
    ['engDefaultRoute','engSnat','engDnat','engInboundPolicy'].forEach(id=>$(id).addEventListener('change',renderEngineConfig));
    $('engRunBtn').onclick=()=>runEngine();$('engLoadPresetBtn').onclick=()=>applyPreset($('enginePreset').value);
    applyPreset('https');
  }
  if($('incidentSelect')) initTroubleshooter();
  if($('quickEngine')) $('quickEngine').onclick=()=>window.setView('engine');
  if($('quickTroubleshoot')) $('quickTroubleshoot').onclick=()=>window.setView('troubleshoot');
  if($('engineHomeBtn')) $('engineHomeBtn').onclick=()=>baseSetView('dashboard');
  if($('troubleshootHomeBtn')) $('troubleshootHomeBtn').onclick=()=>baseSetView('dashboard');
  updateBadges();
})();
