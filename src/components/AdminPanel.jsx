import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7", card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA", success:"#22C55E", error:"#EF4444" };
const CAT_COLORS = { Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7", Matematica:"#FFE66D", Quiz:"#EC4899" };
const DIFF_LABELS = ["","⭐ Facile","⭐⭐ Medio","⭐⭐⭐ Difficile"];

function getTodayStr() { return new Date().toISOString().split("T")[0]; }

export default function AdminPanel({ showToast }) {
  const [view, setView] = useState("enigmi");
  const [enigmi, setEnigmi] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newE, setNewE] = useState({ testo:"", soluzione:"", categoria:"Indovinello", difficolta:2, fonte:"", data_pub:getTodayStr() });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: e }, { data: p }, { data: s }] = await Promise.all([
      supabase.from("enigmi").select("*").order("data_pub", { ascending:false }),
      supabase.from("profiles").select("*").neq("ruolo","admin"),
      supabase.from("enigmi_stats").select("*"),
    ]);
    setEnigmi(e || []);
    setProfiles(p || []);
    const sm = {};
    (s || []).forEach(r => { sm[r.id] = r.solutori; });
    setStats(sm);
    setLoading(false);
  };

  const addEnigma = async () => {
    if (!newE.testo || !newE.soluzione) return showToast("Compila testo e soluzione!", "error");
    const { error } = await supabase.from("enigmi").insert(newE);
    if (error) return showToast(error.message, "error");
    showToast("Enigma aggiunto ✅", "success");
    setShowAdd(false);
    setNewE({ testo:"", soluzione:"", categoria:"Indovinello", difficolta:2, fonte:"", data_pub:getTodayStr() });
    loadAll();
  };

  const deleteEnigma = async (id) => {
    const { error } = await supabase.from("enigmi").delete().eq("id", id);
    if (error) return showToast(error.message, "error");
    showToast("Enigma eliminato", "info");
    setSelected(null);
    loadAll();
  };

  const tab = (t, label) => (
    <button key={t} onClick={()=>setView(t)} style={{
      padding:"10px 20px", borderRadius:50, fontWeight:800, cursor:"pointer", fontSize:14, border:"none",
      background: view===t ? COLORS.primary : COLORS.cardLight,
      color: view===t ? "#fff" : COLORS.muted,
      fontFamily:"'Nunito',sans-serif", transition:"all .2s"
    }}>{label}</button>
  );

  const newsletterUsers = profiles.filter(p => p.newsletter);
  const totalSolved = Object.values(stats).reduce((a,b)=>a+b,0);

  if (loading) return <div style={{textAlign:"center",padding:60,color:COLORS.muted}}>Caricamento...</div>;

  return (
    <div className="fade-in">
      <h1 style={{fontFamily:"'Fredoka One'",fontSize:36,color:COLORS.accent,marginBottom:4}}>⚙️ Pannello Admin</h1>
      <p style={{color:COLORS.muted,marginBottom:24}}>Gestisci enigmi, iscritti e newsletter</p>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[
          {label:"Iscritti",value:profiles.length,color:COLORS.secondary,icon:"👥"},
          {label:"Enigmi",value:enigmi.length,color:COLORS.primary,icon:"🧩"},
          {label:"Newsletter",value:newsletterUsers.length,color:COLORS.accent,icon:"📧"},
          {label:"Risolti",value:totalSolved,color:COLORS.success,icon:"✅"},
        ].map(s => (
          <div key={s.label} className="card" style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:24}}>{s.icon}</div>
            <div style={{fontFamily:"'Fredoka One'",fontSize:30,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:COLORS.muted,fontWeight:700}}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {tab("enigmi","🧩 Enigmi")}
        {tab("iscritti","👥 Iscritti")}
        {tab("newsletter","📧 Newsletter")}
      </div>

      {/* ── ENIGMI ── */}
      {view === "enigmi" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h2 style={{fontFamily:"'Fredoka One'",fontSize:24}}>Lista Enigmi ({enigmi.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(!showAdd)}>+ Aggiungi</button>
          </div>

          {showAdd && (
            <div className="card fade-in" style={{marginBottom:20,border:`2px solid ${COLORS.primary}33`}}>
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:20,marginBottom:16}}>Nuovo Enigma</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:700,color:COLORS.muted,display:"block",marginBottom:4}}>TESTO *</label>
                  <textarea className="input" rows={3} value={newE.testo} onChange={e=>setNewE(p=>({...p,testo:e.target.value}))} placeholder="Testo dell'enigma..." style={{resize:"vertical"}} />
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:COLORS.muted,display:"block",marginBottom:4}}>SOLUZIONE *</label>
                  <input className="input" value={newE.soluzione} onChange={e=>setNewE(p=>({...p,soluzione:e.target.value}))} placeholder="La risposta corretta" />
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:COLORS.muted,display:"block",marginBottom:4}}>CATEGORIA</label>
                  <select className="input" value={newE.categoria} onChange={e=>setNewE(p=>({...p,categoria:e.target.value}))}>
                    {["Indovinello","Logica","Rebus","Matematica","Quiz"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:COLORS.muted,display:"block",marginBottom:4}}>DIFFICOLTÀ</label>
                  <select className="input" value={newE.difficolta} onChange={e=>setNewE(p=>({...p,difficolta:+e.target.value}))}>
                    <option value={1}>Facile</option><option value={2}>Medio</option><option value={3}>Difficile</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:COLORS.muted,display:"block",marginBottom:4}}>FONTE</label>
                  <input className="input" value={newE.fonte} onChange={e=>setNewE(p=>({...p,fonte:e.target.value}))} placeholder="Es. Enigmistica classica" />
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:COLORS.muted,display:"block",marginBottom:4}}>DATA PUBBLICAZIONE</label>
                  <input className="input" type="date" value={newE.data_pub} onChange={e=>setNewE(p=>({...p,data_pub:e.target.value}))} />
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button className="btn btn-primary btn-sm" onClick={addEnigma}>Aggiungi ✅</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)}>Annulla</button>
              </div>
            </div>
          )}

          <div style={{display:"grid",gap:12}}>
            {enigmi.map(e => {
              const isToday = e.data_pub === getTodayStr();
              const catColor = CAT_COLORS[e.categoria] || COLORS.primary;
              return (
                <div key={e.id} className="card" style={{padding:"16px 20px",border:`1px solid ${isToday?COLORS.primary:COLORS.cardLight}`,cursor:"pointer"}} onClick={()=>setSelected(selected?.id===e.id?null:e)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
                        {isToday && <span className="badge" style={{background:COLORS.primary,color:"#fff",fontSize:11}}>📅 Oggi</span>}
                        <span className="badge" style={{background:catColor+"33",color:catColor,fontSize:11}}>{e.categoria}</span>
                        <span style={{fontSize:12,color:COLORS.muted}}>{e.data_pub}</span>
                        <span style={{fontSize:12,color:COLORS.muted}}>{DIFF_LABELS[e.difficolta]}</span>
                      </div>
                      <p style={{fontWeight:600,fontSize:14,lineHeight:1.5}}>{e.testo.substring(0,100)}{e.testo.length>100?"...":""}</p>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"'Fredoka One'",fontSize:22,color:COLORS.success}}>{stats[e.id]||0}</div>
                      <div style={{fontSize:11,color:COLORS.muted}}>risolto</div>
                    </div>
                  </div>
                  {selected?.id === e.id && (
                    <div className="fade-in" style={{marginTop:16,padding:16,background:COLORS.cardLight,borderRadius:12}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                        <div><span style={{fontSize:12,color:COLORS.muted}}>Soluzione:</span><br/><strong style={{color:COLORS.accent}}>{e.soluzione}</strong></div>
                        <div><span style={{fontSize:12,color:COLORS.muted}}>Fonte:</span><br/><strong>{e.fonte||"—"}</strong></div>
                      </div>
                      <p style={{fontSize:13,color:COLORS.muted,marginBottom:12}}>{e.testo}</p>
                      <button className="btn btn-sm" style={{background:COLORS.error,color:"#fff"}} onClick={ev=>{ev.stopPropagation();deleteEnigma(e.id)}}>🗑️ Elimina</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ISCRITTI ── */}
      {view === "iscritti" && (
        <div>
          <h2 style={{fontFamily:"'Fredoka One'",fontSize:24,marginBottom:16}}>Iscritti ({profiles.length})</h2>
          {profiles.length === 0 ? (
            <div className="card" style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:48}}>👤</div>
              <p style={{color:COLORS.muted,marginTop:12}}>Nessun iscritto ancora</p>
            </div>
          ) : (
            <div style={{display:"grid",gap:12}}>
              {profiles.map(u => (
                <div key={u.id} className="card" style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:16}}>{u.nome}</div>
                    <div style={{color:COLORS.muted,fontSize:13}}>{u.email}</div>
                    <div style={{marginTop:6,display:"flex",gap:6,flexWrap:"wrap"}}>
                      {(u.preferenze||[]).map(p=>(
                        <span key={p} className="tag" style={{background:CAT_COLORS[p]+"33",color:CAT_COLORS[p],fontSize:11,padding:"2px 10px"}}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:16,textAlign:"center"}}>
                    <div><div style={{fontSize:20}}>{u.newsletter?"📧":"—"}</div><div style={{fontSize:11,color:COLORS.muted}}>Newsletter</div></div>
                    <div><div style={{fontSize:12,color:COLORS.muted,marginTop:4}}>{new Date(u.created_at).toLocaleDateString("it-IT")}</div><div style={{fontSize:11,color:COLORS.muted}}>Iscritto il</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NEWSLETTER ── */}
      {view === "newsletter" && (
        <div>
          <h2 style={{fontFamily:"'Fredoka One'",fontSize:24,marginBottom:4}}>Newsletter</h2>
          <p style={{color:COLORS.muted,marginBottom:16,fontSize:14}}>{newsletterUsers.length} utenti riceveranno l'enigma ogni giorno</p>
          {newsletterUsers.length === 0 ? (
            <div className="card" style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:48}}>📭</div>
              <p style={{color:COLORS.muted,marginTop:12}}>Nessun utente iscritto alla newsletter</p>
            </div>
          ) : (
            <div style={{display:"grid",gap:10}}>
              {newsletterUsers.map(u => (
                <div key={u.id} className="card" style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <strong>{u.nome}</strong>
                    <div style={{fontSize:13,color:COLORS.muted}}>{u.email}</div>
                  </div>
                  <span className="badge" style={{background:COLORS.success+"33",color:COLORS.success}}>✅ Attiva</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
