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
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Inter',sans-serif; }

  @keyframes fadeSlideUp {
    from{opacity:0;transform:translateY(16px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes drawRoute{
    from{stroke-dashoffset:1200}
    to{stroke-dashoffset:0}
  }
  @keyframes pinPop{
    0%{transform:scale(0);opacity:0}
    70%{transform:scale(1.2);opacity:1}
    100%{transform:scale(1)}
  }
  @keyframes pulse{
    0%,100%{opacity:.4;r:12}
    50%{opacity:.15;r:18}
  }

  .animate-up   {animation:fadeSlideUp .4s cubic-bezier(.22,.68,0,1.2) both}
  .animate-up-2 {animation:fadeSlideUp .4s cubic-bezier(.22,.68,0,1.2) .08s both}
  .animate-up-3 {animation:fadeSlideUp .4s cubic-bezier(.22,.68,0,1.2) .16s both}
  .animate-fade {animation:fadeIn .35s ease both}
  .spin         {animation:spin .8s linear infinite}
  .route-line   {stroke-dasharray:1200;animation:drawRoute 1.2s cubic-bezier(.4,0,.2,1) .4s both}
  .pin-pop      {animation:pinPop .4s cubic-bezier(.22,.68,0,1.2) .8s both;transform-origin:center}
  .pin-pulse    {animation:pulse 2s ease-in-out infinite}

  .btn-primary{
    background:#2563eb;color:white;border:none;border-radius:9px;
    padding:11px 24px;font-size:15px;font-weight:700;cursor:pointer;
    transition:background .18s,transform .12s,box-shadow .18s;font-family:inherit;
  }
  .btn-primary:hover:not(:disabled){background:#1d4ed8;box-shadow:0 4px 14px rgba(37,99,235,.35)}
  .btn-primary:active:not(:disabled){transform:scale(.97)}
  .btn-primary:disabled{background:#bfdbfe;cursor:not-allowed}

  .btn-outline{
    background:transparent;border-radius:9px;padding:9px 16px;
    font-size:13px;font-weight:700;cursor:pointer;
    display:flex;align-items:center;gap:6px;white-space:nowrap;
    transition:background .15s,transform .12s;font-family:inherit;
  }
  .btn-outline:hover{filter:brightness(.93)}
  .btn-outline:active{transform:scale(.96)}

  .btn-back{
    display:flex;align-items:center;gap:6px;
    background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);
    border-radius:20px;padding:7px 16px;color:white;
    font-size:14px;font-weight:600;cursor:pointer;margin-bottom:16px;
    transition:background .15s;font-family:inherit;
  }
  .btn-back:hover{background:rgba(255,255,255,.25)}

  .field-input{
    width:100%;border:1.5px solid #d1d5db;border-radius:9px;
    padding:11px 13px;font-size:15px;font-weight:600;color:#111;
    outline:none;background:white;font-family:'Inter',inherit;
    transition:border-color .15s,box-shadow .15s;text-transform:uppercase;
  }
  .field-input::placeholder{color:#9ca3af;font-weight:400;text-transform:none}
  .field-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
  .field-input.valid{border-color:#86efac}
  .field-input.error{border-color:#fca5a5}

  .select-input{
    width:100%;border:1.5px solid #d1d5db;border-radius:9px;
    padding:11px 36px 11px 13px;font-size:15px;font-weight:600;
    color:#111;outline:none;background:white;
    font-family:'Inter',inherit;appearance:none;cursor:pointer;
    transition:border-color .15s,box-shadow .15s;
  }
  .select-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}

  .card{
    background:white;border-radius:14px;border:1px solid #e5e7eb;
    padding:20px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.05);
  }
  .result-card{
    border-radius:11px;padding:15px 16px;display:flex;align-items:center;
    justify-content:space-between;gap:12px;
    border-left-width:4px;border-left-style:solid;
  }
  .feedback-btn{
    border-radius:9px;padding:11px 8px;cursor:pointer;
    display:flex;flex-direction:column;align-items:center;gap:6px;
    transition:transform .12s,box-shadow .15s;font-family:inherit;
  }
  .feedback-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
  .feedback-btn:active{transform:scale(.96)}
  .step-row{
    display:flex;gap:14px;margin-bottom:22px;
    position:relative;z-index:1;animation:fadeSlideUp .35s ease both;
  }
  .hint-chip{
    display:inline-flex;align-items:center;gap:4px;
    font-size:11px;font-weight:600;padding:3px 8px;
    border-radius:20px;margin-top:5px;
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
//  Airport Map — styled to match mockup
// ─────────────────────────────────────────────────────────────────

// Gate → pixel coordinate in the SVG (760×380 viewBox)
// T1 piers on the LEFT side, T2 / Satellite on the RIGHT
function gateCoord(g) {
  const p = pier(g);
  const n = parseInt(norm(g).slice(1)) || 1;
  if (!p) return { x: 380, y: 190 };
  // T1 piers — finger piers extend UPWARD from concourse at y≈230
  if (p === "E") return { x: 52, y: 80 + (Math.min(n, 99) / 99) * 130 };
  if (p === "D") return { x: 102, y: 65 + (Math.min(n, 23) / 23) * 145 };
  if (p === "C") return { x: 152, y: 60 + (Math.min(n, 30) / 30) * 150 };
  if (p === "B") return { x: 202, y: 65 + (Math.min(n, 17) / 17) * 145 };
  if (p === "A") return { x: 252, y: 75 + (Math.min(n, 43) / 43) * 135 };
  // T2 Main — G is lower (Lv04), H is upper (Lv05)
  if (p === "G") return { x: 390 + (Math.min(n, 48) / 48) * 185, y: 268 };
  if (p === "H") return { x: 390 + (Math.min(n, 48) / 48) * 185, y: 170 };
  // T2 Satellite — K lower, L upper
  if (p === "K") return { x: 655 + (Math.min(n, 30) / 30) * 80, y: 268 };
  if (p === "L") return { x: 655 + (Math.min(n, 30) / 30) * 80, y: 170 };
  return { x: 380, y: 190 };
}

function buildWaypoints(arrGate, depGate) {
  const fp = pier(arrGate), tp = pier(depGate);
  if (!fp || !tp) return [gateCoord(arrGate), gateCoord(depGate)];
  const fi = PIER_INFO[fp], ti = PIER_INFO[tp];
  const from = gateCoord(arrGate);
  const to = gateCoord(depGate);
  const pts = [from];
  const CONC = 232; // T1 concourse y
  const CONC2 = 232; // T2 concourse y (same level)
  const MAC_X = 330; // MAC/bus connection x
  const SAT_X = 628; // Satellite train x

  if (fi.terminal === "T1" && ti.terminal === "T1") {
    pts.push({ x: from.x, y: CONC });
    pts.push({ x: to.x, y: CONC });
  } else if (fi.terminal === "T2" && ti.terminal === "T2") {
    pts.push({ x: from.x, y: CONC2 });
    pts.push({ x: to.x, y: CONC2 });
  } else if (fi.terminal === "T2" && ti.terminal === "T2S") {
    pts.push({ x: from.x, y: CONC2 });
    pts.push({ x: SAT_X, y: CONC2 });
  } else if (fi.terminal === "T2S" && ti.terminal === "T2") {
    pts.push({ x: from.x, y: CONC2 });
    pts.push({ x: SAT_X, y: CONC2 });
    pts.push({ x: to.x, y: CONC2 });
  } else if (fi.terminal === "T1" && ti.terminal === "T2") {
    pts.push({ x: from.x, y: CONC });
    pts.push({ x: MAC_X, y: CONC });
    pts.push({ x: to.x, y: CONC2 });
  } else if (fi.terminal === "T1" && ti.terminal === "T2S") {
    pts.push({ x: from.x, y: CONC });
    pts.push({ x: MAC_X, y: CONC });
    pts.push({ x: SAT_X, y: CONC2 });
  } else if (fi.terminal === "T2" && ti.terminal === "T1") {
    pts.push({ x: from.x, y: CONC2 });
    pts.push({ x: MAC_X, y: CONC });
    pts.push({ x: to.x, y: CONC });
  } else if (fi.terminal === "T2S" && ti.terminal === "T1") {
    pts.push({ x: from.x, y: CONC2 });
    pts.push({ x: SAT_X, y: CONC2 });
    pts.push({ x: MAC_X, y: CONC });
    pts.push({ x: to.x, y: CONC });
  }
  pts.push(to);
  return pts;
}

function AirportMap({ arrGate, depGate, urgency, walkTime, available }) {
  const u = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.tight;
  const from = gateCoord(arrGate);
  const to = gateCoord(depGate);
  const wpts = buildWaypoints(arrGate, depGate);
  const pathD = wpts.map((p, i) => `${i === 0 ? "M" : "L"} ${Math.round(p.x)} ${Math.round(p.y)}`).join(" ");
  const pinColor = u.leftBar;

  return (
    <div style={{
      borderRadius: 12, overflow: "hidden",
      border: "1px solid #c8d8e8",
      boxShadow: "0 2px 12px rgba(30,60,120,.1)",
    }}>
      <svg viewBox="0 0 760 380" style={{ width: "100%", display: "block" }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mapbg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c0d4ec" />
            <stop offset="100%" stopColor="#d8e8f6" />
          </linearGradient>
          <filter id="bshadow">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#7090b0" floodOpacity=".35" />
          </filter>
          <filter id="pshadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity=".3" />
          </filter>
          <marker id="arrowhead" markerWidth="10" markerHeight="7"
            refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#1a6fe8" />
          </marker>
        </defs>

        {/* ── Background ── */}
        <rect width="760" height="380" fill="url(#mapbg)" />

        {/* Subtle map grid */}
        {[...Array(9)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 46} x2="760" y2={i * 46}
            stroke="#b0c8e0" strokeWidth="0.4" opacity="0.6" />
        ))}
        {[...Array(16)].map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="380"
            stroke="#b0c8e0" strokeWidth="0.4" opacity="0.6" />
        ))}

        {/* ── Taxiways at bottom ── */}
        <rect x="0" y="310" width="760" height="35" rx="0" fill="#adc0d4" opacity=".7" />
        <rect x="0" y="320" width="760" height="3" fill="#98b0c4" opacity=".9" />
        <rect x="0" y="328" width="760" height="3" fill="#98b0c4" opacity=".6" />

        {/* ── MAC / Bus connection road ── */}
        <rect x="285" y="115" width="75" height="197" fill="#a8bcd0" opacity=".65" />
        {/* Road markings */}
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={i} x="319" y={128 + i * 32} width="5" height="18" rx="2"
            fill="white" opacity=".5" />
        ))}
        {/* MAC label box */}
        <rect x="289" y="196" width="67" height="40" rx="6"
          fill="white" opacity=".88" filter="url(#bshadow)" />
        <text x="322" y="212" textAnchor="middle" fontSize="9" fill="#4a6a8a" fontWeight="800">MAC</text>
        <text x="322" y="226" textAnchor="middle" fontSize="8" fill="#7a9ab8">🚌 Bus Stop</text>

        {/* ── Satellite train station ── */}
        <rect x="618" y="195" width="36" height="45" rx="5"
          fill="#fde68a" opacity=".85" filter="url(#bshadow)" />
        <text x="636" y="221" textAnchor="middle" fontSize="11">🚆</text>

        {/* ══════════════════════════════════
             TERMINAL 1  (left side)
        ══════════════════════════════════ */}

        {/* T1 Main concourse */}
        <rect x="25" y="218" width="253" height="42" rx="7"
          fill="white" stroke="#c0d4e8" strokeWidth="1" filter="url(#bshadow)" />
        {/* concourse roof line */}
        <rect x="25" y="218" width="253" height="11" rx="7" fill="#eaf1fb" />
        <rect x="25" y="225" width="253" height="4" fill="#dce8f8" />

        {/* T1 Finger piers — 5 piers pointing UP */}
        {[
          { x: 50, label: "E", h: 130 },
          { x: 100, label: "D", h: 145 },
          { x: 150, label: "C", h: 150 },
          { x: 200, label: "B", h: 145 },
          { x: 250, label: "A", h: 130 },
        ].map(p => (
          <g key={p.label}>
            {/* Pier body */}
            <rect x={p.x - 10} y={218 - p.h} width="20" height={p.h}
              rx="4" fill="white" stroke="#c0d4e8" strokeWidth="0.8"
              filter="url(#bshadow)" />
            {/* Gate slots on left */}
            {[...Array(6)].map((_, j) => (
              <rect key={`l${j}`} x={p.x - 17} y={218 - p.h + 20 + j * 18}
                width="7" height="5" rx="1" fill="#ccdde8" />
            ))}
            {/* Gate slots on right */}
            {[...Array(6)].map((_, j) => (
              <rect key={`r${j}`} x={p.x + 10} y={218 - p.h + 20 + j * 18}
                width="7" height="5" rx="1" fill="#ccdde8" />
            ))}
            {/* Pier label */}
            <text x={p.x} y={220 - p.h + 12} textAnchor="middle"
              fontSize="8" fill="#6a8aaa" fontWeight="700">{p.label}</text>
          </g>
        ))}

        {/* T1 gate label */}
        <text x="151" y="250" textAnchor="middle"
          fontSize="12" fill="#3a5a7a" fontWeight="800" opacity=".9">Terminal 1</text>

        {/* ══════════════════════════════════
             TERMINAL 2  (right side)
        ══════════════════════════════════ */}

        {/* T2 H-pier building (upper, Level 05) */}
        <rect x="374" y="135" width="235" height="62" rx="7"
          fill="white" stroke="#c0d4e8" strokeWidth="1" filter="url(#bshadow)" />
        <rect x="374" y="135" width="235" height="11" rx="7" fill="#eaf1fb" />
        <rect x="374" y="142" width="235" height="4" fill="#dce8f8" />
        {/* H gate slots */}
        {[...Array(9)].map((_, i) => (
          <rect key={i} x={382 + i * 24} y={162} width="14" height="6" rx="2" fill="#ccdde8" />
        ))}
        {[...Array(9)].map((_, i) => (
          <rect key={i} x={382 + i * 24} y={172} width="14" height="6" rx="2" fill="#ccdde8" />
        ))}
        <text x="491" y="153" textAnchor="middle"
          fontSize="8" fill="#6a8aaa" fontWeight="700">H01–H48 · Lv05</text>

        {/* T2 Main concourse body */}
        <rect x="374" y="218" width="235" height="42" rx="7"
          fill="white" stroke="#c0d4e8" strokeWidth="1" filter="url(#bshadow)" />
        <rect x="374" y="218" width="235" height="11" rx="7" fill="#eaf1fb" />
        <rect x="374" y="225" width="235" height="4" fill="#dce8f8" />

        {/* T2 G-pier (lower strip, Level 04) */}
        <rect x="374" y="260" width="235" height="28" rx="4"
          fill="white" stroke="#c0d4e8" strokeWidth="0.8" />
        {[...Array(9)].map((_, i) => (
          <rect key={i} x={382 + i * 24} y={266} width="14" height="6" rx="2" fill="#ccdde8" />
        ))}
        {[...Array(9)].map((_, i) => (
          <rect key={i} x={382 + i * 24} y={275} width="14" height="6" rx="2" fill="#ccdde8" />
        ))}
        <text x="491" y="250" textAnchor="middle"
          fontSize="12" fill="#3a5a7a" fontWeight="800" opacity=".9">Terminal 2</text>

        {/* ══════════════════════════════════
             T2 SATELLITE  (far right)
        ══════════════════════════════════ */}
        <rect x="650" y="133" width="100" height="158" rx="7"
          fill="white" stroke="#e8d88a" strokeWidth="1.5" filter="url(#bshadow)" />
        <rect x="650" y="133" width="100" height="11" rx="7" fill="#fef3c7" />
        <rect x="650" y="140" width="100" height="4" fill="#fde68a" />

        {/* L gates (top) */}
        <rect x="656" y="158" width="88" height="28" rx="3"
          fill="#fef9e7" stroke="#fde68a" strokeWidth="0.8" />
        {[...Array(4)].map((_, i) => (
          <rect key={i} x={660 + i * 20} y={164} width="12" height="5" rx="1" fill="#fde68a" />
        ))}
        {[...Array(4)].map((_, i) => (
          <rect key={i} x={660 + i * 20} y={172} width="12" height="5" rx="1" fill="#fde68a" />
        ))}

        {/* K gates (bottom) */}
        <rect x="656" y="255" width="88" height="28" rx="3"
          fill="#fef9e7" stroke="#fde68a" strokeWidth="0.8" />
        {[...Array(4)].map((_, i) => (
          <rect key={i} x={660 + i * 20} y={261} width="12" height="5" rx="1" fill="#fde68a" />
        ))}
        {[...Array(4)].map((_, i) => (
          <rect key={i} x={660 + i * 20} y={269} width="12" height="5" rx="1" fill="#fde68a" />
        ))}

        <text x="700" y="218" textAnchor="middle"
          fontSize="9" fill="#8a6a2a" fontWeight="800">Satellite</text>
        <text x="700" y="230" textAnchor="middle"
          fontSize="8" fill="#a08040">T2 · K/L</text>

        {/* ══════════════════════════════════
             ROUTE LINE
        ══════════════════════════════════ */}
        {/* Route glow/shadow */}
        <path d={pathD} fill="none"
          stroke="rgba(0,60,160,.18)" strokeWidth="10"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Animated route */}
        <path d={pathD}
          className="route-line"
          fill="none"
          stroke="#1a6fe8"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1200"
          markerEnd="url(#arrowhead)"
        />
        {/* Route highlight */}
        <path d={pathD} fill="none"
          stroke="rgba(255,255,255,.4)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Junction dots at waypoints */}
        {wpts.slice(1, -1).map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="7"
              fill="white" stroke="#1a6fe8" strokeWidth="2"
              filter="url(#bshadow)" />
            <circle cx={pt.x} cy={pt.y} r="3" fill="#1a6fe8" />
          </g>
        ))}

        {/* ══════════════════════════════════
             ARRIVAL PIN — orange
        ══════════════════════════════════ */}
        <g className="pin-pop">
          {/* Pulse ring */}
          <circle cx={from.x} cy={from.y} r="16"
            fill="#f97316" opacity=".15" className="pin-pulse" />
          {/* Pin circle */}
          <circle cx={from.x} cy={from.y} r="10"
            fill="#f97316" stroke="white" strokeWidth="2.5"
            filter="url(#pshadow)" />
          {/* Label badge — positioned above pin */}
          <rect x={from.x - 26} y={from.y - 46} width="52" height="24"
            rx="6" fill="#f97316" filter="url(#pshadow)" />
          {/* Badge notch (triangle) */}
          <polygon
            points={`${from.x - 5},${from.y - 22} ${from.x + 5},${from.y - 22} ${from.x},${from.y - 13}`}
            fill="#f97316" />
          <text x={from.x - 18} y={from.y - 31} fontSize="8" fill="white">✈</text>
          <text x={from.x - 5} y={from.y - 31} fontSize="10" fill="white" fontWeight="800">
            {norm(arrGate)}
          </text>
        </g>

        {/* ══════════════════════════════════
             DEPARTURE PIN — urgency color
        ══════════════════════════════════ */}
        <g className="pin-pop" style={{ animationDelay: "1s" }}>
          <circle cx={to.x} cy={to.y} r="16"
            fill={pinColor} opacity=".15" className="pin-pulse" />
          <circle cx={to.x} cy={to.y} r="10"
            fill={pinColor} stroke="white" strokeWidth="2.5"
            filter="url(#pshadow)" />
          {/* Label badge — below pin */}
          <rect x={to.x - 26} y={to.y + 14} width="52" height="24"
            rx="6" fill={pinColor} filter="url(#pshadow)" />
          <polygon
            points={`${to.x - 5},${to.y + 14} ${to.x + 5},${to.y + 14} ${to.x},${to.y + 10}`}
            fill={pinColor} />
          <text x={to.x - 18} y={to.y + 29} fontSize="8" fill="white">✈</text>
          <text x={to.x - 5} y={to.y + 29} fontSize="10" fill="white" fontWeight="800">
            {norm(depGate)}
          </text>
        </g>

        {/* ── Footer ── */}
        <text x="14" y="370" fontSize="8" fill="#6080a0" fontWeight="500">
          Flughafen München / Munich Airport
        </text>

        {/* ── Distance / time pill ── */}
        <rect x="245" y="324" width="270" height="30" rx="15"
          fill="white" stroke="#d0dce8" strokeWidth="1"
          filter="url(#bshadow)" />
        <text x="380" y="343" textAnchor="middle"
          fontSize="12" fill="#1e293b" fontWeight="700">
          🚶 {walkTime} min walking · {available} min available
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
    <div style={{ background: "#f1f5f9", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "20px 20px 28px" }}>
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
          <div style={{ background: u.bg, border: `1.5px solid ${u.border}`, borderRadius: 20, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <Icon size={13} style={{ color: u.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: u.color }}>{u.label.split(" ")[0].toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 32px" }}>

        {/* Results card */}
        <div className="card animate-up">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={17} style={{ color: "#2563eb" }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0d0d0d" }}>Results</h2>
          </div>
          <div className="result-card" style={{ background: u.bg, border: `1px solid ${u.border}`, borderLeftColor: u.leftBar }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, flex: 1 }}>
              <u.Icon size={28} style={{ color: u.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: u.color, marginBottom: 2 }}>{u.label}</p>
                <p style={{ fontSize: 14, color: "#374151" }}>
                  You have <strong style={{ color: u.color }}>{fmtMinLong(result.available)}</strong> to get there.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map card — exactly as mockup */}
        <div className="card animate-up-2">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Navigation size={17} style={{ color: "#2563eb" }} />
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

          {/* Metrics */}
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

        {/* Urgent alert */}
        {(result.urgency === "risky" || result.urgency === "tight") && (
          <div className="animate-up-3" style={{
            background: result.urgency === "risky" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${result.urgency === "risky" ? "#fca5a5" : "#fdba74"}`,
            borderRadius: 12, padding: "13px 16px",
            display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14,
          }}>
            <AlertTriangle size={17} style={{ color: result.urgency === "risky" ? "#dc2626" : "#c2410c", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, lineHeight: 1.5, color: result.urgency === "risky" ? "#991b1b" : "#92400e" }}>{u.tip}</p>
          </div>
        )}

        {/* Step-by-step */}
        <div className="card">
          <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 20 }}>Step-by-step directions</p>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 17, top: 18, bottom: 18, width: 2, background: "#f3f4f6", zIndex: 0 }} />
            {result.directions.map((step, i) => {
              const isLast = i === result.directions.length - 1;
              return (
                <div key={i} className="step-row" style={{ animationDelay: `${.1 + i * .07}s` }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: isLast ? u.color : "#1e3a8a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "3px solid white", boxShadow: "0 0 0 1.5px #e5e7eb", zIndex: 1,
                  }}>
                    {isLast ? <MapPin size={15} color="white" /> : <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{i + 1}</span>}
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

        {/* Go Back — big blue button like mockup */}
        <button className="btn-primary" onClick={onBack}
          style={{ width: "60%", margin: "8px auto 0", display: "block", fontSize: 16, padding: "14px", borderRadius: 12 }}>
          Go Back
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

  useEffect(() => { if (depInfo) { setGate(depInfo.depGate); setMinsManual(String(depInfo.minsToBrd)); } }, [toKey]);

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
      <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "20px 20px 28px" }}>
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

        {/* Airport Config */}
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
            {/* Risk Indicator */}
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

