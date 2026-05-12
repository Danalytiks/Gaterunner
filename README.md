# ✈️ GateRunner

> **"Together, we'll get there on time!"**

GateRunner is a React prototype that helps passengers with tight connections navigate **Munich Airport (MUC)** quickly and confidently — built by someone who works there.

🔗 **[Live Demo →](https://gaterunner.vercel.app)**

---

## 🧭 The Problem

Short layovers + unfamiliar airport = missed flights.

Airports can be overwhelming, especially for:
- 👴 Elderly travelers
- 🧳 Occasional flyers
- ⏱️ Passengers with tight connections

Often the time **is** sufficient — but passengers don't know the route and miss their flight anyway. GateRunner solves that.

---

## 📊 Data-Driven Risk Classification

The Safe / Tight / Risky thresholds used in GateRunner are not arbitrary — they are validated by a data analysis of **10 million US domestic flights (2024)**.

> 🔬 **[See the full analysis →](https://github.com/Danalytiks/flight-delay-connection-risk-analysis)**

Key finding: **~1 in 5 flights** lands in a Tight or Risky connection scenario, confirming the real-world need for GateRunner.

| Status | Buffer | Share of flights |
|---|---|---|
| 🟢 Safe | > 20 min | 77.96% |
| 🟡 Tight | 5–20 min | 12.83% |
| 🔴 Risky | < 5 min | 7.57% |

---

## 🚀 What It Does

1. **Enter your flight numbers** — incoming + connecting (flight-number based, not gate-based)
2. **Auto-lookup** of arrival gate, departure gate, and time to boarding
3. **Instant risk classification**: Safe 🟢 / Tight 🟡 / Risky 🔴
4. **Step-by-step directions** tailored to MUC's real layout — including bus, Satellite train, and MAC walking route
5. **Passenger feedback loop** for continuous data improvement

---

## 🏗️ MUC Airport Architecture

GateRunner is built around the real, verified layout of Munich Airport:

| Zone | Piers | Gates | Level | Connection to T2 |
|---|---|---|---|---|
| Terminal 1 | A | A01–A43 | 04 | Free shuttle bus (5–7 min) |
| Terminal 1 | B | B01–B17 | 04 | Free shuttle bus (5–7 min) |
| Terminal 1 | C | C01–C30 | 04 | Free shuttle bus (5–7 min) |
| Terminal 1 | D | D01–D23 | 04 | Free shuttle bus (5–7 min) |
| Terminal 1 | E | E01–E99 (VIP Wing) | 04 | Free shuttle bus (5–7 min) |
| Terminal 2 Main | G | G01–G48 | 04 | — |
| Terminal 2 Main | H | H01–H48 | 05 | — |
| T2 Satellite | K | K01–K30 | 04 | Satellite train (every 4 min, ≈ 2 min ride) |
| T2 Satellite | L | L01–L30 | 05 | Satellite train (every 4 min, ≈ 2 min ride) |

**T1 ↔ T2 transfer:**
- 🚌 Free shuttle bus — every **10 min** (07:00–17:00) / every **20 min** outside these hours, 5–7 min ride
- 🚶 Walk via **Munich Airport Center (MAC)** — pedestrian connection between Pier B/C and T2, ≈ 10 min on foot

---

## 🎯 Why Flight Numbers, Not Gates?

Using flight numbers unlocks richer context than a gate alone:
- ✅ Automatic arrival gate lookup
- ✅ Origin airport code
- ✅ Time remaining to boarding
- ✅ Destination airport code
- 🔜 Future: real-time delays, gate changes, airline alerts

---

## 🧮 Risk Classification Logic

Buffer = time available − walking time − security time

Security time is factored in based on gate position:
- Central gates (G/H 09–38, K/L 04–27): **+4 min**
- Pier Nord / Pier Süd gates: **+7 min**

---

## 🛠️ Stack

| | |
|---|---|
| Framework | React + Vite |
| Icons | Lucide React |
| Styling | CSS-in-JS (inline + injected keyframes) |
| Airport Data | Calibrated MUC walking time matrix (private) |
| Deploy | Vercel |

---

## 📐 Architecture

```
src/
├── App.jsx               # Full application (UI + logic)
│   ├── MainScreen        — Airport config, flight input, results, feedback
│   └── DirectionsScreen  — Step-by-step route with metrics
└── data/
    └── mucData.js        # 🔒 Pier graph + walking time matrix (private)
```

> The core data layer is intentionally kept private and will be replaced by a live flight API in production.

---

## 🗺️ Roadmap

- [ ] Live flight API integration (AeroDataBox / Lufthansa Open API)
- [ ] Real-time gate change alerts
- [ ] Multi-language support (🇬🇧 EN / 🇩🇪 DE / 🇵🇹 PT)
- [ ] Accessibility mode — reduced mobility routing with elevator guidance
- [ ] Feedback analytics dashboard
- [ ] Visual airport map with highlighted route
- [ ] Expansion to other airports (FRA, BER, VIE)

---

## 👨‍💻 Author

Built by **Daniela Costa Glotzbach** — working at Munich Airport (MUC) and passionate about solving real problems with data and design.

[![GitHub](https://img.shields.io/badge/GitHub-Danalytiks-181717?style=flat&logo=github)](https://github.com/Danalytiks)

---

*GateRunner — because every minute counts.* ⏱️
