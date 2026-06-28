import { CheckCircle, AlertTriangle, XCircle, MessageCircle } from "lucide-react";
import Card from "./Card";
const OPTIONS = [
  { key:"safe",  Icon:CheckCircle,  label:"Yes — Safe",          color:"#15803d", border:"#86efac", bg:"#f0fdf4", msg:"Great! Thanks for the feedback. Safe travels! ✈" },
  { key:"tight", Icon:AlertTriangle, label:"Yes — Tight",         color:"#c2410c", border:"#fdba74", bg:"#fff7ed", msg:"Phew, close one! Thank you for the feedback." },
  { key:"risky", Icon:XCircle,       label:"No — Missed (Risky)", color:"#b91c1c", border:"#fca5a5", bg:"#fef2f2", msg:"We're sorry. Please visit your airline's service desk." },
];
export default function Feedback({ feedback, setFeedback }) {
  const selected = OPTIONS.find(o=>o.key===feedback);
  return (
    <Card>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:3 }}>
        <div style={{ width:32,height:32,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <MessageCircle size={18} color="#2563eb"/>
        </div>
        <h2 style={{ fontSize:17,fontWeight:800,color:"#0d0d0d",margin:0 }}>Feedback</h2>
      </div>
      <p style={{ fontSize:12,color:"#6b7280",margin:"0 0 16px",lineHeight:1.5 }}>Have you made your connection?</p>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14 }}>
        {OPTIONS.map(o=>(
          <button key={o.key} onClick={()=>setFeedback(p=>p===o.key?null:o.key)}
            style={{ border:`1.5px solid ${feedback===o.key?o.color:o.border}`, background:feedback===o.key?o.bg:"white", borderRadius:9, padding:"11px 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, fontFamily:"inherit" }}>
            <o.Icon size={20} style={{ color:o.color }}/>
            <span style={{ fontSize:12,fontWeight:700,color:o.color,textAlign:"center",lineHeight:1.3 }}>{o.label}</span>
          </button>
        ))}
      </div>
      {selected && <p style={{ textAlign:"center",fontSize:13,color:"#6b7280",fontStyle:"italic",marginBottom:10 }}>{selected.msg}</p>}
      <p style={{ textAlign:"center",fontSize:11,color:"#9ca3af",margin:0 }}>Your feedback helps us improve GateRunner!</p>
    </Card>
  );
}
