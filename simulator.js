window.FW_GLOSSARY = [
  ["ARP","Address Resolution Protocol maps a local IPv4 next hop to a MAC address. For a remote destination, the host normally ARPs for its default gateway—not the remote server."],
  ["5-tuple","The core flow identity: source IP, destination IP, source port, destination port and protocol."],
  ["Stateful firewall","A firewall that tracks connection/session state so return traffic can be associated with an allowed flow."],
  ["Default route","0.0.0.0/0 in IPv4. It is used when no more-specific route matches the destination."],
  ["Longest-prefix match","Routing chooses the most specific matching prefix. A /24 beats a /16 for the same destination range."],
  ["SNAT","Source NAT changes the source address/port, commonly for private clients going to the Internet."],
  ["DNAT","Destination NAT changes the destination address/port, commonly to publish an internal service."],
  ["PAT","Port Address Translation lets many internal sessions share one public address by translating ports."],
  ["Hairpin / U-turn NAT","Internal users access an internal service by its public address and traffic loops through the firewall translation path."],
  ["Zone","A logical security boundary grouping interfaces or networks. Policies often match source and destination zones."],
  ["App-ID","Palo Alto application identification that classifies applications beyond simple TCP/UDP port matching."],
  ["Application-default","Palo Alto policy option that restricts an identified application to its standard/default ports."],
  ["User-ID","Palo Alto identity mapping that allows policy to use users/groups rather than only IP addresses."],
  ["VIP","FortiGate Virtual IP object used for destination NAT/port publishing."],
  ["IP Pool","FortiGate object that defines translated source addresses for SNAT."],
  ["SIC","Check Point Secure Internal Communication establishes trust between management and gateways."],
  ["Hide NAT","Check Point many-to-one source translation, similar in purpose to PAT/SNAT overload."],
  ["ClusterXL","Check Point gateway clustering/high-availability technology."],
  ["Security profile","Inspection controls such as IPS, antivirus, URL/web filtering, anti-spyware or file controls applied to allowed traffic."],
  ["Asymmetric routing","Forward and return paths differ in a way that can break stateful inspection because the same firewall/session does not see both directions."],
  ["TCP SYN","The first packet of a normal TCP three-way handshake, requesting a new connection."],
  ["RST","TCP reset. It usually indicates an endpoint or middlebox actively rejected or terminated a connection."],
  ["Retransmission","A sender repeats data because the expected acknowledgement/response did not arrive in time; it is evidence of loss or delay, not proof of the exact cause."],
  ["Implicit deny","Traffic not matched by an allow rule is denied by the firewall's default/cleanup behaviour."],
  ["North-South traffic","Traffic entering or leaving an environment, such as users to Internet or Internet to DMZ."],
  ["East-West traffic","Traffic moving laterally inside an environment, such as user VLAN to server VLAN."],
  ["IKE","Internet Key Exchange negotiates IPsec security associations and cryptographic parameters."],
  ["Phase 2 / IPsec SA","Defines protected traffic and encryption parameters used to carry data through an IPsec tunnel."],
  ["SSL/TLS decryption","Firewall decrypts permitted encrypted traffic for inspection and then re-encrypts it, subject to certificate, privacy and application compatibility considerations."],
  ["Return path","The route and policy/session path used by response traffic back to the original source. It must be valid for a session to work end-to-end."]
];

window.FW_PACKET_SCENARIOS = [
  {
    id:"internet-snat", name:"Client → Internet (SNAT)",
    nodes:["PC","Switch","Firewall","Internet","Web Server"],
    subtitle:"192.168.10.10/24 wants HTTPS to 203.0.113.20. Gateway: 192.168.10.1",
    steps:[
      {q:"Is 203.0.113.20 on the PC's local /24 subnet?", context:"PC: 192.168.10.10/24 · Destination: 203.0.113.20", options:["Yes — send directly","No — use the default gateway"], answer:1, explain:"203.0.113.20 is outside 192.168.10.0/24, so the host sends the packet to its default gateway.", evidence:"Destination is remote → next hop is 192.168.10.1."},
      {q:"Whose MAC address must the PC learn first?", context:"The destination is remote, but Ethernet still needs a local Layer-2 next hop.", options:["203.0.113.20","192.168.10.1","The DNS server","The ISP core router"], answer:1, explain:"The PC ARPs for the default gateway because that is the local Layer-2 next hop.", evidence:"ARP resolves 192.168.10.1 → firewall LAN MAC."},
      {q:"After receiving the packet, what must the firewall determine before forwarding it?", context:"Think like a router and a security device.", options:["Only the destination MAC","Route + security decision + translation/inspection requirements","Only DNS","Only the username"], answer:1, explain:"A firewall must establish forwarding and security decisions. Exact order differs by platform, but route, policy, NAT and inspection all matter.", evidence:"Firewall processing begins: route/policy/NAT/session context."},
      {q:"The client uses private source 192.168.10.10. What is normally required for public Internet access?", context:"Assume the ISP will not route RFC1918 private addresses back to you.", options:["DNAT","SNAT/PAT","ARP proxy only","No translation ever"], answer:1, explain:"Outbound Internet access typically uses SNAT/PAT to translate the private source to a public address.", evidence:"Source translated: 192.168.10.10:ephemeral → public-IP:translated-port."},
      {q:"What does a stateful firewall create when it permits this new flow?", context:"The return packet must be recognised without requiring an unrelated new inbound rule.", options:["A DNS zone","A session/connection entry","A VLAN tag","A new subnet mask"], answer:1, explain:"The firewall records session state, including flow identity and often NAT mappings.", evidence:"Session created for client ↔ web server flow."},
      {q:"The server replies. What helps the firewall send the response back to the original PC?", context:"The destination on the returning Internet packet is the translated public address.", options:["The existing session/NAT state","A random ARP entry","The website URL","The switch CAM table alone"], answer:0, explain:"The firewall matches the reply to the existing session, reverses the NAT mapping and forwards it toward the client.", evidence:"Return matched → de-NAT → route to 192.168.10.10."}
    ]
  },
  {
    id:"local-arp", name:"Same Subnet (No Router)",
    nodes:["PC-A","Switch","PC-B"],
    subtitle:"PC-A 10.10.10.10/24 wants to reach PC-B 10.10.10.50/24",
    steps:[
      {q:"Does PC-A need its default gateway for this destination?", context:"Both IPs are inside 10.10.10.0/24.", options:["Yes","No"], answer:1, explain:"The destination is directly connected, so PC-A sends directly at Layer 2.", evidence:"Subnet calculation says local destination."},
      {q:"What does PC-A need before building the Ethernet frame?", context:"It knows PC-B's IPv4 address but needs a Layer-2 destination.", options:["PC-B MAC via ARP","Default gateway public IP","A NAT rule","An IPsec SA"], answer:0, explain:"ARP resolves PC-B's local IPv4 address to its MAC address.", evidence:"ARP broadcast: Who has 10.10.10.50?"},
      {q:"What does the switch primarily use to forward the resulting Ethernet frame?", context:"The frame is now addressed directly to PC-B.", options:["Destination MAC table","BGP table","Firewall session table","DNS cache"], answer:0, explain:"A Layer-2 switch forwards based on its MAC address table (or floods if unknown).", evidence:"Switch forwards frame toward PC-B based on destination MAC."},
      {q:"If PC-A has the wrong /16 mask while PC-B is actually behind a router, what could happen?", context:"PC-A may incorrectly believe remote addresses are local.", options:["PC-A may ARP for a remote host instead of using its gateway","NAT automatically fixes it","DNS changes the subnet mask","TCP ignores the IP layer"], answer:0, explain:"A wrong mask changes the host's local/remote decision and can cause ARP for destinations that should be routed.", evidence:"Host subnet logic can break reachability before any firewall policy is checked."}
    ]
  },
  {
    id:"inbound-dnat", name:"Internet → Internal Server (DNAT)",
    nodes:["Internet Client","Firewall","DMZ Server"],
    subtitle:"Client reaches public 198.51.100.10:443, mapped to DMZ server 10.20.30.50:443",
    steps:[
      {q:"Which translation is the central requirement for publishing this internal server?", context:"The public destination must become the private DMZ destination.", options:["SNAT only","DNAT / destination translation","No NAT","DHCP relay"], answer:1, explain:"Destination NAT maps the public address/port to the internal server address/port.", evidence:"Public destination 198.51.100.10:443 → 10.20.30.50:443."},
      {q:"Is a DNAT/VIP object by itself enough to permit the connection?", context:"Translation and access control are separate functions.", options:["Yes, NAT always means allow","No, security policy must also permit the flow"], answer:1, explain:"NAT changes packet fields; a matching security policy/rule is still required.", evidence:"Translation exists, but policy must permit Internet/Untrust → DMZ."},
      {q:"External SYN reaches the server, but the server sends its reply to a different gateway. Likely outcome?", context:"The firewall created state for the inbound flow but may not see the return traffic.", options:["Session can fail because of asymmetric return path","DNS automatically repairs it","The switch converts it to UDP","The public IP becomes private"], answer:0, explain:"Stateful inspection depends on a valid return path through the expected firewall/session path.", evidence:"Forward works; return-path asymmetry can break the TCP handshake."},
      {q:"What is the most useful proof when you suspect the firewall is dropping the inbound SYN?", context:"Avoid changing policy blindly.", options:["Packet captures on ingress and egress plus logs/session evidence","Reboot everything","Create any-any rule first","Change DNS"], answer:0, explain:"Comparing ingress/egress captures and logs can prove whether the firewall received, translated and forwarded the packet.", evidence:"Use two-sided evidence to localise the drop point."}
    ]
  }
];

/*
 * Curated study guides. Week 1 is intentionally content-first: read the core idea,
 * then watch only the exact video chapters that support our firewall-engineer path.
 */
window.FW_STUDY_CONTENT = {
  1: {
    estimated:"Reading 20–25 min · Tagged video 28–35 min · Lab 35–45 min",
    outcome:"By the end, you should be able to narrate one packet from a PC to a remote web server and back, stating what changes at each hop and where a firewall makes decisions.",
    prerequisites:["Know that an IP address identifies a Layer-3 endpoint","Know that a MAC address is used on the local Ethernet segment","Know the basic difference between a switch and a router"],
    reading:[
      {tag:"MUST",title:"Start with the problem, not the OSI chart",body:"When a user types a website name, several different mechanisms cooperate: name resolution, local-vs-remote subnet decision, ARP for the local next hop, Ethernet framing, IP routing, TCP/UDP, firewall policy, NAT and the return path. The goal today is to see these as one continuous journey."},
      {tag:"MUST",title:"Local or remote is the first routing decision",body:"A host compares the destination IP with its own IP and subnet mask. If the destination is local, it sends directly at Layer 2. If it is remote, it sends the frame to the default gateway. The IP destination remains the remote server; only the local Ethernet destination is the gateway's MAC."},
      {tag:"MUST",title:"Layer 2 changes hop by hop; Layer 3 identifies the end conversation",body:"Routers remove the incoming Ethernet header and build a new Layer-2 header for the next link. In a normal routed path, the source and destination IP addresses remain end-to-end unless NAT changes them. This distinction is foundational for packet captures and firewall troubleshooting."},
      {tag:"MUST",title:"The firewall is both a forwarding and a security decision point",body:"A routed firewall must understand where the packet should go and whether the traffic is permitted. Depending on platform and feature set, route, zone, policy, NAT, application/security inspection and session state all influence the result. Do not memorize a vendor-specific processing order yet."},
      {tag:"MUST",title:"State and the return path matter",body:"A successful outbound packet is only half a working connection. A stateful firewall tracks the permitted flow so returning traffic can be associated with the existing session and NAT mapping. Missing or asymmetric return routing can break a connection even when the forward path looks correct."},
      {tag:"SHOULD",title:"Use the OSI model as a troubleshooting map",body:"For this course, the OSI model is useful because it tells you what evidence belongs where: physical/link, Ethernet/ARP, IP/routing, TCP/UDP and application. We will not spend time memorizing every layer acronym if it does not help you locate a fault."}
    ],
    videos:[
      {tag:"MUST",source:"Jeremy's IT Lab — OSI Model & TCP/IP Suite",videoId:"t-ai8JzhHuY",start:203,end:952,label:"OSI layers used in packet flow",focus:"Understand what Layer 2, Layer 3 and Layer 4 are responsible for. Do not try to memorize every example protocol."},
      {tag:"MUST",source:"Jeremy's IT Lab — OSI Model & TCP/IP Suite",videoId:"t-ai8JzhHuY",start:952,end:1125,label:"PDUs + TCP/IP mapping",focus:"Focus on encapsulation terminology and how OSI maps to the practical TCP/IP stack."},
      {tag:"MUST",source:"Jeremy's IT Lab — OSI Model & TCP/IP Suite",videoId:"t-ai8JzhHuY",start:1262,end:1512,label:"Data flow / encapsulation",focus:"Watch how data gets headers added/removed as it moves through the stack."},
      {tag:"MUST",source:"Jeremy's IT Lab — The Life of a Packet",videoId:"4YrYV2io3as",start:99,end:239,label:"Read the topology before tracing",focus:"Identify endpoints, routers and subnets before following the packet."},
      {tag:"MUST",source:"Jeremy's IT Lab — The Life of a Packet",videoId:"4YrYV2io3as",start:239,end:465,label:"PC to first router",focus:"Watch the local/remote decision, ARP and first Ethernet frame."},
      {tag:"MUST",source:"Jeremy's IT Lab — The Life of a Packet",videoId:"4YrYV2io3as",start:465,end:703,label:"Router-to-router forwarding",focus:"Observe how the Layer-2 header changes while the IP conversation continues."},
      {tag:"MUST",source:"Jeremy's IT Lab — The Life of a Packet",videoId:"4YrYV2io3as",start:703,end:921,label:"Last hop + return traffic",focus:"Pay special attention to the reverse path; firewall troubleshooting always needs both directions."}
    ],
    commands:["Windows: ipconfig /all","Windows: arp -a","Windows: route print","Windows: tracert 8.8.8.8","Linux: ip addr","Linux: ip neigh","Linux: ip route","Linux: traceroute 8.8.8.8"],
    teachBack:"Without notes, explain what happens when 192.168.1.10/24 opens a remote HTTPS site. Mention DNS, subnet decision, ARP, default gateway, Ethernet, IP, route, firewall policy, NAT/session and return traffic."
  },
  2: {
    estimated:"Reading 25–30 min · Tagged video 35–45 min · Practice 40 min",
    outcome:"You should be able to decide whether two IPv4 addresses are local or routed, identify network/broadcast/host ranges, read CIDR notation and select a sensible prefix for a firewall network.",
    prerequisites:["Session 1 packet-flow mental model","Basic decimal arithmetic","Understand why the subnet mask affects local-vs-remote forwarding"],
    reading:[
      {tag:"MUST",title:"An IPv4 address has a network part and a host part",body:"The prefix length tells us how many leading bits identify the network. Hosts use that boundary to decide whether a destination is directly connected or must be sent to a gateway. Firewalls use the same networks in interfaces, objects, routes and policies."},
      {tag:"MUST",title:"CIDR is the notation we will use",body:"A prefix such as /24, /26 or /30 describes the network boundary. A larger prefix number means more network bits and fewer host addresses. You should become comfortable reading /24 through /30 without relying on a calculator for every basic case."},
      {tag:"MUST",title:"Network address, usable range and broadcast",body:"For ordinary IPv4 subnets, the network address identifies the subnet and the broadcast address targets all hosts in that broadcast domain. The addresses between them are the conventional usable host range. Point-to-point /31 is a special case and /32 identifies a single address/host route."},
      {tag:"MUST",title:"Subnetting is a firewall skill, not a math competition",body:"Our practical questions are: Is this destination local? Does this object include the host? Which interface owns this subnet? Are two networks overlapping? Which route is more specific? How many hosts must this VLAN support?"},
      {tag:"SHOULD",title:"Binary matters because masks are bit boundaries",body:"You do not need to love binary arithmetic, but understanding powers of two and the bit boundary makes subnetting predictable. Learn the common block sizes and practice until /25, /26, /27, /28, /29 and /30 feel natural."},
      {tag:"ADVANCED",title:"Preview: longest-prefix match",body:"Routers and firewalls prefer the most-specific matching route. If both 10.0.0.0/8 and 10.10.10.0/24 match a destination, /24 wins. We will study this deeply in the routing session; for now, connect it to the idea of prefix length."}
    ],
    videos:[
      {tag:"MUST",source:"Jeremy's IT Lab — IPv4 Addressing Part 1",videoId:"3ROdsfEUuhs",start:426,end:506,label:"What an IPv4 address is",focus:"Understand the 32-bit address and dotted-decimal representation."},
      {tag:"SHOULD",source:"Jeremy's IT Lab — IPv4 Addressing Part 1",videoId:"3ROdsfEUuhs",start:620,end:1205,label:"Binary conversion practice",focus:"Learn enough binary to understand masks and subnet boundaries. Repeat this segment only if binary is weak."},
      {tag:"MUST",source:"Jeremy's IT Lab — IPv4 Addressing Part 1",videoId:"3ROdsfEUuhs",start:1205,end:1439,label:"Network portion vs host portion",focus:"This is the key idea behind every subnet decision."},
      {tag:"MUST",source:"Jeremy's IT Lab — IPv4 Addressing Part 1",videoId:"3ROdsfEUuhs",start:1809,end:2038,label:"Netmask, network and broadcast",focus:"Be able to identify what the mask means and why network/broadcast addresses matter."},
      {tag:"MUST",source:"Jeremy's IT Lab — Subnetting Part 1",videoId:"bQ8sdpGQu8c",start:559,end:721,label:"CIDR notation",focus:"Connect /prefix notation to subnet size."},
      {tag:"SHOULD",source:"Jeremy's IT Lab — Subnetting Part 1",videoId:"bQ8sdpGQu8c",start:721,end:1270,label:"Usable addresses, /31 and /32",focus:"Understand host counts and why /31 and /32 are special."},
      {tag:"MUST",source:"Jeremy's IT Lab — Subnetting Part 1",videoId:"bQ8sdpGQu8c",start:1347,end:1579,label:"Subnetting scenario",focus:"Work the scenario yourself before listening to the answer."},
      {tag:"SHOULD",source:"Jeremy's IT Lab — Subnetting Part 2",videoId:"IGhd-0di0Qo",start:320,end:648,label:"Subnetting trick + practice",focus:"Use this to build speed after you understand the logic."},
      {tag:"MUST",source:"Jeremy's IT Lab — Subnetting Part 2",videoId:"IGhd-0di0Qo",start:648,end:857,label:"Identify subnet + host count",focus:"Practice the exact skill we need for firewall networks."},
      {tag:"SHOULD",source:"Jeremy's IT Lab — Subnetting Part 2",videoId:"IGhd-0di0Qo",start:1089,end:1320,label:"Choose prefix length + larger subnet example",focus:"Useful for sizing real VLANs and site networks."}
    ],
    commands:["Windows: ipconfig /all","Windows PowerShell: Get-NetIPAddress","Linux: ip addr show","Linux: ip route"],
    teachBack:"Given 10.10.10.130/26 and destination 10.10.10.200, calculate the local subnet and explain whether the host sends directly or uses its gateway."
  },
  3: {
    estimated:"Reading 20–25 min · Tagged video 20–25 min · Wireshark/lab 45 min",
    outcome:"You should be able to predict ARP behavior, interpret an ARP table, explain what ping proves and does not prove, and use a packet capture as evidence.",
    prerequisites:["Session 1 packet journey","Session 2 local-vs-remote subnet decision","Basic idea of Ethernet and MAC addresses"],
    reading:[
      {tag:"MUST",title:"ARP resolves the local next hop",body:"ARP maps an IPv4 address to a MAC address on the local Layer-2 segment. If the final destination is local, the host ARPs for that destination. If the final destination is remote, the host normally ARPs for the default gateway instead."},
      {tag:"MUST",title:"ARP request is broadcast; the answer identifies the owner",body:"The requester sends a broadcast asking who owns an IPv4 address. The owner responds with its MAC address and the mapping can be cached. This is why wrong masks, duplicate addresses and stale neighbor information can create confusing symptoms before the firewall policy is ever involved."},
      {tag:"MUST",title:"The ARP/neighbor table is troubleshooting evidence",body:"Do not treat arp -a or ip neigh as trivia. They tell you which local next-hop MAC the host believes corresponds to an IPv4 address. If the expected gateway entry is missing or incomplete, investigate Layer 2, VLAN membership, addressing and interface state before changing a firewall policy."},
      {tag:"MUST",title:"ICMP echo is a reachability test, not an application test",body:"A successful ping proves that ICMP echo traffic completed a path at that moment. It does not prove DNS, TCP/443, TLS, authentication or an application service. A failed ping also does not automatically mean the host is down because ICMP can be filtered."},
      {tag:"MUST",title:"Use captures to prove where the packet exists",body:"A packet capture is evidence at a specific observation point. Seeing an ARP request with no reply proves something different from seeing a TCP SYN leave a firewall with no SYN/ACK return. Later we will compare captures on both sides of a firewall to localize drops."},
      {tag:"SHOULD",title:"Switch MAC table and host ARP table are different",body:"A host ARP/neighbor table maps IP to MAC. A switch MAC/CAM table maps MAC addresses to switch ports. They solve different problems but cooperate to deliver the frame."}
    ],
    videos:[
      {tag:"SHOULD",source:"Jeremy's IT Lab — Ethernet LAN Switching Part 2",videoId:"5q1pqdmdPjo",start:57,end:362,label:"Ethernet frame refresher",focus:"Review the fields only enough to understand source/destination MAC and EtherType."},
      {tag:"MUST",source:"Jeremy's IT Lab — Ethernet LAN Switching Part 2",videoId:"5q1pqdmdPjo",start:362,end:784,label:"ARP request, reply and ARP table",focus:"This is today's core video. Predict each frame before it is explained."},
      {tag:"MUST",source:"Jeremy's IT Lab — Ethernet LAN Switching Part 2",videoId:"5q1pqdmdPjo",start:931,end:1225,label:"Ping + Wireshark packet capture",focus:"Connect ICMP behavior with what is visible in a capture."},
      {tag:"SHOULD",source:"Jeremy's IT Lab — Ethernet LAN Switching Part 2",videoId:"5q1pqdmdPjo",start:1225,end:1451,label:"MAC address table",focus:"Understand the difference between a switch MAC table and an endpoint ARP table."},
      {tag:"MUST",source:"Jeremy's IT Lab — The Life of a Packet",videoId:"4YrYV2io3as",start:239,end:465,label:"Remote destination: ARP for the gateway",focus:"Reinforce the rule: remote IP destination, local Layer-2 next hop."}
    ],
    commands:["Windows: arp -a","Windows: ping <gateway>","Windows: tracert <destination>","Linux: ip neigh","Linux: ping -c 4 <gateway>","Wireshark filters: arp · icmp · ip.addr == <host>"],
    teachBack:"Explain why a PC sending to 8.8.8.8 does not ARP for 8.8.8.8. Then explain what a successful ping proves—and what it still does not prove."
  }
};

(function installStudyGuide(){
  function fmt(sec){
    const m=Math.floor(sec/60), s=sec%60;
    return `${m}:${String(s).padStart(2,"0")}`;
  }
  function tagClass(tag){ return `study-tag tag-${tag.toLowerCase()}`; }
  function ensureStyles(){
    if(document.getElementById("studyGuideStyles")) return;
    const st=document.createElement("style"); st.id="studyGuideStyles";
    st.textContent=`
      .study-guide-panel{border-color:#2d5d78;background:linear-gradient(180deg,rgba(13,38,58,.98),rgba(8,25,42,.98))}
      .study-guide-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.study-guide-head h3{margin:4px 0}.study-estimate{color:var(--muted);font-size:13px}
      .study-outcome{padding:14px 16px;border-radius:12px;background:#081b2d;border:1px solid var(--line);line-height:1.65;margin:14px 0}.study-outcome b{color:var(--cyan)}
      .study-prereq{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 20px}.study-prereq span{font-size:12px;padding:7px 9px;border:1px solid var(--line);border-radius:999px;color:#c9d8e7;background:#0a2034}
      .study-columns{display:grid;grid-template-columns:1fr 1fr;gap:16px}.study-subhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.study-subhead h4{margin:0;font-size:18px}
      .read-card,.video-segment{border:1px solid var(--line);background:#091b2c;border-radius:12px;padding:14px;margin:9px 0}.read-card h5,.video-segment h5{margin:7px 0;font-size:15px}.read-card p,.video-segment p{margin:0;color:#bfd0df;line-height:1.65;font-size:14px}
      .study-tag{display:inline-flex;font-size:10px;font-weight:900;letter-spacing:.08em;padding:4px 7px;border-radius:999px}.tag-must{background:rgba(55,215,255,.15);color:#7ee8ff;border:1px solid rgba(55,215,255,.35)}.tag-should{background:rgba(89,217,142,.12);color:#8ce8b1;border:1px solid rgba(89,217,142,.3)}.tag-optional,.tag-advanced{background:rgba(255,190,92,.12);color:#ffd08a;border:1px solid rgba(255,190,92,.3)}
      .video-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}.time-chip{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#fff;background:#132c43;border:1px solid #285070;border-radius:7px;padding:3px 7px;font-size:11px}
      .video-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.segment-play{border:0;border-radius:8px;padding:8px 10px;font-weight:800;cursor:pointer;background:#123e55;color:#8cecff}.segment-open{border:1px solid var(--line);border-radius:8px;padding:7px 10px;color:#bfe8ff;text-decoration:none;font-size:12px}.segment-play:hover{background:#16506d}
      .study-commands{margin-top:16px}.command-grid{display:flex;flex-wrap:wrap;gap:7px}.command-grid code{background:#06131f;border:1px solid var(--line);border-radius:8px;padding:7px 9px;color:#aeeeff;font-size:12px}
      .teach-back{margin-top:16px;padding:14px 16px;border:1px solid #315c4c;background:#0a211e;border-radius:12px;line-height:1.65}.teach-back strong{color:#8ce8b1}
      .study-guide-empty{display:none}
      @media(max-width:900px){.study-columns{grid-template-columns:1fr}.study-guide-head{flex-direction:column}}
    `;
    document.head.appendChild(st);
  }
  function ensurePanel(){
    let sec=document.getElementById("studyGuidePanel");
    if(sec) return sec;
    const lesson=document.getElementById("lessonView"), head=lesson && lesson.querySelector(".lesson-head");
    if(!lesson || !head) return null;
    sec=document.createElement("section"); sec.id="studyGuidePanel"; sec.className="panel study-guide-panel hidden";
    head.insertAdjacentElement("afterend",sec);
    return sec;
  }
  function renderStudyGuide(id){
    const data=window.FW_STUDY_CONTENT && window.FW_STUDY_CONTENT[id];
    const panel=ensurePanel(); if(!panel) return;
    if(!data){ panel.classList.add("hidden"); panel.innerHTML=""; return; }
    panel.classList.remove("hidden");
    const reads=data.reading.map(x=>`<article class="read-card"><span class="${tagClass(x.tag)}">${x.tag}</span><h5>${x.title}</h5><p>${x.body}</p></article>`).join("");
    const vids=data.videos.map((v,i)=>`<article class="video-segment"><div class="video-meta"><span class="${tagClass(v.tag)}">${v.tag}</span><span class="time-chip">${fmt(v.start)}–${fmt(v.end)}</span></div><h5>${v.label}</h5><p><b>${v.source}</b><br>${v.focus}</p><div class="video-actions"><button class="segment-play" data-video="${v.videoId}" data-start="${v.start}" data-end="${v.end}">▶ Play tagged part here</button><a class="segment-open" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${v.videoId}&t=${v.start}s">Open on YouTube ↗</a></div></article>`).join("");
    panel.innerHTML=`<div class="study-guide-head"><div><span class="eyebrow">CONTENT-FIRST STUDY GUIDE</span><h3>Read first → watch only the tagged parts → practise</h3></div><div class="study-estimate">${data.estimated}</div></div><div class="study-outcome"><b>Session outcome:</b> ${data.outcome}</div><div class="study-prereq">${data.prerequisites.map(x=>`<span>Prerequisite · ${x}</span>`).join("")}</div><div class="study-columns"><div><div class="study-subhead"><h4>1 · Read First</h4><span class="section-tag">UNDERSTAND</span></div>${reads}</div><div><div class="study-subhead"><h4>2 · Watch Tagged Parts</h4><span class="section-tag">FOCUSED VIDEO</span></div>${vids}</div></div><div class="study-commands"><div class="study-subhead"><h4>3 · Commands / tools to try</h4><span class="section-tag">PROVE IT</span></div><div class="command-grid">${data.commands.map(c=>`<code>${c}</code>`).join("")}</div></div><div class="teach-back"><strong>4 · Teach-back checkpoint:</strong> ${data.teachBack}</div>`;
    panel.querySelectorAll(".segment-play").forEach(btn=>btn.addEventListener("click",()=>{
      const iframe=document.getElementById("videoFrame");
      const video=btn.dataset.video, start=btn.dataset.start, end=btn.dataset.end;
      iframe.src=`https://www.youtube.com/embed/${video}?start=${start}&end=${end}&autoplay=1&rel=0`;
      const vp=document.querySelector(".video-panel"); if(vp) vp.scrollIntoView({behavior:"smooth",block:"start"});
    }));
  }
  window.renderStudyGuide=renderStudyGuide;
  window.addEventListener("load",()=>{
    ensureStyles(); ensurePanel();
    const original=window.openLesson;
    if(typeof original==="function"){
      window.openLesson=function(id){ original(id); renderStudyGuide(Number(id)); };
    }
    document.addEventListener("click",()=>{
      const lesson=document.getElementById("lessonView");
      if(!lesson || lesson.classList.contains("hidden")) return;
      const title=document.getElementById("lessonTitle")?.textContent;
      const s=(window.COURSE_SESSIONS||[]).find(x=>x.title===title);
      if(s) renderStudyGuide(s.id);
    },true);
  });
})();
