import { Plane } from "lucide-react";
export default function Header() {
  return (
    <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "20px 24px 24px" }}>
      <div style={{ maxWidth:480, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"#2563eb", boxShadow:"0 2px 12px rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Plane size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, color:"white", letterSpacing:-0.5, margin:0 }}>GateRunner</h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.75)", margin:"2px 0 0" }}>Together, we'll get there on time!</p>
          </div>
        </div>
        <div style={{ width:46, height:46, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🏃</div>
      </div>
    </div>
  );
}
