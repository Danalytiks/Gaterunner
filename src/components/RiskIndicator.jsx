export default function RiskIndicator() {
  return (
    <div style={{ textAlign:"center", padding:"6px 0 14px" }}>
      <p style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Risk Indicator</p>
      <div style={{ display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
        {[{dot:"#22c55e",label:"SAFE",note:"(< 10%)"},{dot:"#f59e0b",label:"TIGHT",note:"(10–35%)"},{dot:"#ef4444",label:"RISKY",note:"(> 35%)"}].map(r=>(
          <div key={r.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:10, height:10, borderRadius:"50%", background:r.dot, display:"inline-block" }}/>
            <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{r.label}</span>
            <span style={{ fontSize:11, color:"#9ca3af" }}>{r.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
