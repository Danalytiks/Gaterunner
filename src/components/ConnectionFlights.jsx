import { Plane } from "lucide-react";
import Card from "./Card";
function Field({ label, sub, value, onChange, placeholder }) {
  return (
    <div>
      <p style={{ fontSize:13,fontWeight:700,color:"#374151",margin:"0 0 1px" }}>{label}</p>
      <p style={{ fontSize:11,color:"#9ca3af",margin:"0 0 7px" }}>{sub}</p>
      <input value={value} onChange={e=>onChange(e.target.value.toUpperCase())} placeholder={placeholder} maxLength={8}
        style={{ width:"100%",border:"1.5px solid #d1d5db",borderRadius:9,padding:"11px 13px",fontSize:15,fontWeight:600,color:"#111",outline:"none",background:"white",fontFamily:"inherit",textTransform:"uppercase",boxSizing:"border-box" }}/>
    </div>
  );
}
export default function ConnectionFlights({ fromFlight,setFromFlight,toFlight,setToFlight,gate,setGate,onCheck }) {
  const canCheck = fromFlight.trim() && toFlight.trim() && gate.trim();
  return (
    <Card>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:3 }}>
        <div style={{ width:32,height:32,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <Plane size={18} color="#2563eb"/>
        </div>
        <h2 style={{ fontSize:17,fontWeight:800,color:"#0d0d0d",margin:0 }}>Connection Flights</h2>
      </div>
      <p style={{ fontSize:12,color:"#6b7280",margin:"0 0 18px",lineHeight:1.5 }}>Enter your incoming and connecting flights to check your connection time.</p>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 0.65fr",gap:12,marginBottom:16 }}>
        <Field label="From Flight" sub="(Arriving Flight)"   value={fromFlight} onChange={setFromFlight} placeholder="LH1983"/>
        <Field label="To Flight"   sub="(Connecting Flight)" value={toFlight}   onChange={setToFlight}   placeholder="EN8206"/>
        <Field label="Gate"        sub="(Connecting Gate)"   value={gate}       onChange={setGate}       placeholder="G81"/>
      </div>
      <div style={{ display:"flex",justifyContent:"flex-end" }}>
        <button onClick={onCheck} disabled={!canCheck}
          style={{ background:canCheck?"#2563eb":"#bfdbfe",color:"white",border:"none",borderRadius:9,padding:"11px 24px",fontSize:15,fontWeight:700,cursor:canCheck?"pointer":"not-allowed",fontFamily:"inherit" }}>
          Check Connection
        </button>
      </div>
    </Card>
  );
}
