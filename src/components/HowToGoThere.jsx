import { Navigation, AlertTriangle, ArrowRight } from "lucide-react";
import Card from "./Card";

function AirportMap() {
  return (
    <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid #d1dce8", boxShadow:"0 2px 10px rgba(30,60,120,0.1)" }}>
      <svg viewBox="0 0 720 420" style={{ width:"100%", display:"block" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#bdd0e8"/><stop offset="100%" stopColor="#d4e4f4"/>
          </linearGradient>
          <filter id="bShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#7090b0" floodOpacity="0.3"/>
          </filter>
          <filter id="pShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.25"/>
          </filter>
          <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#1a6fe8"/>
          </marker>
          <style>{`
            @keyframes drawRoute { from{stroke-dashoffset:800} to{stroke-dashoffset:0} }
            @keyframes pinPop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
            @keyframes walkPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
            .route-animated { stroke-dasharray:800; animation:drawRoute 1.4s cubic-bezier(0.4,0,0.2,1) 0.3s both; }
            .pin-pop { animation:pinPop 0.5s cubic-bezier(0.22,0.68,0,1.2) 0.8s both; transform-origin:center; }
            .walk-pulse { animation:walkPulse 1.5s ease-in-out infinite; }
          `}</style>
        </defs>
        <rect width="720" height="420" fill="url(#mapBg)"/>
        {[...Array(10)].map((_,i)=><line key={`h${i}`} x1="0" y1={i*45} x2="720" y2={i*45} stroke="#a8c0d8" strokeWidth="0.4" opacity="0.5"/>)}
        {[...Array(17)].map((_,i)=><line key={`v${i}`} x1={i*45} y1="0" x2={i*45} y2="420" stroke="#a8c0d8" strokeWidth="0.4" opacity="0.5"/>)}
        <rect x="0" y="350" width="720" height="35" fill="#9fb8cc" opacity="0.6"/>
        <rect x="0" y="360" width="720" height="3" fill="#8aaec0" opacity="0.8"/>
        <rect x="282" y="105" width="68" height="215" fill="#98b0c8" opacity="0.7"/>
        {[0,1,2,3,4,5].map(i=><rect key={i} x="313" y={118+i*28} width="5" height="16" rx="2" fill="white" opacity="0.55"/>)}
        <rect x="287" y="196" width="58" height="38" rx="6" fill="white" opacity="0.9" filter="url(#bShadow)"/>
        <text x="316" y="211" textAnchor="middle" fontSize="9" fill="#4a6a8a" fontWeight="800">MAC</text>
        <text x="316" y="225" textAnchor="middle" fontSize="8" fill="#7a9ab8">🚌 Bus</text>
        <rect x="598" y="180" width="34" height="48" rx="4" fill="#e8d070" opacity="0.85" filter="url(#bShadow)"/>
        <text x="615" y="209" textAnchor="middle" fontSize="12">🚆</text>
        <rect x="22" y="210" width="250" height="44" rx="8" fill="white" stroke="#c0d4e8" strokeWidth="1" filter="url(#bShadow)"/>
        <rect x="22" y="210" width="250" height="12" rx="8" fill="#e8f0fa"/>
        {[{x:42,label:"E",h:100},{x:92,label:"D",h:115},{x:142,label:"C",h:120},{x:192,label:"B",h:115},{x:242,label:"A",h:100}].map(p=>(
          <g key={p.label}>
            <rect x={p.x-10} y={210-p.h} width="20" height={p.h} rx="4" fill="white" stroke="#c0d4e8" strokeWidth="0.8" filter="url(#bShadow)"/>
            {[...Array(5)].map((_,j)=>(
              <g key={j}>
                <rect x={p.x-17} y={215-p.h+18+j*17} width="7" height="4" rx="1" fill="#ccdde8"/>
                <rect x={p.x+10} y={215-p.h+18+j*17} width="7" height="4" rx="1" fill="#ccdde8"/>
              </g>
            ))}
            <text x={p.x} y={212-p.h+11} textAnchor="middle" fontSize="8" fill="#6a8aaa" fontWeight="700">{p.label}</text>
          </g>
        ))}
        <text x="147" y="245" textAnchor="middle" fontSize="12" fill="#3a5a7a" fontWeight="800">Terminal 1</text>
        <rect x="368" y="128" width="218" height="60" rx="7" fill="white" stroke="#c0d4e8" strokeWidth="1" filter="url(#bShadow)"/>
        <rect x="368" y="128" width="218" height="11" rx="7" fill="#e8f0fa"/>
        {[...Array(8)].map((_,i)=><rect key={i} x={376+i*25} y={155} width="14" height="5" rx="2" fill="#ccdde8"/>)}
        <text x="477" y="147" textAnchor="middle" fontSize="8" fill="#6a8aaa" fontWeight="700">H · Lv05</text>
        <rect x="368" y="210" width="218" height="44" rx="7" fill="white" stroke="#c0d4e8" strokeWidth="1" filter="url(#bShadow)"/>
        <rect x="368" y="210" width="218" height="12" rx="7" fill="#e8f0fa"/>
        <rect x="368" y="254" width="218" height="30" rx="4" fill="white" stroke="#c0d4e8" strokeWidth="0.8"/>
        {[...Array(8)].map((_,i)=><g key={i}><rect x={376+i*25} y={259} width="14" height="5" rx="2" fill="#ccdde8"/><rect x={376+i*25} y={268} width="14" height="5" rx="2" fill="#ccdde8"/></g>)}
        <text x="477" y="247" textAnchor="middle" fontSize="12" fill="#3a5a7a" fontWeight="800">Terminal 2</text>
        <rect x="642" y="126" width="68" height="162" rx="7" fill="white" stroke="#e8d870" strokeWidth="1.5" filter="url(#bShadow)"/>
        <rect x="642" y="126" width="68" height="11" rx="7" fill="#fef3c7"/>
        <rect x="648" y="148" width="56" height="24" rx="3" fill="#fef9e7" stroke="#fde68a" strokeWidth="0.8"/>
        <rect x="648" y="248" width="56" height="24" rx="3" fill="#fef9e7" stroke="#fde68a" strokeWidth="0.8"/>
        <text x="676" y="210" textAnchor="middle" fontSize="8" fill="#8a6a2a" fontWeight="800">SAT</text>
        <path d="M 192 130 L 192 232 L 316 232 L 456 264" fill="none" stroke="rgba(0,50,150,0.18)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="route-animated" d="M 192 130 L 192 232 L 316 232 L 456 264" fill="none" stroke="#1a6fe8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrow)"/>
        <path d="M 192 130 L 192 232 L 316 232 L 456 264" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {[[192,232],[316,232]].map(([x,y],i)=>(
          <g key={i}>
            <circle cx={x} cy={y} r="7" fill="white" stroke="#1a6fe8" strokeWidth="2" filter="url(#bShadow)"/>
            <circle cx={x} cy={y} r="3" fill="#1a6fe8"/>
          </g>
        ))}
        <g className="pin-pop">
          <circle cx="192" cy="120" r="18" fill="#f97316" opacity="0.15"/>
          <circle cx="192" cy="120" r="11" fill="#f97316" stroke="white" strokeWidth="3" filter="url(#pShadow)"/>
          <rect x="166" y="80" width="52" height="26" rx="6" fill="#f97316" filter="url(#pShadow)"/>
          <polygon points="187,106 197,106 192,114" fill="#f97316"/>
          <text x="180" y="96" fontSize="8" fill="white">✈</text>
          <text x="190" y="96" fontSize="11" fill="white" fontWeight="800">B45</text>
        </g>
        <g className="pin-pop" style={{ animationDelay:"1.2s" }}>
          <circle cx="456" cy="274" r="18" fill="#16a34a" opacity="0.15"/>
          <circle cx="456" cy="274" r="11" fill="#16a34a" stroke="white" strokeWidth="3" filter="url(#pShadow)"/>
          <rect x="430" y="290" width="52" height="26" rx="6" fill="#16a34a" filter="url(#pShadow)"/>
          <polygon points="447,290 457,290 452,282" fill="#16a34a"/>
          <text x="444" y="306" fontSize="8" fill="white">✈</text>
          <text x="454" y="306" fontSize="11" fill="white" fontWeight="800">G81</text>
        </g>
        <text x="490" y="268" fontSize="20" className="walk-pulse">🚶</text>
        <text x="12" y="410" fontSize="9" fill="#5a7a9a" fontWeight="500">Flughafen München / Munich Airport</text>
        <rect x="236" y="334" width="248" height="30" rx="15" fill="white" stroke="#d0dce8" strokeWidth="1" filter="url(#bShadow)"/>
        <text x="360" y="353" textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="700">🚶 1 km – 12 min</text>
      </svg>
    </div>
  );
}

export default function HowToGoThere({ onGoBack }) {
  return (
    <>
      <Card>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <AlertTriangle size={18} color="#2563eb"/>
          </div>
          <h2 style={{ fontSize:17,fontWeight:800,color:"#0d0d0d",margin:0 }}>Results</h2>
        </div>
        <div style={{ background:"#fff7ed",border:"1px solid #fdba74",borderLeft:"4px solid #f97316",borderRadius:11,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <AlertTriangle size={28} style={{ color:"#c2410c",flexShrink:0 }}/>
            <div>
              <p style={{ fontSize:15,fontWeight:700,color:"#c2410c",margin:"0 0 3px" }}>Tight Connection</p>
              <p style={{ fontSize:14,color:"#374151",margin:0 }}>You have <strong style={{ color:"#c2410c" }}>15 minutes</strong> to get there.</p>
            </div>
          </div>
          <button style={{ border:"1.5px solid #f97316",background:"transparent",borderRadius:9,padding:"8px 14px",cursor:"pointer",color:"#c2410c",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",fontFamily:"inherit" }}>
            How to go there <ArrowRight size={14}/>
          </button>
        </div>
      </Card>
      <Card>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Navigation size={18} color="#2563eb"/>
          </div>
          <h2 style={{ fontSize:17,fontWeight:800,color:"#0d0d0d",margin:0 }}>How to go there</h2>
        </div>
        <AirportMap/>
        <div style={{ display:"flex",justifyContent:"center",marginTop:20 }}>
          <button onClick={onGoBack}
            style={{ background:"#2563eb",color:"white",border:"none",borderRadius:10,padding:"13px 48px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
            Go Back
          </button>
        </div>
      </Card>
    </>
  );
}
