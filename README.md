# Firewall Learning Portal

Interactive 12-week / 36-session learning portal covering:

- Networking fundamentals
- FortiGate
- Palo Alto Networks
- Check Point
- Multi-vendor troubleshooting and enterprise design

## Features

- Embedded video lessons and official reference links
- Concept notes and packet-flow challenges
- Hands-on labs and break/fix scenarios
- FAQs and checkpoint quizzes
- Assignment workspace and personal notes
- Bookmarks and searchable glossary
- Guided Packet Journey simulator
- Deterministic IPv4 Packet Engine
- Evidence-driven Troubleshooting Simulator
- Local progress tracking
- Export/import progress as JSON
- Responsive dark network-security UI
- GitHub Pages deployment workflow

## Packet Engine

`packet-engine.js` is a browser-side deterministic networking engine. It currently models:

- IPv4 validation and subnet decisions
- Same-subnet vs default-gateway behavior
- ARP next-hop reasoning
- Connected, static and default routes
- Longest-prefix route selection
- Interface-to-zone mapping
- Security-policy matching and implicit deny
- SNAT and DNAT
- Basic stateful-session creation
- Return-session / reverse-NAT reasoning

The Packet Engine UI includes working and broken presets such as HTTPS Internet access, policy-blocked SSH, missing default route, missing SNAT, same-subnet traffic, working DNAT and DNAT with a missing WAN-to-DMZ policy.

## Troubleshooting Simulator

The simulator trains an evidence-first workflow. A learner receives an incident, selects diagnostic actions, collects observations and makes a root-cause diagnosis. Unnecessary actions, hints and incorrect diagnoses reduce the score.

Current incident types include:

- DNS resolution blocked
- Missing default route
- SNAT disabled
- Application/port blocked by policy
- DNAT present but inbound security policy missing
- Remote return-path routing failure

Several incidents call the deterministic Packet Engine directly, so the observed drop reason is calculated rather than hard-coded.

## Learning approach

Each session follows a repeatable pattern:

1. Recap
2. Core concept
3. Packet flow
4. Video learning
5. Hands-on lab
6. Troubleshooting exercise
7. FAQ
8. Checkpoint quiz
9. Assignment and notes

The guiding principle is:

> **Learn the packet first. Then learn the vendor.**

## Course structure

| Weeks | Track |
|---|---|
| 1–3 | Networking foundations |
| 4–6 | FortiGate |
| 7–9 | Palo Alto Networks |
| 10–11 | Check Point |
| 12 | Multi-vendor troubleshooting and final design |

## Main files

- `data.js` — 36-session curriculum
- `simulator.js` — guided Packet Journey scenarios and glossary
- `packet-engine.js` — deterministic packet-processing engine
- `advanced-labs.js` — Packet Engine UI and Troubleshooting Simulator
- `app.js` — main learning portal state and navigation
- `styles.css` / `advanced.css` — interface styling

## Run locally

Open `index.html`, or run a local web server:

```bash
python -m http.server 8000
```

Then browse to `http://localhost:8000`.

## GitHub Pages

The project contains `.github/workflows/pages.yml` for automatic GitHub Pages deployment.

Live site:

`https://sunny-gumber.github.io/Firewall-Learning-Portal/`

## Progress and notes

Course progress, quiz scores, bookmarks, notes and assignment answers are stored in browser `localStorage` so the portal remains a free static site. Packet Engine / troubleshooting usage statistics are also stored locally.

Use **Export** and **Import** for the main course progress backup. A future version can add Supabase authentication and cloud sync without replacing the learning engine.
