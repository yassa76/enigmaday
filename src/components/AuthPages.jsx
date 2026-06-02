import { useState } from "react";
import { supabase } from "../lib/supabase";

const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", card:"#1A1A2E", cardLight:"#16213E", muted:"#8888AA" };
const CAT_COLORS = { Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7", Matematica:"#FFE66D", Quiz:"#EC4899", "Indovina il film":"#38BDF8", Ghigliottina:"#F43F5E" };

export function LoginPage({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, pw);
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div className="fade-in" style={{maxWidth:420,margin:"60px auto"}}>
      <div className="card" style={{border:`2px solid ${COLORS.primary}33`}}>
        <h2 style={{fontFamily:"'Fredoka One'",fontSize:30,color:COLORS.primary,marginBottom:4}}>Bentornato! 👋</h2>
        <p style={{color:COLORS.muted,marginBottom:24,fontSize:14}}>Accedi per risolvere gli enigmi</p>

        {/* Google login */}
        <button onClick={handleGoogle} style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:12,
          background:"#fff", color:"#333", border:"none", borderRadius:50, padding:"12px 20px",
          fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:15, cursor:"pointer",
          marginBottom:20, transition:"all .2s", boxShadow:"0 2px 8px rgba(0,0,0,.2)"
        }}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continua con Google
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{flex:1,height:1,background:COLORS.cardLight}}/>
          <span style={{color:COLORS.muted,fontSize:13}}>oppure</span>
          <div style={{flex:1,height:1,background:COLORS.cardLight}}/>
        </div>

        <form onSubmit={handleSubmit} autoComplete="on">
          <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>EMAIL</label>
          <input className="input" style={{marginTop:6,marginBottom:16}} placeholder="tua@email.it" value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" required/>

          <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>PASSWORD</label>
          <input className="input" style={{marginTop:6,marginBottom:24}} placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} type="password" autoComplete="current-password" required/>

          <button type="submit" className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} disabled={loading}>
            {loading ? "..." : "Accedi 🚀"}
          </button>
        </form>

        <p style={{textAlign:"center",marginTop:16,color:COLORS.muted,fontSize:14}}>
          Non hai un account? <span style={{color:COLORS.secondary,cursor:"pointer",fontWeight:700}} onClick={onRegister}>Registrati</span>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage({ onRegister, onLogin }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [prefs, setPrefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const categorie = ["Indovinello","Logica","Rebus","Matematica","Quiz","Indovina il film","Ghigliottina"];

  const togglePref = (c) => setPrefs(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onRegister(nome, email, pw, prefs);
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div className="fade-in" style={{maxWidth:480,margin:"40px auto"}}>
      <div className="card" style={{border:`2px solid ${COLORS.secondary}33`}}>
        <h2 style={{fontFamily:"'Fredoka One'",fontSize:30,color:COLORS.secondary,marginBottom:4}}>Unisciti! 🎊</h2>
        <p style={{color:COLORS.muted,marginBottom:24,fontSize:14}}>Crea il tuo account gratuito</p>

        {/* Google login */}
        <button onClick={handleGoogle} style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:12,
          background:"#fff", color:"#333", border:"none", borderRadius:50, padding:"12px 20px",
          fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:15, cursor:"pointer",
          marginBottom:20, transition:"all .2s", boxShadow:"0 2px 8px rgba(0,0,0,.2)"
        }}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continua con Google
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{flex:1,height:1,background:COLORS.cardLight}}/>
          <span style={{color:COLORS.muted,fontSize:13}}>oppure</span>
          <div style={{flex:1,height:1,background:COLORS.cardLight}}/>
        </div>

        <form onSubmit={handleSubmit} autoComplete="on">
          <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>NOME</label>
          <input className="input" style={{marginTop:6,marginBottom:16}} placeholder="Il tuo nome" value={nome} onChange={e=>setNome(e.target.value)} type="text" autoComplete="name" required/>

          <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>EMAIL</label>
          <input className="input" style={{marginTop:6,marginBottom:16}} placeholder="tua@email.it" value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" required/>

          <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>PASSWORD</label>
          <input className="input" style={{marginTop:6,marginBottom:20}} placeholder="Almeno 6 caratteri" value={pw} onChange={e=>setPw(e.target.value)} type="password" autoComplete="new-password" required minLength={6}/>

          <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1,display:"block",marginBottom:10}}>
            PREFERENZE ENIGMI (opzionale)
          </label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
            {categorie.map(c => (
              <span key={c} onClick={()=>togglePref(c)} className="tag"
                style={{background:prefs.includes(c)?CAT_COLORS[c]||COLORS.primary:"#16213E",color:prefs.includes(c)?"#000":COLORS.muted,border:`1px solid ${prefs.includes(c)?CAT_COLORS[c]||COLORS.primary:COLORS.muted}`,transition:"all .15s"}}>
                {c}
              </span>
            ))}
          </div>

          <button type="submit" className="btn btn-secondary" style={{width:"100%",justifyContent:"center"}} disabled={loading}>
            {loading ? "..." : "Crea account 🎉"}
          </button>
        </form>

        <p style={{textAlign:"center",marginTop:16,color:COLORS.muted,fontSize:14}}>
          Hai già un account? <span style={{color:COLORS.primary,cursor:"pointer",fontWeight:700}} onClick={onLogin}>Accedi</span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
