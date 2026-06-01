import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7", bg:"#0F0F1A", card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA", success:"#22C55E", error:"#EF4444" };
const CAT_COLORS = { Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7", Matematica:"#FFE66D", Quiz:"#EC4899" };
const DIFF_LABELS = ["","❓ Facile","❓❓ Medio","❓❓❓ Difficile"];

function normalize(str) {
  return str.toLowerCase().trim().replace(/[àáâ]/g,"a").replace(/[èéê]/g,"e").replace(/[ìíî]/g,"i").replace(/[òóô]/g,"o").replace(/[ùúû]/g,"u");
}
function timeUntilMidnight() {
  const now = new Date(), mid = new Date(now); mid.setHours(24,0,0,0);
  const d = mid - now, h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function HomePage({ enigma, session, profile, showToast, onLoginRequest }) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState("idle");
  const [showSolution, setShowSolution] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [countdown, setCountdown] = useState(timeUntilMidnight());
  const [solutori, setSolutori] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => { const t = setInterval(()=>setCountdown(timeUntilMidnight()),1000); return ()=>clearInterval(t); }, []);

  useEffect(() => {
    if (!enigma) return;
    loadSolutori();
    if (session) loadPrevAttempt();
    else { setState("idle"); setShowSolution(false); setAnswer(""); }
  }, [enigma?.id, session]);

  const loadSolutori = async () => {
    const { data } = await supabase.from("enigmi_stats").select("solutori").eq("id", enigma.id).single();
    setSolutori(data?.solutori || 0);
  };

  const loadPrevAttempt = async () => {
    const { data } = await supabase.from("tentativi").select("*").eq("enigma_id", enigma.id).eq("user_id", session.user.id).single();
    if (data) setState(data.corretto ? "correct" : "wrong");
  };

  const submit = async () => {
    if (!answer.trim() || !enigma || !session) return;
    const corretto = normalize(answer) === normalize(enigma.soluzione);
    await supabase.from("tentativi").upsert(
      { user_id: session.user.id, enigma_id: enigma.id, risposta: answer, corretto },
      { onConflict: "user_id,enigma_id" }
    );
    if (corretto) { setState("correct"); loadSolutori(); }
    else { setState("wrong"); setShaking(true); setTimeout(() => setShaking(false), 500); }
  };

  const share = () => {
    const text = `🧩 Enigma del Giorno su EnigmaDay!\n\n"${enigma.testo}"\n\nRiesci a risolverlo? 🤔\nhttps://enigmaday.netlify.app`;
    if (navigator.share) navigator.share({ title:"EnigmaDay", text });
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); showToast("Testo copiato! 📋","success"); }
  };

  if (!enigma) return (
    <div style={{textAlign:"center",padding:80}}>
      <div style={{fontSize:64}}>🔍</div>
      <h2 style={{fontFamily:"'Fredoka One'",fontSize:28,color:COLORS.muted,marginTop:16}}>Nessun enigma per oggi!</h2>
      <p style={{color:COLORS.muted,marginTop:8}}>L'admin non ha ancora pubblicato l'enigma di oggi.</p>
    </div>
  );

  const catColor = CAT_COLORS[enigma.categoria] || COLORS.primary;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontFamily:"'Fredoka One'",fontSize:18,color:COLORS.muted,marginBottom:4}}>
          {new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </div>
        <h1 style={{fontFamily:"'Fredoka One'",fontSize:42,background:`linear-gradient(135deg,${COLORS.primary},${COLORS.purple})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2}}>
          Enigma del Giorno 🧩
        </h1>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:12,flexWrap:"wrap"}}>
          <span className="tag" style={{background:catColor,color:"#000"}}>{enigma.categoria}</span>
          <span className="tag" style={{background:COLORS.cardLight,color:COLORS.text,border:`1px solid ${COLORS.muted}`}}>{DIFF_LABELS[enigma.difficolta]}</span>
          <span className="tag" style={{background:COLORS.cardLight,color:COLORS.secondary,border:`1px solid ${COLORS.secondary}`}}>
            👥 {solutori} {solutori===1?"persona":"persone"} {solutori===1?"l'ha":"l'hanno"} risolto
          </span>
        </div>
      </div>

      {/* Enigma Card */}
      <div className="card" style={{textAlign:"center",marginBottom:24,padding:"40px 32px",background:`linear-gradient(135deg,${COLORS.card},${COLORS.cardLight})`,border:`2px solid ${catColor}33`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:80,opacity:.06,transform:"rotate(15deg)"}}>🧩</div>

        {/* Media (foto o video) */}
        {enigma.media_url && (
          <div style={{marginBottom:24}}>
            {enigma.media_tipo === "video" ? (
              <video src={enigma.media_url} controls style={{maxWidth:"100%",maxHeight:320,borderRadius:16,boxShadow:"0 4px 20px rgba(0,0,0,.4)"}} />
            ) : (
              <img src={enigma.media_url} alt="enigma" style={{maxWidth:"100%",maxHeight:320,borderRadius:16,objectFit:"contain",boxShadow:"0 4px 20px rgba(0,0,0,.4)"}} />
            )}
          </div>
        )}

        <p style={{fontSize:22,lineHeight:1.7,fontWeight:700,color:COLORS.text,maxWidth:600,margin:"0 auto"}}>
          "{enigma.testo}"
        </p>
        {enigma.fonte && <div style={{marginTop:16,fontSize:12,color:COLORS.muted}}>fonte: {enigma.fonte}</div>}
      </div>

      {/* Interaction */}
      {state === "correct" ? (
        <div className="card fade-in" style={{textAlign:"center",background:`linear-gradient(135deg,${COLORS.success}22,${COLORS.card})`,border:`2px solid ${COLORS.success}`,marginBottom:24}}>
          <div style={{fontSize:56}}>🎊</div>
          <h3 style={{fontFamily:"'Fredoka One'",fontSize:30,color:COLORS.success,marginTop:8}}>Corretto! Bravissimo!</h3>
          <p style={{color:COLORS.muted,marginTop:8}}>La risposta era: <strong style={{color:COLORS.success}}>{enigma.soluzione}</strong></p>
        </div>
      ) : showSolution ? (
        <div className="card fade-in" style={{textAlign:"center",marginBottom:24,border:`2px solid ${COLORS.purple}`}}>
          <div style={{fontSize:48}}>💡</div>
          <h3 style={{fontFamily:"'Fredoka One'",fontSize:26,color:COLORS.purple,marginTop:8}}>La soluzione era...</h3>
          <p style={{fontSize:28,fontWeight:800,color:COLORS.accent,marginTop:12}}>{enigma.soluzione}</p>
        </div>
      ) : (
        <div className="card" style={{marginBottom:24}}>
          {!session ? (
            <div style={{textAlign:"center",padding:"16px 0"}}>
              <p style={{color:COLORS.muted,marginBottom:16,fontSize:16}}>🔒 Registrati per provare a risolvere l'enigma!</p>
              <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                <button className="btn btn-primary" onClick={onLoginRequest}>Accedi</button>
                <button className="btn btn-secondary" onClick={onLoginRequest}>Registrati</button>
              </div>
            </div>
          ) : (
            <>
              <label style={{fontWeight:700,color:COLORS.muted,fontSize:14,display:"block",marginBottom:8}}>LA TUA RISPOSTA</label>
              <div style={{display:"flex",gap:10}}>
                <input
                  className="input"
                  placeholder="Inserisci la tua risposta..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && submit()}
                  style={{animation: shaking ? "shake .3s ease" : "none"}}
                  disabled={state !== "idle"}
                />
                <button className="btn btn-primary" onClick={submit} disabled={state!=="idle"}>Verifica 🚀</button>
              </div>
              {state === "wrong" && !showSolution && (
                <div className="fade-in" style={{marginTop:16}}>
                  <p style={{color:COLORS.error,fontWeight:700,marginBottom:12}}>❌ Non è corretto!</p>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>{setState("idle");setAnswer("");}}>🔄 Riprova</button>
                    <button className="btn btn-purple btn-sm" onClick={()=>setShowSolution(true)}>👁️ Mostra soluzione</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:12,fontWeight:700,color:COLORS.muted,marginBottom:8,letterSpacing:1}}>PROSSIMO ENIGMA TRA</div>
          <div style={{fontFamily:"'Fredoka One'",fontSize:36,color:COLORS.accent,letterSpacing:4}}>{countdown}</div>
        </div>
        <div className="card" style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{fontSize:12,fontWeight:700,color:COLORS.muted,letterSpacing:1}}>CONDIVIDI CON UN AMICO</div>
          <button className="btn btn-secondary" onClick={share}>
            {copied ? "✅ Copiato!" : "📤 Condividi"}
          </button>
        </div>
      </div>
    </div>
  );
}
