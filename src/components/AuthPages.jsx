// ─── LoginPage ────────────────────────────────────────────────────────────────
const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", card:"#1A1A2E", cardLight:"#16213E", muted:"#8888AA" };
const CAT_COLORS = { Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7", Matematica:"#FFE66D", Quiz:"#EC4899" };

import { useState } from "react";

export function LoginPage({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  return (
    <div className="fade-in" style={{maxWidth:420,margin:"60px auto"}}>
      <div className="card" style={{border:`2px solid ${COLORS.primary}33`}}>
        <h2 style={{fontFamily:"'Fredoka One'",fontSize:30,color:COLORS.primary,marginBottom:4}}>Bentornato! 👋</h2>
        <p style={{color:COLORS.muted,marginBottom:24,fontSize:14}}>Accedi per risolvere gli enigmi</p>

        <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>EMAIL</label>
        <input className="input" style={{marginTop:6,marginBottom:16}} placeholder="tua@email.it" value={email} onChange={e=>setEmail(e.target.value)} type="email" />

        <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>PASSWORD</label>
        <input className="input" style={{marginTop:6,marginBottom:24}} placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&onLogin(email,pw)} />

        <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={()=>onLogin(email,pw)}>
          Accedi 🚀
        </button>
        <p style={{textAlign:"center",marginTop:16,color:COLORS.muted,fontSize:14}}>
          Non hai un account? <span style={{color:COLORS.secondary,cursor:"pointer",fontWeight:700}} onClick={onRegister}>Registrati</span>
        </p>
      </div>
    </div>
  );
}

// ─── RegisterPage ─────────────────────────────────────────────────────────────
export function RegisterPage({ onRegister, onLogin }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [prefs, setPrefs] = useState([]);
  const categorie = ["Indovinello","Logica","Rebus","Matematica","Quiz"];

  const togglePref = (c) => setPrefs(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c]);

  return (
    <div className="fade-in" style={{maxWidth:480,margin:"40px auto"}}>
      <div className="card" style={{border:`2px solid ${COLORS.secondary}33`}}>
        <h2 style={{fontFamily:"'Fredoka One'",fontSize:30,color:COLORS.secondary,marginBottom:4}}>Unisciti! 🎊</h2>
        <p style={{color:COLORS.muted,marginBottom:24,fontSize:14}}>Crea il tuo account gratuito</p>

        <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>NOME</label>
        <input className="input" style={{marginTop:6,marginBottom:16}} placeholder="Il tuo nome" value={nome} onChange={e=>setNome(e.target.value)} />

        <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>EMAIL</label>
        <input className="input" style={{marginTop:6,marginBottom:16}} placeholder="tua@email.it" value={email} onChange={e=>setEmail(e.target.value)} type="email" />

        <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1}}>PASSWORD</label>
        <input className="input" style={{marginTop:6,marginBottom:20}} placeholder="Almeno 6 caratteri" value={pw} onChange={e=>setPw(e.target.value)} type="password" />

        <label style={{fontWeight:700,color:COLORS.muted,fontSize:12,letterSpacing:1,display:"block",marginBottom:10}}>
          PREFERENZE ENIGMI (opzionale)
        </label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
          {categorie.map(c => (
            <span key={c} onClick={()=>togglePref(c)} className="tag"
              style={{background:prefs.includes(c)?CAT_COLORS[c]:"#16213E",color:prefs.includes(c)?"#000":COLORS.muted,border:`1px solid ${prefs.includes(c)?CAT_COLORS[c]:COLORS.muted}`,transition:"all .15s"}}>
              {c}
            </span>
          ))}
        </div>

        <button className="btn btn-secondary" style={{width:"100%",justifyContent:"center"}} onClick={()=>onRegister(nome,email,pw,prefs)}>
          Crea account 🎉
        </button>
        <p style={{textAlign:"center",marginTop:16,color:COLORS.muted,fontSize:14}}>
          Hai già un account? <span style={{color:COLORS.primary,cursor:"pointer",fontWeight:700}} onClick={onLogin}>Accedi</span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
