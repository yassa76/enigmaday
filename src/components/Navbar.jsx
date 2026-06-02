const COLORS = { card:"#1A1A2E", primary:"#FF6B35", accent:"#FFE66D", muted:"#8888AA", text:"#F0F0F0" };

function AvatarSmall({ src, emoji, nome }) {
  if (src) return <img src={src} alt="avatar" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",border:`2px solid ${COLORS.primary}`}}/>;
  if (emoji&&emoji.length<=2) return <div style={{width:32,height:32,borderRadius:"50%",background:"#16213E",border:`2px solid ${COLORS.primary}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{emoji}</div>;
  return <div style={{width:32,height:32,borderRadius:"50%",background:COLORS.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>{nome?nome[0].toUpperCase():"?"}</div>;
}

export default function Navbar({ profile, session, onLogout, onNav, isAdmin }) {
  const googleAvatar = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;
  const isGoogleUser = session?.user?.app_metadata?.provider === "google";
  const avatarSrc = isGoogleUser ? googleAvatar : (profile?.avatar_url||null);
  const avatarEmoji = !avatarSrc ? (profile?.avatar_emoji||null) : null;
  const displayName = profile?.soprannome || profile?.nome || "Profilo";

  return (
    <nav style={{background:COLORS.card,borderBottom:`3px solid ${COLORS.primary}`,padding:"0 24px",height:70,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
      <div onClick={()=>onNav("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:32}}>🧩</span>
        <span style={{fontFamily:"'Fredoka One'",fontSize:26,color:COLORS.primary,letterSpacing:1}}>EnigmaDay</span>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>onNav("leaderboard")}>🏆 Classifiche</button>
        {session ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={()=>onNav("profile")} style={{display:"flex",alignItems:"center",gap:8}}>
              <AvatarSmall src={avatarSrc} emoji={avatarEmoji} nome={profile?.nome}/>
              {displayName}
            </button>
            {isAdmin && <button className="btn btn-accent btn-sm" onClick={()=>onNav("admin")}>⚙️ Admin</button>}
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>Esci</button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={()=>onNav("login")}>Accedi</button>
            <button className="btn btn-primary btn-sm" onClick={()=>onNav("register")}>Registrati</button>
          </>
        )}
      </div>
    </nav>
  );
}
