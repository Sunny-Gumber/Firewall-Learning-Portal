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
