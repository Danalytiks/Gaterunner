import { MapPin, ChevronDown } from "lucide-react";
import Card from "./Card";
const AIRPORTS = [
  { code:"MUC", name:"Munich International Airport" },
  { code:"FRA", name:"Frankfurt Airport" },
  { code:"BER", name:"Berlin Brandenburg Airport" },
  { code:"HAM", name:"Hamburg Airport" },
];
export default function AirportConfiguration({ airport, setAirport }) {
  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:3 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <MapPin size={18} color="#2563eb"/>
          </div>
          <h2 style={{ fontSize:17,fontWeight:800,color:"#0d0d0d",margin:0 }}>Airport Configuration</h2>
        </div>
        <button style={{ display:"flex",alignItems:"center",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:20,padding:"5px 11px",cursor:"pointer",color:"#1d4ed8",fontSize:11,fontWeight:600,fontFamily:"inherit" }}>
          <MapPin size={11} style={{ marginRight:4 }}/>Option to get my location
        </button>
      </div>
      <p style={{ fontSize:12,color:"#6b7280",margin:"0 0 16px",lineHeight:1.5 }}>Select the airport where you are making your connection.</p>
      <label style={{ display:"block",fontSize:13,fontWeight:700,color:"#374151",marginBottom:6 }}>Airport</label>
      <div style={{ position:"relative" }}>
        <select value={airport} onChange={e=>setAirport(e.target.value)}
          style={{ width:"100%",border:"1.5px solid #d1d5db",borderRadius:9,padding:"11px 36px 11px 13px",fontSize:15,fontWeight:600,color:"#111",outline:"none",background:"white",fontFamily:"inherit",appearance:"none",cursor:"pointer",boxSizing:"border-box" }}>
          {AIRPORTS.map(a=><option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
        </select>
        <ChevronDown size={15} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",pointerEvents:"none" }}/>
      </div>
    </Card>
  );
}
