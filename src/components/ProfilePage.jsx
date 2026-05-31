import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7", card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA", success:"#22C55E" };
const CAT_COLORS = { Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7", Matematica:"#FFE66D", Quiz:"#EC4899" };

export default function ProfilePage({ profile, session, onUpdate, showToast }) {
  const [prefs, setPrefs] = useState(profile?.preferenze || []);
  const [newsletter, setNewsletter] = useState(profile?.newsletter || false);
  const [tentativi, setTentativi] = useState([]);
  const categorie = ["Indovinello","Logica","Rebus","Matematica","Quiz"];

  useEffect(() => {
    loadTentativi();
  }, []);

  const loadTentativi = async () => {
    const { data } = await supabase
      .from("tentativi")
      .select("*, enigmi(testo, categoria)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setTentativi(data || []);
  };

  const togglePref = (c) => setPrefs(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c]);

  const solved = tentativi.filter(t => t.corretto);
  const rate = tentativi.length ? Math.round(solved.length / tentativi.length * 100) : 0;

  return (
    <div className="fade-in">
      <h1 style={{fontFamily:"'Fredoka One'",fontSize:36,color:COLORS.primary,marginBottom:4}}>Il mio Profilo 👤</h1>
      <p style={{color:COLORS.muted,marginBottom:28,fontSize:15}}>Ciao, {profile?.nome}! Ecco le tue statistiche e preferenze.</p>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
        {[
          {label:"Risolti", value:solved.length, color:COLORS.success, icon:"✅"},
          {label:"Tentati", value:tentativi.length, color:COLORS.secondary, icon:"🎯"},
          {label:"Tasso", value:tentativi.length ? rate+"%" : "—", color:COLORS.accent, icon:"📊"},
        ].map(s => (
          <div key={s.label} className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:28}}>{s.icon}</div>
            <div style={{fontFamily:"'Fredoka One'",fontSize:34,color:s.color}}>{s.value}</div>
            <div style={{fontSize:12,color:COLORS.muted,fontWeight:700,letterSpacing:1}}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Preferences */}
      <div className="card" style={{marginBottom:20}}>
        <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:12}}>🎯 Preferenze Enigmi</h3>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          {categorie.map(c => (
            <span key={c} onClick={()=>togglePref(c)} className="tag"
              style={{background:prefs.includes(c)?CAT_COLORS[c]:"#16213E",color:prefs.includes(c)?"#000":COLORS.muted,border:`1px solid ${prefs.includes(c)?CAT_COLORS[c]:COLORS.muted}`,transition:"all .15s",fontSize:14,padding:"6px 14px"}}>
              {c}
            </span>
          ))}
        </div>
        <p style={{fontSize:13,color:COLORS.muted}}>Seleziona le categorie che preferisci</p>
      </div>

      {/* Newsletter */}
      <div className="card" style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:4}}>📧 Newsletter</h3>
          <p style={{color:COLORS.muted,fontSize:14}}>Ricevi l'enigma del giorno ogni mattina via email</p>
        </div>
        <div onClick={()=>setNewsletter(!newsletter)}
          style={{width:52,height:28,borderRadius:14,background:newsletter?COLORS.success:COLORS.muted,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
          <div style={{position:"absolute",top:3,left:newsletter?26:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
        </div>
      </div>

      <button className="btn btn-primary" onClick={()=>onUpdate({preferenze:prefs, newsletter})}>
        💾 Salva modifiche
      </button>

      {/* History */}
      {tentativi.length > 0 && (
        <div className="card" style={{marginTop:28}}>
          <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:16}}>📜 Storico tentativi</h3>
          {tentativi.map(t => (
            <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${COLORS.cardLight}`}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{t.enigmi?.testo?.substring(0,55)}...</div>
                <div style={{fontSize:12,color:COLORS.muted,marginTop:2}}>La tua risposta: "{t.risposta}"</div>
              </div>
              <span className="tag" style={{background:t.corretto?"#22C55E33":"#EF444433",color:t.corretto?"#22C55E":"#EF4444",flexShrink:0,marginLeft:12}}>
                {t.corretto ? "✅ Risolto" : "❌ Errato"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
