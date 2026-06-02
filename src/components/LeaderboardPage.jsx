import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = { primary:"#FF6B35", secondary:"#4ECDC4", accent:"#FFE66D", purple:"#A855F7", card:"#1A1A2E", cardLight:"#16213E", text:"#F0F0F0", muted:"#8888AA", success:"#22C55E", error:"#EF4444", warning:"#F59E0B" };

function Avatar({ src, emoji, nome, size=36 }) {
  if (src) return <img src={src} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`2px solid ${COLORS.primary}`}}/>;
  if (emoji && emoji.length<=2) return <div style={{width:size,height:size,borderRadius:"50%",background:COLORS.cardLight,border:`2px solid ${COLORS.primary}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.5}}>{emoji}</div>;
  return <div style={{width:size,height:size,borderRadius:"50%",background:COLORS.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.4,fontWeight:800,color:"#fff"}}>{nome?nome[0].toUpperCase():"?"}</div>;
}

const MEDAL = ["🥇","🥈","🥉"];
const PODIO_COLORS = ["#FFD700","#C0C0C0","#CD7F32"];

function LeaderRow({ rank, user, value, valueLabel, currentUserId, highlight }) {
  const isMe = user.id === currentUserId;
  const medal = rank <= 3 ? MEDAL[rank-1] : null;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:14, padding:"12px 16px",
      background: isMe ? COLORS.primary+"22" : rank%2===0 ? COLORS.cardLight+"44" : "transparent",
      border: isMe ? `1px solid ${COLORS.primary}44` : "1px solid transparent",
      borderRadius:12, transition:"all .15s"
    }}>
      <div style={{width:32,textAlign:"center",flexShrink:0}}>
        {medal
          ? <span style={{fontSize:22}}>{medal}</span>
          : <span style={{fontFamily:"'Fredoka One'",fontSize:18,color:COLORS.muted}}>#{rank}</span>
        }
      </div>
      <Avatar src={user.avatar_url} emoji={user.avatar_emoji} nome={user.display_name} size={38}/>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:15}}>
          {user.display_name}
          {isMe && <span style={{fontSize:11,background:COLORS.primary,color:"#fff",padding:"1px 8px",borderRadius:50,marginLeft:8}}>tu</span>}
        </div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontFamily:"'Fredoka One'",fontSize:20,color:highlight}}>{value}</div>
        <div style={{fontSize:11,color:COLORS.muted}}>{valueLabel}</div>
      </div>
    </div>
  );
}

function Podio({ top3, currentUserId, valueKey, valueLabel, formatValue }) {
  if (!top3 || top3.length === 0) return <p style={{color:COLORS.muted,textAlign:"center",padding:20}}>Nessun dato ancora</p>;
  const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];
  const heights = [80, 110, 60];
  const ranks = top3.length >= 3 ? [2,1,3] : [2,1];

  return (
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:8,marginBottom:8}}>
      {order.map((user, i) => {
        const rank = ranks[i];
        const isMe = user.id === currentUserId;
        const h = heights[i];
        return (
          <div key={user.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <Avatar src={user.avatar_url} emoji={user.avatar_emoji} nome={user.display_name} size={rank===1?52:40}/>
            <div style={{fontWeight:700,fontSize:13,color:isMe?COLORS.primary:COLORS.text,maxWidth:80,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {user.display_name}{isMe&&" 👈"}
            </div>
            <div style={{fontFamily:"'Fredoka One'",fontSize:rank===1?20:16,color:PODIO_COLORS[rank-1]}}>{formatValue(user[valueKey])}</div>
            <div style={{
              width:rank===1?90:70, height:h, borderRadius:"8px 8px 0 0",
              background:`linear-gradient(180deg,${PODIO_COLORS[rank-1]}88,${PODIO_COLORS[rank-1]}44)`,
              border:`2px solid ${PODIO_COLORS[rank-1]}66`,
              display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:8
            }}>
              <span style={{fontSize:rank===1?32:24}}>{MEDAL[rank-1]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage({ session, profile }) {
  const [tab, setTab] = useState("oggi");
  const [oggiData, setOggiData] = useState([]);
  const [streakData, setStreakData] = useState([]);
  const [hallData, setHallData] = useState([]);
  const [meseData, setMeseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = today.substring(0,7)+"-01";

    const [{ data: oggi }, { data: generale }, { data: mese }] = await Promise.all([
      supabase.from("classifica_velocita_oggi").select("*").limit(20),
      supabase.from("classifica_generale").select("*").limit(20),
      supabase.from("tentativi").select("user_id, profiles(id,nome,soprannome,avatar_url,avatar_emoji)").eq("corretto",true).gte("created_at",firstOfMonth),
    ]);

    setOggiData(oggi || []);

    // Streak
    const streak = (generale || []).filter(u=>u.streak>0).sort((a,b)=>b.streak-a.streak).slice(0,20);
    setStreakData(streak);
    setHallData(generale || []);

    // Mese — aggrega per utente
    const meseMap = {};
    (mese || []).forEach(t => {
      const uid = t.user_id;
      if (!meseMap[uid]) meseMap[uid] = { ...t.profiles, id:uid, count:0 };
      meseMap[uid].count++;
    });
    setMeseData(Object.values(meseMap).sort((a,b)=>b.count-a.count).slice(0,20));
    setLoading(false);
  };

  const formatTime = (s) => {
    if (!s) return "—";
    if (s < 60) return `${s}s`;
    return `${Math.floor(s/60)}m ${s%60}s`;
  };

  const tabStyle = (t) => ({
    padding:"10px 20px", borderRadius:50, fontWeight:800, cursor:"pointer", fontSize:14, border:"none",
    background: tab===t ? COLORS.primary : COLORS.cardLight,
    color: tab===t ? "#fff" : COLORS.muted,
    fontFamily:"'Nunito',sans-serif", transition:"all .2s"
  });

  if (loading) return (
    <div style={{textAlign:"center",padding:60,color:COLORS.muted}}>
      <div style={{fontSize:48,marginBottom:12}}>⏳</div>Caricamento classifiche...
    </div>
  );

  const tabs = [
    { key:"oggi", label:"⚡ Oggi", data:oggiData, valueKey:"tempo_usato", valueLabel:"tempo", formatValue:formatTime, color:COLORS.accent, emptyMsg:"Nessuno ha ancora risolto l'enigma di oggi!" },
    { key:"streak", label:"🔥 Streak", data:streakData, valueKey:"streak", valueLabel:"giorni", formatValue:v=>v+"🔥", color:COLORS.warning, emptyMsg:"Nessuna streak attiva" },
    { key:"hall", label:"🏆 Hall of Fame", data:hallData, valueKey:"risolti", valueLabel:"risolti", formatValue:v=>v, color:COLORS.success, emptyMsg:"Nessun dato" },
    { key:"mese", label:"📅 Questo mese", data:meseData, valueKey:"count", valueLabel:"risolti", formatValue:v=>v, color:COLORS.secondary, emptyMsg:"Nessun dato questo mese" },
  ];

  const currentTab = tabs.find(t=>t.key===tab);
  const top3 = currentTab.data.slice(0,3);
  const rest = currentTab.data.slice(3);

  return (
    <div className="fade-in">
      <h1 style={{fontFamily:"'Fredoka One'",fontSize:36,background:`linear-gradient(135deg,${COLORS.accent},${COLORS.primary})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>
        Classifiche 🏆
      </h1>
      <p style={{color:COLORS.muted,marginBottom:28,fontSize:15}}>Chi sono i migliori enigmisti?</p>

      <div style={{display:"flex",gap:8,marginBottom:28,flexWrap:"wrap"}}>
        {tabs.map(t=><button key={t.key} style={tabStyle(t.key)} onClick={()=>setTab(t.key)}>{t.label}</button>)}
      </div>

      {currentTab.data.length === 0 ? (
        <div className="card" style={{textAlign:"center",padding:60}}>
          <div style={{fontSize:56,marginBottom:12}}>🔍</div>
          <p style={{color:COLORS.muted,fontSize:16}}>{currentTab.emptyMsg}</p>
        </div>
      ) : (
        <>
          {/* Podio */}
          <div className="card" style={{marginBottom:20,background:`linear-gradient(135deg,${COLORS.card},${COLORS.cardLight})`,border:`2px solid ${currentTab.color}33`}}>
            <h3 style={{fontFamily:"'Fredoka One'",fontSize:20,color:currentTab.color,textAlign:"center",marginBottom:20}}>
              {currentTab.label}
            </h3>
            <Podio top3={top3} currentUserId={session?.user?.id} valueKey={currentTab.valueKey} valueLabel={currentTab.valueLabel} formatValue={currentTab.formatValue}/>
          </div>

          {/* Lista completa */}
          {rest.length > 0 && (
            <div className="card">
              <h3 style={{fontFamily:"'Fredoka One'",fontSize:20,marginBottom:16,color:COLORS.muted}}>Classifica completa</h3>
              <div style={{display:"grid",gap:6}}>
                {rest.map((user,i)=>(
                  <LeaderRow
                    key={user.id}
                    rank={i+4}
                    user={user}
                    value={currentTab.formatValue(user[currentTab.valueKey])}
                    valueLabel={currentTab.valueLabel}
                    currentUserId={session?.user?.id}
                    highlight={currentTab.color}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
