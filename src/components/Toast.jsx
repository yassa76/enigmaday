const COLORS = { success:"#22C55E", error:"#EF4444", info:"#4ECDC4" };

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:999,
      background: COLORS[toast.type] || COLORS.info,
      color: toast.type === "error" ? "#fff" : "#000",
      padding:"12px 24px", borderRadius:50,
      fontWeight:800, fontSize:15,
      boxShadow:"0 4px 20px rgba(0,0,0,.4)",
      animation:"fadeIn .3s ease"
    }}>
      {toast.msg}
    </div>
  );
}
