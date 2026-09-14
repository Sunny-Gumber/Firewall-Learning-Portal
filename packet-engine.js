(function(){
  'use strict';

  const PE = {};

  function ipToInt(ip){
    const p=String(ip).trim().split('.').map(Number);
    if(p.length!==4 || p.some(n=>!Number.isInteger(n)||n<0||n>255)) throw new Error(`Invalid IPv4 address: ${ip}`);
    return (((p[0]<<24)>>>0) + (p[1]<<16) + (p[2]<<8) + p[3]) >>> 0;
  }
  function intToIp(n){ return [n>>>24,(n>>>16)&255,(n>>>8)&255,n&255].join('.'); }
  function prefixMask(prefix){
    const p=Number(prefix); if(!Number.isInteger(p)||p<0||p>32) throw new Error(`Invalid prefix /${prefix}`);
    return p===0?0:(0xffffffff << (32-p))>>>0;
  }
  function network(ip,prefix){ return intToIp(ipToInt(ip)&prefixMask(prefix)); }
  function contains(cidr,ip){
    const [base,pfxRaw]=String(cidr).split('/'); const pfx=Number(pfxRaw);
    const m=prefixMask(pfx); return (ipToInt(base)&m)===(ipToInt(ip)&m);
  }
  function sameSubnet(a,b,prefix){ const m=prefixMask(prefix); return (ipToInt(a)&m)===(ipToInt(b)&m); }
  function isPrivate(ip){
    ipToInt(ip);
    return contains('10.0.0.0/8',ip)||contains('172.16.0.0/12',ip)||contains('192.168.0.0/16',ip)||contains('100.64.0.0/10',ip);
  }
  function parsePort(v){ const n=Number(v||0); return Number.isFinite(n)?n:0; }
  function matchToken(ruleValue, value){
    if(ruleValue===undefined||ruleValue===null||ruleValue===''||ruleValue==='any') return true;
    if(Array.isArray(ruleValue)) return ruleValue.some(x=>matchToken(x,value));
    return String(ruleValue).toLowerCase()===String(value).toLowerCase();
  }
  function matchAddr(ruleValue,ip){
    if(!ruleValue||ruleValue==='any') return true;
    if(Array.isArray(ruleValue)) return ruleValue.some(x=>matchAddr(x,ip));
    return String(ruleValue).includes('/') ? contains(ruleValue,ip) : String(ruleValue)===String(ip);
  }
  function matchPort(ruleValue,port){
    if(ruleValue===undefined||ruleValue===null||ruleValue===''||ruleValue==='any') return true;
    if(Array.isArray(ruleValue)) return ruleValue.some(x=>matchPort(x,port));
    const s=String(ruleValue);
    if(s.includes('-')){ const [a,b]=s.split('-').map(Number); return port>=a&&port<=b; }
    return Number(ruleValue)===Number(port);
  }
  function longestRoute(routes,destination){
    const candidates=(routes||[]).filter(r=>{
      try{return contains(r.cidr,destination);}catch{return false;}
    }).map(r=>({...r,prefix:Number(String(r.cidr).split('/')[1])}));
    candidates.sort((a,b)=>b.prefix-a.prefix || (a.metric||0)-(b.metric||0));
    return candidates[0]||null;
  }
  function zoneForInterface(name,fw){
    const i=(fw.interfaces||[]).find(x=>x.name===name); return i?i.zone:name;
  }
  function connectedRoutes(fw){
    return (fw.interfaces||[]).filter(i=>i.ip&&i.prefix!==undefined).map(i=>({cidr:`${network(i.ip,i.prefix)}/${i.prefix}`,iface:i.name,nextHop:'connected',metric:0,connected:true}));
  }
  function bestRoute(fw,dest){ return longestRoute([...connectedRoutes(fw),...(fw.routes||[])],dest); }
  function findPolicy(fw,packet,fromZone,toZone){
    return (fw.policies||[]).find(p=>
      matchToken(p.from,fromZone)&&matchToken(p.to,toZone)&&matchAddr(p.src,packet.src)&&matchAddr(p.dst,packet.dst)&&matchToken(p.protocol,packet.protocol)&&matchPort(p.dstPort,packet.dstPort)
    )||null;
  }
  function findDnat(fw,p){
    return (fw.dnat||[]).find(n=>n.enabled!==false && matchAddr(n.publicIp,p.dst) && matchToken(n.protocol,p.protocol) && matchPort(n.publicPort,p.dstPort))||null;
  }
  function clonePacket(p){return {src:p.src,dst:p.dst,protocol:String(p.protocol||'TCP').toUpperCase(),srcPort:parsePort(p.srcPort),dstPort:parsePort(p.dstPort)};}
  function packetText(p){ return `${p.protocol} ${p.src}${p.srcPort?':'+p.srcPort:''} → ${p.dst}${p.dstPort?':'+p.dstPort:''}`; }

  function simulate(cfg){
    const out={ok:false,verdict:'DROP',reason:'',steps:[],route:null,policy:null,nat:null,session:null,packetOriginal:null,packetFinal:null,warnings:[]};
    const step=(stage,title,detail,status='pass',packet=null)=>out.steps.push({stage,title,detail,status,packet:packet?clonePacket(packet):null});
    try{
      const host=cfg.host||{}; const fw=cfg.firewall||{}; const p=clonePacket(cfg.packet||{});
      ipToInt(host.ip); ipToInt(p.dst); if(host.gateway) ipToInt(host.gateway);
      out.packetOriginal=clonePacket(p);
      const ingress=cfg.ingress||'lan';

      if(ingress==='lan'){
        const local=sameSubnet(host.ip,p.dst,Number(host.prefix));
        step('HOST','Subnet decision', local?`${p.dst} is inside ${network(host.ip,host.prefix)}/${host.prefix}. Host sends directly.`:`${p.dst} is outside ${network(host.ip,host.prefix)}/${host.prefix}. Host uses default gateway ${host.gateway}.`,'pass',p);
        if(local){
          step('L2','ARP resolution',`ARP resolves the destination ${p.dst} directly. The firewall is not in this Layer-3 path.`,'pass',p);
          out.ok=true; out.verdict='DELIVER'; out.reason='Same-subnet delivery'; out.packetFinal=clonePacket(p);
          return out;
        }
        if(!host.gateway){ step('HOST','Default gateway missing','Remote destination requires a default gateway, but none is configured.','fail',p); out.reason='Missing host gateway'; return out; }
        step('L2','ARP for gateway',`Host resolves the MAC of next hop ${host.gateway}; it does not ARP for the remote destination.`,'pass',p);
      } else {
        step('INGRESS','Internet-side packet',`Packet arrives on the firewall WAN side: ${packetText(p)}.`,'pass',p);
      }

      const ingressIf=ingress==='wan'?(fw.wanInterface||'wan'):(fw.lanInterface||'lan');
      const fromZone=zoneForInterface(ingressIf,fw);
      step('FIREWALL','Ingress classification',`Ingress interface ${ingressIf} maps to zone ${fromZone}.`,'pass',p);

      let dnat=null;
      if(ingress==='wan'){
        dnat=findDnat(fw,p);
        if(dnat){
          const before=clonePacket(p); p.dst=dnat.internalIp; if(dnat.internalPort) p.dstPort=Number(dnat.internalPort);
          out.nat={type:'DNAT',before,after:clonePacket(p),rule:dnat.name||'DNAT'};
          step('NAT','Destination translation',`${before.dst}:${before.dstPort} translated to ${p.dst}:${p.dstPort} by ${dnat.name||'DNAT rule'}.`,'pass',p);
        } else {
          step('NAT','Destination translation','No DNAT rule matched the inbound destination.','neutral',p);
        }
      }

      const route=bestRoute(fw,p.dst); out.route=route;
      if(!route){ step('ROUTE','Route lookup',`No route matches ${p.dst}. Firewall cannot choose an egress interface.`,'fail',p); out.reason='No route'; return out; }
      const toZone=zoneForInterface(route.iface,fw);
      step('ROUTE','Longest-prefix match',`${route.cidr} wins. Egress=${route.iface}, next-hop=${route.nextHop||'connected'}, zone=${toZone}.`,'pass',p);

      const policy=findPolicy(fw,p,fromZone,toZone); out.policy=policy;
      if(!policy){ step('POLICY','Security policy','No policy matched this flow. Generic firewall behavior: implicit deny.','fail',p); out.reason='Implicit deny'; return out; }
      if(String(policy.action).toLowerCase()!=='allow'){
        step('POLICY','Security policy',`${policy.name||'Matched rule'} explicitly denies the flow.`,'fail',p); out.reason=`Denied by ${policy.name||'policy'}`; return out;
      }
      step('POLICY','Security policy',`${policy.name||'Policy'} allows ${fromZone} → ${toZone} for ${p.protocol}${p.dstPort?'/'+p.dstPort:''}.`,'pass',p);

      if(ingress==='lan' && toZone.toLowerCase()==='wan'){
        const snat=fw.snat||{};
        if(snat.enabled){
          const before=clonePacket(p); p.src=snat.publicIp || (fw.interfaces||[]).find(i=>i.name===route.iface)?.ip || p.src;
          out.nat={type:'SNAT',before,after:clonePacket(p),rule:snat.name||'Outbound SNAT'};
          step('NAT','Source translation',`${before.src} translated to ${p.src}. Return traffic can map back through session state.`,'pass',p);
        } else if(isPrivate(p.src)){
          step('NAT','Source translation',`SNAT is disabled and source ${p.src} is private. The firewall can forward it, but normal Internet return routing will fail.`,'fail',p);
          out.reason='Private source exits WAN without SNAT'; out.warnings.push('Upstream Internet will not normally route RFC1918/CGNAT source addresses back.'); return out;
        } else step('NAT','Source translation','No SNAT required because source is already routable.','neutral',p);
      }

      const session={id:Math.floor(Math.random()*900000)+100000,state:p.protocol==='TCP'?'SYN-SENT / NEW':'NEW',original:clonePacket(out.packetOriginal),translated:clonePacket(p),fromZone,toZone,policy:policy.name||'unnamed'};
      out.session=session;
      step('SESSION','State creation',`Session ${session.id} created. Firewall will use state/NAT mapping for return traffic.`,'pass',p);
      step('EGRESS','Transmit',`Packet leaves ${route.iface} toward ${route.nextHop||p.dst}: ${packetText(p)}.`,'pass',p);

      if(out.nat){
        const ret={src:p.dst,dst:p.src,protocol:p.protocol,srcPort:p.dstPort,dstPort:p.srcPort};
        step('RETURN','Return-session lookup',`Return packet ${packetText(ret)} matches existing state. Reverse translation restores the original endpoint.`,'pass',ret);
      } else step('RETURN','Return path',`Return traffic must have a valid route back to ${out.packetOriginal.src}; state permits the reverse flow for this session.`,'pass',p);

      out.ok=true; out.verdict='ALLOW'; out.reason='Flow permitted end-to-end by modeled firewall'; out.packetFinal=clonePacket(p);
      return out;
    } catch(err){ out.reason=err.message; step('INPUT','Validation error',err.message,'fail'); return out; }
  }

  PE.ipToInt=ipToInt; PE.intToIp=intToIp; PE.network=network; PE.contains=contains; PE.sameSubnet=sameSubnet; PE.isPrivate=isPrivate; PE.longestRoute=longestRoute; PE.simulate=simulate; PE.packetText=packetText;
  window.PacketEngine=PE;
})();
