import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7", card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA", success:"#22C55E", error:"#EF4444" };
const CAT_COLORS = { Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7", Matematica:"#FFE66D", Quiz:"#EC4899", "Indovina il film":"#38BDF8", Ghigliottina:"#F43F5E" };
const DEFAULT_AVATARS = ["🧩","🦊","🐼","🦁","🐸","🦄","🐯","🐧","🦋","🎭","🧠","⚡"];
const CATEGORIE = ["Indovinello","Logica","Rebus","Matematica","Quiz","Indovina il film","Ghigliottina"];

// ── Definiti FUORI dal componente per evitare re-render che fanno perdere il focus ──
function ReadOnlyField({ label, value, note, tabIndex }) {
  return (
    <div>
      <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>{label}</label>
      <div tabIndex={tabIndex} style={{background:COLORS.cardLight,borderRadius:12,padding:"12px 16px",color:COLORS.muted,fontSize:15,opacity:0.7}}>
        {value || "—"}
      </div>
      {note && <p style={{fontSize:11,color:COLORS.muted,marginTop:4}}>🔒 {note}</p>}
    </div>
  );
}

function EditField({ label, value, onChange, type="text", placeholder="", required=false, tabIndex }) {
  return (
    <div>
      <label style={{fontSize:11,fontWeight:700,color:COLORS.muted,letterSpacing:1,display:"block",marginBottom:6}}>
        {label}{required && <span style={{color:COLORS.error}}> *</span>}
      </label>
      <input
        className="input" type={type} value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        tabIndex={tabIndex}
      />
    </div>
  );
}

function AvatarCircle({ src, emoji, nome, size=80 }) {
  if (src) return <img src={src} alt="avatar" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`3px solid ${COLORS.primary}`}}/>;
  if (emoji && emoji.length <= 2) return (
    <div style={{width:size,height:size,borderRadius:"50%",background:COLORS.cardLight,border:`3px solid ${COLORS.primary}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.45}}>{emoji}</div>
  );
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:COLORS.primary,border:`3px solid ${COLORS.primary}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:800,color:"#fff"}}>
      {nome ? nome[0].toUpperCase() : "?"}
    </div>
  );
}

function CropModal({ imageSrc, onCrop, onCancel }) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({x:0,y:0});
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({x:0,y:0});
  const imgRef = useRef(null);
  const SIZE = 280;

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; draw(); };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => { draw(); }, [scale, offset]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,SIZE,SIZE);
    const img = imgRef.current;
    const ratio = Math.max(SIZE/img.width, SIZE/img.height) * scale;
    const w = img.width*ratio, h = img.height*ratio;
    const x = (SIZE-w)/2+offset.x, y = (SIZE-h)/2+offset.y;
    ctx.drawImage(img, x, y, w, h);
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath(); ctx.arc(SIZE/2,SIZE/2,SIZE/2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  };

  const handleMouseDown = (e) => { setDragging(true); setDragStart({x:e.clientX-offset.x,y:e.clientY-offset.y}); };
  const handleMouseMove = (e) => { if (!dragging) return; setOffset({x:e.clientX-dragStart.x,y:e.clientY-dragStart.y}); };
  const handleMouseUp = () => setDragging(false);
  const cropAndSave = () => { canvasRef.current.toBlob(blob=>onCrop(blob),"image/jpeg",0.9); };

  return (
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.85)",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onCancel();}}>
      <div style={{background:COLORS.card,borderRadius:24,padding:32,maxWidth:380,width:"100%",textAlign:"center"}}>
        <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,color:COLORS.primary,marginBottom:8}}>Ritaglia foto profilo</h3>
        <p style={{color:COLORS.muted,fontSize:13,marginBottom:20}}>Trascina per posizionare, usa lo slider per zoomare</p>
        <div style={{display:"inline-block",borderRadius:"50%",overflow:"hidden",cursor:"grab",border:`3px solid ${COLORS.primary}`}}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            style={{display:"block"}}
          />
        </div>
        <div style={{marginTop:16,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:COLORS.muted}}>🔍</span>
          <input type="range" min={0.5} max={3} step={0.05} value={scale} onChange={e=>setScale(+e.target.value)} style={{flex:1,accentColor:COLORS.primary}}/>
          <span style={{fontSize:12,color:COLORS.muted}}>🔎</span>
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={cropAndSave}>✅ Usa questa foto</button>
          <button className="btn btn-ghost" style={{flex:1,justifyContent:"center"}} onClick={onCancel}>Annulla</button>
        </div>
      </div>
    </div>
  );
}

// ── Stato iniziale dal profilo ─────────────────────────────────────────────────
function getInitialState(profile) {
  return {
    nome: profile?.nome || "",
    cognome: profile?.cognome || "",
    soprannome: profile?.soprannome || "",
    dataNascita: profile?.data_nascita || "",
    citta: profile?.citta || "",
    prefs: profile?.preferenze || [],
    newsletter: profile?.newsletter || false,
    consensoMarketing: profile?.consenso_marketing || false,
    avatarUrl: profile?.avatar_url || "",
    selectedEmoji: null,
  };
}

export default function ProfilePage({ profile, session, onUpdate, showToast }) {
  const isGoogleUser = session?.user?.app_metadata?.provider === "google";
  const googleAvatar = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;

  const [state, setState] = useState(() => getInitialState(profile));
  const [dirty, setDirty] = useState(false);
  const [tentativi, setTentativi] = useState([]);
  const [cropSrc, setCropSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState("stats");
  const fileRef = useRef(null);

  const set = useCallback((key, value) => {
    setState(prev => ({...prev, [key]: value}));
    setDirty(true);
  }, []);

  const displayAvatar = isGoogleUser ? googleAvatar : (state.avatarUrl || null);
  const displayEmoji = !displayAvatar ? (state.selectedEmoji || null) : null;

  useEffect(() => { loadTentativi(); }, []);

  const loadTentativi = async () => {
    const { data } = await supabase.from("tentativi").select("*, enigmi(testo,categoria)").eq("user_id", session.user.id).order("created_at",{ascending:false});
    setTentativi(data || []);
  };

  const changeTab = (newTab) => {
    if (dirty && tab !== "stats") {
      if (!window.confirm("Hai modifiche non salvate. Vuoi uscire senza salvare?")) return;
      setState(getInitialState(profile));
      setDirty(false);
    }
    setTab(newTab);
  };

  const handleCancel = () => {
    setState(getInitialState(profile));
    setDirty(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCrop = async (blob) => {
    setCropSrc(null); setUploading(true);
    const path = `${session.user.id}/avatar.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, blob, {upsert:true,contentType:"image/jpeg"});
    if (error) { showToast("Errore upload: "+error.message,"error"); setUploading(false); return; }
    const { data:{publicUrl} } = supabase.storage.from("avatars").getPublicUrl(path);
    set("avatarUrl", publicUrl+"?t="+Date.now());
    setUploading(false); showToast("Foto aggiornata ✅","success");
  };

  const saveProfile = async () => {
    if (!state.nome.trim()) return showToast("Il nome è obbligatorio","error");
    if (!state.cognome.trim()) return showToast("Il cognome è obbligatorio","error");
    await onUpdate({
      nome: state.nome.trim(),
      cognome: state.cognome.trim(),
      soprannome: state.soprannome.trim(),
      data_nascita: state.dataNascita || null,
      citta: state.citta.trim(),
      preferenze: state.prefs,
      newsletter: state.newsletter,
      consenso_marketing: state.consensoMarketing,
      avatar_url: isGoogleUser ? "" : state.avatarUrl,
      consenso_data: (state.newsletter || state.consensoMarketing) ? new Date().toISOString() : null,
    });
    setDirty(false);
  };

  const togglePref = (c) => {
    const newPrefs = state.prefs.includes(c) ? state.prefs.filter(x=>x!==c) : [...state.prefs, c];
    set("prefs", newPrefs);
  };

  const solved = tentativi.filter(t=>t.corretto);
  const rate = tentativi.length ? Math.round(solved.length/tentativi.length*100) : 0;

  const tabStyle = (t) => ({
    padding:"8px 18px", borderRadius:50, fontWeight:800, cursor:"pointer", fontSize:13, border:"none",
    background: tab===t ? COLORS.primary : COLORS.cardLight,
    color: tab===t ? "#fff" : COLORS.muted,
    fontFamily:"'Nunito',sans-serif", transition:"all .2s",
    position:"relative"
  });

  const SaveCancelBar = () => (
    <div style={{display:"flex",gap:10,marginTop:20}}>
      <button className="btn btn-primary" onClick={saveProfile}>💾 Salva modifiche</button>
      <button className="btn btn-ghost" onClick={handleCancel}>✕ Annulla</button>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card" style={{marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{position:"relative",cursor:isGoogleUser?"default":"pointer"}} onClick={()=>!isGoogleUser&&changeTab("avatar")}>
          <AvatarCircle src={displayAvatar} emoji={displayEmoji} nome={state.nome} size={80}/>
          {!isGoogleUser && (
            <div style={{position:"absolute",bottom:0,right:0,background:COLORS.primary,borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✏️</div>
          )}
        </div>
        <div>
          <h1 style={{fontFamily:"'Fredoka One'",fontSize:28,color:COLORS.primary}}>
            {state.soprannome || state.nome}{!state.soprannome && state.cognome ? " "+state.cognome : ""}
          </h1>
          {state.soprannome && <p style={{color:COLORS.muted,fontSize:13}}>{state.nome} {state.cognome}</p>}
          <p style={{color:COLORS.muted,fontSize:13}}>{session?.user?.email}</p>
          {profile?.streak > 0 && <p style={{color:"#F59E0B",fontWeight:700,marginTop:4}}>🔥 {profile.streak} giorni di fila</p>}
          {isGoogleUser && <span style={{fontSize:12,background:"#4285F422",color:"#4285F4",padding:"2px 10px",borderRadius:50,marginTop:4,display:"inline-block"}}>Google Account</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[
          ["stats","📊 Statistiche"],
          ["dati","👤 Dati personali"],
          ...(!isGoogleUser ? [["avatar","🖼️ Avatar"]] : []),
          ["preferenze","🎯 Preferenze"],
          ["privacy","🔒 Privacy"],
        ].map(([t,label])=>(
          <button key={t} style={tabStyle(t)} onClick={()=>changeTab(t)}>
            {label}
            {dirty && tab===t && <span style={{position:"absolute",top:2,right:6,width:6,height:6,borderRadius:"50%",background:COLORS.accent}}/>}
          </button>
        ))}
      </div>

      {/* STATISTICHE */}
      {tab==="stats" && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
            {[
              {label:"Risolti",value:solved.length,color:COLORS.success,icon:"✅"},
              {label:"Tentati",value:tentativi.length,color:COLORS.secondary,icon:"🎯"},
              {label:"Tasso",value:tentativi.length?rate+"%":"—",color:COLORS.accent,icon:"📊"},
            ].map(s=>(
              <div key={s.label} className="card" style={{textAlign:"center"}}>
                <div style={{fontSize:28}}>{s.icon}</div>
                <div style={{fontFamily:"'Fredoka One'",fontSize:34,color:s.color}}>{s.value}</div>
                <div style={{fontSize:12,color:COLORS.muted,fontWeight:700,letterSpacing:1}}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          {tentativi.length>0 && (
            <div className="card">
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:20,marginBottom:16}}>📜 Storico</h3>
              {tentativi.map(t=>(
                <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${COLORS.cardLight}`}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{t.enigmi?.testo?.substring(0,55)}...</div>
                    <div style={{fontSize:12,color:COLORS.muted,marginTop:2}}>"{t.risposta}"</div>
                  </div>
                  <span style={{background:t.corretto?"#22C55E33":"#EF444433",color:t.corretto?"#22C55E":"#EF4444",padding:"3px 10px",borderRadius:50,fontSize:12,fontWeight:700,flexShrink:0,marginLeft:12}}>
                    {t.corretto?"✅":"❌"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DATI PERSONALI */}
      {tab==="dati" && (
        <div className="fade-in">
          <div className="card" style={{marginBottom:16}}>
            <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:16}}>👤 Dati personali</h3>
            <div style={{display:"grid",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {isGoogleUser ? (
                  <>
                    <ReadOnlyField label="NOME" value={state.nome} note="Proviene dal tuo account Google"/>
                    <ReadOnlyField label="COGNOME" value={state.cognome} note="Proviene dal tuo account Google"/>
                  </>
                ) : (
                  <>
                    <EditField label="NOME" value={state.nome} onChange={v=>set("nome",v)} placeholder="Mario" required tabIndex={1}/>
                    <EditField label="COGNOME" value={state.cognome} onChange={v=>set("cognome",v)} placeholder="Rossi" required tabIndex={2}/>
                  </>
                )}
              </div>
              <EditField label="SOPRANNOME / ALIAS" value={state.soprannome} onChange={v=>set("soprannome",v)} placeholder="Es. EnigmaMaster" tabIndex={3}/>
              <ReadOnlyField label="EMAIL" value={session?.user?.email} note="L'email non può essere modificata"/>
              <EditField label="DATA DI NASCITA" value={state.dataNascita} onChange={v=>set("dataNascita",v)} type="date" tabIndex={4}/>
              <EditField label="CITTÀ" value={state.citta} onChange={v=>set("citta",v)} placeholder="Es. Roma" tabIndex={5}/>
            </div>
          </div>
          <SaveCancelBar/>
        </div>
      )}

      {/* AVATAR */}
      {tab==="avatar" && !isGoogleUser && (
        <div className="fade-in">
          <div className="card" style={{marginBottom:16}}>
            <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:16}}>🖼️ Foto profilo</h3>
            <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:24}}>
              <AvatarCircle src={displayAvatar} emoji={displayEmoji} nome={state.nome} size={100}/>
              <div>
                <button className="btn btn-primary btn-sm" onClick={()=>fileRef.current?.click()} disabled={uploading} tabIndex={1}>
                  {uploading?"⏳ Caricamento...":"📷 Carica una foto"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{display:"none"}}/>
                {state.avatarUrl && (
                  <button className="btn btn-ghost btn-sm" style={{marginLeft:8}} onClick={()=>set("avatarUrl","")} tabIndex={2}>🗑️ Rimuovi</button>
                )}
              </div>
            </div>
            <h4 style={{fontWeight:700,color:COLORS.muted,fontSize:13,letterSpacing:1,marginBottom:12}}>OPPURE SCEGLI UN AVATAR</h4>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {DEFAULT_AVATARS.map((emoji,i)=>(
                <div key={emoji} onClick={()=>{set("selectedEmoji",emoji);set("avatarUrl","");}}
                  tabIndex={3+i}
                  style={{width:52,height:52,borderRadius:"50%",background:state.selectedEmoji===emoji&&!state.avatarUrl?COLORS.primary+"33":COLORS.cardLight,border:`2px solid ${state.selectedEmoji===emoji&&!state.avatarUrl?COLORS.primary:"transparent"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,cursor:"pointer",transition:"all .15s"}}>
                  {emoji}
                </div>
              ))}
            </div>
          </div>
          <SaveCancelBar/>
        </div>
      )}

      {/* PREFERENZE */}
      {tab==="preferenze" && (
        <div className="fade-in">
          <div className="card" style={{marginBottom:16}}>
            <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:12}}>🎯 Categorie preferite</h3>
            <p style={{color:COLORS.muted,fontSize:13,marginBottom:16}}>Seleziona le categorie di enigmi che preferisci</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {CATEGORIE.map(c=>(
                <span key={c} onClick={()=>togglePref(c)} className="tag"
                  style={{background:state.prefs.includes(c)?CAT_COLORS[c]||COLORS.primary:COLORS.cardLight,color:state.prefs.includes(c)?"#000":COLORS.muted,border:`1px solid ${state.prefs.includes(c)?CAT_COLORS[c]||COLORS.primary:COLORS.muted}`,transition:"all .15s",fontSize:14,padding:"6px 14px"}}>
                  {c}
                </span>
              ))}
            </div>
          </div>
          <SaveCancelBar/>
        </div>
      )}

      {/* PRIVACY */}
      {tab==="privacy" && (
        <div className="fade-in">
          <div className="card" style={{marginBottom:16}}>
            <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:4}}>🔒 Privacy & Consensi</h3>
            <p style={{color:COLORS.muted,fontSize:13,marginBottom:24,lineHeight:1.6}}>
              In conformità al GDPR (Regolamento UE 2016/679), gestisci qui i tuoi consensi. Puoi modificarli o revocarli in qualsiasi momento.
            </p>
            {[
              {key:"newsletter",value:state.newsletter,setter:v=>set("newsletter",v),title:"📧 Newsletter giornaliera",desc:"Ricevi l'enigma del giorno ogni mattina via email."},
              {key:"marketing",value:state.consensoMarketing,setter:v=>set("consensoMarketing",v),title:"📣 Comunicazioni promozionali",desc:"Acconsento a ricevere comunicazioni su nuove funzionalità ed eventi speciali."},
            ].map(item=>(
              <div key={item.key} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"16px 0",borderBottom:`1px solid ${COLORS.cardLight}`}}>
                <div style={{flex:1,marginRight:16}}>
                  <div style={{fontWeight:700,marginBottom:4}}>{item.title}</div>
                  <div style={{color:COLORS.muted,fontSize:13,lineHeight:1.5}}>{item.desc}</div>
                </div>
                <div onClick={()=>item.setter(!item.value)}
                  style={{width:52,height:28,borderRadius:14,background:item.value?COLORS.success:COLORS.muted,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:item.value?26:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </div>
              </div>
            ))}
            <div style={{padding:"16px 0"}}>
              <div style={{fontWeight:700,marginBottom:8}}>ℹ️ I tuoi diritti GDPR</div>
              <div style={{color:COLORS.muted,fontSize:13,lineHeight:1.7}}>
                Hai diritto di accedere, rettificare e cancellare i tuoi dati. Hai diritto alla portabilità e di opporti al trattamento. Per esercitare questi diritti contattaci tramite il sito.
              </div>
              {profile?.consenso_data && (
                <div style={{marginTop:8,fontSize:12,color:COLORS.muted}}>
                  Ultimo aggiornamento: {new Date(profile.consenso_data).toLocaleDateString("it-IT")}
                </div>
              )}
            </div>
          </div>
          <SaveCancelBar/>
        </div>
      )}

      {cropSrc && <CropModal imageSrc={cropSrc} onCrop={handleCrop} onCancel={()=>setCropSrc(null)}/>}
    </div>
  );
}
