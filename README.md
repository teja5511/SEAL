# SEAL — Storm Emergency Action Ledger

**Seal the drain before the rain. Pay the crew only when the photo proves it.**

🌐 **Live Web App:** [https://seal-five-sigma.vercel.app/](https://seal-five-sigma.vercel.app/)

SEAL is a climate-dispatch app for urban monsoon flooding. Cities rarely flood because of rainfall alone. They flood because a **storm drain** is clogged with plastic and silt, and nobody is paid to clear it before the cloud arrives. (Hyderabad crews say **nala** — EN+TE mode keeps that word; English mode does not.)

The product is a closed loop, not a dashboard:

1. Rank which drains will fail under the next rain band.
2. Dispatch informal waste-picker crews.
3. Hold work if wet-bulb heat is unsafe.
4. Release rupees only when an after-photo proves the same drain is open.

Built for **NextStep Hacks 2026** (HackAlphaX, theme *Earth Forward*): waste reduction, flood resilience, and informal livelihoods in one operational loop.

The brand is city-agnostic. The recorded demo is seeded on **Hyderabad (GHMC)** drain pins so the story is concrete.

---

## Why this exists

Civic complaint apps let residents report a clog. Weather apps show a rain cloud. Heat dashboards tell outdoor workers to stay home. None of those pay the people who already know every storm drain, on the night before the flood, without sending them into lethal heat.

SEAL treats a drain job as **proof-of-cooling-the-flood**: photo in, rank, dispatch, photo out, escrow.

---

## Product surfaces

| Route | Role |
|---|---|
| [`/`](app/page.tsx) | **Command** — dark MapLibre map, Replay Storm clock, ranked queue, WBGT heat gate, dispatch |
| [`/report`](app/report/page.tsx) | **Report** — camera / sample drain photo → clog class + 0–100 score as JSON |
| [`/crew`](app/crew/page.tsx) | **Crew** — WhatsApp-shaped job card (English + Telugu), after-photo, HeatGuard HOLD |
| [`/ledger`](app/ledger/page.tsx) | **Ledger** — before/after slider, ₹ paid only on verify, households saved vs at risk |

APIs:

- `GET /api/weather` — WeatherNext 3 (Earth Engine) → Open-Meteo → Replay Storm
- `POST /api/vision` — Gemini 2.0 Flash on the photo, or a filename heuristic if no API key

---

## Dual-core contract

Generative models are not allowed to invent flood risk.

**Core 1 (deterministic).** Drain rank, precipitation percentiles, and WBGT come from code and geospatial/weather APIs. The score is immutable.

```
risk = (clog / 10)^1.4 × precip_p90_mm × basin_proxy × (1 + 0.35 × water_prob)
```

- **RED** if risk ≥ 220  
- **YELLOW** if risk ≥ 90  
- **WATCH** otherwise  

HeatGuard (from WBGT):

- `WORK` under 28°C WBGT  
- `SHADE_BREAK` from 28–32°C  
- `HOLD` at 32°C WBGT and above — map redness cannot override this  

**Core 2 (language only).** Gemini may label a drain photo and write crew copy. It cannot change Core 1 scores or release escrow.

---

## Replay Storm

Judging is a recorded video, so the demo does not depend on live weather.

| Beat | What happens |
|---|---|
| **T–6h** | Crews idle, light rain, yellow watch list |
| **T–4h** | Nowcast ~28–40 mm p90; high-risk pins go RED and auto-dispatch |
| **T–2h** | After-photos verify some jobs; one pin stays on heat **HOLD** |
| **T–0** | First rain. Split view: sealed storm drains stay dry, unsealed RED pins flood |

Press **Replay Storm** on Command, or click the four beats. Toggle **Go live** to pull `/api/weather` instead of the script.

---

## Data sources

| Source | Used for | When |
|---|---|---|
| [Google DeepMind WeatherNext 3](https://developers.google.com/weathernext/guides/earth-engine) on Earth Engine | Hourly precip p90, 2 m temp / dewpoint over Hyderabad | `EE_PROJECT` + `EE_PRIVATE_KEY_JSON` and [allowlist](https://developers.google.com/weathernext/guides/access-forecast) (often 5–7 days) |
| Dynamic World / Sentinel-2 / SRTM (via Earth Engine cache) | Water probability, NDWI, NDBI, elevation | Live GEE or [`data/gee-cache.json`](data/gee-cache.json) |
| [Open-Meteo](https://open-meteo.com/) | Live fallback nowcast | No Earth Engine keys |
| Replay scenario | Scripted 6-hour storm | Default Command demo |
| Gemini 2.0 Flash | Drain photo → `clear \| silt \| plastic \| blocked` | `GEMINI_API_KEY`; otherwise heuristic from filename |

WeatherNext 3 collections (when enabled):

- `projects/gcp-public-data-weathernext/assets/weathernext_3_0_0_0p1deg` (~11 km precip / wind)
- `projects/gcp-public-data-weathernext/assets/weathernext_3_0_0_0p05deg` (~5 km station temp / dewpoint)

---

## Stack

- **App:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion  
- **Map:** MapLibre GL + OpenFreeMap dark (no Mapbox bill)  
- **Earth observation:** `@google/earthengine` on the server only  
- **Vision:** Gemini 2.0 Flash (`POST /api/vision`)  
- **Demo data:** 24 Hyderabad storm-drain pins in [`data/hyderabad-nalas.json`](data/hyderabad-nalas.json)

What this repo deliberately does **not** include: Twilio, live UPI, Landsat sidewalk routing, a climate chatbot.

---

## Run locally

Requires Node.js 18+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build    # production check
npm start        # serve the production build
```

### Environment

Copy [`.env.example`](.env.example):

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | No | Live drain vision. Demo samples work without it. |
| `EE_PROJECT` | No | GCP project registered for Earth Engine |
| `EE_PRIVATE_KEY_JSON` | No | Service-account JSON (string) for WeatherNext 3 |
| `NEXT_PUBLIC_MAP_STYLE` | No | MapLibre style URL; defaults to OpenFreeMap dark |

Without keys the UI still records: Replay Storm + Open-Meteo + vision heuristics.

---

## Repository layout

```
app/page.tsx            Command
app/report/page.tsx     Resident photo
app/crew/page.tsx       Crew WhatsApp
app/ledger/page.tsx     Proof ledger
app/api/weather/        WeatherNext 3 / Open-Meteo / replay
app/api/vision/         Gemini / heuristic clog JSON
lib/rank.ts             Immutable risk formula
lib/wbgt.ts             HeatGuard WORK / SHADE_BREAK / HOLD
lib/scenario.ts         Replay Storm beats
lib/store.ts            T–6 → T–0 state machine
lib/gee.ts              Earth Engine + WeatherNext 3 client
data/hyderabad-nalas.json
data/gee-cache.json
public/demo/            Sample before/after drain SVGs
DEVPOST.md              3–5 minute video beat sheet
```

---

## Video for judges

See [`DEVPOST.md`](DEVPOST.md). Record Replay Storm on Command, then Report → Crew (HOLD + verify) → Ledger (slider + ₹). No outdoor shoot required.

---

## License

Hackathon prototype for NextStep Hacks 2026. WeatherNext real-time fields follow [Google DeepMind experimental terms](https://developers.google.com/weathernext/guides/access-forecast); historical WeatherNext data is CC BY 4.0.
