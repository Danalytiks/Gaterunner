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
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .animate-up   { animation: fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both; }
  .animate-up-2 { animation: fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) 0.08s both; }
  .animate-up-3 { animation: fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) 0.16s both; }
  .animate-fade { animation: fadeIn 0.35s ease both; }
  .spin         { animation: spin 0.8s linear infinite; }

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
    border: 1px solid #e5e7eb; padding: 20px;
    margin-bottom: 14px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }

  .result-card {
    border-radius: 11px; padding: 15px 16px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
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
    display: flex; gap: 14px; margin-bottom: 22px;
    position: relative; z-index: 1;
    animation: fadeSlideUp 0.35s ease both;
  }

  .hint-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600; padding: 3px 8px;
    border-radius: 20px; margin-top: 5px;
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
  safe: {
    label: "Safe Connection", color: "#15803d",
    bg: "#f0fdf4", border: "#86efac", leftBar: "#22c55e",
    Icon: CheckCircle,
    tip: "You're good! Head to your gate at a relaxed pace.",
  },
  tight: {
    label: "Tight Connection", color: "#c2410c",
    bg: "#fff7ed", border: "#fdba74", leftBar: "#f97316",
    Icon: AlertTriangle,
    tip: "Go directly to your gate — no stops along the way.",
  },
  risky: {
    label: "Risky Connection", color: "#b91c1c",
    bg: "#fef2f2", border: "#fca5a5", leftBar: "#ef4444",
    Icon: Clock,
    tip: "Alert the crew now! Ask them to notify the gate to hold.",
  },
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

function calcUrgency(buffer) {
  if (buffer > 20) return "safe";
  if (buffer > 5) return "tight";
  return "risky";
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
        background: accent + "20", border: `2px solid ${accent}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 6px",
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: accent, fontFamily: "monospace" }}>
          {norm(gate) || "—"}
        </span>
      </div>
      {info && <p style={{ margin: 0, fontSize: 10, color: "#6b7280", lineHeight: 1.3, maxWidth: 80 }}>{info.label}</p>}
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
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 4 }}>How to get there</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
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

        {/* Route summary */}
        <div className="card animate-up" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
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

          {/* Metrics */}
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
                flex: 1, background: "#f9fafb", borderRadius: 9, padding: "9px 8px", textAlign: "center",
              }}>
                <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>{m.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: m.hi ? "#dc2626" : "#111" }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent tip */}
        {(result.urgency === "risky" || result.urgency === "tight") && (
          <div className="animate-up-2" style={{
            background: result.urgency === "risky" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${result.urgency === "risky" ? "#fca5a5" : "#fdba74"}`,
            borderRadius: 12, padding: "13px 16px",
            display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14,
          }}>
            <AlertTriangle size={17} style={{
              color: result.urgency === "risky" ? "#dc2626" : "#c2410c",
              flexShrink: 0, marginTop: 1,
            }} />
            <p style={{ fontSize: 13, lineHeight: 1.5, color: result.urgency === "risky" ? "#991b1b" : "#92400e" }}>
              {u.tip}
            </p>
          </div>
        )}

        {/* Steps */}
        <div className="card animate-up-3">
          <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 20 }}>
            Step-by-step directions
          </p>
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", left: 17, top: 18, bottom: 18,
              width: 2, background: "#f3f4f6", zIndex: 0,
            }} />
            {result.directions.map((step, i) => {
              const isLast = i === result.directions.length - 1;
              return (
                <div key={i} className="step-row" style={{ animationDelay: `${0.22 + i * 0.07}s` }}>
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
          <div style={{
            borderTop: "1px solid #f3f4f6", paddingTop: 14, marginTop: 2,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Total estimated walk</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: u.color }}>≈ {fmtMin(result.walkTime)}</span>
              <div style={{
                background: u.bg, border: `1px solid ${u.border}`,
                borderRadius: 20, padding: "3px 10px",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Icon size={11} style={{ color: u.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: u.color }}>{u.label.split(" ")[0]}</span>
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
  const resultsRef = useRef(null);

  const fromKey = norm(fromFlight);
  const toKey = norm(toFlight);
  const arrInfo = ARRIVALS_DB[fromKey] || null;
  const depInfo = DEPARTURES_DB[toKey] || null;

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
  const canCheck = !!arrPier && !!depPier && !!available;

  const handleCheck = () => {
    if (!canCheck) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const secTime = securityTime(gate);
      const effectiveWalk = walkTime + secTime;
      const buf = available - effectiveWalk;
      const urgency = calcUrgency(buf);
      const directions = buildDirections(arrInfo.arrGate, gate);
      setResult({
        urgency, walkTime, securityTime: secTime,
        effectiveWalk, available, buffer: buf,
        directions,
        arrGate: arrInfo.arrGate,
        depGate: norm(gate),
        arrOrigin: arrInfo.origin,
        depDest: depInfo?.dest,
      });
      setLoading(false);
      setFeedback(null);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }, 600);
  };

  const u = result ? URGENCY_CONFIG[result.urgency] : null;
  const inputClass = (valid, err) => `field-input${valid ? " valid" : ""}${err ? " error" : ""}`;

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", padding: "20px 20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 13, background: "#2563eb",
              boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plane size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: -0.5 }}>GateRunner</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
                Together, we'll get there on time!
              </p>
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>🏃</div>
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
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 18, marginLeft: 41 }}>
            Enter your incoming and connecting flights to check your connection time.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.65fr", gap: 12, marginBottom: 16 }}>
            {/* From Flight */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>From Flight</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Arriving Flight)</p>
              <input
                className={inputClass(!!arrInfo, fromKey.length > 2 && !arrInfo)}
                value={fromFlight}
                onChange={e => { setFromFlight(e.target.value); setResult(null); }}
                placeholder="LH1983" maxLength={8}
              />
              {arrInfo
                ? <span className="hint-chip" style={{ background: "#eff6ff", color: "#1d4ed8" }}>✈ {arrInfo.origin} · Gate {arrInfo.arrGate}</span>
                : fromKey.length > 2 && <span className="hint-chip" style={{ background: "#fef2f2", color: "#b91c1c" }}>Flight not found</span>
              }
            </div>

            {/* To Flight */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>To Flight</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Connecting Flight)</p>
              <input
                className={inputClass(!!depInfo, toKey.length > 2 && !depInfo)}
                value={toFlight}
                onChange={e => { setToFlight(e.target.value); setResult(null); }}
                placeholder="EN8206" maxLength={8}
              />
              {depInfo
                ? <span className="hint-chip" style={{ background: "#eff6ff", color: "#1d4ed8" }}>✈ to {depInfo.dest} · {depInfo.minsToBrd} min</span>
                : toKey.length > 2 && <span className="hint-chip" style={{ background: "#fef2f2", color: "#b91c1c" }}>Flight not found</span>
              }
            </div>

            {/* Gate */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 1 }}>Gate</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>(Connecting Gate)</p>
              <input
                className={inputClass(!!depPier, gate.length > 0 && !depPier)}
                value={gate}
                onChange={e => { setGate(e.target.value.toUpperCase()); setResult(null); }}
                placeholder="G81" maxLength={5}
              />
              {depPier && (
                <span className="hint-chip" style={{ background: PIER_INFO[depPier].color + "20", color: PIER_INFO[depPier].color }}>
                  {PIER_INFO[depPier].terminal}
                </span>
              )}
            </div>
          </div>

          {/* Manual minutes */}
          {!depInfo && (arrInfo || depPier) && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#f9fafb", borderRadius: 9, padding: "10px 13px",
              marginBottom: 14, border: "1px dashed #d1d5db",
            }}>
              <Clock size={14} style={{ color: "#6b7280", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#6b7280", flex: 1 }}>Minutes until boarding:</p>
              <input
                type="number" value={minsManual}
                onChange={e => setMinsManual(e.target.value)}
                placeholder="45" min={1} max={240}
                style={{
                  width: 65, border: "1.5px solid #d1d5db", borderRadius: 7,
                  padding: "7px 10px", fontSize: 15, fontWeight: 700,
                  color: "#111", outline: "none", fontFamily: "inherit", textAlign: "center",
                }}
              />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-primary"
              onClick={handleCheck}
              disabled={!canCheck || loading}
              style={{ display: "flex", alignItems: "center", gap: 7 }}
            >
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
                  <p style={{ fontSize: 14, color: "#374151" }}>
                    You have <strong style={{ color: u.color }}>{fmtMinLong(result.available)}</strong> to get there.
                  </p>
                </div>
              </div>
              <button
                className="btn-outline"
                onClick={() => onHowToGo(result)}
                style={{ border: `1.5px solid ${u.color}`, color: u.color, flexShrink: 0 }}
              >
                How to go there <ArrowRight size={14} />
              </button>
            </div>

            {/* Risk Indicator */}
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Risk Indicator</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                {[
                  { dot: "#22c55e", label: "SAFE", note: "(> 20 min)" },
                  { dot: "#f97316", label: "TIGHT", note: "(5–20 min)" },
                  { dot: "#ef4444", label: "RISKY", note: "(< 5 min)" },
                ].map(r => (
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
              <p className="animate-fade" style={{ textAlign: "center", fontSize: 13, color: "#6b7280", fontStyle: "italic", marginBottom: 8 }}>
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
