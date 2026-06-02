import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = {
  primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7",
  card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA",
  success:"#22C55E", error:"#EF4444", bg:"#0F0F1A", warning:"#F59E0B"
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
    <span style={{ display:"inline-flex", alignItems:"center", gap:2, background:colors[level]+"22", color:colors[level], padding:"2px 8px", borderRadius:50, fontSize:13, fontWeight:700 }}>
      {DIFF[level]} <span style={{fontSize:11}}>{DIFF_LABEL[level]}</span>
    </span>
  );
}

function Bar({ label, value, max, color }) {
  const pct = max ? Math.round((value/max)*100) : 0;
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:13,color:COLORS.muted}}>{label}</span>
        <span style={{fontSize:13,fontWeight:700,color}}>{value}</span>
      </div>
      <div style={{background:COLORS.cardLight,borderRadius:50,height:8}}>
        <div style={{width:`${pct}%`,background:color,borderRadius:50,height:8,transition:"width .6s ease"}}/>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:COLORS.card,borderRadius:24,width:"100%",maxWidth:680,maxHeight:"90vh",overflowY:"auto",position:"relative",border:`1px solid ${COLORS.primary}33`,boxShadow:"0 24px 80px rgba(0,0,0,.6)"}}>
        <button onClick={onClose} style={{position:"sticky",top:16,float:"right",marginRight:16,background:COLORS.cardLight,border:"none",color:COLORS.text,width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>✕</button>
        <div style={{padding:"28px 28px 32px"}}>{children}</div>
      </div>
    </div>
  );
}

function EnigmaForm({ initial, onSave, onCancel, showToast }) {
  const empty = { testo:"", soluzione:"", descrizione:"", categoria:"Indovinello", difficolta:2, fonte:"", data_pub:getTodayStr(), media_url:"", media_tipo:"" };
  const [form, setForm] = useState(initial ? {...empty,...initial} : empty);
  const [uploading, setUploading] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const path = `enigmi/${Date.now()}.${file.name.split(".").pop()}`;
    setUploading(true);
    const { error } = await supabase.storage.from("enigmi-media").upload(path, file, {upsert:true});
    if (error) { showToast("Errore upload: "+error.message,"error"); setUploading(false); return; }
    const { data:{publicUrl} } = supabase.storage.from("enigmi-media").getPublicUrl(path);
    set("media_url",publicUrl); set("media_tipo",isVideo?"video":"foto");
    setUploading(false); showToast("Media caricato ✅","success");
  };

  const catColor = CAT_COLORS[form.categoria] || COLORS.primary;

  return (
    <div>
      <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:20,color:COLORS.primary}}>
        {initial?"✏️ Modifica Enigma":"➕ Nuovo Enigma"}
      </h3>
      <div style={{display:"grid",gap:14}}>
        <div>
          <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>TESTO *</label>
          <textarea className="input" rows={3} value={form.testo} onChange={e=>set("testo",e.target.value)} placeholder="Testo dell'enigma..." style={{resize:"vertical"}}/>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>DESCRIZIONE / NOTE</label>
          <textarea className="input" rows={2} value={form.descrizione||""} onChange={e=>set("descrizione",e.target.value)} placeholder="Contesto aggiuntivo, hint..." style={{resize:"vertical"}}/>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>SOLUZIONE *</label>
          <input className="input" value={form.soluzione} onChange={e=>set("soluzione",e.target.value)} placeholder="La risposta corretta"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>CATEGORIA</label>
            <select className="input" value={form.categoria} onChange={e=>set("categoria",e.target.value)}>
              {CATEGORIE.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>DIFFICOLTÀ</label>
            <select className="input" value={form.difficolta} onChange={e=>set("difficolta",+e.target.value)}>
              <option value={1}>🧩 Facile</option>
              <option value={2}>🧩🧩 Medio</option>
              <option value={3}>🧩🧩🧩 Difficile</option>
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>FONTE</label>
            <input className="input" value={form.fonte||""} onChange={e=>set("fonte",e.target.value)} placeholder="Es. Enigmistica classica"/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>DATA PUBBLICAZIONE</label>
            <input className="input" type="date" value={form.data_pub} onChange={e=>set("data_pub",e.target.value)}/>
          </div>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>FOTO / VIDEO</label>
          {form.media_url ? (
            <div style={{position:"relative",display:"inline-block",maxWidth:"100%"}}>
              {form.media_tipo==="video"
                ?<video src={form.media_url} controls style={{maxWidth:"100%",maxHeight:220,borderRadius:12}}/>
                :<img src={form.media_url} alt="media" style={{maxWidth:"100%",maxHeight:220,borderRadius:12,objectFit:"contain"}}/>
              }
              <button onClick={()=>{set("media_url","");set("media_tipo","");}} style={{position:"absolute",top:8,right:8,background:COLORS.error,border:"none",borderRadius:"50%",width:28,height:28,color:"#fff",cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          ) : (
            <label style={{display:"block",border:`2px dashed ${COLORS.muted}44`,borderRadius:12,padding:"24px",textAlign:"center",cursor:"pointer",color:COLORS.muted,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.primary;e.currentTarget.style.color=COLORS.primary;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.muted+"44";e.currentTarget.style.color=COLORS.muted;}}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=COLORS.primary;e.currentTarget.style.background=COLORS.primary+"11";}}
              onDragLeave={e=>{e.currentTarget.style.borderColor=COLORS.muted+"44";e.currentTarget.style.background="transparent";}}
              onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor=COLORS.muted+"44";e.currentTarget.style.background="transparent";const f=e.dataTransfer.files[0];if(f)handleFile({target:{files:[f]}});}}>
              <input type="file" accept="image/*,video/*" onChange={handleFile} style={{display:"none"}}/>
              <div style={{fontSize:28,marginBottom:8}}>🖼️</div>
              {uploading?"⏳ Caricamento...":"Trascina qui o clicca per caricare"}
            </label>
          )}
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",padding:"12px 16px",background:COLORS.cardLight,borderRadius:12}}>
          <span className="tag" style={{background:catColor,color:"#000",fontSize:13}}>{form.categoria}</span>
          <DiffBadge level={form.difficolta}/>
          <span style={{fontSize:12,color:COLORS.muted}}>{form.data_pub}</span>
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button className="btn btn-primary" onClick={()=>onSave(form)}>{initial?"💾 Salva modifiche":"✅ Aggiungi enigma"}</button>
        <button className="btn btn-ghost" onClick={onCancel}>Annulla</button>
      </div>
    </div>
  );
}

export default function AdminPanel({ showToast, onConfigUpdate }) {
  const [view, setView] = useState("enigmi");
  const [enigmi, setEnigmi] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({});
  const [tentativi, setTentativi] = useState([]);
  const [diffConfig, setDiffConfig] = useState([]);
  const [catConfig, setCatConfig] = useState([]);
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
    const [{ data:e },{ data:p },{ data:s },{ data:t },{ data:dc },{ data:cc }] = await Promise.all([
      supabase.from("enigmi").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("enigmi_stats").select("*"),
      supabase.from("tentativi").select("*"),
      supabase.from("difficolta_config").select("*").order("livello"),
      supabase.from("categorie_config").select("*"),
    ]);
    setEnigmi(e||[]); setProfiles((p||[]).filter(u=>u.ruolo!=="admin"));
    const sm={}; (s||[]).forEach(r=>{sm[r.id]=r.solutori;}); setStats(sm);
    setTentativi(t||[]); setDiffConfig(dc||[]); setCatConfig(cc||[]);
    setLoading(false);
  };

  const addEnigma = async (form) => {
    if (!form.testo||!form.soluzione) return showToast("Compila testo e soluzione!","error");
    const { data, error } = await supabase.from("enigmi").insert(form).select();
    if (error) return showToast(error.message,"error");
    showToast("Enigma aggiunto ✅","success"); closeModal(); loadAll();
  };

  const updateEnigma = async (form) => {
    const { error } = await supabase.from("enigmi").update(form).eq("id",form.id);
    if (error) return showToast(error.message,"error");
    showToast("Aggiornato ✅","success"); closeModal(); loadAll();
  };

  const deleteEnigma = async (id) => {
    if (!window.confirm("Eliminare questo enigma?")) return;
    const { error } = await supabase.from("enigmi").delete().eq("id",id);
    if (error) return showToast(error.message,"error");
    showToast("Eliminato","info"); closeModal(); loadAll();
  };

  const saveDiffConfig = async (livello, secondi) => {
    const { error } = await supabase.from("difficolta_config").update({secondi:+secondi}).eq("livello",livello);
    if (error) return showToast(error.message,"error");
    showToast("Salvato ✅","success");
    setDiffConfig(prev=>prev.map(d=>d.livello===livello?{...d,secondi:+secondi}:d));
    if (onConfigUpdate) onConfigUpdate();
  };

  const saveCatConfig = async (categoria, istruzioni) => {
    const { error } = await supabase.from("categorie_config").upsert({categoria,istruzioni},{onConflict:"categoria"});
    if (error) return showToast(error.message,"error");
    showToast("Istruzioni salvate ✅","success");
    setCatConfig(prev=>prev.map(c=>c.categoria===categoria?{...c,istruzioni}:c));
    if (onConfigUpdate) onConfigUpdate();
  };

  const openAdd = () => { setModalEnigma(null); setModalMode("add"); };
  const openView = (e) => { setModalEnigma(e); setModalMode("view"); };
  const openEdit = (e) => { setModalEnigma(e); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setModalEnigma(null); };

  const handleSort = (col) => {
    if (sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({col}) => sortCol!==col
    ? <span style={{opacity:.3,marginLeft:4}}>↕</span>
    : <span style={{color:COLORS.primary,marginLeft:4}}>{sortDir==="asc"?"↑":"↓"}</span>;

  const filteredEnigmi = () => {
    let list=[...enigmi];
    if (filterCat!=="Tutte") list=list.filter(e=>e.categoria===filterCat);
    if (search) list=list.filter(e=>e.testo.toLowerCase().includes(search.toLowerCase())||e.soluzione.toLowerCase().includes(search.toLowerCase()));
    list.sort((a,b)=>{
      let va=a[sortCol],vb=b[sortCol];
      if (sortCol==="solutori"){va=stats[a.id]||0;vb=stats[b.id]||0;}
      if (va<vb) return sortDir==="asc"?-1:1;
      if (va>vb) return sortDir==="asc"?1:-1;
      return 0;
    });
    return list;
  };

  const an = (()=>{
    const totalUtenti=profiles.length, newsletter=profiles.filter(p=>p.newsletter).length;
    const totalTentativi=tentativi.length, totalRisolti=tentativi.filter(t=>t.corretto).length;
    const tassoRisoluzione=totalTentativi?Math.round(totalRisolti/totalTentativi*100):0;
    const totalSolved=Object.values(stats).reduce((a,b)=>a+b,0);
    const perCategoria={};
    enigmi.forEach(e=>{
      if (!perCategoria[e.categoria]) perCategoria[e.categoria]={enigmi:0,risolti:0};
      perCategoria[e.categoria].enigmi++;
      perCategoria[e.categoria].risolti+=(stats[e.id]||0);
    });
    const perDiff={1:0,2:0,3:0};
    enigmi.forEach(e=>{perDiff[e.difficolta]=(perDiff[e.difficolta]||0)+1;});
    const topEnigmi=[...enigmi].sort((a,b)=>(stats[b.id]||0)-(stats[a.id]||0)).slice(0,5);
    return {totalUtenti,newsletter,totalTentativi,totalRisolti,tassoRisoluzione,totalSolved,perCategoria,perDiff,topEnigmi};
  })();

  const tab=(t,label)=>(
    <button key={t} onClick={()=>setView(t)} style={{padding:"10px 20px",borderRadius:50,fontWeight:800,cursor:"pointer",fontSize:14,border:"none",background:view===t?COLORS.primary:COLORS.cardLight,color:view===t?"#fff":COLORS.muted,fontFamily:"'Nunito',sans-serif",transition:"all .2s"}}>{label}</button>
  );

  const thStyle=(col)=>({padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:sortCol===col?COLORS.primary:COLORS.muted,letterSpacing:1,cursor:col?"pointer":"default",whiteSpace:"nowrap",userSelect:"none",borderBottom:`2px solid ${COLORS.cardLight}`});
  const tdStyle={padding:"12px 14px",fontSize:13,borderBottom:`1px solid ${COLORS.cardLight}22`,verticalAlign:"middle"};

  if (loading) return (<div style={{textAlign:"center",padding:80,color:COLORS.muted}}><div style={{fontSize:48,marginBottom:12}}>⏳</div>Caricamento...</div>);

  return (
    <div className="fade-in">
      <h1 style={{fontFamily:"'Fredoka One'",fontSize:36,color:COLORS.accent,marginBottom:4}}>⚙️ Pannello Admin</h1>
      <p style={{color:COLORS.muted,marginBottom:24}}>Gestisci enigmi, iscritti, analytics e impostazioni</p>

      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[{label:"Iscritti",value:profiles.length,color:COLORS.secondary,icon:"👥"},{label:"Enigmi",value:enigmi.length,color:COLORS.primary,icon:"🧩"},{label:"Newsletter",value:an.newsletter,color:COLORS.accent,icon:"📧"},{label:"Risolti",value:an.totalSolved,color:COLORS.success,icon:"✅"}].map(s=>(
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
        {tab("analytics","📊 Analytics")}
        {tab("impostazioni","⚙️ Impostazioni")}
      </div>

      {/* ENIGMI */}
      {view==="enigmi" && (
        <div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            <input className="input" style={{maxWidth:240}} placeholder="🔍 Cerca..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="input" style={{width:"auto"}} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option>Tutte</option>
              {CATEGORIE.map(c=><option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" style={{marginLeft:"auto"}} onClick={openAdd}>+ Aggiungi enigma</button>
          </div>
          <div style={{background:COLORS.card,borderRadius:20,overflow:"hidden",border:`1px solid ${COLORS.cardLight}`}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead style={{background:COLORS.cardLight}}>
                  <tr>
                    <th style={thStyle("data_pub")} onClick={()=>handleSort("data_pub")}>DATA<SortIcon col="data_pub"/></th>
                    <th style={thStyle("categoria")} onClick={()=>handleSort("categoria")}>CATEGORIA<SortIcon col="categoria"/></th>
                    <th style={thStyle("difficolta")} onClick={()=>handleSort("difficolta")}>DIFFICOLTÀ<SortIcon col="difficolta"/></th>
                    <th style={{...thStyle("testo"),minWidth:220}}>TESTO</th>
                    <th style={{...thStyle("solutori"),textAlign:"center"}} onClick={()=>handleSort("solutori")}>RISOLTI<SortIcon col="solutori"/></th>
                    <th style={{...thStyle(""),textAlign:"center"}}>MEDIA</th>
                    <th style={thStyle("")}>AZIONI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnigmi().map((e,i)=>{
                    const isToday=e.data_pub===getTodayStr();
                    const catColor=CAT_COLORS[e.categoria]||COLORS.primary;
                    return (
                      <tr key={e.id} style={{background:isToday?COLORS.primary+"11":i%2===0?"transparent":COLORS.cardLight+"44"}}>
                        <td style={tdStyle}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            {isToday&&<span style={{fontSize:10,background:COLORS.primary,color:"#fff",padding:"2px 6px",borderRadius:50,fontWeight:700}}>OGGI</span>}
                            <span style={{color:COLORS.muted,fontSize:12}}>{e.data_pub}</span>
                          </div>
                        </td>
                        <td style={tdStyle}><span className="tag" style={{background:catColor+"33",color:catColor,fontSize:11,padding:"3px 10px"}}>{e.categoria}</span></td>
                        <td style={tdStyle}><DiffBadge level={e.difficolta}/></td>
                        <td style={tdStyle}><span style={{color:COLORS.text,cursor:"pointer",textDecoration:"underline",textDecorationColor:COLORS.primary+"66"}} onClick={()=>openView(e)}>{e.testo.substring(0,60)}{e.testo.length>60?"...":""}</span></td>
                        <td style={{...tdStyle,textAlign:"center"}}><span style={{fontFamily:"'Fredoka One'",fontSize:18,color:COLORS.success}}>{stats[e.id]||0}</span></td>
                        <td style={{...tdStyle,textAlign:"center"}}>{e.media_url?<span>{e.media_tipo==="video"?"🎥":"🖼️"}</span>:<span style={{color:COLORS.muted+"44"}}>—</span>}</td>
                        <td style={tdStyle}>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>openView(e)} style={{background:COLORS.cardLight,border:"none",color:COLORS.text,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>👁️</button>
                            <button onClick={()=>openEdit(e)} style={{background:COLORS.secondary+"33",border:"none",color:COLORS.secondary,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>✏️</button>
                            <button onClick={()=>deleteEnigma(e.id)} style={{background:COLORS.error+"22",border:"none",color:COLORS.error,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredEnigmi().length===0&&<div style={{textAlign:"center",padding:40,color:COLORS.muted}}>Nessun enigma trovato</div>}
            </div>
            <div style={{padding:"12px 16px",borderTop:`1px solid ${COLORS.cardLight}`,fontSize:12,color:COLORS.muted}}>{filteredEnigmi().length} enigmi</div>
          </div>
        </div>
      )}

      {/* ISCRITTI */}
      {view==="iscritti" && (
        <IscrittiTab
          profiles={profiles}
          tentativi={tentativi}
          enigmi={enigmi}
          onReload={loadAll}
          showToast={showToast}
          thStyle={thStyle}
          tdStyle={tdStyle}
        />
      )}

      {/* NEWSLETTER */}
      {view==="newsletter" && (
        <div>
          <h2 style={{fontFamily:"'Fredoka One'",fontSize:24,marginBottom:4}}>Newsletter</h2>
          <p style={{color:COLORS.muted,marginBottom:16,fontSize:14}}>{profiles.filter(p=>p.newsletter).length} utenti iscritti</p>
          <div style={{background:COLORS.card,borderRadius:20,overflow:"hidden"}}>
            {profiles.filter(p=>p.newsletter).length===0 ? (
              <div style={{textAlign:"center",padding:40}}><div style={{fontSize:48}}>📭</div><p style={{color:COLORS.muted,marginTop:12}}>Nessun utente iscritto</p></div>
            ) : (
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead style={{background:COLORS.cardLight}}>
                  <tr><th style={thStyle("")}>NOME</th><th style={thStyle("")}>EMAIL</th><th style={thStyle("")}>STATO</th></tr>
                </thead>
                <tbody>
                  {profiles.filter(p=>p.newsletter).map((u,i)=>(
                    <tr key={u.id} style={{background:i%2===0?"transparent":COLORS.cardLight+"44"}}>
                      <td style={{...tdStyle,fontWeight:700}}>{u.nome}</td>
                      <td style={{...tdStyle,color:COLORS.muted}}>{u.email}</td>
                      <td style={tdStyle}><span style={{background:COLORS.success+"33",color:COLORS.success,padding:"3px 12px",borderRadius:50,fontSize:12,fontWeight:700}}>✅ Attiva</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {view==="analytics" && (
        <div>
          <h2 style={{fontFamily:"'Fredoka One'",fontSize:24,marginBottom:20}}>📊 Analytics</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
            {[
              {label:"Tasso risoluzione",value:an.tassoRisoluzione+"%",sub:`${an.totalRisolti} su ${an.totalTentativi} tentativi`,color:COLORS.success},
              {label:"Iscritti newsletter",value:Math.round(an.newsletter/Math.max(an.totalUtenti,1)*100)+"%",sub:`${an.newsletter} su ${an.totalUtenti} utenti`,color:COLORS.accent},
              {label:"Media risolti/enigma",value:enigmi.length?(an.totalSolved/enigmi.length).toFixed(1):"0",sub:"solutori per enigma",color:COLORS.secondary},
            ].map(k=>(
              <div key={k.label} className="card" style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Fredoka One'",fontSize:38,color:k.color}}>{k.value}</div>
                <div style={{fontWeight:700,fontSize:14,marginTop:4}}>{k.label}</div>
                <div style={{fontSize:12,color:COLORS.muted,marginTop:4}}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div className="card">
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:20,marginBottom:16}}>Per categoria</h3>
              {Object.entries(an.perCategoria).map(([cat,val])=><Bar key={cat} label={cat} value={val.enigmi} max={enigmi.length} color={CAT_COLORS[cat]||COLORS.primary}/>)}
            </div>
            <div className="card">
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:20,marginBottom:16}}>Per difficoltà</h3>
              <Bar label="🧩 Facile" value={an.perDiff[1]||0} max={enigmi.length} color={COLORS.success}/>
              <Bar label="🧩🧩 Medio" value={an.perDiff[2]||0} max={enigmi.length} color={COLORS.accent}/>
              <Bar label="🧩🧩🧩 Difficile" value={an.perDiff[3]||0} max={enigmi.length} color={COLORS.error}/>
            </div>
            <div className="card" style={{gridColumn:"1/-1"}}>
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:20,marginBottom:16}}>🏆 Top 5 più risolti</h3>
              {an.topEnigmi.length===0?<p style={{color:COLORS.muted}}>Nessun dato ancora</p>:an.topEnigmi.map((e,i)=>(
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:16,padding:"10px 0",borderBottom:`1px solid ${COLORS.cardLight}`}}>
                  <div style={{fontFamily:"'Fredoka One'",fontSize:24,color:COLORS.accent,width:32,textAlign:"center"}}>#{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14}}>{e.testo.substring(0,70)}...</div>
                    <div style={{fontSize:12,color:COLORS.muted,marginTop:2}}>{e.data_pub} · {e.categoria}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Fredoka One'",fontSize:22,color:COLORS.success}}>{stats[e.id]||0}</div>
                    <div style={{fontSize:11,color:COLORS.muted}}>risolti</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* IMPOSTAZIONI */}
      {view==="impostazioni" && (
        <div>
          <h2 style={{fontFamily:"'Fredoka One'",fontSize:24,marginBottom:4}}>⚙️ Impostazioni</h2>
          <p style={{color:COLORS.muted,marginBottom:28,fontSize:14}}>Configura i tempi per difficoltà e le istruzioni per categoria</p>

          {/* Tempi */}
          <div className="card" style={{marginBottom:24}}>
            <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:4}}>⏱ Tempo per difficoltà</h3>
            <p style={{color:COLORS.muted,fontSize:13,marginBottom:20}}>Secondi a disposizione per rispondere in base al livello dell'enigma</p>
            <div style={{display:"grid",gap:16}}>
              {diffConfig.map(d=>(
                <DiffTimerRow key={d.livello} config={d} onSave={saveDiffConfig}/>
              ))}
            </div>
          </div>

          {/* Istruzioni categorie */}
          <div className="card">
            <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:4}}>📖 Istruzioni per categoria</h3>
            <p style={{color:COLORS.muted,fontSize:13,marginBottom:20}}>Testo mostrato agli utenti quando cliccano "Come funziona questa categoria"</p>
            <div style={{display:"grid",gap:20}}>
              {CATEGORIE.map(cat=>{
                const cfg=catConfig.find(c=>c.categoria===cat);
                return <CatInstruzioniRow key={cat} categoria={cat} istruzioni={cfg?.istruzioni||""} onSave={saveCatConfig}/>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {modalMode && (
        <Modal onClose={closeModal}>
          {modalMode==="add" && <EnigmaForm onSave={addEnigma} onCancel={closeModal} showToast={showToast}/>}
          {modalMode==="edit" && <EnigmaForm initial={modalEnigma} onSave={updateEnigma} onCancel={closeModal} showToast={showToast}/>}
          {modalMode==="view" && modalEnigma && (
            <div>
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                <span className="tag" style={{background:CAT_COLORS[modalEnigma.categoria]||COLORS.primary,color:"#000"}}>{modalEnigma.categoria}</span>
                <DiffBadge level={modalEnigma.difficolta}/>
                <span style={{color:COLORS.muted,fontSize:13}}>{modalEnigma.data_pub}</span>
                <span style={{color:COLORS.success,fontSize:13,fontWeight:700}}>👥 {stats[modalEnigma.id]||0} risolti</span>
              </div>
              {modalEnigma.media_url && (
                <div style={{marginBottom:20}}>
                  {modalEnigma.media_tipo==="video"
                    ?<video src={modalEnigma.media_url} controls style={{width:"100%",borderRadius:16,maxHeight:280}}/>
                    :<img src={modalEnigma.media_url} alt="media" style={{width:"100%",borderRadius:16,maxHeight:280,objectFit:"contain"}}/>
                  }
                </div>
              )}
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:12,lineHeight:1.4}}>{modalEnigma.testo}</h3>
              {modalEnigma.descrizione && <p style={{color:COLORS.muted,fontSize:14,marginBottom:16,lineHeight:1.6,background:COLORS.cardLight,padding:"12px 16px",borderRadius:12}}>{modalEnigma.descrizione}</p>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                <div style={{background:COLORS.cardLight,padding:"12px 16px",borderRadius:12}}>
                  <div style={{fontSize:11,color:COLORS.muted,fontWeight:700,marginBottom:4}}>SOLUZIONE</div>
                  <div style={{fontSize:18,fontWeight:800,color:COLORS.accent}}>{modalEnigma.soluzione}</div>
                </div>
                <div style={{background:COLORS.cardLight,padding:"12px 16px",borderRadius:12}}>
                  <div style={{fontSize:11,color:COLORS.muted,fontWeight:700,marginBottom:4}}>FONTE</div>
                  <div style={{fontWeight:600}}>{modalEnigma.fonte||"—"}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(modalEnigma)}>✏️ Modifica</button>
                <button className="btn btn-sm" style={{background:COLORS.error,color:"#fff"}} onClick={()=>deleteEnigma(modalEnigma.id)}>🗑️ Elimina</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function DiffTimerRow({ config, onSave }) {
  const colors = ["", "#22C55E", "#FFE66D", "#EF4444"];
  const [val, setVal] = useState(config.secondi);
  const [dirty, setDirty] = useState(false);
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px",background:"#16213E",borderRadius:14}}>
      <div style={{minWidth:140}}>
        <span style={{fontSize:20}}>{["","🧩","🧩🧩","🧩🧩🧩"][config.livello]}</span>
        <span style={{fontWeight:700,marginLeft:8,color:colors[config.livello]}}>{["","Facile","Medio","Difficile"][config.livello]}</span>
      </div>
      <input
        type="number" min={10} max={3600}
        value={val}
        onChange={e=>{setVal(+e.target.value);setDirty(true);}}
        style={{background:"#0F0F1A",border:`2px solid ${dirty?colors[config.livello]:"#8888AA33"}`,borderRadius:10,padding:"8px 14px",color:"#F0F0F0",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:16,width:100,outline:"none"}}
      />
      <span style={{color:"#8888AA",fontSize:13}}>secondi ({Math.floor(val/60)}m {val%60}s)</span>
      {dirty && <button className="btn btn-primary btn-sm" onClick={()=>{onSave(config.livello,val);setDirty(false);}}>💾 Salva</button>}
    </div>
  );
}

function CatInstruzioniRow({ categoria, istruzioni: initialVal, onSave }) {
  const catColor = CAT_COLORS[categoria] || "#FF6B35";
  const [val, setVal] = useState(initialVal);
  const [dirty, setDirty] = useState(false);
  return (
    <div style={{borderLeft:`3px solid ${catColor}`,paddingLeft:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <span className="tag" style={{background:catColor,color:"#000",fontSize:13}}>{categoria}</span>
      </div>
      <textarea
        className="input"
        rows={3}
        placeholder={`Spiega come funziona la categoria "${categoria}"...`}
        value={val}
        onChange={e=>{setVal(e.target.value);setDirty(true);}}
        style={{resize:"vertical",marginBottom:8}}
      />
      {dirty && (
        <button className="btn btn-primary btn-sm" onClick={()=>{onSave(categoria,val);setDirty(false);}}>💾 Salva istruzioni</button>
      )}
    </div>
  );
}
// ── IscrittiTab ───────────────────────────────────────────────────────────────
function IscrittiTab({ profiles, tentativi, enigmi, onReload, showToast, thStyle, tdStyle }) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedUser, setSelectedUser] = useState(null); // scheda utente
  const [editUser, setEditUser] = useState(null); // utente in modifica
  const [editForm, setEditForm] = useState({});

  const handleSort = (col) => {
    if (sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const SortIcon = ({col}) => sortCol!==col
    ? <span style={{opacity:.3,marginLeft:4}}>↕</span>
    : <span style={{color:COLORS.primary,marginLeft:4}}>{sortDir==="asc"?"↑":"↓"}</span>;

  const filtered = () => {
    let list = [...profiles];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.nome||"").toLowerCase().includes(q) ||
        (u.cognome||"").toLowerCase().includes(q) ||
        (u.email||"").toLowerCase().includes(q) ||
        (u.citta||"").toLowerCase().includes(q) ||
        (u.soprannome||"").toLowerCase().includes(q)
      );
    }
    list.sort((a,b) => {
      let va = a[sortCol]||"", vb = b[sortCol]||"";
      if (sortCol==="risolti") { va=tentativi.filter(t=>t.user_id===a.id&&t.corretto).length; vb=tentativi.filter(t=>t.user_id===b.id&&t.corretto).length; }
      if (sortCol==="streak") { va=a.streak||0; vb=b.streak||0; }
      if (va<vb) return sortDir==="asc"?-1:1;
      if (va>vb) return sortDir==="asc"?1:-1;
      return 0;
    });
    return list;
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Eliminare l'utente ${u.nome} ${u.cognome}? Questa azione è irreversibile.`)) return;
    const { error } = await supabase.from("profiles").delete().eq("id", u.id);
    if (error) return showToast(error.message, "error");
    showToast("Utente eliminato", "info");
    setSelectedUser(null);
    onReload();
  };

  const saveEdit = async () => {
    const { error } = await supabase.from("profiles").update(editForm).eq("id", editUser.id);
    if (error) return showToast(error.message, "error");
    showToast("Utente aggiornato ✅", "success");
    setEditUser(null);
    onReload();
  };

  const list = filtered();

  return (
    <div>
      {/* Toolbar */}
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        <h2 style={{fontFamily:"'Fredoka One'",fontSize:24,marginRight:"auto"}}>Iscritti ({profiles.length})</h2>
        <input className="input" style={{maxWidth:260}} placeholder="🔍 Cerca per nome, email, città..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {list.length===0 ? (
        <div className="card" style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:48}}>👤</div>
          <p style={{color:COLORS.muted,marginTop:12}}>{search?"Nessun risultato":"Nessun iscritto"}</p>
        </div>
      ) : (
        <div style={{background:COLORS.card,borderRadius:20,overflow:"hidden",border:`1px solid ${COLORS.cardLight}`}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead style={{background:COLORS.cardLight}}>
                <tr>
                  <th style={thStyle("nome")} onClick={()=>handleSort("nome")}>NOME <SortIcon col="nome"/></th>
                  <th style={thStyle("cognome")} onClick={()=>handleSort("cognome")}>COGNOME <SortIcon col="cognome"/></th>
                  <th style={thStyle("email")} onClick={()=>handleSort("email")}>EMAIL <SortIcon col="email"/></th>
                  <th style={thStyle("citta")} onClick={()=>handleSort("citta")}>CITTÀ <SortIcon col="citta"/></th>
                  <th style={thStyle("data_nascita")} onClick={()=>handleSort("data_nascita")}>NASCITA <SortIcon col="data_nascita"/></th>
                  <th style={{...thStyle("streak"),textAlign:"center"}} onClick={()=>handleSort("streak")}>STREAK <SortIcon col="streak"/></th>
                  <th style={{...thStyle("risolti"),textAlign:"center"}} onClick={()=>handleSort("risolti")}>RISOLTI <SortIcon col="risolti"/></th>
                  <th style={{...thStyle(""),textAlign:"center"}}>NL</th>
                  <th style={thStyle("created_at")} onClick={()=>handleSort("created_at")}>ISCRITTO <SortIcon col="created_at"/></th>
                  <th style={thStyle("")}>AZIONI</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u,i)=>{
                  const ut = tentativi.filter(t=>t.user_id===u.id);
                  const risolti = ut.filter(t=>t.corretto).length;
                  const isAdmin = u.ruolo==="admin";
                  return (
                    <tr key={u.id} style={{background:isAdmin?COLORS.accent+"11":i%2===0?"transparent":COLORS.cardLight+"44",cursor:"pointer"}}
                      onClick={()=>setSelectedUser(u)}>
                      <td style={{...tdStyle,fontWeight:700}}>
                        {u.nome}
                        {isAdmin&&<span style={{fontSize:10,background:COLORS.accent,color:"#000",padding:"1px 6px",borderRadius:50,marginLeft:6,fontWeight:700}}>ADMIN</span>}
                      </td>
                      <td style={tdStyle}>{u.cognome||"—"}</td>
                      <td style={{...tdStyle,color:COLORS.muted,fontSize:12}}>{u.email}</td>
                      <td style={{...tdStyle,color:COLORS.muted,fontSize:12}}>{u.citta||"—"}</td>
                      <td style={{...tdStyle,color:COLORS.muted,fontSize:12}}>{u.data_nascita?new Date(u.data_nascita).toLocaleDateString("it-IT"):"—"}</td>
                      <td style={{...tdStyle,textAlign:"center"}}><span style={{color:"#F59E0B",fontWeight:700}}>{u.streak>0?`🔥${u.streak}`:"—"}</span></td>
                      <td style={{...tdStyle,textAlign:"center"}}><span style={{fontFamily:"'Fredoka One'",fontSize:18,color:COLORS.success}}>{risolti}</span></td>
                      <td style={{...tdStyle,textAlign:"center"}}>{u.newsletter?<span style={{color:COLORS.success}}>✅</span>:<span style={{color:COLORS.muted}}>—</span>}</td>
                      <td style={{...tdStyle,color:COLORS.muted,fontSize:12}}>{new Date(u.created_at).toLocaleDateString("it-IT")}</td>
                      <td style={tdStyle} onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>{setEditUser(u);setEditForm({nome:u.nome,cognome:u.cognome,citta:u.citta||"",soprannome:u.soprannome||"",ruolo:u.ruolo||"utente",newsletter:u.newsletter||false});}}
                            style={{background:COLORS.secondary+"33",border:"none",color:COLORS.secondary,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>✏️</button>
                          {!isAdmin&&<button onClick={()=>deleteUser(u)}
                            style={{background:COLORS.error+"22",border:"none",color:COLORS.error,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:"10px 16px",borderTop:`1px solid ${COLORS.cardLight}`,fontSize:12,color:COLORS.muted}}>
            {list.length} utenti {search?`(filtro: "${search}")`:""}
          </div>
        </div>
      )}

      {/* Scheda utente */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          tentativi={tentativi.filter(t=>t.user_id===selectedUser.id)}
          enigmi={enigmi}
          onClose={()=>setSelectedUser(null)}
          onEdit={()=>{setEditUser(selectedUser);setEditForm({nome:selectedUser.nome,cognome:selectedUser.cognome,citta:selectedUser.citta||"",soprannome:selectedUser.soprannome||"",ruolo:selectedUser.ruolo||"utente",newsletter:selectedUser.newsletter||false});setSelectedUser(null);}}
          onDelete={()=>deleteUser(selectedUser)}
        />
      )}

      {/* Modal modifica */}
      {editUser && (
        <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",padding:20}}
          onClick={e=>{if(e.target===e.currentTarget)setEditUser(null);}}>
          <div style={{background:COLORS.card,borderRadius:24,padding:32,maxWidth:480,width:"100%",border:`1px solid ${COLORS.primary}33`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,color:COLORS.primary}}>✏️ Modifica utente</h3>
              <button onClick={()=>setEditUser(null)} style={{background:COLORS.cardLight,border:"none",color:COLORS.text,width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{display:"grid",gap:12}}>
              {[
                {label:"NOME",key:"nome",placeholder:"Mario"},
                {label:"COGNOME",key:"cognome",placeholder:"Rossi"},
                {label:"SOPRANNOME",key:"soprannome",placeholder:"EnigmaMaster"},
                {label:"CITTÀ",key:"citta",placeholder:"Roma"},
              ].map(f=>(
                <div key={f.key}>
                  <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:4}}>{f.label}</label>
                  <input className="input" value={editForm[f.key]||""} onChange={e=>setEditForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}/>
                </div>
              ))}
              <div>
                <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:4}}>RUOLO</label>
                <select className="input" value={editForm.ruolo||"utente"} onChange={e=>setEditForm(p=>({...p,ruolo:e.target.value}))}>
                  <option value="utente">Utente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:COLORS.cardLight,borderRadius:12}}>
                <span style={{fontWeight:700,fontSize:14}}>Newsletter attiva</span>
                <div onClick={()=>setEditForm(p=>({...p,newsletter:!p.newsletter}))}
                  style={{width:48,height:26,borderRadius:13,background:editForm.newsletter?COLORS.success:COLORS.muted,position:"relative",cursor:"pointer",transition:"background .2s"}}>
                  <div style={{position:"absolute",top:3,left:editForm.newsletter?24:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={saveEdit}>💾 Salva</button>
              <button className="btn btn-ghost" style={{flex:1,justifyContent:"center"}} onClick={()=>setEditUser(null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── UserModal ─────────────────────────────────────────────────────────────────
function UserModal({ user, tentativi, enigmi, onClose, onEdit, onDelete }) {
  const risolti = tentativi.filter(t=>t.corretto);
  const rate = tentativi.length ? Math.round(risolti.length/tentativi.length*100) : 0;
  const isAdmin = user.ruolo==="admin";

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:COLORS.card,borderRadius:24,width:"100%",maxWidth:600,maxHeight:"90vh",overflowY:"auto",border:`1px solid ${COLORS.primary}33`,boxShadow:"0 24px 80px rgba(0,0,0,.6)"}}>
        <div style={{padding:"28px 28px 32px"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <h3 style={{fontFamily:"'Fredoka One'",fontSize:26,color:COLORS.primary}}>{user.nome} {user.cognome}</h3>
                {isAdmin&&<span style={{fontSize:11,background:COLORS.accent,color:"#000",padding:"2px 8px",borderRadius:50,fontWeight:700}}>ADMIN</span>}
              </div>
              {user.soprannome&&<p style={{color:COLORS.muted,fontSize:13}}>"{user.soprannome}"</p>}
            </div>
            <button onClick={onClose} style={{background:COLORS.cardLight,border:"none",color:COLORS.text,width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:18}}>✕</button>
          </div>

          {/* Info anagrafiche */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            {[
              {label:"Email",value:user.email},
              {label:"Città",value:user.citta||"—"},
              {label:"Data nascita",value:user.data_nascita?new Date(user.data_nascita).toLocaleDateString("it-IT"):"—"},
              {label:"Iscritto il",value:new Date(user.created_at).toLocaleDateString("it-IT")},
              {label:"Newsletter",value:user.newsletter?"✅ Attiva":"—"},
              {label:"Streak",value:user.streak>0?`🔥 ${user.streak} giorni`:"—"},
            ].map(f=>(
              <div key={f.label} style={{background:COLORS.cardLight,padding:"10px 14px",borderRadius:12}}>
                <div style={{fontSize:11,color:COLORS.muted,fontWeight:700,marginBottom:2}}>{f.label.toUpperCase()}</div>
                <div style={{fontWeight:600,fontSize:14}}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Preferenze */}
          {(user.preferenze||[]).length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,marginBottom:8}}>PREFERENZE</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {user.preferenze.map(p=><span key={p} style={{background:CAT_COLORS[p]+"33",color:CAT_COLORS[p]||COLORS.primary,padding:"3px 10px",borderRadius:50,fontSize:12,fontWeight:700}}>{p}</span>)}
              </div>
            </div>
          )}

          {/* Statistiche */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            {[
              {label:"Risolti",value:risolti.length,color:COLORS.success},
              {label:"Tentati",value:tentativi.length,color:COLORS.secondary},
              {label:"Tasso",value:tentativi.length?rate+"%":"—",color:COLORS.accent},
            ].map(s=>(
              <div key={s.label} style={{background:COLORS.cardLight,padding:"12px",borderRadius:12,textAlign:"center"}}>
                <div style={{fontFamily:"'Fredoka One'",fontSize:26,color:s.color}}>{s.value}</div>
                <div style={{fontSize:11,color:COLORS.muted,fontWeight:700}}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Ultimi tentativi */}
          {tentativi.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,marginBottom:8}}>ULTIMI TENTATIVI</div>
              {tentativi.slice(0,5).map(t=>{
                const enigma = enigmi.find(e=>e.id===t.enigma_id);
                return (
                  <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${COLORS.cardLight}`}}>
                    <div style={{fontSize:13,flex:1}}>{enigma?.testo?.substring(0,50)||t.enigma_id}...</div>
                    <span style={{background:t.corretto?"#22C55E33":"#EF444433",color:t.corretto?"#22C55E":"#EF4444",padding:"2px 8px",borderRadius:50,fontSize:11,fontWeight:700,marginLeft:10}}>
                      {t.corretto?"✅":"❌"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Azioni */}
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-secondary btn-sm" onClick={onEdit}>✏️ Modifica</button>
            {!isAdmin&&<button className="btn btn-sm" style={{background:COLORS.error,color:"#fff"}} onClick={onDelete}>🗑️ Elimina</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
