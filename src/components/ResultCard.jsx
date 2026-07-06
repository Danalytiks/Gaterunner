import { AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
const CONFIG = {
  tight:    { label:"Tight Connection", time:"15 minutes", Icon:AlertTriangle, color:"#c2410c", bg:"#fff7ed", border:"#fdba74", leftBar:"#f97316" },
  safe:     { label:"Safe Connection",  time:"2 hours",    Icon:CheckCircle,   color:"#15803d", bg:"#f0fdf4", border:"#86efac", leftBar:"#22c55e" },
  moderate: { label:"At Risk",          time:"45 minutes", Icon:Clock,         color:"#b91c1c", bg:"#fef2f2", border:"#fca5a5", leftBar:"#ef4444" },
};
export default function ResultCard({ type, onHowToGoThere }) {
  const c = CONFIG[type]; if (!c) return null;
  const { label, time, Icon, color, bg, border, leftBar } = c;
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderLeft:`4px solid ${leftBar}`, borderRadius:11, padding:"15px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:13, flex:1, minWidth:0 }}>
        <Icon size={30} style={{ color, flexShrink:0 }}/>
        <div>
          <p style={{ fontSize:15, fontWeight:700, color, margin:"0 0 3px" }}>{label}</p>
          <p style={{ fontSize:14, color:"#374151", margin:0 }}>You have <strong style={{ color }}>{time}</strong> to get there.</p>
        </div>
      </div>
      <button onClick={onHowToGoThere}
        style={{ border:`1.5px solid ${color}`, background:"transparent", borderRadius:9, padding:"9px 14px", cursor:"pointer", color, fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", fontFamily:"inherit", flexShrink:0 }}>
        How to go there <ArrowRight size={14}/>
      </button>
    </div>
  );
}
