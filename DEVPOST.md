# SEAL — Storm Emergency Action Ledger

**Tagline:** Seal the drain before the rain. Pay the crew only when the photo proves it.

## Elevator (first 20 seconds)

Cities don’t flood because of rain. They flood because a storm drain is clogged and nobody is paid to clear it before the cloud arrives. SEAL is the action ledger that dispatches waste-picker crews ahead of the storm, refuses to send them into unsafe heat, and pays only when the verified after-photo proves the drain is clear. Dual-core rank is immutable: deterministic hydrologic physics and satellite telemetry set the risk; Gemini assists with vision and dispatch but can never invent or alter risk scores.

## Earth Forward

Waste reduction + flood resilience + informal livelihoods. Not a chatbot. Not a heatmap homepage.
- **EN default, EN+TE optional:** English by default for international judges and municipal coordination; optional EN+TE (Telugu) for Hyderabad waste-picker field crews.
- **Pay only on verified after-photo:** Indian rupees (₹) remain locked in escrow until computer vision authenticates clear water flow.
- **Dual-core rank immutable:** Core 1 physics and Google Earth Engine / WeatherNext 3 calculate rank deterministically. Gemini cannot alter scores or hallucinate risk.

## What we fused

- **CryoGrid:** cinematic command map, hours-ahead clock, dispatch — without fake Landsat sidewalk routing.
- **NalaPay:** the actual job (clogged storm drains in vulnerable wards).
- **CoolReceipt:** pay only on verified after-photos — escrow never unlocks on a promise.
- **HeatGuard:** WORK / SHADE_BREAK / HOLD from Wet-Bulb Globe Temperature (WBGT). Map redness cannot override crew safety.
- **Analytics Scoreboard:** video-ready scoreboard tracking the RED/YELLOW/WATCH risk mix, households saved, and verified jobs at T–0.
- **Research PDFs:** dual-core architecture (deterministic GEE/WeatherNext 3 vs constrained Gemini). Mangrove MVI dropped — Hyderabad is not a mangrove estuary.

## Demo beat sheet (record Replay Storm)

1. **0:00–0:20 Problem:** Last monsoon, bikes under water. One clogged storm drain causes miles of backup.
2. **0:20–1:20 Command (`/`):** Press *Replay next 6 hours*. T–6 idle → T–4 pins turn RED → queue auto-dispatches crews. Demonstrate locale toggle (EN default, EN+TE optional toggle in sidebar).
3. **1:20–2:00 Report (`/report`):** Sample plastic photo → Gemini Vision clog classification JSON overlay without altering underlying hydrologic rank.
4. **2:00–2:50 Crew (`/crew`):** WhatsApp-ready job card, localized Telugu instruction, heat HOLD trigger on an extreme-WBGT drain, after-photo submitted.
5. **2:50–3:40 Ledger (`/ledger`):** Proof slider comparing before/after — escrow released (pay only on verified after-photo), households saved vs flood backup if unsealed.
6. **3:40–4:20 Analytics (`/analytics`):** Video-ready scoreboard displaying RED/YELLOW/WATCH risk mix, households saved count, verified jobs at T–0, and action vs inaction impact.
7. **4:20–5:00 Architecture:** Dual-core rank immutable — deterministic Core 1 (GEE DEM slope, catchment, WeatherNext 3 p90 or Open-Meteo fallback) + constrained Gemini assistant (Gemini cannot change the score or invent risk).

## Try it

Live URL after `vercel` deploy. Repo: this folder. No live outdoor demo required.
