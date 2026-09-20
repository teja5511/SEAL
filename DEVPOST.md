# SEAL — Storm Emergency Action Ledger

**Tagline:** Seal the drain before the rain. Pay the crew only when the photo proves it.

## Elevator (first 20 seconds)

Cities don’t flood because of rain. They flood because a storm drain is clogged and nobody is paid to clear it before the cloud arrives. SEAL is the ledger that dispatches waste-picker crews, refuses to send them into unsafe heat, and pays only when the after-photo proves the drain is open.

## Earth Forward

Waste reduction + flood resilience + informal livelihoods. Not a chatbot. Not a heatmap homepage.

## What we fused

- CryoGrid: cinematic command map, hours-ahead clock, dispatch — without fake Landsat sidewalk routing.
- NalaPay: the actual job (clogged storm drains).
- CoolReceipt: pay only on verified before/after photos.
- HeatGuard: WORK / SHADE_BREAK / HOLD from WBGT. Map redness cannot override.
- Research PDFs: dual-core (deterministic GEE/WeatherNext 3 vs constrained Gemini). Mangrove MVI dropped — Hyderabad is not a mangrove estuary.

## Demo beat sheet (record Replay Storm)

1. 0:00–0:20 Problem: last monsoon, bikes under water. One clogged storm drain.
2. 0:20–1:40 Command `/` — press Replay next 6 hours. T–6 idle → T–4 pins go red → queue auto-dispatches.
3. 1:40–2:20 Report `/report` — sample plastic photo → clog JSON overlay.
4. 2:20–3:20 Crew `/crew` — WhatsApp job, Telugu line, heat HOLD on one pin, after-photo on another.
5. 3:20–4:20 Ledger `/ledger` — slider, ₹ escrow, households not inundated vs unsealed flood.
6. 4:20–5:00 Architecture: Core 1 immutable rank + WeatherNext 3 p90 (or Open-Meteo fallback) + Gemini cannot change the score.

## Try it

Live URL after `vercel` deploy. Repo: this folder. No live outdoor demo required.
