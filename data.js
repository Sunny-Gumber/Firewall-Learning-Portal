(() => {
  const VIDEO = {
    network: "https://www.youtube.com/embed/videoseries?list=PLxbwE86jKRgMpuZuLBivzlM8s2Dk5lXBQ",
    wireshark: "https://www.youtube.com/embed/rmFX1V49K8U",
    fortigate: "https://www.youtube.com/embed/UCcR2ZX-HyY",
    paloalto: "https://www.youtube.com/embed/videoseries?list=PLQQoSBmrXmrw6njwWXSIOiWZE7La8PA5P",
    checkpoint: "https://www.youtube.com/embed/videoseries?list=PL4Jm1LJEII4b-aoZQ5SltYgzRMPkRPn1u"
  };

  const LINKS = {
    "Networking Foundation": [
      ["Cisco Skills for All", "https://skillsforall.com/"],
      ["Jeremy's IT Lab CCNA Playlist", "https://www.youtube.com/playlist?list=PLxbwE86jKRgMpuZuLBivzlM8s2Dk5lXBQ"]
    ],
    "FortiGate": [
      ["Fortinet Training Institute", "https://training.fortinet.com/"],
      ["FortiGate starter video", "https://www.youtube.com/watch?v=UCcR2ZX-HyY"]
    ],
    "Palo Alto": [
      ["Palo Alto Education Services", "https://www.paloaltonetworks.com/services/education"],
      ["Keith Barker Palo Alto 0–60", "https://www.youtube.com/playlist?list=PLQQoSBmrXmrw6njwWXSIOiWZE7La8PA5P"]
    ],
    "Check Point": [
      ["Check Point Training", "https://www.checkpoint.com/services/training/"],
      ["CCSA Video Playlist", "https://www.youtube.com/playlist?list=PL4Jm1LJEII4b-aoZQ5SltYgzRMPkRPn1u"]
    ],
    "Multi-Vendor": [
      ["Fortinet Training", "https://training.fortinet.com/"],
      ["Palo Alto Education", "https://www.paloaltonetworks.com/services/education"],
      ["Check Point Training", "https://www.checkpoint.com/services/training/"]
    ]
  };

  const RAW = [
    [1,1,"Networking Foundation","How a Packet Actually Travels","Build the mental model that every firewall decision depends on.","Watch OSI/TCP-IP and Life of a Packet. Focus on encapsulation, default gateway and the return path.","An IP packet is carried inside a Layer-2 frame. For an off-subnet destination, the host resolves the default gateway MAC, sends the packet to the gateway, and each routed hop rebuilds Layer-2 framing. A stateful firewall then adds route, policy, NAT and session decisions.","The PC can ping its gateway but cannot open any Internet site.","Draw the complete journey from your laptop to a public website. Label ARP, DNS, route lookup, policy, NAT, TCP handshake and the return path.","A packet capture showing DNS, ARP and the TCP handshake"],
    [1,2,"Networking Foundation","IPv4 Addressing & Subnetting","Look at an IP/prefix and immediately decide local versus routed communication.","Watch IPv4 addressing and subnetting lessons. Practise /24 through /30 by hand.","The subnet mask defines the local network boundary. Correct firewall routing, interfaces, zones and address objects all depend on accurate prefix calculations. Longest-prefix logic later uses the same CIDR understanding.","Two hosts on the same switch communicate inconsistently because their subnet masks differ.","Create subnets for 200 Users, 100 CCTV devices, 30 Servers and 20 Management devices with growth space.","Correct network, usable-host and broadcast calculations"],
    [1,3,"Networking Foundation","ARP, ICMP & First Troubleshooting","Use ARP and ICMP as evidence instead of treating ping as a complete network test.","Review ARP and ICMP, then capture both in Wireshark.","ARP resolves a local IPv4 next hop to a MAC address. ICMP echo only proves an ICMP path; it does not prove DNS, TCP, authentication or application health. A good troubleshooter knows exactly what each test proves.","A server does not answer ping but its HTTPS application opens normally.","Capture one ARP exchange and one ICMP exchange and explain every important field.","ARP table plus a packet capture identifying the ARP requester/replier"],
    [2,1,"Networking Foundation","TCP, UDP & Ports","Understand sessions well enough to troubleshoot real firewall traffic.","Watch TCP/UDP plus the Wireshark TCP walkthrough. Identify SYN, SYN/ACK, ACK, FIN and RST.","The TCP 5-tuple is source IP, destination IP, source port, destination port and protocol. TCP creates explicit connection state; UDP does not have a handshake, although stateful firewalls still track UDP flows using timers.","A client retransmits SYN packets but never receives SYN/ACK.","Capture an HTTPS session and document its 5-tuple, handshake and teardown.","A Wireshark trace showing SYN, SYN/ACK, ACK and the selected client source port"],
    [2,2,"Networking Foundation","DNS, DHCP & Supporting Services","Recognise dependency failures that users often call firewall problems.","Watch DNS and DHCP lessons, then test nslookup/dig and a DHCP renewal in a lab.","DNS maps names to addresses; DHCP supplies client configuration. DHCP discovery begins as broadcast traffic, so routed designs may require a relay. DNS failure can look like an Internet outage even when routing and NAT are perfect.","The user can ping 8.8.8.8 but google.com does not resolve.","Build a decision tree for 'Internet not working' that separates DNS, routing, firewall and application failures.","Successful/failed nslookup evidence plus a DNS packet capture"],
    [2,3,"Networking Foundation","Wireshark for Firewall Engineers","Use packet captures to prove where a connection fails.","Use the Wireshark TCP video and practise host, protocol and port filters.","A capture is evidence only at the point where it was taken. Comparing LAN-side and WAN-side captures is extremely powerful: it can prove whether a packet entered a device, left it, was translated, or received a reply.","The client times out, but WAN-side capture shows its SYN leaving the firewall.","Save a capture of one HTTPS session and write a 10-point analysis of what the trace proves.","Matching ingress/egress captures that localise where traffic disappears"],
    [3,1,"Networking Foundation","VLANs, Trunks & Inter-VLAN Routing","Build segmentation before you build security policy.","Watch VLAN parts 1–3. Focus on access ports, 802.1Q trunks and inter-VLAN routing.","VLANs create separate broadcast domains. Access ports carry one untagged access VLAN; trunks carry multiple tagged VLANs. Traffic between VLANs requires a Layer-3 gateway, which may be a router, L3 switch or firewall.","A PC in VLAN 10 cannot reach a server in VLAN 20 although both access ports are up.","Design Users, CCTV, Servers and Management VLANs and document exactly which flows should be allowed.","Switch VLAN/trunk status plus gateway reachability from both VLANs"],
    [3,2,"Networking Foundation","Routing Tables & Longest Prefix Match","Read route decisions before blaming security policy.","Watch routing fundamentals, static routes and default routes.","A router/firewall selects the most specific matching prefix, then resolves the next hop or egress interface. Forward routing and return routing both matter; asymmetric paths can break stateful inspection.","Traffic for a private branch network follows the Internet default route.","Create a sample routing table and predict the selected route for ten destinations.","The routing table entry selected by longest-prefix match"],
    [3,3,"Networking Foundation","NAT, PAT & Port Forwarding","Understand translation as a separate function from access control.","Watch NAT/PAT lessons and draw before/after packet headers.","Source NAT changes the initiator identity, PAT lets many sessions share an address using ports, and destination NAT publishes an internal service. NAT does not replace the firewall policy and does not repair missing routes.","DNAT exists for a web server but external clients still cannot connect.","Draw SNAT, PAT, DNAT and hairpin/U-turn examples showing original and translated headers.","A session/log or packet capture proving the expected translated source/destination"],

    [4,1,"FortiGate","FortiGate Architecture & Initial Setup","Translate your networking model into FortiOS components.","Use Fortinet self-paced training and the FortiGate Day 1 video. Focus on interfaces, routes, policies, objects and logs.","FortiOS brings interfaces, routing, policy, NAT, security profiles, VPN and logging into one platform. A clean baseline includes secure administration, DNS/NTP, interface addressing, backups and named objects.","The FortiGate GUI works from one subnet but not from another.","Create a FortiGate baseline checklist covering management, admin security, DNS/NTP, backup and interface plan.","Interface administrative-access settings plus routing to the management source"],
    [4,2,"FortiGate","FortiGate Interfaces, VLANs & Routing","Build a correct forwarding path before writing policies.","Watch FortiGate interface, VLAN and routing modules.","Layer-3 interfaces define connected networks. VLAN subinterfaces add tagged logical networks. Static/default routes decide egress, and routing must be valid before a permit policy can successfully deliver traffic.","A VLAN client can ping the FortiGate gateway but not reach the Internet.","Build Users, CCTV and Servers VLAN interfaces with a WAN default route in your lab.","get router info routing-table output plus interface status"],
    [4,3,"FortiGate","FortiGate Firewall Policies","Make policy order, objects and logging predictable.","Study firewall-policy matching and create policies rather than relying on broad defaults.","Policies normally match incoming/outgoing interface, source, destination, service and schedule, then apply action, NAT and security profiles. Policy order matters; useful logging makes verification far easier.","A broad allow rule above a restrictive rule causes unexpected access.","Create least-privilege policies for Users, CCTV, Servers and Guest, with meaningful names and logging.","Policy hit counters and forward-traffic logs showing the matched rule"],
    [5,1,"FortiGate","FortiGate Source NAT & IP Pools","Control outbound identity and verify the translation.","Study FortiGate SNAT, overload and IP pools.","Outbound NAT may use the outgoing interface address or an IP pool. Translation is associated with the session; verify both the policy decision and the translated address rather than assuming NAT occurred.","Internet policy allows traffic but upstream sees private RFC1918 source addresses.","Create outbound NAT for two internal VLANs and record the translated address for each.","FortiGate session/traffic log showing the translated source"],
    [5,2,"FortiGate","FortiGate DNAT, VIP & Port Forwarding","Publish internal services without losing packet-flow clarity.","Study Virtual IPs, DNAT and port forwarding.","A FortiGate VIP represents destination translation. The firewall policy must reference the correct destination object/interface path, and the internal server must have a valid return path back through the firewall.","The VIP is configured but no firewall policy permits the published service.","Publish a test HTTPS service using a VIP and document original versus translated destination/port.","WAN-side and LAN-side capture or traffic log proving DNAT"],
    [5,3,"FortiGate","FortiGate Security Profiles","Add threat prevention without hiding the root cause when something breaks.","Study IPS, antivirus, web filtering, DNS filtering, application control and SSL inspection.","Security profiles inspect traffic that a firewall policy already permits. Deep inspection increases visibility into encrypted traffic but introduces certificate, compatibility and performance considerations.","A site fails only after deep SSL inspection is enabled.","Apply profiles one at a time to a controlled policy and record the log/event created by each.","A UTM/security event identifying which profile and signature/category acted"],
    [6,1,"FortiGate","FortiGate Site-to-Site IPsec VPN","Build an encrypted routed path and separate tunnel health from application reachability.","Study IKE, Phase 1, Phase 2/selectors, routes and firewall policies.","An IPsec tunnel can be established while protected traffic still fails. You must validate negotiation, selectors, routes, policies, NAT exemptions where relevant and the remote return path.","The VPN reports up, but internal subnets cannot communicate.","Design a two-site VPN and document local/remote networks, routes, policies and validation tests.","VPN status plus packet/session evidence for traffic entering the tunnel"],
    [6,2,"FortiGate","FortiGate SD-WAN, Failover & HA Concepts","Understand path and device resilience instead of only steady-state connectivity.","Study SD-WAN health checks, SLA rules and FortiGate HA concepts.","SD-WAN can steer traffic based on health and SLA rather than simple interface state. HA protects against firewall failure, but state/config synchronisation and monitored links determine how clean failover will be.","The primary ISP is unusable upstream, but the physical interface remains up and traffic does not fail over.","Design dual-ISP steering with health checks and write the expected failover/failback sequence.","SLA/health-check state showing why a member is selected or removed"],
    [6,3,"FortiGate","FortiGate Troubleshooting with CLI & Packet Flow","Build a repeatable FortiGate diagnostic workflow.","Study routing-table checks, policy hits, sessions, diagnose debug flow and packet capture.","Good troubleshooting proves each stage: ingress, route, policy, NAT, UTM, session, egress and return traffic. CLI flow debugging and sniffer captures are especially useful when GUI logs are insufficient.","One internal subnet fails while all other subnets use the same WAN normally.","Create and use a 10-step FortiGate troubleshooting checklist on an intentionally broken policy or route.","diagnose debug flow/sniffer evidence identifying the exact drop or decision"],

    [7,1,"Palo Alto","Palo Alto Architecture, Interfaces & Zones","Understand PAN-OS building blocks and commit workflow.","Start Keith Barker 0–60 and Palo Alto official getting-started material.","PAN-OS separates interfaces, zones, virtual routers, objects, security policy and NAT policy. Configuration changes are staged until commit. Zones become fundamental security-policy context.","An interface is physically up but traffic never matches the expected security rule.","Build Trust, Untrust and DMZ zones and map Layer-3 interfaces correctly.","Interface/zone configuration plus a committed configuration and traffic log"],
    [7,2,"Palo Alto","Virtual Router, Routes & Packet Flow","Predict PAN-OS forwarding before changing policy.","Study virtual routers, static/default routes and PAN-OS packet flow.","Virtual routers contain routing decisions. Security policy and NAT are separate rulebases, so troubleshooting requires knowing which fields each stage evaluates and which egress zone the route determines.","Traffic matches an allow rule but exits an unexpected interface.","Configure connected, static and default routes and predict egress for ten destinations.","Virtual-router routing table and test-routing evidence"],
    [7,3,"Palo Alto","Palo Alto Security Policies & Objects","Write readable least-privilege rules with correct zone context.","Study security rules, address/service objects, logging and rule order.","Security rules can match source/destination zones and addresses, user, application, service and more. Log at session end is often useful for normal traffic; rule hit counts help identify unused or shadowed policy.","A route change sends traffic to a different destination zone, so an old rule no longer matches.","Build Users→Internet, Users→Servers, CCTV→NVR and Guest→Internet-only rules.","Traffic log showing the exact matched security rule and application"],
    [8,1,"Palo Alto","Palo Alto NAT & U-Turn NAT","Separate original packet fields from translated fields.","Study source NAT, destination NAT and U-turn/hairpin scenarios.","PAN-OS NAT policy is independent from security policy. Correct design depends on understanding original source/destination, translated source/destination, route-selected zones and the internal return path.","External DNAT works but internal users cannot reach the same service using its public FQDN.","Create SNAT, DNAT and U-turn designs and write the packet headers at each stage.","Traffic/session details showing source/destination translation"],
    [8,2,"Palo Alto","App-ID & Application-Default","Move from port-only filtering to application-aware policy.","Study App-ID, application dependencies and application-default.","App-ID identifies applications using multiple signals rather than trusting only port numbers. application-default can restrict an allowed App-ID to its expected standard ports, reducing exposure from non-standard port use.","HTTPS is initially permitted, then the identified application is denied by a more specific policy decision.","Create an application-aware Internet policy and document how it tightens a port-only rule.","Traffic log application field and the matched rule after App-ID identification"],
    [8,3,"Palo Alto","Traffic Logs, Sessions & Policy Verification","Use PAN-OS evidence instead of GUI assumptions.","Study Monitor logs, session browser and policy/routing test commands.","Traffic logs show rule, application, zones, addresses, bytes and session end reasons. A session with outbound bytes but no return bytes points the investigation differently from a policy deny.","The user claims the firewall blocks an app, but the log says allow and shows no return bytes.","Create a troubleshooting worksheet based on traffic logs, session state, route verification and packet capture.","Traffic log plus session details that prove whether the firewall allowed and forwarded the flow"],
    [9,1,"Palo Alto","Security Profiles & Threat Prevention","Attach layered inspection to allowed traffic and know which layer acted.","Study antivirus, anti-spyware, vulnerability protection, URL filtering and file controls.","Access policy answers 'may this session exist?' while security profiles inspect permitted sessions for threats/content. A reset may therefore occur after the security rule allowed the connection.","Traffic is allowed by policy but reset by a threat-prevention profile.","Create a security-profile group and test at least two controlled events/categories.","Threat log identifying the exact profile/signature/action"],
    [9,2,"Palo Alto","User-ID, GlobalProtect & SSL Decryption Concepts","Add identity, remote access and encrypted inspection to policy design.","Study User-ID, GlobalProtect fundamentals and SSL decryption architecture.","User-ID maps traffic to identity for user/group policy. GlobalProtect provides remote access. TLS decryption provides visibility but requires trust certificates, privacy governance and exception handling for incompatible/pinned applications.","A certificate-pinned application fails only when decryption applies.","Design Finance and Engineering identity-based rules plus a decryption-exception process.","User mapping / GlobalProtect session / decryption log evidence relevant to the scenario"],
    [9,3,"Palo Alto","Palo Alto Troubleshooting Masterclass","Create a disciplined PAN-OS break/fix workflow.","Study packet capture stages, session troubleshooting and test commands.","Prove interface, routing, security policy, NAT, App-ID/security profile, session state and packet captures in a fixed order. Do not create broad rules as a diagnostic shortcut.","A GlobalProtect user connects successfully but cannot reach one internal application.","Troubleshoot five broken PAN-OS scenarios and record evidence before every change.","PAN-OS session/log/capture evidence locating the exact failing stage"],

    [10,1,"Check Point","Check Point Architecture: SmartConsole, Management & Gateway","Understand why Check Point's management architecture feels different.","Start Check Point Jump Start/CCSA material. Focus on SmartConsole, Security Management Server, Security Gateway and SIC.","SmartConsole is the administration client; the Management Server stores policy/objects and compiles policy; Security Gateways enforce installed policy. SIC establishes trusted communication between management and gateway components.","Objects can be edited in SmartConsole but policy installation to the gateway fails.","Draw the Check Point management architecture and explain every step from editing a rule to gateway enforcement.","SIC/gateway communication status and a successful policy-install result"],
    [10,2,"Check Point","Gaia, Interfaces, Routing & SIC","Build the platform foundation before security policy.","Study Gaia networking, interfaces, static/default routing and SIC setup.","Gaia provides the operating/network platform underneath Check Point security applications. Correct addressing, DNS/time and routing are prerequisites for reliable management and traffic handling.","The gateway is reachable in Gaia but does not establish trusted management communication.","Create a lab addressing/routing plan and document the prerequisites for SIC establishment.","Gaia route/interface output and SIC communication status"],
    [10,3,"Check Point","Access Control Policy & Objects","Build, publish and install a clear rulebase.","Study Access Control policy, objects, services, logging, publish and install workflow.","Check Point separates editing/publishing from policy installation. Rules can use networks, services, applications and identity context. Cleanup rules and logging improve control and investigation.","A rule was edited and published, but the gateway still enforces previous behaviour because policy was not installed.","Create and install Users, Servers, CCTV and Guest rules with logging and a cleanup rule.","SmartConsole policy-install status plus log showing the matching rule"],
    [11,1,"Check Point","Check Point NAT: Hide, Static & Manual Rules","Understand Check Point translation choices and verify them with traffic.","Study Hide NAT, Static NAT, automatic NAT and manual NAT rules.","Hide NAT supports many-to-one outbound translation; Static NAT provides a consistent mapping; manual NAT handles scenarios requiring explicit rule control. Routing and policy still matter on both directions.","Automatic NAT exists for a server object but return traffic follows an unexpected path.","Draw Hide NAT and Static NAT packet flows including translated and return traffic.","SmartConsole/log or packet capture evidence showing translated addresses"],
    [11,2,"Check Point","Threat Prevention, Logs & SmartConsole Investigation","Correlate Access Control and threat decisions.","Study Threat Prevention blades and SmartConsole log investigation.","Access Control and Threat Prevention answer different questions. A connection may pass access policy and later be blocked/reset by IPS, Anti-Bot, Antivirus or another inspection decision.","Access Control log shows Accept but the application still fails.","Investigate a mock incident using Access Control logs, Threat logs and network-path evidence.","A log entry that identifies the exact blade/action responsible"],
    [11,3,"Check Point","VPN, ClusterXL & Troubleshooting Concepts","Complete the enterprise Check Point picture with secure connectivity and resilience.","Study VPN communities/domains and ClusterXL fundamentals.","VPN communities and encryption domains define protected connectivity. ClusterXL provides gateway resiliency; synchronisation, member state and monitored interfaces affect failover and session continuity.","A cluster member fails but session continuity is poorer than expected.","Design two-gateway HA plus site-to-site VPN and write a controlled failure test plan.","Cluster member/sync state and VPN/security association evidence"],

    [12,1,"Multi-Vendor","Same Requirement on Three Vendors","Prove that firewall concepts survive GUI and terminology changes.","Review your FortiGate, Palo Alto and Check Point policy/NAT/routing lessons side-by-side.","The same requirement always reduces to traffic definition, route, access decision, translation/inspection, session state and return path. Vendor terminology changes; networking truth does not.","An engineer knows one GUI well but cannot explain the packet path on another vendor.","Implement conceptually Users→Internet and Public→DMZ on all three vendors and build a terminology comparison table.","Equivalent policy, route, NAT and log evidence on each vendor"],
    [12,2,"Multi-Vendor","Enterprise Break/Fix Challenge","Diagnose multiple simultaneous faults without random configuration changes.","Revisit troubleshooting modules and work from symptoms to evidence.","A senior troubleshooter defines one flow at a time, validates the endpoint and Layer-2/3 path, then proves firewall route, policy, NAT/VPN/inspection, session and return traffic before changing configuration.","Users lack Internet, one DNAT app fails, VPN connects without internal access, and ISP failover does not trigger.","Solve a four-fault scenario and write a root-cause report containing symptom, evidence, cause, fix and prevention for each.","A root-cause matrix supported by logs, routes, sessions or captures"],
    [12,3,"Multi-Vendor","Final Enterprise Firewall Design","Combine segmentation, security, resilience and operations into one professional design.","Use every previous source as reference and focus on design trade-offs rather than menu clicks.","A production design must cover zones/VLANs, least privilege, routing, NAT, remote/site VPN, threat prevention, HA/dual ISP, logging, backup, monitoring, change control and recovery. Security that cannot be operated reliably is not a complete design.","The network works but uses broad any-any rules, weak logging and no tested failure plan.","Produce an HLD/LLD-style design for HQ + 3 branches + dual ISP + DMZ + Users + Servers + CCTV + remote access, including testing and rollback.","A complete design document with traffic matrix, failure plan and verification checklist"]
  ];

  const phaseFaqs = {
    "Networking Foundation": [
      ["Why does firewall learning start with networking?","Because every firewall decision is made on network traffic. If you cannot predict the packet path, GUI configuration becomes memorisation."],
      ["What should I write before troubleshooting?","Source IP, destination IP, protocol/port, time of failure, expected path and expected result."],
      ["Does ping prove an application works?","No. It proves only the ICMP path that was tested."],
      ["Why is the return path important?","Stateful communication requires replies to return through a valid path, often through the same stateful firewall."],
      ["When should I use Wireshark?","Whenever logs and configuration do not conclusively show what happened to the packet."]
    ],
    "FortiGate": [
      ["What should I check before a FortiGate policy?","Interface/VLAN status and routing. An allow rule cannot fix an invalid path."],
      ["Why use objects instead of raw IPs everywhere?","Objects improve readability, reuse and change control."],
      ["What is the value of traffic logs?","They show which policy handled the flow and provide session/security context."],
      ["Should I use any-any during troubleshooting?","Avoid it as a shortcut. Prove the failing stage and make the smallest justified change."],
      ["Which FortiGate CLI skills matter most?","Routing table checks, session inspection, diagnose debug flow and packet sniffing."]
    ],
    "Palo Alto": [
      ["Why are zones so important in PAN-OS?","Security policy uses source and destination zones as core match criteria."],
      ["Is a Palo Alto security rule the same as a NAT rule?","No. Access control and address translation are separate rulebases."],
      ["Why is App-ID important?","It lets policy identify applications beyond simple destination-port assumptions."],
      ["What should logs tell me?","Matched rule, application, zones, addresses, bytes and session outcome/end reason."],
      ["Why commit?","PAN-OS configuration edits are staged and must be committed before they become active."]
    ],
    "Check Point": [
      ["Why separate Management Server and Gateway?","Central management stores/organises policy while gateways focus on enforcement."],
      ["What is SIC?","Secure Internal Communication establishes trust between Check Point components."],
      ["Why can a published rule still not affect traffic?","The updated policy must also be installed on the relevant gateway."],
      ["Access log says Accept; can another blade still block?","Yes. Threat Prevention or other inspection can still act on permitted traffic."],
      ["Why learn Gaia?","Interface, routing, system and platform health directly affect security-gateway behaviour."]
    ],
    "Multi-Vendor": [
      ["What should stay constant across vendors?","Your packet-flow model: ingress, route, policy, NAT/inspection, session, egress and return path."],
      ["What should I compare between vendors?","Policy model, NAT implementation, routing context, logging, HA, VPN and troubleshooting tools."],
      ["What makes someone senior rather than GUI-familiar?","They can predict and prove packet behaviour even on a platform they have not used before."],
      ["What is the best troubleshooting habit?","Change nothing until you can state what evidence suggests is wrong."],
      ["What belongs in a production design?","Security, routing, resilience, observability, operations, backup/recovery and a tested failure plan."]
    ]
  };

  function videoFor(phase, title){
    if (title.includes("Wireshark")) return VIDEO.wireshark;
    if (phase === "FortiGate") return VIDEO.fortigate;
    if (phase === "Palo Alto") return VIDEO.paloalto;
    if (phase === "Check Point") return VIDEO.checkpoint;
    return VIDEO.network;
  }

  function objectives(title){
    return [
      `Explain ${title} in your own words without relying on GUI labels`,
      "Place today's feature correctly in the end-to-end packet path",
      "Configure or model the feature in a controlled lab",
      "Use logs, routes, sessions or packet capture to verify the result",
      "Troubleshoot one deliberately broken version of the same scenario"
    ];
  }

  function concepts(title, core){
    return [
      ["Core idea", core],
      ["Packet-first question", `Before configuring ${title}, write the original source, destination, protocol/service, ingress point, expected route, policy decision, translation/inspection and return path.`],
      ["Verification rule", "Do not call a change successful because the GUI accepted it. Generate real test traffic and prove the result in logs, sessions, route output or packet capture."],
      ["Trainer mindset", "After the lab, explain the topic as if teaching a junior engineer. If you cannot explain why each step exists, repeat the packet-flow exercise."]
    ];
  }

  function lab(title, proof){
    return [
      "Draw a small topology and state the expected traffic before touching configuration.",
      "Record source IP, destination IP, protocol/port or application, ingress and expected egress.",
      `Configure or model the minimum elements required for ${title}.`,
      `Generate test traffic and collect: ${proof}.`,
      "Intentionally break one relevant setting and compare the new symptom with the healthy baseline.",
      "Restore service and write the root cause, evidence, corrective action and one preventive control."
    ];
  }

  function troubleshootingSteps(){
    return [
      "Define one exact failing flow: source, destination, service/application and timestamp.",
      "Verify endpoint addressing, subnet, gateway and local dependencies.",
      "Verify Layer-2/VLAN reachability where relevant.",
      "Verify route/next hop and expected egress in both directions.",
      "Verify policy, NAT, VPN or security-profile decisions relevant to the session.",
      "Check logs and live session/flow information.",
      "Use packet capture when the previous evidence is not conclusive.",
      "Change only the component proven wrong, retest, then document the result."
    ];
  }

  function quiz(title, proof){
    return [
      {
        question: `Which evidence best validates the result of today's ${title} lab?`,
        options: [proof, "A firewall reboot", "An any-any permit rule", "A screenshot of the login page"],
        answer: 0,
        explain: "Verification should come from evidence directly related to the packet/feature being tested."
      },
      {
        question: "Before changing a firewall rule during troubleshooting, what should you establish?",
        options: ["A reproducible failing flow and evidence", "A plan to disable logging", "A broad temporary any-any rule", "A factory reset"],
        answer: 0,
        explain: "Start with a specific flow and evidence so the change is tied to a proven cause."
      },
      {
        question: "If a packet is captured leaving the firewall but no reply returns, where should the investigation expand?",
        options: ["Only the source PC", "Upstream network, destination and return path", "The firewall GUI theme", "Delete all NAT rules"],
        answer: 1,
        explain: "The outbound capture proves forwarding to that point; investigate what happens after it and on the return path."
      }
    ];
  }

  window.COURSE_SESSIONS = RAW.map((r, i) => {
    const [week, day, phase, title, goal, watch, core, issue, assignment, proof] = r;
    return {
      id: i + 1,
      week,
      day,
      phase,
      title,
      goal,
      watch,
      video: videoFor(phase, title),
      objectives: objectives(title),
      concepts: concepts(title, core),
      packetFlow: `SESSION: ${title}\n\nSource → ingress → route lookup → security decision → NAT/VPN/inspection → egress → destination\n  ↑                                                                                           │\n  └────────────────────────────── return traffic / session path ───────────────────────────────┘\n\nChallenge: Mark exactly where today's feature changes, permits, translates, inspects or verifies this flow.`,
      lab: lab(title, proof),
      troubleshooting: issue,
      troubleshootingSteps: troubleshootingSteps(),
      faqs: phaseFaqs[phase],
      assignment,
      quiz: quiz(title, proof),
      links: LINKS[phase]
    };
  });
})();
