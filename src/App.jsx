import { useState, useEffect, useRef } from "react";
import {
  MapPin, Plane, BarChart2, MessageCircle,
  AlertTriangle, CheckCircle, Clock, XCircle,
  ArrowRight, ArrowLeft, ChevronDown, Train, Bus,
  Navigation, Navigation2, Loader2,
} from "lucide-react";
import {
  ARRIVALS_DB, DEPARTURES_DB, PIER_INFO, WALK_TIME,
  norm, pier, securityTime, buildDirections,
} from "./data/mucData.js";

// ─────────────────────────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; }

  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes dash {
    from { stroke-dashoffset: 900; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes pulse {
    0%,100% { transform:scale(1); opacity:1; }
    50%      { transform:scale(1.35); opacity:.7; }
  }

  .animate-up   { animation: fadeSlideUp .4s cubic-bezier(.22,.68,0,1.2) both; }
  .animate-up-2 { animation: fadeSlideUp .4s cubic-bezier(.22,.68,0,1.2) .08s both; }
  .animate-up-3 { animation: fadeSlideUp .4s cubic-bezier(.22,.68,0,1.2) .16s both; }
  .animate-fade { animation: fadeIn .35s ease both; }
  .spin         { animation: spin .8s linear infinite; }

  .route-path   { stroke-dasharray:900; animation: dash 1.4s cubic-bezier(.4,0,.2,1) .3s both; }
  .gate-pulse   { animation: pulse 2s ease-in-out infinite; }

  .btn-primary {
    background:#2563eb; color:white; border:none; border-radius:9px;
    padding:11px 24px; font-size:15px; font-weight:700; cursor:pointer;
    transition:background .18s,transform .12s,box-shadow .18s; font-family:inherit;
  }
  .btn-primary:hover:not(:disabled) { background:#1d4ed8; box-shadow:0 4px 14px rgba(37,99,235,.35); }
  .btn-primary:active:not(:disabled){ transform:scale(.97); }
  .btn-primary:disabled              { background:#bfdbfe; cursor:not-allowed; }

  .btn-outline {
    background:transparent; border-radius:9px; padding:9px 16px;
    font-size:13px; font-weight:700; cursor:pointer;
    display:flex; align-items:center; gap:6px; white-space:nowrap;
    transition:background .15s,transform .12s; font-family:inherit;
  }
  .btn-outline:hover  { filter:brightness(.93); }
  .btn-outline:active { transform:scale(.96); }

  .btn-back {
    display:flex; align-items:center; gap:6px;
    background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
    border-radius:20px; padding:7px 16px; color:white;
    font-size:14px; font-weight:600; cursor:pointer; margin-bottom:16px;
    transition:background .15s; font-family:inherit;
  }
  .btn-back:hover { background:rgba(255,255,255,.25); }

  .field-input {
    width:100%; border:1.5px solid #d1d5db; border-radius:9px;
    padding:11px 13px; font-size:15px; font-weight:600; color:#111;
    outline:none; background:white; font-family:'Inter',inherit;
    transition:border-color .15s,box-shadow .15s; text-transform:uppercase;
  }
  .field-input::placeholder { color:#9ca3af; font-weight:400; text-transform:none; }
  .field-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
  .field-input.valid { border-color:#86efac; }
  .field-input.error { border-color:#fca5a5; }

  .select-input {
    width:100%; border:1.5px solid #d1d5db; border-radius:9px;
    padding:11px 36px 11px 13px; font-size:15px; font-weight:600;
    color:#111; outline:none; background:white;
    font-family:'Inter',inherit; appearance:none; cursor:pointer;
    transition:border-color .15s,box-shadow .15s;
  }
  .select-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); }

  .card {
    background:white; border-radius:14px; border:1px solid #e5e7eb;
    padding:20px; margin-bottom:14px; box-shadow:0 1px 6px rgba(0,0,0,.05);
  }
  .result-card {
    border-radius:11px; padding:15px 16px; display:flex; align-items:center;
    justify-content:space-between; gap:12px;
    border-left-width:4px; border-left-style:solid;
  }
  .feedback-btn {
    border-radius:9px; padding:11px 8px; cursor:pointer;
    display:flex; flex-direction:column; align-items:center; gap:6px;
    transition:transform .12s,box-shadow .15s; font-family:inherit;
  }
  .feedback-btn:hover  { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,.1); }
  .feedback-btn:active { transform:scale(.96); }
  .step-row {
    display:flex; gap:14px; margin-bottom:22px;
    position:relative; z-index:1; animation:fadeSlideUp .35s ease both;
  }
  .hint-chip {
    display:inline-flex; align-items:center; gap:4px;
    font-size:11px; font-weight:600; padding:3px 8px;
    border-radius:20px; margin-top:5px;
  }
`;

// ─────────────────────────────────────────────────────────────────
//  Static data
// ─────────────────────────────────────────────────────────────────
const AIRPORTS = [
  { code: "MUC", name: "Munich International Airport" },
  { code: "FRA", name: "Frankfurt Airport" },
  { code: "BER", name: "Berlin Brandenburg Airport" },
  { code: "HAM", name: "Hamburg Airport" },
];

const URGENCY_CONFIG = {
  safe: { label: "Safe Connection", color: "#15803d", bg: "#f0fdf4", border: "#86efac", leftBar: "#22c55e", Icon: CheckCircle, tip: "You're good! Head to your gate at a relaxed pace." },
  tight: { label: "Tight Connection", color: "#c2410c", bg: "#fff7ed", border: "#fdba74", leftBar: "#f97316", Icon: AlertTriangle, tip: "Go directly to your gate — no stops along the way." },
  risky: { label: "Risky Connection", color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5", leftBar: "#ef4444", Icon: Clock, tip: "Alert the crew now! Ask them to notify the gate to hold." },
};

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────
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
const calcUrgency = buf => buf > 20 ? "safe" : buf > 5 ? "tight" : "risky";

// ─────────────────────────────────────────────────────────────────
//  Airport Map SVG
// ─────────────────────────────────────────────────────────────────

// Gate → approximate SVG coordinate on the airport diagram
// ViewBox: 0 0 820 240
const GATE_COORD = g => {
  const p = pier(g);
  const n = parseInt(norm(g).slice(1)) || 1;
  if (!p) return { x: 400, y: 120 };

  // T1 building spans x=30–290, y=60–180
  // Piers left→right: E D C B A
  const T1_PIERS = { E: 55, D: 105, C: 155, B: 205, A: 255 };
  if (p === "E") return { x: T1_PIERS.E, y: 110 };
  if (p === "D") return { x: T1_PIERS.D, y: 75 + (n / 23) * 90 };
  if (p === "C") return { x: T1_PIERS.C, y: 75 + (n / 30) * 90 };
  if (p === "B") return { x: T1_PIERS.B, y: 75 + (n / 17) * 90 };
  if (p === "A") return { x: T1_PIERS.A, y: 75 + (n / 43) * 90 };

  // T2 Main building spans x=390–600, y=60–180
  // G = lower half (lv04), H = upper half (lv05)
  if (p === "G") return { x: 395 + (n / 48) * 195, y: 155 };
  if (p === "H") return { x: 395 + (n / 48) * 195, y: 75 };

  // T2 Satellite spans x=660–800, y=60–180
  if (p === "K") return { x: 665 + (n / 30) * 130, y: 155 };
  if (p === "L") return { x: 665 + (n / 30) * 130, y: 75 };

  return { x: 400, y: 120 };
};

// Build waypoints for the route path between two gates
const routeWaypoints = (fromGate, toGate) => {
  const fp = pier(fromGate), tp = pier(toGate);
  if (!fp || !tp) return [];
  const fi = PIER_INFO[fp], ti = PIER_INFO[tp];
  const from = GATE_COORD(fromGate);
  const to = GATE_COORD(toGate);
  const pts = [from];

  if (fi.terminal === ti.terminal && (fi.terminal !== "T2" || fp === tp || (fp === "G" && tp === "G") || (fp === "H" && tp === "H"))) {
    // Same building — go via corridor center y
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: to.x, y: 120 });
  } else if (fi.terminal === "T1" && ti.terminal === "T1") {
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: to.x, y: 120 });
  } else if (fi.terminal === "T2" && ti.terminal === "T2") {
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: to.x, y: 120 });
  } else if (fi.terminal === "T2" && ti.terminal === "T2S") {
    // T2 → train station (x=625) → Satellite
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: 625, y: 120 });
    pts.push({ x: to.x, y: 120 });
  } else if (fi.terminal === "T2S" && ti.terminal === "T2") {
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: 625, y: 120 });
    pts.push({ x: to.x, y: 120 });
  } else if (fi.terminal === "T1" && ti.terminal === "T2") {
    // T1 → MAC (x=335) → T2
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: 335, y: 120 });
    pts.push({ x: to.x, y: 120 });
  } else if (fi.terminal === "T1" && ti.terminal === "T2S") {
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: 335, y: 120 });
    pts.push({ x: 625, y: 120 });
    pts.push({ x: to.x, y: 120 });
  } else if (fi.terminal === "T2" && ti.terminal === "T1") {
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: 335, y: 120 });
    pts.push({ x: to.x, y: 120 });
  } else if (fi.terminal === "T2S" && ti.terminal === "T1") {
    pts.push({ x: from.x, y: 120 });
    pts.push({ x: 625, y: 120 });
    pts.push({ x: 335, y: 120 });
    pts.push({ x: to.x, y: 120 });
  }

  pts.push(to);
  return pts;
};

const ptsToD = pts =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

function AirportMap({ arrGate, depGate, urgency, walkTime, available }) {
  const u = URGENCY_CONFIG[urgency];
  const from = GATE_COORD(arrGate);
  const to = GATE_COORD(depGate);
  const wpts = routeWaypoints(arrGate, depGate);

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", background: "#f0f4ff" }}>
      <svg
        viewBox="0 0 820 240"
        style={{ width: "100%", display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sky gradient background */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#eff6ff" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e3a8a" floodOpacity="0.15" />
          </filter>
        </defs>
        <rect width="820" height="240" fill="url(#skyGrad)" />

        {/* ── Ground / taxiway ── */}
        <rect x="0" y="195" width="820" height="45" fill="#e2e8f0" />
        {/* Taxiway lines */}
        <line x1="0" y1="210" x2="820" y2="210" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="20 10" />

        {/* ── MAC road / bus lane (between T1 and T2) ── */}
        <rect x="298" y="50" width="80" height="145" rx="4" fill="#cbd5e1" opacity=".6" />
        <text x="338" y="130" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="700">MAC</text>
        <text x="338" y="142" textAnchor="middle" fontSize="8" fill="#94a3b8">Bus Stop</text>
        {/* bus icon area */}
        <rect x="314" y="148" width="48" height="20" rx="4" fill="#94a3b8" opacity=".4" />
        <text x="338" y="162" textAnchor="middle" fontSize="9" fill="#475569">🚌</text>

        {/* ── Satellite train track ── */}
        <rect x="620" y="105" width="40" height="30" rx="4" fill="#fde68a" opacity=".8" />
        <text x="640" y="124" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="700">🚆</text>

        {/* ══ T1 Building ══ */}
        <rect x="28" y="52" width="258" height="140" rx="8" fill="#1e40af" filter="url(#shadow)" opacity=".9" />
        <rect x="30" y="54" width="254" height="136" rx="7" fill="#2563eb" />
        {/* T1 roof highlight */}
        <rect x="30" y="54" width="254" height="18" rx="7" fill="#3b82f6" />
        <text x="157" y="66" textAnchor="middle" fontSize="10" fill="white" fontWeight="800" opacity=".9">TERMINAL 1</text>

        {/* T1 pier labels */}
        {[
          { letter: "E", cx: 55 },
          { letter: "D", cx: 105 },
          { letter: "C", cx: 155 },
          { letter: "B", cx: 205 },
          { letter: "A", cx: 255 },
        ].map(pr => (
          <g key={pr.letter}>
            <rect x={pr.cx - 14} y="78" width="28" height="100" rx="4" fill="#1d4ed8" opacity=".6" />
            <text x={pr.cx} y="135" textAnchor="middle" fontSize="11" fill="white" fontWeight="800" opacity=".8">
              {pr.letter}
            </text>
          </g>
        ))}

        {/* ══ T2 Main Building ══ */}
        <rect x="388" y="52" width="220" height="140" rx="8" fill="#6d28d9" filter="url(#shadow)" opacity=".9" />
        <rect x="390" y="54" width="216" height="136" rx="7" fill="#7c3aed" />
        <rect x="390" y="54" width="216" height="18" rx="7" fill="#8b5cf6" />
        <text x="498" y="66" textAnchor="middle" fontSize="10" fill="white" fontWeight="800" opacity=".9">TERMINAL 2</text>

        {/* G pier (Level 04 - bottom) */}
        <rect x="395" y="120" width="205" height="28" rx="3" fill="#5b21b6" opacity=".7" />
        <text x="498" y="139" textAnchor="middle" fontSize="9" fill="#e9d5ff" fontWeight="700">G01–G48 · Lv04</text>
        {/* H pier (Level 05 - top) */}
        <rect x="395" y="78" width="205" height="28" rx="3" fill="#5b21b6" opacity=".7" />
        <text x="498" y="97" textAnchor="middle" fontSize="9" fill="#e9d5ff" fontWeight="700">H01–H48 · Lv05</text>

        {/* ══ T2 Satellite ══ */}
        <rect x="660" y="52" width="148" height="140" rx="8" fill="#b45309" filter="url(#shadow)" opacity=".9" />
        <rect x="662" y="54" width="144" height="136" rx="7" fill="#d97706" />
        <rect x="662" y="54" width="144" height="18" rx="7" fill="#f59e0b" />
        <text x="734" y="66" textAnchor="middle" fontSize="9" fill="white" fontWeight="800">T2 SATELLITE</text>
        {/* K pier */}
        <rect x="667" y="120" width="134" height="28" rx="3" fill="#92400e" opacity=".7" />
        <text x="734" y="139" textAnchor="middle" fontSize="9" fill="#fef3c7" fontWeight="700">K01–K30 · Lv04</text>
        {/* L pier */}
        <rect x="667" y="78" width="134" height="28" rx="3" fill="#92400e" opacity=".7" />
        <text x="734" y="97" textAnchor="middle" fontSize="9" fill="#fef3c7" fontWeight="700">L01–L30 · Lv05</text>

        {/* ── Labels ── */}
        <text x="14" y="210" fontSize="8" fill="#94a3b8">Flughafen München / Munich Airport</text>

        {/* ── Route path ── */}
        {wpts.length > 1 && (
          <>
            {/* Shadow path */}
            <path
              d={ptsToD(wpts)}
              fill="none" stroke="rgba(30,58,138,0.25)"
              strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Animated route */}
            <path
              className="route-path"
              d={ptsToD(wpts)}
              fill="none" stroke="white"
              strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="900"
            />
            {/* Arrow dots along path */}
            {wpts.slice(1, -1).map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="5"
                fill="white" stroke="#1e3a8a" strokeWidth="1.5" opacity=".9" />
            ))}
          </>
        )}

        {/* ── Arrival gate pin (blue) ── */}
        <g transform={`translate(${from.x},${from.y})`}>
          <circle className="gate-pulse" cx="0" cy="0" r="11" fill="#2563eb" opacity=".25" />
          <circle cx="0" cy="0" r="7" fill="#2563eb" stroke="white" strokeWidth="2" />
          <text x="0" y="3.5" textAnchor="middle" fontSize="7" fill="white" fontWeight="800">✈</text>
        </g>
        {/* Arrival label */}
        <rect x={from.x - 22} y={from.y - 30} width="44" height="17" rx="4" fill="#2563eb" />
        <text x={from.x} y={from.y - 19} textAnchor="middle" fontSize="9" fill="white" fontWeight="800">
          {norm(arrGate)}
        </text>

        {/* ── Departure gate pin (urgency color) ── */}
        <g transform={`translate(${to.x},${to.y})`}>
          <circle cx="0" cy="0" r="11" fill={u.leftBar} opacity=".25" />
          <circle cx="0" cy="0" r="7" fill={u.leftBar} stroke="white" strokeWidth="2" />
          <text x="0" y="3.5" textAnchor="middle" fontSize="7" fill="white" fontWeight="800">★</text>
        </g>
        {/* Departure label */}
        <rect x={to.x - 22} y={to.y + 16} width="44" height="17" rx="4" fill={u.leftBar} />
        <text x={to.x} y={to.y + 28} textAnchor="middle" fontSize="9" fill="white" fontWeight="800">
          {norm(depGate)}
        </text>

        {/* ── Distance pill ── */}
        <rect x="310" y="198" width="200" height="22" rx="11" fill="white" stroke="#e5e7eb" strokeWidth="1" />
        <text x="410" y="213" textAnchor="middle" fontSize="10" fill="#374151" fontWeight="700">
          🚶 ≈ {walkTime} min walking · {available} min available
        </text>
      </svg>
    </div>
  );
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
//  DirectionsScreen
// ─────────────────────────────────────────────────────────────────
function DirectionsScreen({ result, onBack }) {
  const u = URGENCY_CONFIG[result.urgency];
  const { Icon } = u;

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%)", padding: "20px 20px 28px" }}>
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 4 }}>How to get there</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>
              Gate {result.arrGate} → Gate {result.depGate} &nbsp;·&nbsp; ≈ {fmtMin(result.walkTime)} walk
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

        {/* Urgent tip */}
        {(result.urgency === "risky" || result.urgency === "tight") && (
          <div className="animate-up" style={{
            background: result.urgency === "risky" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${result.urgency === "risky" ? "#fca5a5" : "#fdba74"}`,
            borderRadius: 12, padding: "13px 16px",
            display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14,
          }}>
            <AlertTriangle size={17} style={{ color: result.urgency === "risky" ? "#dc2626" : "#c2410c", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, lineHeight: 1.5, color: result.urgency === "risky" ? "#991b1b" : "#92400e" }}>
              {u.tip}
            </p>
          </div>
        )}

        {/* Map card */}
        <div className="card animate-up-2">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={17} style={{ color: "#2563eb" }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>How to go there</h2>
          </div>
          <AirportMap
            arrGate={result.arrGate}
            depGate={result.depGate}
            urgency={result.urgency}
            walkTime={result.walkTime}
            available={result.available}
          />

          {/* Metrics row */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { label: "Walk time", value: fmtMin(result.walkTime) },
              ...(result.securityTime > 0 ? [{ label: "Security", value: `+${result.securityTime} min` }] : []),
              { label: "Time available", value: fmtMin(result.available) },
              { label: "Buffer", value: result.buffer >= 0 ? `+${fmtMin(result.buffer)}` : `-${fmtMin(Math.abs(result.buffer))}`, hi: result.buffer < 0 },
            ].map(m => (
              <div key={m.label} style={{ flex: 1, background: "#f9fafb", borderRadius: 9, padding: "9px 8px", textAlign: "center" }}>
                <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>{m.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: m.hi ? "#dc2626" : "#111" }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps card */}
        <div className="card animate-up-3">
          <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 20 }}>Step-by-step directions</p>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 17, top: 18, bottom: 18, width: 2, background: "#f3f4f6", zIndex: 0 }} />
            {result.directions.map((step, i) => {
              const isLast = i === result.directions.length - 1;
              return (
                <div key={i} className="step-row" style={{ animationDelay: `${.22 + i * .07}s` }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: isLast ? u.color : "#1e3a8a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "3px solid white", boxShadow: "0 0 0 1.5px #e5e7eb", zIndex: 1,
                  }}>
                    {isLast
                      ? <MapPin size={15} color="white" />
                      : <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{i + 1}</span>
                    }
                  </div>
                  <div style={{ flex: 1, paddingTop: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.5, flex: 1 }}>{step.text}</p>
                      <StepIcon type={step.icon} color="#9ca3af" />
                    </div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>≈ {step.mins} min</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Total estimated walk</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: u.color }}>≈ {fmtMin(result.walkTime)}</span>
              <div style={{ background: u.bg, border: `1px solid ${u.border}`, borderRadius: 20, padding: "3px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                <Icon size={11} style={{ color: u.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: u.color }}>{u.label.split(" ")[0]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Go Back button */}
        <button className="btn-primary" onClick={onBack}
          style={{ width: "100%", marginTop: 4, fontSize: 16, padding: "14px" }}>
          ← Go Back
        </button>
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
  const resultsRef = useRef(null);

  const fromKey = norm(fromFlight);
  const toKey = norm(toFlight);
  const arrInfo = ARRIVALS_DB[fromKey] || null;
  const depInfo = DEPARTURES_DB[toKey] || null;

  useEffect(() => {
    if (depInfo) { setGate(depInfo.depGate); setMinsManual(String(depInfo.minsToBrd)); }
  }, [toKey]);

  const arrPier = arrInfo?.arrGate ? pier(arrInfo.arrGate) : null;
  const depPier = gate ? pier(gate) : null;
  const walkTime = arrPier && depPier ? WALK_TIME[arrPier]?.[depPier] ?? null : null;
  const available = parseInt(minsManual) || null;
  const canCheck = !!arrPier && !!depPier && !!available;

  const handleCheck = () => {
    if (!canCheck) return;
    setLoading(true); setResult(null);
    setTimeout(() => {
      const secTime = securityTime(gate);
      const buf = available - (walkTime + secTime);
      const urgency = calcUrgency(buf);
      const directions = buildDirections(arrInfo.arrGate, gate);
      setResult({ urgency, walkTime, securityTime: secTime, available, buffer: buf, directions, arrGate: arrInfo.arrGate, depGate: norm(gate), arrOrigin: arrInfo.origin, depDest: depInfo?.dest });
      setLoading(false); setFeedback(null);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }, 600);
  };

  const u = result ? URGENCY_CONFIG[result.urgency] : null;
  const ic = (valid, err) => `field-input${valid ? " valid" : ""}${err ? " error" : ""}`;

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%)", padding: "20px 20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 50, height: 50, borderRadius: 13, background: "#2563eb", boxShadow: "0 2px 10px rgba(0,0,0,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plane size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: -.5 }}>GateRunner</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 1 }}>Together, we'll get there on time!</p>
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏃</div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 36px" }}>

        {/* Airport Configuration */}
        <div className="card animate-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={17} style={{ color: "#2563eb" }} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Airport Configuration</h2>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 5, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "5px 11px", cursor: "pointer", color: "#1d4ed8", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
              <MapPin size={11} /> Get my location
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, marginLeft: 41 }}>Select the airport where you are making your connection.</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Airport</p>
          <div style={{ position: "relative" }}>
            <select className="select-input" value={airport} onChange={e => setAirport(e.target.value)}>
              {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Connection Flights */}
        <div className="card animate-up-2">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plane size={17} style={{ color: "#2563eb" }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Connection Flights</h2>
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 18, marginLeft: 41 }}>Enter your incoming and connecting flights to check your connection time.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.65fr", gap: 12, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>From Flight</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Arriving Flight)</p>
              <input className={ic(!!arrInfo, fromKey.length > 2 && !arrInfo)} value={fromFlight} onChange={e => { setFromFlight(e.target.value); setResult(null); }} placeholder="LH1983" maxLength={8} />
              {arrInfo ? <span className="hint-chip" style={{ background: "#eff6ff", color: "#1d4ed8" }}>✈ {arrInfo.origin} · Gate {arrInfo.arrGate}</span>
                : fromKey.length > 2 && <span className="hint-chip" style={{ background: "#fef2f2", color: "#b91c1c" }}>Flight not found</span>}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>To Flight</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Connecting Flight)</p>
              <input className={ic(!!depInfo, toKey.length > 2 && !depInfo)} value={toFlight} onChange={e => { setToFlight(e.target.value); setResult(null); }} placeholder="EN8206" maxLength={8} />
              {depInfo ? <span className="hint-chip" style={{ background: "#eff6ff", color: "#1d4ed8" }}>✈ to {depInfo.dest} · {depInfo.minsToBrd} min</span>
                : toKey.length > 2 && <span className="hint-chip" style={{ background: "#fef2f2", color: "#b91c1c" }}>Flight not found</span>}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>Gate</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Connecting Gate)</p>
              <input className={ic(!!depPier, gate.length > 0 && !depPier)} value={gate} onChange={e => { setGate(e.target.value.toUpperCase()); setResult(null); }} placeholder="G81" maxLength={5} />
              {depPier && <span className="hint-chip" style={{ background: PIER_INFO[depPier].color + "20", color: PIER_INFO[depPier].color }}>{PIER_INFO[depPier].terminal}</span>}
            </div>
          </div>

          {!depInfo && (arrInfo || depPier) && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f9fafb", borderRadius: 9, padding: "10px 13px", marginBottom: 14, border: "1px dashed #d1d5db" }}>
              <Clock size={14} style={{ color: "#6b7280", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#6b7280", flex: 1 }}>Minutes until boarding:</p>
              <input type="number" value={minsManual} onChange={e => setMinsManual(e.target.value)} placeholder="45" min={1} max={240}
                style={{ width: 65, border: "1.5px solid #d1d5db", borderRadius: 7, padding: "7px 10px", fontSize: 15, fontWeight: 700, color: "#111", outline: "none", fontFamily: "inherit", textAlign: "center" }} />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-primary" onClick={handleCheck} disabled={!canCheck || loading} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {loading ? <><Loader2 size={16} className="spin" /> Checking…</> : "Check Connection"}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && u && (
          <div ref={resultsRef} className="card animate-up">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={17} style={{ color: "#2563eb" }} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Results</h2>
            </div>
            <div className="result-card" style={{ background: u.bg, border: `1px solid ${u.border}`, borderLeftColor: u.leftBar, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, flex: 1, minWidth: 0 }}>
                <u.Icon size={30} style={{ color: u.color, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: u.color, marginBottom: 3 }}>{u.label}</p>
                  <p style={{ fontSize: 14, color: "#374151" }}>You have <strong style={{ color: u.color }}>{fmtMinLong(result.available)}</strong> to get there.</p>
                </div>
              </div>
              <button className="btn-outline" onClick={() => onHowToGo(result)} style={{ border: `1.5px solid ${u.color}`, color: u.color, flexShrink: 0 }}>
                How to go there <ArrowRight size={14} />
              </button>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Risk Indicator</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                {[{ dot: "#22c55e", label: "SAFE", note: "(> 20 min)" }, { dot: "#f97316", label: "TIGHT", note: "(5–20 min)" }, { dot: "#ef4444", label: "RISKY", note: "(< 5 min)" }].map(r => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: r.dot, display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{r.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feedback */}
        {result && (
          <div className="card animate-up-2">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle size={17} style={{ color: "#2563eb" }} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Feedback</h2>
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, marginLeft: 41 }}>Have you made your connection?</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { key: "safe", Icon: CheckCircle, label: "Yes\u00A0—\u00A0Safe", color: "#15803d", border: "#86efac", bg: "#f0fdf4" },
                { key: "tight", Icon: AlertTriangle, label: "Yes\u00A0—\u00A0Tight", color: "#c2410c", border: "#fdba74", bg: "#fff7ed" },
                { key: "risky", Icon: XCircle, label: "No\u00A0—\u00A0Missed", color: "#b91c1c", border: "#fca5a5", bg: "#fef2f2" },
              ].map(f => (
                <button key={f.key} className="feedback-btn"
                  onClick={() => setFeedback(p => p === f.key ? null : f.key)}
                  style={{ border: `1.5px solid ${feedback === f.key ? f.color : f.border}`, background: feedback === f.key ? f.bg : "white" }}>
                  <f.Icon size={20} style={{ color: f.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: f.color, textAlign: "center", lineHeight: 1.3 }}>{f.label}</span>
                </button>
              ))}
            </div>
            {feedback && (
              <p className="animate-fade" style={{ textAlign: "center", fontSize: 13, color: "#6b7280", fontStyle: "italic", marginBottom: 8 }}>
                {feedback === "safe" && "Great! Thanks for the feedback. Safe travels! ✈"}
                {feedback === "tight" && "Phew, close one! Thank you for the feedback."}
                {feedback === "risky" && "We're sorry. Please visit your airline's service desk."}
              </p>
            )}
            <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af" }}>Your feedback helps us improve GateRunner!</p>
          </div>
        )}

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

