# GateRunner

GateRunner is an aviation analytics tool that estimates whether a passenger can safely make a flight connection by modeling real airport transfer times and operational uncertainty.

![GateRunner](gaterunner.png)

## Why this project matters

Flight connections are one of the most common operational risks in aviation.
Missed connections cost airlines millions yearly and affect passenger satisfaction.
GateRunner models this decision process using timing uncertainty instead of fixed thresholds.

---

![Main Screenshot](gaterunner.png)

GateRunner is a data-driven application that predicts whether a passenger can safely make a flight connection.
## Tech Stack

- React
- Node.js
- TypeScript
- JSON-based airport configuration models

---

## Problem

Passengers often misjudge whether their connection time is sufficient, especially in unfamiliar airports.  
GateRunner estimates the real time required for a connection using operational airport timing models.

---

## Methodology

The model decomposes connection time into:

- aircraft deplaning time
- terminal transfer time
- security processing time
- operational buffer

Each component uses statistical timing ranges (p50 / p90).

If an airport is not configured, the system uses a generic airport profile to estimate timings.

---

## Output

Connections are classified as:

- SAFE — connection time comfortably exceeds estimated requirements
- TIGHT — connection may be possible but with moderate risk
- RISKY — high probability of missing the connection

---

## Tech Stack

- React
- Node.js
- TypeScript
- JSON-based airport configuration models

---

## Project Structure
```
gaterunner-mvp/
├── client/        # Frontend React application
├── server/        # Backend logic and API
├── shared/        # Shared models and configuration
├── patches/       # Configuration patches
├── Gaterunner_1.png
├── Gaterunner_2.png
├── Gaterunner_3.png
├── gaterunner.png
└── README.md
```

---

## How to Run

### 1. Clone the repository
```bash
git clone https://github.com/Danalytiks/Gaterunner.git
cd gaterunner-mvp
```

#### 2. Install dependencies

Make sure you have Node.js (LTS) installed.

Then install the project dependencies:

pnpm install


#### 3. Run the development server
pnpm run dev


##### 4. Open the application

Open your browser and go to:
http://localhost:3000


#### Prerequisites

The following tools must be installed:
* Node.js (LTS)
* pnpm

If pnpm is not installed, run:
* corepack enable
* corepack prepare pnpm@latest --activate





