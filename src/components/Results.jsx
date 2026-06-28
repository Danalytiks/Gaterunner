import { BarChart2 } from "lucide-react";
import Card from "./Card";
import ResultCard from "./ResultCard";
export default function Results({ onHowToGoThere }) {
  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <div style={{ width:32,height:32,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <BarChart2 size={18} color="#2563eb"/>
        </div>
        <h2 style={{ fontSize:17,fontWeight:800,color:"#0d0d0d",margin:0 }}>Results</h2>
      </div>
      <ResultCard type="tight"    onHowToGoThere={onHowToGoThere}/>
      <ResultCard type="safe"     onHowToGoThere={onHowToGoThere}/>
      <ResultCard type="moderate" onHowToGoThere={onHowToGoThere}/>
    </Card>
  );
}
