import { useState, useEffect, useRef } from "react";
import {
  MapPin, Plane, BarChart2, MessageCircle,
  AlertTriangle, CheckCircle, Clock, XCircle,
  ArrowRight, ArrowLeft, ChevronDown, Train, Bus,
  Navigation, Navigation2, Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
//  CSS animations injected once
// ─────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
    100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .animate-up    { animation: fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both; }
  .animate-up-2  { animation: fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) 0.08s both; }
  .animate-up-3  { animation: fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) 0.16s both; }
  .animate-fade  { animation: fadeIn 0.35s ease both; }
  .pulse-ring    { animation: pulseRing 1.4s ease-out infinite; }
  .spin          { animation: spin 0.8s linear infinite; }

  .btn-primary {
    background: #2563eb; color: white; border: none;
    border-radius: 9px; padding: 11px 24px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
    font-family: inherit;
  }
  .btn-primary:hover:not(:disabled)  { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
  .btn-primary:active:not(:disabled) { transform: scale(0.97); }
  .btn-primary:disabled { background: #bfdbfe; cursor: not-allowed; }

  .btn-outline {
    background: transparent; border-radius: 9px;
    padding: 9px 16px; font-size: 13px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; gap: 6px;
    white-space: nowrap; transition: background 0.15s, transform 0.12s;
    font-family: inherit;
  }
  .btn-outline:hover  { filter: brightness(0.93); }
  .btn-outline:active { transform: scale(0.96); }

  .btn-back {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
    border-radius: 20px; padding: 7px 16px;
    color: white; font-size: 14px; font-weight: 600;
    cursor: pointer; margin-bottom: 16px;
    transition: background 0.15s; font-family: inherit;
  }
  .btn-back:hover { background: rgba(255,255,255,0.25); }

  .field-input {
    width: 100%; border: 1.5px solid #d1d5db; border-radius: 9px;
    padding: 11px 13px; font-size: 15px; font-weight: 600;
    color: #111; outline: none; background: white;
    font-family: 'Inter', inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
    text-transform: uppercase;
  }
  .field-input::placeholder { color: #9ca3af; font-weight: 400; text-transform: none; }
  .field-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .field-input.valid { border-color: #86efac; }
  .field-input.error { border-color: #fca5a5; }

  .select-input {
    width: 100%; border: 1.5px solid #d1d5db; border-radius: 9px;
    padding: 11px 36px 11px 13px; font-size: 15px; font-weight: 600;
    color: #111; outline: none; background: white;
    font-family: 'Inter', inherit; appearance: none; cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .select-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

  .card {
    background: white; border-radius: 14px;
    border: 1px solid #e5e7eb;
    padding: 20px 20px;
    margin-bottom: 14px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }

  .result-card {
    border-radius: 11px; padding: 15px 16px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 12;
    border-left-width: 4px; border-left-style: solid;
  }

  .feedback-btn {
    border-radius: 9px; padding: 11px 8px; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    transition: transform 0.12s, box-shadow 0.15s;
    font-family: inherit;
  }
  .feedback-btn:hover  { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .feedback-btn:active { transform: scale(0.96); }

  .step-row {
    display: flex; gap: 14px; margin-bottom: 22px; position: relative; z-index: 1;
    animation: fadeSlideUp 0.35s ease both;
  }

  .hint-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600; padding: 3px 8px;
    border-radius: 20px; margin-top: 5px;
  }
`;

// ─────────────────────────────────────────────────────────────────
//  Data
// ─────────────────────────────────────────────────────────────────
const ARRIVALS_DB = {
  "LH1983": { origin: "BER", arrGate: "B42", airline: "Lufthansa" },
  "LH400": { origin: "JFK", arrGate: "K07", airline: "Lufthansa" },
  "LH776": { origin: "EZE", arrGate: "H14", airline: "Lufthansa" },
  "LH1900": { origin: "HAM", arrGate: "B12", airline: "Lufthansa" },
  "LH18": { origin: "SFO", arrGate: "L08", airline: "Lufthansa" },
  "BA942": { origin: "LHR", arrGate: "E22", airline: "British Airways" },
  "EW567": { origin: "VIE", arrGate: "D09", airline: "Eurowings" },
  "AZ4242": { origin: "FCO", arrGate: "A19", airline: "ITA Airways" },
  "TP932": { origin: "LIS", arrGate: "E08", airline: "TAP Air Portugal" },
  "OS123": { origin: "VIE", arrGate: "B05", airline: "Austrian Airlines" },
  "SK455": { origin: "CPH", arrGate: "H22", airline: "SAS" },
  "IB3163": { origin: "MAD", arrGate: "E15", airline: "Iberia" },
};

const DEPARTURES_DB = {
  "EN8206": { dest: "BRI", depGate: "K08", minsToBrd: 35, airline: "Air Dolomiti" },
  "LH1800": { dest: "HAM", depGate: "H03", minsToBrd: 60, airline: "Lufthansa" },
  "LH1234": { dest: "FRA", depGate: "G22", minsToBrd: 45, airline: "Lufthansa" },
  "OS223": { dest: "VIE", depGate: "B08", minsToBrd: 25, airline: "Austrian Airlines" },
  "LX1074": { dest: "ZRH", depGate: "G12", minsToBrd: 50, airline: "Swiss" },
  "UA901": { dest: "EWR", depGate: "L15", minsToBrd: 90, airline: "United Airlines" },
  "TP931": { dest: "LIS", depGate: "K11", minsToBrd: 40, airline: "TAP Air Portugal" },
  "AZ4241": { dest: "FCO", depGate: "K05", minsToBrd: 30, airline: "ITA Airways" },
  "EN8210": { dest: "VRN", depGate: "K13", minsToBrd: 20, airline: "Air Dolomiti" },
  "LH2382": { dest: "MXP", depGate: "K02", minsToBrd: 15, airline: "Lufthansa" },
  "IB3164": { dest: "MAD", depGate: "E19", minsToBrd: 55, airline: "Iberia" },
};

const AIRPORTS = [
  { code: "MUC", name: "Munich International Airport" },
  { code: "FRA", name: "Frankfurt Airport" },
  { code: "BER", name: "Berlin Brandenburg Airport" },
  { code: "HAM", name: "Hamburg Airport" },
];

const PIER_INFO = {
  // Terminal 1 — Ebene 04 (gates), Ebene 03 (arrivals/MAC)
  A: { terminal: "T1", label: "T1 · Pier A", color: "#3b82f6", gates: "A01–A43", level: "04" },
  B: { terminal: "T1", label: "T1 · Pier B", color: "#3b82f6", gates: "B01–B17", level: "04" },
  C: { terminal: "T1", label: "T1 · Pier C", color: "#3b82f6", gates: "C01–C30", level: "04" },
  D: { terminal: "T1", label: "T1 · Pier D", color: "#3b82f6", gates: "D01–D23", level: "04" },
  E: { terminal: "T1", label: "T1 · Pier E (VIP Wing)", color: "#3b82f6", gates: "E01–E99", level: "04" },
  // Terminal 2 Main Building
  G: { terminal: "T2", label: "T2 Main · Pier G (Lv 04)", color: "#a855f7", gates: "G01–G48", level: "04", connAt: "G19–G28" },
  H: { terminal: "T2", label: "T2 Main · Pier H (Lv 05)", color: "#a855f7", gates: "H01–H48", level: "05", connAt: "H19–H28" },
  // Terminal 2 Satellite
  K: { terminal: "T2S", label: "T2 Satellite · Pier K (Lv 04)", color: "#f59e0b", gates: "K01–K30", level: "04" },
  L: { terminal: "T2S", label: "T2 Satellite · Pier L (Lv 05)", color: "#f59e0b", gates: "L01–L30", level: "05" },
};

// Walk times (minutes) — T1: A B C D E | T2 Main: G H | T2 Satellite: K L
// T1↔T2: free shuttle bus (5–7 min) every 10 min (07–17h) / 20 min off-peak
//         OR walk via Munich Airport Center (MAC) — central between Pier B/C
// Piers B & C are closest to MAC/bus stop; A & E are farthest
// T2 Main ↔ T2 Satellite: Satellite train every 4 min, ≈ 2 min ride — avg total ≈ 10 min
const WALK_TIME = {
  //      A    B    C    D    E    G    H    K    L
  A: { A: 4, B: 8, C: 13, D: 18, E: 24, G: 27, H: 30, K: 37, L: 41 },
  B: { A: 8, B: 4, C: 6, D: 12, E: 18, G: 24, H: 27, K: 34, L: 38 },
  C: { A: 13, B: 6, C: 4, D: 8, E: 14, G: 23, H: 26, K: 33, L: 37 },
  D: { A: 18, B: 12, C: 8, D: 4, E: 8, G: 25, H: 28, K: 35, L: 39 },
  E: { A: 24, B: 18, C: 14, D: 8, E: 4, G: 28, H: 31, K: 38, L: 42 },
  G: { A: 27, B: 24, C: 23, D: 25, E: 28, G: 4, H: 8, K: 10, L: 14 },
  H: { A: 30, B: 27, C: 26, D: 28, E: 31, G: 8, H: 4, K: 12, L: 10 },
  K: { A: 37, B: 34, C: 33, D: 35, E: 38, G: 10, H: 12, K: 4, L: 8 },
  L: { A: 41, B: 38, C: 37, D: 39, E: 42, G: 14, H: 10, K: 8, L: 4 },
};

const URGENCY_CONFIG = {
  safe: {
    label: "Safe Connection", color: "#15803d",
    bg: "#f0fdf4", border: "#86efac", leftBar: "#22c55e",
    Icon: CheckCircle, dot: "#22c55e",
    tip: "You're good! Head to your gate at a relaxed pace.",
  },
  tight: {
    label: "Tight Connection", color: "#c2410c",
    bg: "#fff7ed", border: "#fdba74", leftBar: "#f97316",
    Icon: AlertTriangle, dot: "#f97316",
    tip: "Go directly to your gate — no stops along the way.",
  },
  risky: {
    label: "Risky Connection", color: "#b91c1c",
    bg: "#fef2f2", border: "#fca5a5", leftBar: "#ef4444",
    Icon: Clock, dot: "#ef4444",
    tip: "Alert the crew now! Ask them to notify the gate to hold.",
  },
};

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────
const norm = s => (s || "").toUpperCase().replace(/\s/g, "");
const pier = g => { const p = norm(g).charAt(0); return PIER_INFO[p] ? p : null; };
const gateNum = g => parseInt(norm(g).slice(1)) || 0;

// Security checkpoint time based on gate position within T2
// Central gates (G/H 09–38, K/L 04–27): ≈ 4 min | Pier Nord/Süd ends: ≈ 7 min
function securityTime(g) {
  const p = pier(g);
  if (!p || PIER_INFO[p].terminal === "T1") return 0;
  const n = gateNum(g);
  if (p === "G" || p === "H") return (n >= 9 && n <= 38) ? 4 : 7;
  if (p === "K" || p === "L") return (n >= 4 && n <= 27) ? 4 : 7;
  return 5;
}

// T2 Main: walk from entry (center, G/H 19-28) to gate
// Each ~10 gate numbers = ~3 min walk along the pier
function pierWalkTime(g) {
  const p = pier(g);
  if (!p || PIER_INFO[p].terminal !== "T2") return 0;
  const n = gateNum(g);
  const distFromCenter = Math.abs(n - 24); // center ≈ gate 24
  return Math.round((distFromCenter / 10) * 3) + 2;
}

const fmtMin = m => {
  if (!m && m !== 0) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
};
const fmtMinLong = m => {
  if (!m && m !== 0) return "—";
  if (m < 60) return `${m} minutes`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} hr ${r} min` : `${h} hour${h > 1 ? "s" : ""}`;
};

function calcUrgency(buffer) {
  if (buffer > 20) return "safe";
  if (buffer > 5) return "tight";
  return "risky";
}

// ─────────────────────────────────────────────────────────────────
//  Directions builder
// ─────────────────────────────────────────────────────────────────
function buildDirections(fromGate, toGate) {
  const fp = pier(fromGate), tp = pier(toGate);
  if (!fp || !tp) return [];
  const fi = PIER_INFO[fp], ti = PIER_INFO[tp];
  const dest = norm(toGate);
  const steps = [];

  // Same pier
  if (fp === tp) {
    steps.push({ icon: "walk", text: `You're already in ${ti.label}. Follow signs to Gate ${dest}.`, mins: 4 });
    return steps;
  }

  // T1 → T1
  if (fi.terminal === "T1" && ti.terminal === "T1") {
    steps.push({ icon: "walk", text: `After deplaning at Pier ${fp}, follow the Level 04 corridor toward Pier ${tp}.`, mins: 5 });
    steps.push({ icon: "sign", text: `Follow the overhead signs for "Pier ${tp}" — the MAC (Munich Airport Center) connects all T1 piers at ground level.`, mins: 8 });
    steps.push({ icon: "gate", text: `Gate ${dest} is signposted along Pier ${tp}.`, mins: 4 });
    return steps;
  }

  // T2 Main → T2 Main (G ↔ H)
  if (fi.terminal === "T2" && ti.terminal === "T2") {
    steps.push({ icon: "walk", text: "Follow the Terminal 2 Main Building corridor.", mins: 3 });
    steps.push({ icon: "sign", text: `Follow overhead signs for "Pier ${tp}".`, mins: 6 });
    steps.push({ icon: "gate", text: `Gate ${dest} is indicated at the end of the pier.`, mins: 2 });
    return steps;
  }

  // T2 Main → T2 Satellite (G/H → K/L)
  if (fi.terminal === "T2" && ti.terminal === "T2S") {
    const fromLevel = fp === "G" ? "04" : "05";
    const toLevel = tp === "K" ? "04" : "05";
    const sameLevel = fromLevel === toLevel;
    steps.push({ icon: "walk", text: `In T2 Main Building (Level ${fromLevel}), walk toward the center and follow signs to the Satellite train station — look for 'Zugang zu Gates ${tp}' (Access to Gates ${tp}).`, mins: 4 });
    if (!sameLevel) {
      steps.push({ icon: "walk", text: `Take the escalators to Level ${toLevel} to connect to the Satellite train for Pier ${tp}.`, mins: 2 });
    }
    steps.push({ icon: "train", text: `Board the Satellite train at the center of T2 Main — runs every 4 min, ≈ 2 min ride to the Satellite Building.`, mins: 4 });
    steps.push({ icon: "sign", text: `In T2 Satellite Building (Level ${toLevel}), follow signs for Pier ${tp}.`, mins: 3 });
    steps.push({ icon: "gate", text: `Gate ${dest} is signposted along the pier.`, mins: 2 });
    return steps;
  }

  // T2 Satellite → T2 Main (K/L → G/H)
  if (fi.terminal === "T2S" && ti.terminal === "T2") {
    const fromLevel = fp === "K" ? "04" : "05";
    const toLevel = tp === "G" ? "04" : "05";
    const sameLevel = fromLevel === toLevel;
    steps.push({ icon: "walk", text: `In T2 Satellite Building (Level ${fromLevel}), follow signs to the train station — look for 'Zugang zu Gates ${tp}' (Access to Gates ${tp}).`, mins: 3 });
    steps.push({ icon: "train", text: "Take the Satellite train back to T2 Main Building — runs every 4 min, ≈ 2 min ride.", mins: 4 });
    if (!sameLevel) {
      steps.push({ icon: "walk", text: `Take the escalators to Level ${toLevel} for Pier ${tp}.`, mins: 2 });
    }
    steps.push({ icon: "sign", text: `In T2 Main Building, follow overhead signs for Pier ${tp} (Level ${toLevel}).`, mins: 4 });
    steps.push({ icon: "gate", text: `Gate ${dest} is indicated along the pier.`, mins: 2 });
    return steps;
  }

  // T1 → T2 Main
  if (fi.terminal === "T1" && ti.terminal === "T2") {
    steps.push({ icon: "walk", text: `From Pier ${fp}, head to the center of T1 (between Pier B and C) — follow signs to the Bus Stop or MAC (Munich Airport Center).`, mins: 5 });
    steps.push({ icon: "bus", text: "Board the free shuttle bus to Terminal 2 — 5–7 min ride. Every 10 min (07:00–17:00), every 20 min outside these hours. Alternative: walk through the MAC (≈ 10 min on foot).", mins: 10 });
    steps.push({ icon: "sign", text: `In T2 Main Building, follow overhead signs for Pier ${tp} (Level ${PIER_INFO[tp]?.level}).`, mins: 7 });
    steps.push({ icon: "gate", text: `Gate ${dest} is signposted at the pier.`, mins: 3 });
    return steps;
  }

  // T1 → T2 Satellite
  if (fi.terminal === "T1" && ti.terminal === "T2S") {
    steps.push({ icon: "walk", text: `From Pier ${fp}, head to the center of T1 (between Pier B and C) — follow signs to the Bus Stop or MAC.`, mins: 5 });
    steps.push({ icon: "bus", text: "Board the free shuttle bus to Terminal 2 — 5–7 min ride. Every 10 min (07:00–17:00), every 20 min outside these hours.", mins: 10 });
    steps.push({ icon: "walk", text: "In T2 Main Building, follow signs to the Satellite train station — look for 'Zugang zu Gates K/L' (Access to Gates K/L).", mins: 4 });
    steps.push({ icon: "train", text: "Board the Satellite train — runs every 4 min, ≈ 2 min ride to the Satellite Building.", mins: 4 });
    steps.push({ icon: "gate", text: `Gate ${dest} is indicated in the T2 Satellite Building.`, mins: 3 });
    return steps;
  }

  // T2 Main → T1
  if (fi.terminal === "T2" && ti.terminal === "T1") {
    steps.push({ icon: "walk", text: "In T2 Main Building, go to ground level and follow signs to the 'Bus Stop' for Terminal 1.", mins: 5 });
    steps.push({ icon: "bus", text: "Board the free shuttle bus to Terminal 1 — 5–7 min ride. Every 10 min (07:00–17:00), every 20 min outside these hours. Alternative: walk through the MAC.", mins: 10 });
    steps.push({ icon: "walk", text: `In Terminal 1, the MAC connects all piers. Head toward Pier ${tp}.`, mins: 5 });
    steps.push({ icon: "sign", text: `Follow overhead signs for Pier ${tp} and take escalators to Level 04.`, mins: 5 });
    steps.push({ icon: "gate", text: `Gate ${dest} is signposted along the pier.`, mins: 3 });
    return steps;
  }

  // T2 Satellite → T1
  if (fi.terminal === "T2S" && ti.terminal === "T1") {
    steps.push({ icon: "train", text: "Take the Satellite train back to T2 Main Building — runs every 4 min, ≈ 2 min ride.", mins: 4 });
    steps.push({ icon: "walk", text: "In T2 Main Building, go to ground level and follow signs to the 'Bus Stop' for Terminal 1.", mins: 5 });
    steps.push({ icon: "bus", text: "Board the free shuttle bus to Terminal 1 — 5–7 min ride. Every 10 min (07:00–17:00), every 20 min outside these hours.", mins: 10 });
    steps.push({ icon: "walk", text: `In Terminal 1, the MAC connects all piers. Head toward Pier ${tp}.`, mins: 5 });
    steps.push({ icon: "sign", text: `Follow overhead signs for Pier ${tp} and take escalators to Level 04.`, mins: 5 });
    steps.push({ icon: "gate", text: `Gate ${dest} is signposted along the pier.`, mins: 3 });
    return steps;
  }

  return steps;
}

// ─────────────────────────────────────────────────────────────────
//  Step icon
// ─────────────────────────────────────────────────────────────────
function StepIcon({ type, color }) {
  const s = { width: 16, height: 16, color, flexShrink: 0 };
  if (type === "train") return <Train style={s} />;
  if (type === "bus") return <Bus style={s} />;
  if (type === "gate") return <MapPin style={s} />;
  if (type === "sign") return <Navigation2 style={s} />;
  return <Navigation style={s} />;
}

// ─────────────────────────────────────────────────────────────────
//  Gate badge
// ─────────────────────────────────────────────────────────────────
function GateBadge({ gate, label, accent }) {
  const p = pier(gate);
  const info = p ? PIER_INFO[p] : null;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: accent + "20",
        border: `2px solid ${accent}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 6px",
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: accent, fontFamily: "monospace" }}>
          {norm(gate) || "—"}
        </span>
      </div>
      {info && (
        <p style={{ margin: 0, fontSize: 10, color: "#6b7280", lineHeight: 1.3, maxWidth: 80 }}>
          {info.label}
        </p>
      )}
      <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  DirectionsScreen
// ─────────────────────────────────────────────────────────────────
function DirectionsScreen({ result, onBack }) {
  const u = URGENCY_CONFIG[result.urgency];
  const { Icon } = u;

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", padding: "20px 20px 28px" }}>
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 4 }}>
              How to get there
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              Gate {result.arrGate} → Gate {result.depGate}
              &nbsp;·&nbsp; ≈ {fmtMin(result.walkTime)} walk
            </p>
          </div>
          <div style={{
            background: u.bg, border: `1.5px solid ${u.border}`,
            borderRadius: 20, padding: "5px 12px",
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
          }}>
            <Icon size={13} style={{ color: u.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: u.color }}>
              {u.label.split(" ")[0].toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 40px" }}>

        {/* Route summary card */}
        <div className="card animate-up" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <GateBadge gate={result.arrGate} label="Arrival gate" accent="#2563eb" />
            <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 8px" }}>
              <div style={{ flex: 1, height: 2, background: "#e5e7eb" }} />
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: u.bg, border: `1.5px solid ${u.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 6px",
              }}>
                <Plane size={13} style={{ color: u.color }} />
              </div>
              <div style={{ flex: 1, height: 2, background: "#e5e7eb" }} />
            </div>
            <GateBadge gate={result.depGate} label="Connecting gate" accent={u.color} />
          </div>

          {/* Metrics row */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {[
              { label: "Walk time", value: fmtMin(result.walkTime) },
              ...(result.securityTime > 0 ? [{ label: "Security", value: `+${result.securityTime} min` }] : []),
              { label: "Time available", value: fmtMin(result.available) },
              {
                label: "Buffer",
                value: result.buffer >= 0 ? `+${fmtMin(result.buffer)}` : `-${fmtMin(Math.abs(result.buffer))}`,
                hi: result.buffer < 0,
              },
            ].map(m => (
              <div key={m.label} style={{
                flex: 1, background: "#f9fafb", borderRadius: 9,
                padding: "9px 8px", textAlign: "center",
              }}>
                <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>{m.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: m.hi ? "#dc2626" : "#111" }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent tip banner */}
        {(result.urgency === "risky" || result.urgency === "tight") && (
          <div className="animate-up-2" style={{
            background: result.urgency === "risky" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${result.urgency === "risky" ? "#fca5a5" : "#fdba74"}`,
            borderRadius: 12, padding: "13px 16px",
            display: "flex", gap: 10, alignItems: "flex-start",
            marginBottom: 14,
          }}>
            <AlertTriangle size={17} style={{
              color: result.urgency === "risky" ? "#dc2626" : "#c2410c",
              flexShrink: 0, marginTop: 1,
            }} />
            <p style={{
              fontSize: 13, lineHeight: 1.5,
              color: result.urgency === "risky" ? "#991b1b" : "#92400e",
            }}>
              {u.tip}
            </p>
          </div>
        )}

        {/* Step-by-step card */}
        <div className="card animate-up-3">
          <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 20 }}>
            Step-by-step directions
          </p>

          <div style={{ position: "relative" }}>
            {/* Vertical connector */}
            <div style={{
              position: "absolute", left: 17, top: 18, bottom: 18,
              width: 2, background: "#f3f4f6", zIndex: 0,
            }} />

            {result.directions.map((step, i) => {
              const isLast = i === result.directions.length - 1;
              return (
                <div
                  key={i}
                  className="step-row"
                  style={{ animationDelay: `${0.22 + i * 0.07}s` }}
                >
                  {/* Circle */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: isLast ? u.color : "#1e3a8a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "3px solid white",
                    boxShadow: "0 0 0 1.5px #e5e7eb",
                    zIndex: 1,
                  }}>
                    {isLast
                      ? <MapPin size={15} color="white" />
                      : <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{i + 1}</span>
                    }
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, paddingTop: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.5, flex: 1 }}>
                        {step.text}
                      </p>
                      <StepIcon type={step.icon} color="#9ca3af" />
                    </div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                      ≈ {step.mins} min
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total footer */}
          <div style={{
            borderTop: "1px solid #f3f4f6", paddingTop: 14, marginTop: 2,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Total estimated walk</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: u.color }}>
                ≈ {fmtMin(result.walkTime)}
              </span>
              <div style={{
                background: u.bg, border: `1px solid ${u.border}`,
                borderRadius: 20, padding: "3px 10px",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Icon size={11} style={{ color: u.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: u.color }}>
                  {u.label.split(" ")[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MainScreen
// ─────────────────────────────────────────────────────────────────
function MainScreen({ onHowToGo }) {
  const [airport, setAirport] = useState("MUC");
  const [fromFlight, setFromFlight] = useState("");
  const [toFlight, setToFlight] = useState("");
  const [gate, setGate] = useState("");
  const [minsManual, setMinsManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [shake, setShake] = useState(false);
  const resultsRef = useRef(null);

  const fromKey = norm(fromFlight);
  const toKey = norm(toFlight);
  const arrInfo = ARRIVALS_DB[fromKey] || null;
  const depInfo = DEPARTURES_DB[toKey] || null;

  // Auto-fill gate & minutes when connecting flight is found
  useEffect(() => {
    if (depInfo) {
      setGate(depInfo.depGate);
      setMinsManual(String(depInfo.minsToBrd));
    }
  }, [toKey]);

  const arrPier = arrInfo?.arrGate ? pier(arrInfo.arrGate) : null;
  const depPier = gate ? pier(gate) : null;
  const walkTime = arrPier && depPier ? WALK_TIME[arrPier]?.[depPier] ?? null : null;
  const available = parseInt(minsManual) || null;
  const buffer = walkTime != null && available != null ? available - walkTime : null;
  const urgency = buffer !== null ? calcUrgency(buffer) : null;

  // Can check: need arrival gate (from arrInfo) + a dep gate + minutes
  const canCheck = !!arrPier && !!depPier && !!available;

  const handleCheck = () => {
    if (!canCheck) { setShake(true); setTimeout(() => setShake(false), 600); return; }
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const secTime = securityTime(gate); // extra time if security needed at dep gate
      const directions = buildDirections(arrInfo.arrGate, gate);
      const effectiveWalk = walkTime + secTime;
      const buf = available - effectiveWalk;
      const urg = calcUrgency(buf);
      setResult({
        urgency: urg, walkTime, securityTime: secTime,
        effectiveWalk, available, buffer: buf,
        directions,
        arrGate: arrInfo.arrGate,
        depGate: norm(gate),
        fromFlight: fromKey,
        toFlight: toKey,
        arrOrigin: arrInfo.origin,
        depDest: depInfo?.dest,
      });
      setLoading(false);
      setFeedback(null);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }, 600);
  };

  const u = result ? URGENCY_CONFIG[result.urgency] : null;

  // Input class helper
  const inputClass = (valid, err) =>
    `field-input${valid ? " valid" : ""}${err ? " error" : ""}`;

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
        padding: "20px 20px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 13,
              background: "#2563eb",
              boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plane size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: -0.5 }}>
                GateRunner
              </h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
                Together, we'll get there on time!
              </p>
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>
            🏃
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 36px" }}>

        {/* ── Airport Configuration ── */}
        <div className="card animate-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MapPin size={17} style={{ color: "#2563eb" }} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Airport Configuration</h2>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 20, padding: "5px 11px", cursor: "pointer",
              color: "#1d4ed8", fontSize: 11, fontWeight: 600, flexShrink: 0,
            }}>
              <MapPin size={11} /> Get my location
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, marginLeft: 41 }}>
            Select the airport where you are making your connection.
          </p>

          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Airport</p>
          <div style={{ position: "relative" }}>
            <select
              className="select-input"
              value={airport}
              onChange={e => setAirport(e.target.value)}
            >
              {AIRPORTS.map(a => (
                <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
              ))}
            </select>
            <ChevronDown size={15} style={{
              position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none",
            }} />
          </div>
        </div>

        {/* ── Connection Flights ── */}
        <div className="card animate-up-2" style={{ animation: shake ? "none" : undefined }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plane size={17} style={{ color: "#2563eb" }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Connection Flights</h2>
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 18, marginLeft: 41 }}>
            Enter your incoming and connecting flights to check your connection time.
          </p>

          {/* Three-column grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.65fr", gap: 12, marginBottom: 16 }}>

            {/* From Flight */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>From Flight</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Arriving Flight)</p>
              <input
                className={inputClass(!!arrInfo, fromKey.length > 2 && !arrInfo)}
                value={fromFlight}
                onChange={e => { setFromFlight(e.target.value); setResult(null); }}
                placeholder="LH1983"
                maxLength={8}
              />
              {arrInfo ? (
                <span className="hint-chip" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                  ✈ {arrInfo.origin} · Gate {arrInfo.arrGate}
                </span>
              ) : fromKey.length > 2 && (
                <span className="hint-chip" style={{ background: "#fef2f2", color: "#b91c1c" }}>
                  Flight not found
                </span>
              )}
            </div>

            {/* To Flight */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>To Flight</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Connecting Flight)</p>
              <input
                className={inputClass(!!depInfo, toKey.length > 2 && !depInfo)}
                value={toFlight}
                onChange={e => { setToFlight(e.target.value); setResult(null); }}
                placeholder="EN8206"
                maxLength={8}
              />
              {depInfo ? (
                <span className="hint-chip" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                  ✈ to {depInfo.dest} · {depInfo.minsToBrd} min
                </span>
              ) : toKey.length > 2 && (
                <span className="hint-chip" style={{ background: "#fef2f2", color: "#b91c1c" }}>
                  Flight not found
                </span>
              )}
            </div>

            {/* Gate */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>Gate</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Connecting Gate)</p>
              <input
                className={inputClass(!!depPier, gate.length > 0 && !depPier)}
                value={gate}
                onChange={e => { setGate(e.target.value.toUpperCase()); setResult(null); }}
                placeholder="G81"
                maxLength={5}
              />
              {depPier && (
                <span className="hint-chip" style={{
                  background: PIER_INFO[depPier].color + "20",
                  color: PIER_INFO[depPier].color,
                }}>
                  {PIER_INFO[depPier].terminal}
                </span>
              )}
            </div>
          </div>

          {/* Manual minutes — shown when flight not in DB */}
          {!depInfo && (arrInfo || depPier) && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#f9fafb", borderRadius: 9, padding: "10px 13px",
              marginBottom: 14, border: "1px dashed #d1d5db",
            }}>
              <Clock size={14} style={{ color: "#6b7280", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#6b7280", flex: 1 }}>Minutes until boarding:</p>
              <input
                type="number"
                value={minsManual}
                onChange={e => setMinsManual(e.target.value)}
                placeholder="45"
                min={1} max={240}
                style={{
                  width: 65, border: "1.5px solid #d1d5db", borderRadius: 7,
                  padding: "7px 10px", fontSize: 15, fontWeight: 700,
                  color: "#111", outline: "none", fontFamily: "inherit",
                  textAlign: "center",
                }}
              />
            </div>
          )}

          {/* Check Connection */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-primary"
              onClick={handleCheck}
              disabled={!canCheck || loading}
              style={{ display: "flex", alignItems: "center", gap: 7 }}
            >
              {loading
                ? <><Loader2 size={16} className="spin" /> Checking…</>
                : "Check Connection"
              }
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        {result && u && (
          <div ref={resultsRef} className="card animate-up">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BarChart2 size={17} style={{ color: "#2563eb" }} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Results</h2>
            </div>

            {/* Result card */}
            <div className="result-card" style={{
              background: u.bg,
              border: `1px solid ${u.border}`,
              borderLeftColor: u.leftBar,
              marginBottom: 18,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, flex: 1, minWidth: 0 }}>
                <u.Icon size={30} style={{ color: u.color, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: u.color, marginBottom: 3 }}>
                    {u.label}
                  </p>
                  <p style={{ fontSize: 14, color: "#374151" }}>
                    You have{" "}
                    <strong style={{ color: u.color }}>{fmtMinLong(result.available)}</strong>
                    {" "}to get there.
                  </p>
                </div>
              </div>
              <button
                className="btn-outline"
                onClick={() => onHowToGo(result)}
                style={{
                  border: `1.5px solid ${u.color}`,
                  color: u.color, flexShrink: 0,
                }}
              >
                How to go there <ArrowRight size={14} />
              </button>
            </div>

            {/* Risk Indicator legend */}
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                Risk Indicator
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                {[
                  { dot: "#22c55e", label: "SAFE", note: "(> 20 min)" },
                  { dot: "#f97316", label: "TIGHT", note: "(5–20 min)" },
                  { dot: "#ef4444", label: "RISKY", note: "(< 5 min)" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      width: 9, height: 9, borderRadius: "50%",
                      background: r.dot, display: "inline-block",
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{r.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Feedback ── */}
        {result && (
          <div className="card animate-up-2">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageCircle size={17} style={{ color: "#2563eb" }} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Feedback</h2>
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, marginLeft: 41 }}>
              Have you made your connection?
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { key: "safe", Icon: CheckCircle, label: "Yes\u00A0—\u00A0Safe", color: "#15803d", border: "#86efac", bg: "#f0fdf4" },
                { key: "tight", Icon: AlertTriangle, label: "Yes\u00A0—\u00A0Tight", color: "#c2410c", border: "#fdba74", bg: "#fff7ed" },
                { key: "risky", Icon: XCircle, label: "No\u00A0—\u00A0Missed", color: "#b91c1c", border: "#fca5a5", bg: "#fef2f2" },
              ].map(f => (
                <button
                  key={f.key}
                  className="feedback-btn"
                  onClick={() => setFeedback(p => p === f.key ? null : f.key)}
                  style={{
                    border: `1.5px solid ${feedback === f.key ? f.color : f.border}`,
                    background: feedback === f.key ? f.bg : "white",
                  }}
                >
                  <f.Icon size={20} style={{ color: f.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: f.color, textAlign: "center", lineHeight: 1.3 }}>
                    {f.label}
                  </span>
                </button>
              ))}
            </div>

            {feedback && (
              <p className="animate-fade" style={{
                textAlign: "center", fontSize: 13, color: "#6b7280",
                fontStyle: "italic", marginBottom: 8,
              }}>
                {feedback === "safe" && "Great! Thanks for the feedback. Safe travels! ✈"}
                {feedback === "tight" && "Phew, close one! Thank you for the feedback."}
                {feedback === "risky" && "We're sorry. Please visit your airline's service desk."}
              </p>
            )}

            <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af" }}>
              Your feedback helps us improve GateRunner!
            </p>
          </div>
        )}

        {/* Demo hint */}
        {!result && (
          <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            Try <strong>LH1983</strong> → <strong>EN8206</strong> to see the full demo
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Root
// ─────────────────────────────────────────────────────────────────
export default function GateRunner() {
  const [screen, setScreen] = useState("main");
  const [dirResult, setDirResult] = useState(null);

  return (
    <>
      <style>{STYLES}</style>
      {screen === "directions" && dirResult
        ? <DirectionsScreen result={dirResult} onBack={() => setScreen("main")} />
        : <MainScreen onHowToGo={r => { setDirResult(r); setScreen("directions"); }} />
      }
    </>
  );
}