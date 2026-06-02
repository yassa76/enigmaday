import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7", bg:"#0F0F1A", card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA", success:"#22C55E", error:"#EF4444", warning:"#F59E0B" };
const CAT_COLORS = { Indovinello:"#FF6B35", Logica:"#4ECDC4", Rebus:"#A855F7", Matematica:"#FFE66D", Quiz:"#EC4899", "Indovina il film":"#38BDF8", Ghigliottina:"#F43F5E" };
const DIFF_LABELS = ["","🧩 Facile","🧩🧩 Medio","🧩🧩🧩 Difficile"];

function normalize(str) {
  return str.toLowerCase().trim().replace(/[àáâ]/g,"a").replace(/[èéê]/g,"e").replace(/[ìíî]/g,"i").replace(/[òóô]/g,"o").replace(/[ùúû]/g,"u");
}
function getYesterdayStr() { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().split("T")[0]; }
function getTodayStr() { return new Date().toISOString().split("T")[0]; }
function timeUntilMidnight() {
  const now=new Date(), mid=new Date(now); mid.setHours(24,0,0,0);
  const d=mid-now, h=Math.floor(d/3600000), m=Math.floor((d%3600000)/60000), s=Math.floor((d%60000)/1000);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function formatTime(s) {
  if (!s) return "—";
  if (s<60) return s+"s";
  return Math.floor(s/60)+"m "+s%60+"s";
}

function generateShareImage({ enigma, corretto, tempoUsato, streak }) {
  const canvas = document.createElement("canvas");
  canvas.width=800; canvas.height=480;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0,0,800,480);
  grad.addColorStop(0,"#0F0F1A"); grad.addColorStop(1,"#1A1A2E");
  ctx.fillStyle=grad; ctx.fillRect(0,0,800,480);
  ctx.strokeStyle="#FF6B35"; ctx.lineWidth=3;
  ctx.roundRect(6,6,788,468,20); ctx.stroke();
  ctx.font="bold 28px sans-serif"; ctx.fillStyle="#FF6B35";
  ctx.fillText("🧩 EnigmaDay", 40, 60);
  ctx.font="16px sans-serif"; ctx.fillStyle="#8888AA";
  ctx.fillText(new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"}), 40, 90);
  const catColor = CAT_COLORS[enigma.categoria]||"#FF6B35";
  ctx.fillStyle=catColor+"33"; ctx.roundRect(40,110,160,32,50); ctx.fill();
  ctx.fillStyle=catColor; ctx.font="bold 14px sans-serif"; ctx.fillText(enigma.categoria,60,131);
  ctx.fillStyle="#F0F0F0"; ctx.font="bold 22px sans-serif";
  const maxW=720, words=enigma.testo.split(" ");
  let line="", y=185;
  for (const word of words) {
    const test=line+word+" ";
    if (ctx.measureText(test).width>maxW&&line) { ctx.fillText(line.trim(),40,y); line=word+" "; y+=32; if(y>270){ctx.fillText("...",40,y);break;} } else line=test;
  }
  if(y<=270) ctx.fillText(line.trim(),40,y);
  ctx.fillStyle=corretto?"#22C55E":"#EF4444"; ctx.font="bold 32px sans-serif";
  ctx.fillText(corretto?"✅ Risolto!":"❌ Non risolto", 40, 320);
  ctx.font="18px sans-serif"; ctx.fillStyle="#8888AA";
  const stats=[];
  if(corretto&&tempoUsato) stats.push("⏱ "+formatTime(tempoUsato));
  if(streak>0) stats.push("🔥 Streak: "+streak);
  stats.push(DIFF_LABELS[enigma.difficolta]);
  ctx.fillText(stats.join("   ·   "),40,356);
  ctx.fillStyle="#FF6B35"; ctx.font="bold 18px sans-serif"; ctx.fillText("enigmaday.netlify.app",40,440);
  ctx.fillStyle="#8888AA"; ctx.font="16px sans-serif"; ctx.fillText("Riesci a battermi? →",340,440);
  return canvas.toDataURL("image/png");
}

function TimerBar({ secondsLeft, totalSeconds }) {
  const pct = totalSeconds ? (secondsLeft/totalSeconds)*100 : 100;
  const color = pct>50?COLORS.success:pct>25?COLORS.warning:COLORS.error;
  const m=Math.floor(secondsLeft/60), s=secondsLeft%60;
  return (
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:13,color:COLORS.muted,fontWeight:700}}>⏱ TEMPO RIMASTO</span>
        <span style={{fontSize:15,fontWeight:800,color,fontFamily:"'Fredoka One'"}}>{m>0?`${m}:${String(s).padStart(2,"0")}`:s+"s"}</span>
      </div>
      <div style={{background:COLORS.cardLight,borderRadius:50,height:10,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,background:color,height:10,borderRadius:50,transition:"width 1s linear, background .5s"}}/>
      </div>
    </div>
  );
}

function StreakBadge({ streak }) {
  if (!streak||streak===0) return null;
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#F59E0B22",border:"1px solid #F59E0B55",padding:"4px 14px",borderRadius:50}}>
      <span style={{fontSize:16}}>🔥</span>
      <span style={{fontWeight:800,color:"#F59E0B",fontSize:14}}>{streak} giorni di fila</span>
    </div>
  );
}

export default function HomePage({ enigma, yesterdayEnigma, session, profile, showToast, onLoginRequest, diffConfig, catConfig, onNav }) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState("idle");
  const [showSolution, setShowSolution] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [countdown, setCountdown] = useState(timeUntilMidnight());
  const [solutori, setSolutori] = useState(0);
  const [yesterdaySolutori, setYesterdaySolutori] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showInstruzioni, setShowInstruzioni] = useState(false);
  const [timerSecondi, setTimerSecondi] = useState(null);
  const [timerTotale, setTimerTotale] = useState(null);
  const [tempoUsato, setTempoUsato] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [shareImg, setShareImg] = useState(null);
  const [campione, setCampione] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => { const t=setInterval(()=>setCountdown(timeUntilMidnight()),1000); return ()=>clearInterval(t); }, []);

  useEffect(() => {
    if (enigma) { loadSolutori(enigma.id,setSolutori); loadCampione(); }
    if (yesterdayEnigma) loadSolutori(yesterdayEnigma.id,setYesterdaySolutori);
    if (session&&enigma) loadPrevAttempt();
    else { setState("idle"); setShowSolution(false); setAnswer(""); clearTimer(); }
  }, [enigma?.id, session]);

  const loadSolutori = async (id, setter) => {
    const { data } = await supabase.from("enigmi_stats").select("solutori").eq("id",id).maybeSingle();
    setter(data?.solutori||0);
  };

  const loadCampione = async () => {
    const { data } = await supabase.from("classifica_velocita_oggi").select("*").limit(1).maybeSingle();
    setCampione(data||null);
  };

  const loadPrevAttempt = async () => {
    const { data } = await supabase.from("tentativi").select("*").eq("enigma_id",enigma.id).eq("user_id",session.user.id).maybeSingle();
    if (data) { setState(data.corretto?"correct":"wrong"); if(data.tempo_usato) setTempoUsato(data.tempo_usato); }
  };

  const clearTimer = () => { if(timerRef.current) clearInterval(timerRef.current); };

  const startTimer = () => {
    const cfg = diffConfig?.find(d=>d.livello===enigma.difficolta);
    const secs = cfg?.secondi||180;
    setTimerTotale(secs); setTimerSecondi(secs); setStartTime(Date.now()); setState("started");
    timerRef.current = setInterval(() => {
      setTimerSecondi(prev => {
        if (prev<=1) { clearInterval(timerRef.current); setState("timeout"); return 0; }
        return prev-1;
      });
    }, 1000);
  };

  const submit = async () => {
    if (!answer.trim()||!enigma||!session||state!=="started") return;
    const corretto = normalize(answer)===normalize(enigma.soluzione);
    const elapsed = startTime ? Math.round((Date.now()-startTime)/1000) : null;
    clearTimer(); setTempoUsato(elapsed);
    await supabase.from("tentativi").upsert(
      { user_id:session.user.id, enigma_id:enigma.id, risposta:answer, corretto, tempo_usato:elapsed },
      { onConflict:"user_id,enigma_id" }
    );
    if (corretto) {
      setState("correct"); loadSolutori(enigma.id,setSolutori); loadCampione();
      setShareImg(generateShareImage({enigma,corretto:true,tempoUsato:elapsed,streak:profile?.streak||0}));
      await updateStreak();
    } else {
      setState("wrong"); setShaking(true); setTimeout(()=>setShaking(false),500);
      setShareImg(generateShareImage({enigma,corretto:false,tempoUsato:elapsed,streak:profile?.streak||0}));
    }
  };

  const updateStreak = async () => {
    if (!session||!profile) return;
    const today=getTodayStr(), last=profile.streak_last_date, yesterday=getYesterdayStr();
    let newStreak=1;
    if (last===yesterday) newStreak=(profile.streak||0)+1;
    else if (last===today) return;
    await supabase.from("profiles").update({streak:newStreak,streak_last_date:today}).eq("id",session.user.id);
  };

  const shareEnigma = () => {
    const e = session?enigma:yesterdayEnigma;
    if (!e) return;
    const text=`🧩 Enigma del Giorno — EnigmaDay\n\n"${e.testo}"\n\nRiesci a risolverlo? 🤔\nenigmaday.netlify.app`;
    if (navigator.share) navigator.share({title:"EnigmaDay",text});
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); showToast("Copiato! 📋","success"); }
  };

  const shareRisultato = async () => {
    if (!shareImg) return;
    try {
      const blob = await (await fetch(shareImg)).blob();
      const file = new File([blob],"enigmaday.png",{type:"image/png"});
      if (navigator.share&&navigator.canShare({files:[file]})) await navigator.share({files:[file],title:"EnigmaDay"});
      else { const a=document.createElement("a"); a.href=shareImg; a.download="enigmaday.png"; a.click(); showToast("Immagine scaricata 📸","success"); }
    } catch { showToast("Errore condivisione","error"); }
  };

  const istruzioni = (catConfig||[]).find(c=>c.categoria===(session?enigma?.categoria:yesterdayEnigma?.categoria));
  const streak = profile?.streak||0;
  const streakLast = profile?.streak_last_date;
  const streakAtRisk = streakLast===getYesterdayStr()&&streak>0&&state==="idle";
  const displayEnigma = session?enigma:yesterdayEnigma;
  const catColor = displayEnigma?(CAT_COLORS[displayEnigma.categoria]||COLORS.primary):COLORS.primary;
  const isBlurred = session && state==="idle";

  if (!displayEnigma) return (
    <div style={{textAlign:"center",padding:80}}>
      <div style={{fontSize:64}}>🔍</div>
      <h2 style={{fontFamily:"'Fredoka One'",fontSize:28,color:COLORS.muted,marginTop:16}}>Nessun enigma disponibile</h2>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontFamily:"'Fredoka One'",fontSize:18,color:COLORS.muted,marginBottom:4}}>
          {new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </div>
        <h1 style={{fontFamily:"'Fredoka One'",fontSize:42,background:`linear-gradient(135deg,${COLORS.primary},${COLORS.purple})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2}}>
          {session?"Enigma del Giorno 🧩":"Enigma di Ieri 🧩"}
        </h1>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:12,flexWrap:"wrap",alignItems:"center"}}>
          {/* Categoria cliccabile per istruzioni */}
          <span className="tag"
            style={{background:catColor,color:"#000",cursor:istruzioni?.istruzioni?"pointer":"default"}}
            onClick={()=>istruzioni?.istruzioni&&setShowInstruzioni(true)}
            title={istruzioni?.istruzioni?"Clicca per le istruzioni":""}>
            {displayEnigma.categoria}
          </span>
          <span className="tag" style={{background:COLORS.cardLight,color:COLORS.text,border:`1px solid ${COLORS.muted}`}}>{DIFF_LABELS[displayEnigma.difficolta]}</span>
          <span className="tag" style={{background:COLORS.cardLight,color:COLORS.secondary,border:`1px solid ${COLORS.secondary}`}}>
            👥 {session?solutori:yesterdaySolutori} risolto
          </span>
          {streak>0&&<StreakBadge streak={streak}/>}
        </div>
      </div>

      {/* Streak at risk */}
      {streakAtRisk && (
        <div className="fade-in" style={{background:"#F59E0B22",border:"1px solid #F59E0B55",borderRadius:16,padding:"12px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24}}>⚠️</span>
          <div>
            <strong style={{color:"#F59E0B"}}>La tua streak è a rischio!</strong>
            <span style={{color:COLORS.muted,fontSize:14,marginLeft:8}}>Risolvi l'enigma di oggi entro mezzanotte per mantenere i tuoi {streak} giorni di fila.</span>
          </div>
        </div>
      )}

      {/* Enigma Card */}
      <div className="card" style={{textAlign:"center",marginBottom:20,padding:"36px 32px",background:`linear-gradient(135deg,${COLORS.card},${COLORS.cardLight})`,border:`2px solid ${catColor}33`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:80,opacity:.06,transform:"rotate(15deg)"}}>🧩</div>

        {/* Media con blur */}
        {displayEnigma.media_url && (
          <div style={{marginBottom:24,filter:isBlurred?"blur(20px)":"none",transition:"filter .4s ease",pointerEvents:isBlurred?"none":"auto"}}>
            {displayEnigma.media_tipo==="video"
              ?<video src={displayEnigma.media_url} controls style={{maxWidth:"100%",maxHeight:320,borderRadius:16,boxShadow:"0 4px 20px rgba(0,0,0,.4)"}}/>
              :<img src={displayEnigma.media_url} alt="enigma" style={{maxWidth:"100%",maxHeight:320,borderRadius:16,objectFit:"contain",boxShadow:"0 4px 20px rgba(0,0,0,.4)"}}/>
            }
          </div>
        )}

        {/* Testo con blur */}
        <div style={{position:"relative"}}>
          <p style={{fontSize:22,lineHeight:1.7,fontWeight:700,color:COLORS.text,maxWidth:600,margin:"0 auto",filter:isBlurred?"blur(6px)":"none",userSelect:isBlurred?"none":"auto",transition:"filter .4s ease"}}>
            "{displayEnigma.testo}"
          </p>
          {isBlurred && (
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{background:"#0F0F1A99",padding:"6px 16px",borderRadius:50,fontSize:13,color:COLORS.muted,fontWeight:700}}>
                🔒 Premi "Inizia la sfida" per leggere
              </span>
            </div>
          )}
        </div>

        {displayEnigma.fonte&&<div style={{marginTop:12,fontSize:12,color:COLORS.muted}}>fonte: {displayEnigma.fonte}</div>}

        {/* Istruzioni */}
        {istruzioni?.istruzioni && (
          <button onClick={()=>setShowInstruzioni(true)} style={{marginTop:16,background:COLORS.cardLight,border:`1px solid ${COLORS.muted}44`,borderRadius:50,padding:"6px 16px",color:COLORS.muted,cursor:"pointer",fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>
            📖 Come funziona questa categoria
          </button>
        )}
      </div>

      {/* Guest banner */}
      {!session && (
        <div className="card fade-in" style={{textAlign:"center",marginBottom:20,background:`linear-gradient(135deg,${COLORS.primary}22,${COLORS.card})`,border:`2px solid ${COLORS.primary}44`}}>
          <div style={{fontSize:36,marginBottom:8}}>🔒</div>
          <h3 style={{fontFamily:"'Fredoka One'",fontSize:22,color:COLORS.primary,marginBottom:8}}>Vuoi risolvere l'enigma di oggi?</h3>
          <p style={{color:COLORS.muted,marginBottom:16,fontSize:15}}>Registrati gratis per accedere all'enigma di oggi, tenere traccia della tua streak e sfidare gli amici!</p>
          <div style={{display:"flex",gap:12,justifyContent:"center"}}>
            <button className="btn btn-primary" onClick={onLoginRequest}>Registrati gratis</button>
            <button className="btn btn-ghost" onClick={onLoginRequest}>Accedi</button>
          </div>
        </div>
      )}

      {/* Game area */}
      {session && (
        <>
          {state==="idle" && (
            <div className="card" style={{marginBottom:20,textAlign:"center"}}>
              <p style={{color:COLORS.muted,marginBottom:16,fontSize:15}}>
                Hai <strong style={{color:COLORS.accent}}>{timerTotale||(diffConfig?.find(d=>d.livello===enigma?.difficolta)?.secondi||180)} secondi</strong> per rispondere
              </p>
              <button className="btn btn-primary" style={{fontSize:18,padding:"14px 36px"}} onClick={startTimer}>
                🚀 Inizia la sfida
              </button>
            </div>
          )}

          {state==="started" && (
            <div className="card" style={{marginBottom:20}}>
              <TimerBar secondsLeft={timerSecondi} totalSeconds={timerTotale}/>
              <label style={{fontWeight:700,color:COLORS.muted,fontSize:14,display:"block",marginBottom:8}}>LA TUA RISPOSTA</label>
              <div style={{display:"flex",gap:10}}>
                <input className="input" placeholder="Inserisci la tua risposta..." value={answer}
                  onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
                  style={{animation:shaking?"shake .3s ease":"none"}} autoFocus/>
                <button className="btn btn-primary" onClick={submit}>Verifica 🚀</button>
              </div>
            </div>
          )}

          {state==="timeout" && (
            <div className="card fade-in" style={{textAlign:"center",marginBottom:20,border:`2px solid ${COLORS.error}`}}>
              <div style={{fontSize:56}}>⏰</div>
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:28,color:COLORS.error,marginTop:8}}>Tempo scaduto!</h3>
              <p style={{color:COLORS.muted,marginTop:8}}>La risposta era: <strong style={{color:COLORS.accent}}>{enigma.soluzione}</strong></p>
            </div>
          )}

          {state==="correct" && (
            <div className="card fade-in" style={{textAlign:"center",marginBottom:20,background:`linear-gradient(135deg,${COLORS.success}22,${COLORS.card})`,border:`2px solid ${COLORS.success}`}}>
              <div style={{fontSize:56}}>🎊</div>
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:30,color:COLORS.success,marginTop:8}}>Corretto! Bravissimo!</h3>
              <p style={{color:COLORS.muted,marginTop:8}}>La risposta era: <strong style={{color:COLORS.success}}>{enigma.soluzione}</strong></p>
              {tempoUsato&&<p style={{color:COLORS.muted,fontSize:14,marginTop:4}}>⏱ Tempo: <strong style={{color:COLORS.accent}}>{formatTime(tempoUsato)}</strong></p>}
              {streak>0&&<p style={{color:"#F59E0B",fontWeight:700,marginTop:8}}>🔥 Streak: {streak} giorni di fila!</p>}
            </div>
          )}

          {state==="wrong" && !showSolution && (
            <div className="card fade-in" style={{marginBottom:20}}>
              <p style={{color:COLORS.error,fontWeight:700,marginBottom:12}}>❌ Non è corretto!</p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>{setState("started");setAnswer("");startTimer();}}>🔄 Riprova</button>
                <button className="btn btn-purple btn-sm" onClick={()=>setShowSolution(true)}>👁️ Mostra soluzione</button>
              </div>
            </div>
          )}

          {showSolution && (
            <div className="card fade-in" style={{textAlign:"center",marginBottom:20,border:`2px solid ${COLORS.purple}`}}>
              <div style={{fontSize:48}}>💡</div>
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:26,color:COLORS.purple,marginTop:8}}>La soluzione era...</h3>
              <p style={{fontSize:28,fontWeight:800,color:COLORS.accent,marginTop:12}}>{enigma.soluzione}</p>
            </div>
          )}
        </>
      )}

      {/* Campione di oggi */}
      {campione && session && (
        <div className="card fade-in" style={{marginBottom:16,background:`linear-gradient(135deg,#FFD70018,${COLORS.card})`,border:"2px solid #FFD70044",display:"flex",alignItems:"center",gap:16,cursor:"pointer"}}
          onClick={()=>onNav&&onNav("leaderboard")}>
          <div style={{fontSize:32}}>⚡</div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:700,color:"#FFD700",letterSpacing:1,marginBottom:2}}>PIÙ VELOCE DI OGGI</div>
            <div style={{fontWeight:800,fontSize:16}}>
              {campione.display_name}
              {session?.user?.id===campione.id&&<span style={{fontSize:11,background:COLORS.primary,color:"#fff",padding:"1px 8px",borderRadius:50,marginLeft:8}}>sei tu!</span>}
            </div>
            <div style={{fontSize:13,color:COLORS.muted,marginTop:2}}>
              ha risolto in <strong style={{color:"#FFD700"}}>{formatTime(campione.tempo_usato)}</strong>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:28}}>🥇</div>
            <div style={{fontSize:11,color:COLORS.muted}}>vedi classifica →</div>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:12,fontWeight:700,color:COLORS.muted,marginBottom:8,letterSpacing:1}}>PROSSIMO ENIGMA TRA</div>
          <div style={{fontFamily:"'Fredoka One'",fontSize:36,color:COLORS.accent,letterSpacing:4}}>{countdown}</div>
        </div>
        <div className="card" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
          <button className="btn btn-secondary" onClick={shareEnigma} style={{width:"100%",justifyContent:"center"}}>
            {copied?"✅ Copiato!":"📤 Condividi enigma"}
          </button>
          {(state==="correct"||state==="wrong"||state==="timeout")&&shareImg&&(
            <button className="btn btn-purple" onClick={shareRisultato} style={{width:"100%",justifyContent:"center"}}>
              🏆 Condividi risultato
            </button>
          )}
        </div>
      </div>

      {/* Modal istruzioni */}
      {showInstruzioni&&istruzioni?.istruzioni&&(
        <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",padding:20}}
          onClick={e=>{if(e.target===e.currentTarget)setShowInstruzioni(false);}}>
          <div style={{background:COLORS.card,borderRadius:24,padding:32,maxWidth:520,width:"100%",border:`2px solid ${catColor}44`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:24,color:catColor}}>📖 {displayEnigma.categoria}</h3>
              <button onClick={()=>setShowInstruzioni(false)} style={{background:COLORS.cardLight,border:"none",color:COLORS.text,width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <p style={{color:COLORS.muted,lineHeight:1.7,fontSize:15}}>{istruzioni.istruzioni}</p>
          </div>
        </div>
      )}
    </div>
  );
}
