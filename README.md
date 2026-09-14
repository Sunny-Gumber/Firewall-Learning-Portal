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
- Local progress tracking
- Export/import progress as JSON
- Responsive dark network-security UI
- GitHub Pages deployment workflow

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

## Run locally

Open `index.html`, or run a local web server:

```bash
python -m http.server 8000
```

Then browse to `http://localhost:8000`.

## GitHub Pages

The project contains `.github/workflows/pages.yml` for GitHub Pages deployment.

In the repository, go to **Settings → Pages** and select **GitHub Actions** as the source. Every push to `main` will then redeploy the portal.

Expected site URL:

`https://sunny-gumber.github.io/Firewall-Learning-Portal/`

## Progress and notes

Version 1 stores completion status, quiz scores, notes and assignment answers in browser `localStorage` so the portal can remain a free static site.

Use **Export Progress** and **Import Progress** to move/backup your data.

A later version can add Supabase authentication and cloud sync without changing the basic lesson structure.

## Content source structure

`data.js` contains the 36 lesson records. `app.js` renders them into the interactive learning interface.

Each lesson contains:

- learning goal
- video/watch target
- objectives
- concept notes
- packet-flow challenge
- lab
- troubleshooting scenario and workflow
- FAQs
- quiz
- assignment
- official/reference links
