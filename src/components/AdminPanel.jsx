import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = {
  primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7",
  card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA",
  success:"#22C55E", error:"#EF4444", bg:"#0F0F1A"
};
const CAT_COLORS = {
  Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7",
  Matematica:"#FFE66D", Quiz:"#EC4899", "Indovina il film":"#38BDF8", Ghigliottina:"#F43F5E"
};
const CATEGORIE = ["Indovinello","Logica","Rebus","Matematica","Quiz","Indovina il film","Ghigliottina"];
const DIFF = ["", "🧩", "🧩🧩", "🧩🧩🧩"];
const DIFF_LABEL = ["", "Facile", "Medio", "Difficile"];

function getTodayStr() { return new Date().toISOString().split("T")[0]; }

function DiffBadge({ level }) {
  const colors = ["", COLORS.success, COLORS.accent, COLORS.error];
  return (
    <span title={DIFF_LABEL[level]} style={{
      display:"inline-flex", alignItems:"center", gap:2,
      background: colors[level]+"22", color: colors[level],
      padding:"2px 8px", borderRadius:50, fontSize:13, fontWeight:700
    }}>
      {DIFF[level]} <span style={{fontSize:11}}>{DIFF_LABEL[level]}</span>
    </span>
  );
}

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

function Modal({ children, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,.75)", backdropFilter:"blur(4px)", padding:"20px"
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background:COLORS.card, borderRadius:24, width:"100%", maxWidth:680,
        maxHeight:"90vh", overflowY:"auto", position:"relative",
        border:`1px solid ${COLORS.primary}33`, boxShadow:"0 24px 80px rgba(0,0,0,.6)"
      }}>
        <button onClick={onClose} style={{
          position:"sticky", top:16, float:"right", marginRight:16,
          background:COLORS.cardLight, border:"none", color:COLORS.text,
          width:32, height:32, borderRadius:"50%", cursor:"pointer",
          fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10
        }}>✕</button>
        <div style={{ padding:"28px 28px 32px" }}>{children}</div>
      </div>
    </div>
  );
}

function EnigmaForm({ initial, onSave, onCancel, showToast }) {
  const empty = {
    testo:"", soluzione:"", descrizione:"", categoria:"Indovinello",
    difficolta:2, fonte:"", data_pub:getTodayStr(), media_url:"", media_tipo:""
  };
  const [form, setForm] = useState(initial ? { ...empty, ...initial } : empty);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const ext = file.name.split(".").pop();
    const path = `enigmi/${Date.now()}.${ext}`;
    setUploading(true);
    const { error } = await supabase.storage.from("enigmi-media").upload(path, file, { upsert:true });
    if (error) { showToast("Errore upload: " + error.message, "error"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("enigmi-media").getPublicUrl(path);
    set("media_url", publicUrl); set("media_tipo", isVideo ? "video" : "foto");
    setUploading(false);
    showToast("Media caricato ✅", "success");
  };

  const removeMedia = () => { set("media_url",""); set("media_tipo",""); };
  const catColor = CAT_COLORS[form.categoria] || COLORS.primary;

  return (
    <div>
      <h3 style={{ fontFamily:"'Fredoka One'", fontSize:22, marginBottom:20, color:COLORS.primary }}>
        {initial ? "✏️ Modifica Enigma" : "➕ Nuovo Enigma"}
      </h3>
      <div style={{ display:"grid", gap:14 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:1, display:"block", marginBottom:6 }}>TESTO *</label>
          <textarea className="input" rows={3} value={form.testo} onChange={e=>set("testo",e.target.value)} placeholder="Testo dell'enigma..." style={{ resize:"vertical" }} />
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:1, display:"block", marginBottom:6 }}>DESCRIZIONE / NOTE</label>
          <textarea className="input" rows={2} value={form.descrizione||""} onChange={e=>set("descrizione",e.target.value)} placeholder="Contesto aggiuntivo, hint, spiegazione..." style={{ resize:"vertical" }} />
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:1, display:"block", marginBottom:6 }}>SOLUZIONE *</label>
          <input className="input" value={form.soluzione} onChange={e=>set("soluzione",e.target.value)} placeholder="La risposta corretta" />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:1, display:"block", marginBottom:6 }}>CATEGORIA</label>
            <select className="input" value={form.categoria} onChange={e=>set("categoria",e.target.value)}>
              {CATEGORIE.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:1, display:"block", marginBottom:6 }}>DIFFICOLTÀ</label>
            <select className="input" value={form.difficolta} onChange={e=>set("difficolta",+e.target.value)}>
              <option value={1}>🧩 Facile</option>
              <option value={2}>🧩🧩 Medio</option>
              <option value={3}>🧩🧩🧩 Difficile</option>
            </select>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:1, display:"block", marginBottom:6 }}>FONTE</label>
            <input className="input" value={form.fonte||""} onChange={e=>set("fonte",e.target.value)} placeholder="Es. Enigmistica classica" />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:1, display:"block", marginBottom:6 }}>DATA PUBBLICAZIONE</label>
            <input className="input" type="date" value={form.data_pub} onChange={e=>set("data_pub",e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:1, display:"block", marginBottom:6 }}>FOTO / VIDEO</label>
          {form.media_url ? (
            <div style={{ position:"relative", display:"inline-block", maxWidth:"100%" }}>
              {form.media_tipo === "video"
                ? <video src={form.media_url} controls style={{ maxWidth:"100%", maxHeight:220, borderRadius:12 }} />
                : <img src={form.media_url} alt="media" style={{ maxWidth:"100%", maxHeight:220, borderRadius:12, objectFit:"contain" }} />
              }
              <button onClick={removeMedia} style={{ position:"absolute", top:8, right:8, background:COLORS.error, border:"none", borderRadius:"50%", width:28, height:28, color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
          ) : (
            <label
              style={{ display:"block", border:`2px dashed ${COLORS.muted}44`, borderRadius:12, padding:"24px", textAlign:"center", cursor:"pointer", color:COLORS.muted, transition:"all .2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.primary;e.currentTarget.style.color=COLORS.primary;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.muted+"44";e.currentTarget.style.color=COLORS.muted;}}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=COLORS.primary;e.currentTarget.style.color=COLORS.primary;e.currentTarget.style.background=COLORS.primary+"11";}}
              onDragLeave={e=>{e.currentTarget.style.borderColor=COLORS.muted+"44";e.currentTarget.style.color=COLORS.muted;e.currentTarget.style.background="transparent";}}
              onDrop={e=>{
                e.preventDefault();
                e.currentTarget.style.borderColor=COLORS.muted+"44";
                e.currentTarget.style.color=COLORS.muted;
                e.currentTarget.style.background="transparent";
                const file = e.dataTransfer.files[0];
                if (file) handleFile({ target:{ files:[file] } });
              }}>
              <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ display:"none" }} />
              <div style={{ fontSize:28, marginBottom:8 }}>🖼️</div>
              {uploading ? "⏳ Caricamento in corso..." : "Trascina qui o clicca per caricare"}
            </label>
          )}
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", padding:"12px 16px", background:COLORS.cardLight, borderRadius:12 }}>
          <span className="tag" style={{ background:catColor, color:"#000", fontSize:13 }}>{form.categoria}</span>
          <DiffBadge level={form.difficolta} />
          <span style={{ fontSize:12, color:COLORS.muted }}>{form.data_pub}</span>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:20 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          {initial ? "💾 Salva modifiche" : "✅ Aggiungi enigma"}
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>Annulla</button>
      </div>
    </div>
  );
}

export default function AdminPanel({ showToast }) {
  const [view, setView] = useState("enigmi");
  const [enigmi, setEnigmi] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({});
  const [tentativi, setTentativi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [modalEnigma, setModalEnigma] = useState(null);
  const [sortCol, setSortCol] = useState("data_pub");
  const [sortDir, setSortDir] = useState("desc");
  const [filterCat, setFilterCat] = useState("Tutte");
  const [search, setSearch] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: e }, { data: p }, { data: s }, { data: t }] = await Promise.all([
      supabase.from("enigmi").select("*"),
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
    console.log("addEnigma chiamato", form);
    if (!form.testo || !form.soluzione) return showToast("Compila testo e soluzione!", "error");
    const { data, error } = await supabase.from("enigmi").insert(form).select();
    console.log("risultato insert:", data, error);
    if (error) return showToast(error.message, "error");
    showToast("Enigma aggiunto ✅", "success");
    closeModal(); loadAll();
  };

  
  const updateEnigma = async (form) => {
    const { error } = await supabase.from("enigmi").update(form).eq("id", form.id);
    if (error) return showToast(error.message, "error");
    showToast("Enigma aggiornato ✅", "success");
    closeModal(); loadAll();
  };

  const deleteEnigma = async (id) => {
    if (!window.confirm("Eliminare questo enigma?")) return;
    const { error } = await supabase.from("enigmi").delete().eq("id", id);
    if (error) return showToast(error.message, "error");
    showToast("Enigma eliminato", "info");
    closeModal(); loadAll();
  };

  const openAdd = () => { setModalEnigma(null); setModalMode("add"); };
  const openView = (e) => { setModalEnigma(e); setModalMode("view"); };
  const openEdit = (e) => { setModalEnigma(e); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setModalEnigma(null); };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ opacity:.3, marginLeft:4 }}>↕</span>;
    return <span style={{ color:COLORS.primary, marginLeft:4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const filteredEnigmi = () => {
    let list = [...enigmi];
    if (filterCat !== "Tutte") list = list.filter(e => e.categoria === filterCat);
    if (search) list = list.filter(e => e.testo.toLowerCase().includes(search.toLowerCase()) || e.soluzione.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === "solutori") { va = stats[a.id]||0; vb = stats[b.id]||0; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  };

  const an = (() => {
    const totalUtenti = profiles.length;
    const newsletter = profiles.filter(p => p.newsletter).length;
    const totalTentativi = tentativi.length;
    const totalRisolti = tentativi.filter(t => t.corretto).length;
    const tassoRisoluzione = totalTentativi ? Math.round(totalRisolti / totalTentativi * 100) : 0;
    const totalSolved = Object.values(stats).reduce((a,b)=>a+b,0);
    const perCategoria = {};
    enigmi.forEach(e => {
      if (!perCategoria[e.categoria]) perCategoria[e.categoria] = { enigmi:0, risolti:0 };
      perCategoria[e.categoria].enigmi++;
      perCategoria[e.categoria].risolti += (stats[e.id] || 0);
    });
    const perDiff = { 1:0, 2:0, 3:0 };
    enigmi.forEach(e => { perDiff[e.difficolta] = (perDiff[e.difficolta]||0) + 1; });
    const topEnigmi = [...enigmi].sort((a,b) => (stats[b.id]||0) - (stats[a.id]||0)).slice(0,5);
    return { totalUtenti, newsletter, totalTentativi, totalRisolti, tassoRisoluzione, totalSolved, perCategoria, perDiff, topEnigmi };
  })();

  const tab = (t, label) => (
    <button key={t} onClick={()=>setView(t)} style={{
      padding:"10px 20px", borderRadius:50, fontWeight:800, cursor:"pointer", fontSize:14, border:"none",
      background: view===t ? COLORS.primary : COLORS.cardLight,
      color: view===t ? "#fff" : COLORS.muted,
      fontFamily:"'Nunito',sans-serif", transition:"all .2s"
    }}>{label}</button>
  );

  const thStyle = (col) => ({
    padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700,
    color: sortCol===col ? COLORS.primary : COLORS.muted,
    letterSpacing:1, cursor: col ? "pointer" : "default", whiteSpace:"nowrap",
    userSelect:"none", borderBottom:`2px solid ${COLORS.cardLight}`
  });
  const tdStyle = { padding:"12px 14px", fontSize:13, borderBottom:`1px solid ${COLORS.cardLight}22`, verticalAlign:"middle" };

  if (loading) return (
    <div style={{ textAlign:"center", padding:80, color:COLORS.muted }}>
      <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>Caricamento...
    </div>
  );

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily:"'Fredoka One'", fontSize:36, color:COLORS.accent, marginBottom:4 }}>⚙️ Pannello Admin</h1>
      <p style={{ color:COLORS.muted, marginBottom:24 }}>Gestisci enigmi, iscritti e analytics</p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
        {[
          { label:"Iscritti", value:profiles.length, color:COLORS.secondary, icon:"👥" },
          { label:"Enigmi", value:enigmi.length, color:COLORS.primary, icon:"🧩" },
          { label:"Newsletter", value:an.newsletter, color:COLORS.accent, icon:"📧" },
          { label:"Risolti", value:an.totalSolved, color:COLORS.success, icon:"✅" },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign:"center", padding:16 }}>
            <div style={{ fontSize:24 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Fredoka One'", fontSize:30, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:COLORS.muted, fontWeight:700 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {tab("enigmi","🧩 Enigmi")}
        {tab("iscritti","👥 Iscritti")}
        {tab("newsletter","📧 Newsletter")}
        {tab("analytics","📊 Analytics")}
      </div>

      {/* ENIGMI */}
      {view === "enigmi" && (
        <div>
          <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
            <input className="input" style={{ maxWidth:240 }} placeholder="🔍 Cerca..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select className="input" style={{ width:"auto" }} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option>Tutte</option>
              {CATEGORIE.map(c=><option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" style={{ marginLeft:"auto" }} onClick={openAdd}>+ Aggiungi enigma</button>
          </div>
          <div style={{ background:COLORS.card, borderRadius:20, overflow:"hidden", border:`1px solid ${COLORS.cardLight}` }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead style={{ background:COLORS.cardLight }}>
                  <tr>
                    <th style={thStyle("data_pub")} onClick={()=>handleSort("data_pub")}>DATA<SortIcon col="data_pub"/></th>
                    <th style={thStyle("categoria")} onClick={()=>handleSort("categoria")}>CATEGORIA<SortIcon col="categoria"/></th>
                    <th style={thStyle("difficolta")} onClick={()=>handleSort("difficolta")}>DIFFICOLTÀ<SortIcon col="difficolta"/></th>
                    <th style={{...thStyle("testo"), minWidth:220}}>TESTO</th>
                    <th style={{...thStyle("solutori"), textAlign:"center"}} onClick={()=>handleSort("solutori")}>RISOLTI<SortIcon col="solutori"/></th>
                    <th style={{...thStyle(""), textAlign:"center"}}>MEDIA</th>
                    <th style={thStyle("")}>AZIONI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnigmi().map((e, i) => {
                    const isToday = e.data_pub === getTodayStr();
                    const catColor = CAT_COLORS[e.categoria] || COLORS.primary;
                    return (
                      <tr key={e.id} style={{ background: isToday ? COLORS.primary+"11" : i%2===0 ? "transparent" : COLORS.cardLight+"44" }}>
                        <td style={tdStyle}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            {isToday && <span style={{ fontSize:10, background:COLORS.primary, color:"#fff", padding:"2px 6px", borderRadius:50, fontWeight:700 }}>OGGI</span>}
                            <span style={{ color:COLORS.muted, fontSize:12 }}>{e.data_pub}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span className="tag" style={{ background:catColor+"33", color:catColor, fontSize:11, padding:"3px 10px" }}>{e.categoria}</span>
                        </td>
                        <td style={tdStyle}><DiffBadge level={e.difficolta} /></td>
                        <td style={tdStyle}>
                          <span style={{ color:COLORS.text, cursor:"pointer", textDecoration:"underline", textDecorationColor:COLORS.primary+"66" }} onClick={()=>openView(e)}>
                            {e.testo.substring(0,60)}{e.testo.length>60?"...":""}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign:"center" }}>
                          <span style={{ fontFamily:"'Fredoka One'", fontSize:18, color:COLORS.success }}>{stats[e.id]||0}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign:"center" }}>
                          {e.media_url ? <span>{e.media_tipo==="video"?"🎥":"🖼️"}</span> : <span style={{ color:COLORS.muted+"44" }}>—</span>}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={()=>openView(e)} style={{ background:COLORS.cardLight, border:"none", color:COLORS.text, padding:"5px 10px", borderRadius:8, cursor:"pointer", fontSize:12 }}>👁️</button>
                            <button onClick={()=>openEdit(e)} style={{ background:COLORS.secondary+"33", border:"none", color:COLORS.secondary, padding:"5px 10px", borderRadius:8, cursor:"pointer", fontSize:12 }}>✏️</button>
                            <button onClick={()=>deleteEnigma(e.id)} style={{ background:COLORS.error+"22", border:"none", color:COLORS.error, padding:"5px 10px", borderRadius:8, cursor:"pointer", fontSize:12 }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredEnigmi().length === 0 && (
                <div style={{ textAlign:"center", padding:40, color:COLORS.muted }}>Nessun enigma trovato</div>
              )}
            </div>
            <div style={{ padding:"12px 16px", borderTop:`1px solid ${COLORS.cardLight}`, fontSize:12, color:COLORS.muted }}>
              {filteredEnigmi().length} enigmi {filterCat!=="Tutte"?`· filtro: ${filterCat}`:""}
            </div>
          </div>
        </div>
      )}

      {/* ISCRITTI */}
      {view === "iscritti" && (
        <div>
          <h2 style={{ fontFamily:"'Fredoka One'", fontSize:24, marginBottom:16 }}>Iscritti ({profiles.length})</h2>
          {profiles.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:48 }}>👤</div>
              <p style={{ color:COLORS.muted, marginTop:12 }}>Nessun iscritto ancora</p>
            </div>
          ) : (
            <div style={{ background:COLORS.card, borderRadius:20, overflow:"hidden", border:`1px solid ${COLORS.cardLight}` }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead style={{ background:COLORS.cardLight }}>
                  <tr>
                    <th style={thStyle("")}>NOME</th>
                    <th style={thStyle("")}>EMAIL</th>
                    <th style={thStyle("")}>PREFERENZE</th>
                    <th style={{...thStyle(""), textAlign:"center"}}>RISOLTI</th>
                    <th style={{...thStyle(""), textAlign:"center"}}>TENTATI</th>
                    <th style={{...thStyle(""), textAlign:"center"}}>NEWSLETTER</th>
                    <th style={thStyle("")}>ISCRITTO IL</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((u, i) => {
                    const ut = tentativi.filter(t => t.user_id === u.id);
                    const risolti = ut.filter(t => t.corretto).length;
                    return (
                      <tr key={u.id} style={{ background: i%2===0 ? "transparent" : COLORS.cardLight+"44" }}>
                        <td style={{ ...tdStyle, fontWeight:700 }}>{u.nome}</td>
                        <td style={{ ...tdStyle, color:COLORS.muted, fontSize:12 }}>{u.email}</td>
                        <td style={tdStyle}>
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            {(u.preferenze||[]).map(p=>(
                              <span key={p} style={{ background:CAT_COLORS[p]+"33", color:CAT_COLORS[p]||COLORS.primary, padding:"2px 8px", borderRadius:50, fontSize:11, fontWeight:700 }}>{p}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign:"center" }}>
                          <span style={{ fontFamily:"'Fredoka One'", fontSize:18, color:COLORS.success }}>{risolti}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign:"center" }}>
                          <span style={{ fontFamily:"'Fredoka One'", fontSize:18, color:COLORS.secondary }}>{ut.length}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign:"center" }}>
                          {u.newsletter ? <span style={{ color:COLORS.success }}>✅</span> : <span style={{ color:COLORS.muted }}>—</span>}
                        </td>
                        <td style={{ ...tdStyle, color:COLORS.muted, fontSize:12 }}>{new Date(u.created_at).toLocaleDateString("it-IT")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* NEWSLETTER */}
      {view === "newsletter" && (
        <div>
          <h2 style={{ fontFamily:"'Fredoka One'", fontSize:24, marginBottom:4 }}>Newsletter</h2>
          <p style={{ color:COLORS.muted, marginBottom:16, fontSize:14 }}>{profiles.filter(p=>p.newsletter).length} utenti iscritti</p>
          <div style={{ background:COLORS.card, borderRadius:20, overflow:"hidden" }}>
            {profiles.filter(p=>p.newsletter).length === 0 ? (
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:48 }}>📭</div>
                <p style={{ color:COLORS.muted, marginTop:12 }}>Nessun utente iscritto</p>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead style={{ background:COLORS.cardLight }}>
                  <tr>
                    <th style={thStyle("")}>NOME</th>
                    <th style={thStyle("")}>EMAIL</th>
                    <th style={thStyle("")}>STATO</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.filter(p=>p.newsletter).map((u,i) => (
                    <tr key={u.id} style={{ background: i%2===0?"transparent":COLORS.cardLight+"44" }}>
                      <td style={{ ...tdStyle, fontWeight:700 }}>{u.nome}</td>
                      <td style={{ ...tdStyle, color:COLORS.muted }}>{u.email}</td>
                      <td style={tdStyle}><span style={{ background:COLORS.success+"33", color:COLORS.success, padding:"3px 12px", borderRadius:50, fontSize:12, fontWeight:700 }}>✅ Attiva</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {view === "analytics" && (
        <div>
          <h2 style={{ fontFamily:"'Fredoka One'", fontSize:24, marginBottom:20 }}>📊 Analytics</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 }}>
            {[
              { label:"Tasso risoluzione", value:an.tassoRisoluzione+"%", sub:`${an.totalRisolti} su ${an.totalTentativi} tentativi`, color:COLORS.success },
              { label:"Iscritti newsletter", value:Math.round(an.newsletter/Math.max(an.totalUtenti,1)*100)+"%", sub:`${an.newsletter} su ${an.totalUtenti} utenti`, color:COLORS.accent },
              { label:"Media risolti/enigma", value:enigmi.length?(an.totalSolved/enigmi.length).toFixed(1):"0", sub:"solutori per enigma", color:COLORS.secondary },
            ].map(k => (
              <div key={k.label} className="card" style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Fredoka One'", fontSize:38, color:k.color }}>{k.value}</div>
                <div style={{ fontWeight:700, fontSize:14, marginTop:4 }}>{k.label}</div>
                <div style={{ fontSize:12, color:COLORS.muted, marginTop:4 }}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div className="card">
              <h3 style={{ fontFamily:"'Fredoka One'", fontSize:20, marginBottom:16 }}>Enigmi per categoria</h3>
              {Object.entries(an.perCategoria).map(([cat, val]) => (
                <Bar key={cat} label={cat} value={val.enigmi} max={enigmi.length} color={CAT_COLORS[cat]||COLORS.primary} />
              ))}
            </div>
            <div className="card">
              <h3 style={{ fontFamily:"'Fredoka One'", fontSize:20, marginBottom:16 }}>Per difficoltà</h3>
              <Bar label="🧩 Facile" value={an.perDiff[1]||0} max={enigmi.length} color={COLORS.success} />
              <Bar label="🧩🧩 Medio" value={an.perDiff[2]||0} max={enigmi.length} color={COLORS.accent} />
              <Bar label="🧩🧩🧩 Difficile" value={an.perDiff[3]||0} max={enigmi.length} color={COLORS.error} />
            </div>
            <div className="card" style={{ gridColumn:"1/-1" }}>
              <h3 style={{ fontFamily:"'Fredoka One'", fontSize:20, marginBottom:16 }}>🏆 Top 5 più risolti</h3>
              {an.topEnigmi.length === 0 ? <p style={{ color:COLORS.muted }}>Nessun dato ancora</p> : (
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
          </div>
        </div>
      )}

      {/* MODAL */}
      {modalMode && (
        <Modal onClose={closeModal}>
          {modalMode === "add" && (
            <EnigmaForm onSave={addEnigma} onCancel={closeModal} showToast={showToast} />
          )}
          {modalMode === "edit" && (
            <EnigmaForm initial={modalEnigma} onSave={updateEnigma} onCancel={closeModal} showToast={showToast} />
          )}
          {modalMode === "view" && modalEnigma && (
            <div>
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                <span className="tag" style={{ background:CAT_COLORS[modalEnigma.categoria]||COLORS.primary, color:"#000" }}>{modalEnigma.categoria}</span>
                <DiffBadge level={modalEnigma.difficolta} />
                <span style={{ color:COLORS.muted, fontSize:13 }}>{modalEnigma.data_pub}</span>
                <span style={{ color:COLORS.success, fontSize:13, fontWeight:700 }}>👥 {stats[modalEnigma.id]||0} risolti</span>
              </div>
              {modalEnigma.media_url && (
                <div style={{ marginBottom:20 }}>
                  {modalEnigma.media_tipo === "video"
                    ? <video src={modalEnigma.media_url} controls style={{ width:"100%", borderRadius:16, maxHeight:280 }} />
                    : <img src={modalEnigma.media_url} alt="media" style={{ width:"100%", borderRadius:16, maxHeight:280, objectFit:"contain" }} />
                  }
                </div>
              )}
              <h3 style={{ fontFamily:"'Fredoka One'", fontSize:22, marginBottom:12, lineHeight:1.4 }}>{modalEnigma.testo}</h3>
              {modalEnigma.descrizione && (
                <p style={{ color:COLORS.muted, fontSize:14, marginBottom:16, lineHeight:1.6, background:COLORS.cardLight, padding:"12px 16px", borderRadius:12 }}>
                  {modalEnigma.descrizione}
                </p>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                <div style={{ background:COLORS.cardLight, padding:"12px 16px", borderRadius:12 }}>
                  <div style={{ fontSize:11, color:COLORS.muted, fontWeight:700, marginBottom:4 }}>SOLUZIONE</div>
                  <div style={{ fontSize:18, fontWeight:800, color:COLORS.accent }}>{modalEnigma.soluzione}</div>
                </div>
                <div style={{ background:COLORS.cardLight, padding:"12px 16px", borderRadius:12 }}>
                  <div style={{ fontSize:11, color:COLORS.muted, fontWeight:700, marginBottom:4 }}>FONTE</div>
                  <div style={{ fontWeight:600 }}>{modalEnigma.fonte || "—"}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(modalEnigma)}>✏️ Modifica</button>
                <button className="btn btn-sm" style={{ background:COLORS.error, color:"#fff" }} onClick={()=>deleteEnigma(modalEnigma.id)}>🗑️ Elimina</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
