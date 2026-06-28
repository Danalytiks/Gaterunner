export default function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "white", borderRadius: 14, border: "1px solid #e5e7eb",
      padding: "20px", marginBottom: 14, boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}
