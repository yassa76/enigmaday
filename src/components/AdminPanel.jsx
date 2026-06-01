import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7", card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA", success:"#22C55E", error:"#EF4444" };
const CAT_COLORS = { Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7", Matematica:"#FFE66D", Quiz:"#EC4899" };
const DIFF = ["","❓ Facile","❓❓ Medio","❓❓❓ Difficile"];

function getTodayStr() { return new Date().toISOString().split("T")[0]; }

// ── Mini bar chart ────────────────────────────────────────────────────────────
function Bar({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:13, color:COLORS.muted }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color }}>{value}</span>
      </div>
      <div style={{ background:COLORS.cardLight, borderRadius:50, height:8 }}>
        <div style={{ width:`${pct}%`, background:color, borderRadius:50, height:8, transition:"width .6s ease" }} />
      </div>
    </div>
  );
}

// ── Form aggiunta/modifica enigma ─────────────────────────────────────────────
function EnigmaForm({ initial, onSave, onCancel, showToast }) {
  const empty = { testo:"", soluzione:"", categoria:"Indovinello", difficolta:2, fonte:"", data_pub:getTodayStr(), media_url:"", media_tipo:"" };
  const [form, setForm] = useState(initial || empty);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(initial?.media_url || "");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const ext = file.name.split(".").pop();
    const path = `enigmi/${Date.now()}.${ext}`;
    setUploading(true);
    const { data, error } = await supabase.storage.from("enigmi-media").upload(path, file, { upsert: true });
    if (error) { showToast("Errore upload: " + error.message, "error"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("enigmi-media").getPublicUrl(path);
    setForm(p => ({ ...p, media_url: publicUrl, media_tipo: isVideo ? "video" : "foto" }));
    setPreview(publicUrl);
    setUploading(false);
    showToast("Media caricato ✅", "success");
  };

  const removeMedia = () => { setForm(p => ({ ...p, media_url:"", media_tipo:"" })); setPreview(""); };

  return (
    <div className="card fade-in" style={{ marginBottom:20, border:`2px solid ${COLORS.primary}33` }}>
      <h3 style={{ fontFamily:"'Fredoka One'", fontSize:20, marginBottom:16 }}>
        {initial ? "✏️ Modifica Enigma" : "➕ Nuovo Enigma"}
      </h3>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ fontSize:12, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:4 }}>TESTO *</label>
          <textarea className="input" rows={3} value={form.testo} onChange={e=>set("testo",e.target.value)} placeholder="Testo dell'enigma..." style={{ resize:"vertical" }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:4 }}>SOLUZIONE *</label>
          <input className="input" value={form.soluzione} onChange={e=>set("soluzione",e.target.value)} placeholder="La risposta corretta" />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:4 }}>CATEGORIA</label>
          <select className="input" value={form.categoria} onChange={e=>set("categoria",e.target.value)}>
            {["Indovinello","Logica","Rebus","Matematica","Quiz"].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:4 }}>DIFFICOLTÀ</label>
          <select className="input" value={form.difficolta} onChange={e=>set("difficolta",+e.target.value)}>
            <option value={1}>❓ Facile</option>
            <option value={2}>❓❓ Medio</option>
            <option value={3}>❓❓❓ Difficile</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:4 }}>FONTE</label>
          <input className="input" value={form.fonte} onChange={e=>set("fonte",e.target.value)} placeholder="Es. Enigmistica classica" />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:4 }}>DATA PUBBLICAZIONE</label>
          <input className="input" type="date" value={form.data_pub} onChange={e=>set("data_pub",e.target.value)} />
        </div>

        {/* Media upload */}
        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ fontSize:12, fontWeight:700, color:COLORS.muted, display:"block", marginBottom:4 }}>FOTO / VIDEO (opzionale)</label>
          {preview ? (
            <div style={{ position:"relative", display:"inline-block" }}>
              {form.media_tipo === "video"
                ? <video src={preview} controls style={{ maxWidth:"100%", maxHeight:200, borderRadius:12 }} />
                : <img src={preview} alt="media" style={{ maxWidth:"100%", maxHeight:200, borderRadius:12, objectFit:"cover" }} />
              }
              <button onClick={removeMedia} style={{ position:"absolute", top:6, right:6, background:COLORS.error, border:"none", borderRadius:"50%", width:28, height:28, color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>
          ) : (
            <label style={{ display:"block", border:`2px dashed ${COLORS.muted}`, borderRadius:12, padding:"20px", textAlign:"center", cursor:"pointer", color:COLORS.muted, transition:"border-color .2s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=COLORS.primary}
              onMouseLeave={e=>e.currentTarget.style.borderColor=COLORS.muted}>
              <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ display:"none" }} />
              {uploading ? "⏳ Caricamento..." : "🖼️ Clicca per caricare foto o video"}
            </label>
          )}
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginTop:16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>
          {initial ? "💾 Salva modifiche" : "✅ Aggiungi"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Annulla</button>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function AdminPanel({ showToast }) {
  const [view, setView] = useState("enigmi");
  const [enigmi, setEnigmi] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({});
  const [tentativi, setTentativi] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);   // enigma in modifica
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("data_desc");
  const [filterCat, setFilterCat] = useState("Tutte");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: e }, { data: p }, { data: s }, { data: t }] = await Promise.all([
      supabase.from("enigmi").select("*").order("data_pub", { ascending:false }),
      supabase.from("profiles").select("*"),
      supabase.from("enigmi_stats").select("*"),
      supabase.from("tentativi").select("*"),
    ]);
    setEnigmi(e || []);
    setProfiles((p || []).filter(u => u.ruolo !== "admin"));
    const sm = {}; (s || []).forEach(r => { sm[r.id] = r.solutori; });
    setStats(sm);
    setTentativi(t || []);
    setLoading(false);
  };

  const addEnigma = async (form) => {
    if (!form.testo || !form.soluzione) return showToast("Compila testo e soluzione!", "error");
    const { error } = await supabase.from("enigmi").insert(form);
    if (error) return showToast(error.message, "error");
    showToast("Enigma aggiunto ✅", "success");
    setShowAdd(false);
    loadAll();
  };

  const updateEnigma = async (form) => {
    const { error } = await supabase.from("enigmi").update(form).eq("id", form.id);
    if (error) return showToast(error.message, "error");
    showToast("Enigma aggiornato ✅", "success");
    setEditing(null);
    setSelected(null);
    loadAll();
  };

  const deleteEnigma = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo enigma?")) return;
    const { error } = await supabase.from("enigmi").delete().eq("id", id);
    if (error) return showToast(error.message, "error");
    showToast("Enigma eliminato", "info");
    setSelected(null);
    loadAll();
  };

  // ── Sorting & filtering ──────────────────────────────────────────────────
  const sortedEnigmi = () => {
    let list = [...enigmi];
    if (filterCat !== "Tutte") list = list.filter(e => e.categoria === filterCat);
    switch (sortBy) {
      case "data_desc": return list.sort((a,b) => a.data_pub < b.data_pub ? 1 : -1);
      case "data_asc":  return list.sort((a,b) => a.data_pub > b.data_pub ? 1 : -1);
      case "diff_asc":  return list.sort((a,b) => a.difficolta - b.difficolta);
      case "diff_desc": return list.sort((a,b) => b.difficolta - a.difficolta);
      case "solvers":   return list.sort((a,b) => (stats[b.id]||0) - (stats[a.id]||0));
      default: return list;
    }
  };

  // ── Analytics ────────────────────────────────────────────────────────────
  const analytics = () => {
    const totalUtenti = profiles.length;
    const newsletter = profiles.filter(p => p.newsletter).length;
    const totalTentativi = tentativi.length;
    const totalRisolti = tentativi.filter(t => t.corretto).length;
    const tassoRisoluzione = totalTentativi ? Math.round(totalRisolti / totalTentativi * 100) : 0;

    const perCategoria = {};
    enigmi.forEach(e => {
      if (!perCategoria[e.categoria]) perCategoria[e.categoria] = { enigmi:0, risolti:0 };
      perCategoria[e.categoria].enigmi++;
      perCategoria[e.categoria].risolti += (stats[e.id] || 0);
    });

    const perDiff = { 1:0, 2:0, 3:0 };
    enigmi.forEach(e => { perDiff[e.difficolta] = (perDiff[e.difficolta]||0) + 1; });

    const topEnigmi = [...enigmi].sort((a,b) => (stats[b.id]||0) - (stats[a.id]||0)).slice(0,5);

    return { totalUtenti, newsletter, totalTentativi, totalRisolti, tassoRisoluzione, perCategoria, perDiff, topEnigmi };
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

  if (loading) return (
    <div style={{ textAlign:"center", padding:80, color:COLORS.muted }}>
      <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
      Caricamento...
    </div>
  );

  const an = analytics();

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily:"'Fredoka One'", fontSize:36, color:COLORS.accent, marginBottom:4 }}>⚙️ Pannello Admin</h1>
      <p style={{ color:COLORS.muted, marginBottom:24 }}>Gestisci enigmi, iscritti e analytics</p>

      {/* Stats globali */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
        {[
          { label:"Iscritti", value:profiles.length, color:COLORS.secondary, icon:"👥" },
          { label:"Enigmi", value:enigmi.length, color:COLORS.primary, icon:"🧩" },
          { label:"Newsletter", value:newsletterUsers.length, color:COLORS.accent, icon:"📧" },
          { label:"Risolti", value:totalSolved, color:COLORS.success, icon:"✅" },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign:"center", padding:16 }}>
            <div style={{ fontSize:24 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Fredoka One'", fontSize:30, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:COLORS.muted, fontWeight:700 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {tab("enigmi","🧩 Enigmi")}
        {tab("iscritti","👥 Iscritti")}
        {tab("newsletter","📧 Newsletter")}
        {tab("analytics","📊 Analytics")}
      </div>

      {/* ── ENIGMI ── */}
      {view === "enigmi" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
            <h2 style={{ fontFamily:"'Fredoka One'", fontSize:24 }}>Lista Enigmi ({enigmi.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={()=>{ setShowAdd(!showAdd); setEditing(null); }}>+ Aggiungi</button>
          </div>

          {/* Filtri e ordinamento */}
          <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
            <select className="input" style={{ width:"auto" }} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="data_desc">📅 Data (recenti prima)</option>
              <option value="data_asc">📅 Data (vecchi prima)</option>
              <option value="diff_asc">❓ Difficoltà (facile prima)</option>
              <option value="diff_desc">❓ Difficoltà (difficile prima)</option>
              <option value="solvers">🏆 Più risolti</option>
            </select>
            <select className="input" style={{ width:"auto" }} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option>Tutte</option>
              {["Indovinello","Logica","Rebus","Matematica","Quiz"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>

          {showAdd && !editing && (
            <EnigmaForm onSave={addEnigma} onCancel={()=>setShowAdd(false)} showToast={showToast} />
          )}

          <div style={{ display:"grid", gap:12 }}>
            {sortedEnigmi().map(e => {
              const isToday = e.data_pub === getTodayStr();
              const catColor = CAT_COLORS[e.categoria] || COLORS.primary;
              const isEditing = editing?.id === e.id;
              return (
                <div key={e.id}>
                  {isEditing ? (
                    <EnigmaForm initial={editing} onSave={updateEnigma} onCancel={()=>setEditing(null)} showToast={showToast} />
                  ) : (
                    <div className="card" style={{ padding:"16px 20px", border:`1px solid ${isToday?COLORS.primary:COLORS.cardLight}`, cursor:"pointer" }}
                      onClick={()=>setSelected(selected?.id===e.id?null:e)}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:8, marginBottom:6, flexWrap:"wrap", alignItems:"center" }}>
                            {isToday && <span className="badge" style={{ background:COLORS.primary, color:"#fff", fontSize:11 }}>📅 Oggi</span>}
                            <span className="badge" style={{ background:catColor+"33", color:catColor, fontSize:11 }}>{e.categoria}</span>
                            <span style={{ fontSize:12, color:COLORS.muted }}>{e.data_pub}</span>
                            <span style={{ fontSize:12, color:COLORS.muted }}>{DIFF[e.difficolta]}</span>
                            {e.media_url && <span style={{ fontSize:12, color:COLORS.purple }}>{e.media_tipo==="video"?"🎥":"🖼️"} Media</span>}
                          </div>
                          <p style={{ fontWeight:600, fontSize:14, lineHeight:1.5 }}>{e.testo.substring(0,100)}{e.testo.length>100?"...":""}</p>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontFamily:"'Fredoka One'", fontSize:22, color:COLORS.success }}>{stats[e.id]||0}</div>
                          <div style={{ fontSize:11, color:COLORS.muted }}>risolto</div>
                        </div>
                      </div>

                      {selected?.id === e.id && (
                        <div className="fade-in" style={{ marginTop:16, padding:16, background:COLORS.cardLight, borderRadius:12 }}>
                          {e.media_url && (
                            <div style={{ marginBottom:12 }}>
                              {e.media_tipo === "video"
                                ? <video src={e.media_url} controls style={{ maxWidth:"100%", maxHeight:200, borderRadius:8 }} />
                                : <img src={e.media_url} alt="media" style={{ maxWidth:"100%", maxHeight:200, borderRadius:8, objectFit:"cover" }} />
                              }
                            </div>
                          )}
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                            <div><span style={{ fontSize:12, color:COLORS.muted }}>Soluzione:</span><br/><strong style={{ color:COLORS.accent }}>{e.soluzione}</strong></div>
                            <div><span style={{ fontSize:12, color:COLORS.muted }}>Fonte:</span><br/><strong>{e.fonte||"—"}</strong></div>
                          </div>
                          <p style={{ fontSize:13, color:COLORS.muted, marginBottom:12 }}>{e.testo}</p>
                          <div style={{ display:"flex", gap:8 }}>
                            <button className="btn btn-sm btn-secondary" onClick={ev=>{ ev.stopPropagation(); setEditing(e); setSelected(null); setShowAdd(false); }}>✏️ Modifica</button>
                            <button className="btn btn-sm" style={{ background:COLORS.error, color:"#fff" }} onClick={ev=>{ ev.stopPropagation(); deleteEnigma(e.id); }}>🗑️ Elimina</button>
                          </div>
                        </div>
                      )}
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
          <h2 style={{ fontFamily:"'Fredoka One'", fontSize:24, marginBottom:16 }}>Iscritti ({profiles.length})</h2>
          {profiles.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:48 }}>👤</div>
              <p style={{ color:COLORS.muted, marginTop:12 }}>Nessun iscritto ancora</p>
            </div>
          ) : (
            <div style={{ display:"grid", gap:12 }}>
              {profiles.map(u => {
                const ut = tentativi.filter(t => t.user_id === u.id);
                const risolti = ut.filter(t => t.corretto).length;
                return (
                  <div key={u.id} className="card" style={{ padding:"16px 20px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:16 }}>{u.nome}</div>
                        <div style={{ color:COLORS.muted, fontSize:13 }}>{u.email}</div>
                        <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
                          {(u.preferenze||[]).map(p=>(
                            <span key={p} className="tag" style={{ background:CAT_COLORS[p]+"33", color:CAT_COLORS[p], fontSize:11, padding:"2px 10px" }}>{p}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:20, textAlign:"center" }}>
                        <div>
                          <div style={{ fontFamily:"'Fredoka One'", fontSize:22, color:COLORS.success }}>{risolti}</div>
                          <div style={{ fontSize:11, color:COLORS.muted }}>Risolti</div>
                        </div>
                        <div>
                          <div style={{ fontFamily:"'Fredoka One'", fontSize:22, color:COLORS.secondary }}>{ut.length}</div>
                          <div style={{ fontSize:11, color:COLORS.muted }}>Tentati</div>
                        </div>
                        <div>
                          <div style={{ fontSize:20 }}>{u.newsletter?"📧":"—"}</div>
                          <div style={{ fontSize:11, color:COLORS.muted }}>Newsletter</div>
                        </div>
                        <div>
                          <div style={{ fontSize:12, color:COLORS.muted, marginTop:4 }}>{new Date(u.created_at).toLocaleDateString("it-IT")}</div>
                          <div style={{ fontSize:11, color:COLORS.muted }}>Iscritto il</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── NEWSLETTER ── */}
      {view === "newsletter" && (
        <div>
          <h2 style={{ fontFamily:"'Fredoka One'", fontSize:24, marginBottom:4 }}>Newsletter</h2>
          <p style={{ color:COLORS.muted, marginBottom:16, fontSize:14 }}>{newsletterUsers.length} utenti riceveranno l'enigma ogni giorno</p>
          {newsletterUsers.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:48 }}>📭</div>
              <p style={{ color:COLORS.muted, marginTop:12 }}>Nessun utente iscritto alla newsletter</p>
            </div>
          ) : (
            <div style={{ display:"grid", gap:10 }}>
              {newsletterUsers.map(u => (
                <div key={u.id} className="card" style={{ padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <strong>{u.nome}</strong>
                    <div style={{ fontSize:13, color:COLORS.muted }}>{u.email}</div>
                  </div>
                  <span className="badge" style={{ background:COLORS.success+"33", color:COLORS.success }}>✅ Attiva</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {view === "analytics" && (
        <div>
          <h2 style={{ fontFamily:"'Fredoka One'", fontSize:24, marginBottom:20 }}>📊 Analytics</h2>

          {/* KPI */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 }}>
            {[
              { label:"Tasso di risoluzione", value:an.tassoRisoluzione+"%", sub:`${an.totalRisolti} su ${an.totalTentativi} tentativi`, color:COLORS.success },
              { label:"Iscritti newsletter", value:Math.round(an.newsletter/Math.max(an.totalUtenti,1)*100)+"%", sub:`${an.newsletter} su ${an.totalUtenti} utenti`, color:COLORS.accent },
              { label:"Media risolti/enigma", value: enigmi.length ? (totalSolved/enigmi.length).toFixed(1) : "0", sub:"solutori per enigma", color:COLORS.secondary },
            ].map(k => (
              <div key={k.label} className="card" style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Fredoka One'", fontSize:38, color:k.color }}>{k.value}</div>
                <div style={{ fontWeight:700, fontSize:14, marginTop:4 }}>{k.label}</div>
                <div style={{ fontSize:12, color:COLORS.muted, marginTop:4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {/* Per categoria */}
            <div className="card">
              <h3 style={{ fontFamily:"'Fredoka One'", fontSize:20, marginBottom:16 }}>Enigmi per categoria</h3>
              {Object.entries(an.perCategoria).map(([cat, val]) => (
                <Bar key={cat} label={cat} value={val.enigmi} max={enigmi.length} color={CAT_COLORS[cat]||COLORS.primary} />
              ))}
            </div>

            {/* Per difficoltà */}
            <div className="card">
              <h3 style={{ fontFamily:"'Fredoka One'", fontSize:20, marginBottom:16 }}>Enigmi per difficoltà</h3>
              <Bar label="❓ Facile" value={an.perDiff[1]||0} max={enigmi.length} color={COLORS.success} />
              <Bar label="❓❓ Medio" value={an.perDiff[2]||0} max={enigmi.length} color={COLORS.accent} />
              <Bar label="❓❓❓ Difficile" value={an.perDiff[3]||0} max={enigmi.length} color={COLORS.error} />
            </div>

            {/* Top enigmi */}
            <div className="card" style={{ gridColumn:"1/-1" }}>
              <h3 style={{ fontFamily:"'Fredoka One'", fontSize:20, marginBottom:16 }}>🏆 Top 5 enigmi più risolti</h3>
              {an.topEnigmi.length === 0 ? (
                <p style={{ color:COLORS.muted }}>Nessun dato ancora</p>
              ) : (
                an.topEnigmi.map((e, i) => (
                  <div key={e.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"10px 0", borderBottom:`1px solid ${COLORS.cardLight}` }}>
                    <div style={{ fontFamily:"'Fredoka One'", fontSize:24, color:COLORS.accent, width:32, textAlign:"center" }}>#{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:14 }}>{e.testo.substring(0,70)}...</div>
                      <div style={{ fontSize:12, color:COLORS.muted, marginTop:2 }}>{e.data_pub} · {e.categoria}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Fredoka One'", fontSize:22, color:COLORS.success }}>{stats[e.id]||0}</div>
                      <div style={{ fontSize:11, color:COLORS.muted }}>risolti</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Risolti per categoria */}
            <div className="card" style={{ gridColumn:"1/-1" }}>
              <h3 style={{ fontFamily:"'Fredoka One'", fontSize:20, marginBottom:16 }}>Risolti per categoria</h3>
              {Object.entries(an.perCategoria).map(([cat, val]) => (
                <Bar key={cat} label={cat} value={val.risolti} max={Math.max(...Object.values(an.perCategoria).map(v=>v.risolti),1)} color={CAT_COLORS[cat]||COLORS.primary} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
