const COLORS = { card:"#1A1A2E", primary:"#FF6B35", accent:"#FFE66D", muted:"#8888AA", text:"#F0F0F0" };

export default function Navbar({ profile, session, onLogout, onNav, isAdmin }) {
  console.log("PROFILE:", profile);
  console.log("ISADMIN:", isAdmin);
  
  return (
    <nav style={{ background:COLORS.card, borderBottom:`3px solid ${COLORS.primary}`, padding:"0 24px", height:70, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
      <div onClick={() => onNav("home")} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:32 }}>🧩</span>
        <span style={{ fontFamily:"'Fredoka One'", fontSize:26, color:COLORS.primary, letterSpacing:1 }}>EnigmaDay</span>
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        {isAdmin && (
          <button className="btn btn-accent btn-sm" onClick={() => onNav("admin")}>⚙️ Admin</button>
        )}
        {session ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav("profile")}>
              👤 {profile?.nome || "Profilo"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>Esci</button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav("login")}>Accedi</button>
            <button className="btn btn-primary btn-sm" onClick={() => onNav("register")}>Registrati</button>
          </>
        )}
      </div>
    </nav>
  );
}
