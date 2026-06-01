import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import HomePage from "./components/HomePage";
import { LoginPage } from "./components/AuthPages";
import { RegisterPage } from "./components/AuthPages";
import ProfilePage from "./components/ProfilePage";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [page, setPage] = useState("home");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [todayEnigma, setTodayEnigma] = useState(null);
  const [yesterdayEnigma, setYesterdayEnigma] = useState(null);
  const [diffConfig, setDiffConfig] = useState([]);
  const [catConfig, setCatConfig] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  };

  const loadEnigmi = async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const [{ data: t }, { data: y }] = await Promise.all([
      supabase.from("enigmi").select("*").eq("data_pub", today).maybeSingle(),
      supabase.from("enigmi").select("*").eq("data_pub", yesterday).maybeSingle(),
    ]);
    setTodayEnigma(t || null);
    setYesterdayEnigma(y || null);
  };

  const loadConfigs = async () => {
    try {
      const [{ data: d }, { data: c }] = await Promise.all([
        supabase.from("difficolta_config").select("*"),
        supabase.from("categorie_config").select("*"),
      ]);
      setDiffConfig(d || []);
      setCatConfig(c || []);
    } catch(err) {
      console.error("loadConfigs error:", err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await loadProfile(session.user.id);
      await loadEnigmi();
      await loadConfigs();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) await loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return showToast(error.message, "error");
    await loadProfile(data.user.id);
    showToast("Bentornato! 🎉", "success");
    setPage("home");
  };

  const handleRegister = async (nome, email, password, preferenze) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { nome } } });
    if (error) return showToast(error.message, "error");
    showToast("Account creato! Controlla la tua email 📧", "success");
    setPage("login");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null); setSession(null);
    setPage("home");
    showToast("Arrivederci! 👋", "info");
  };

  const handleUpdateProfile = async (updates) => {
    const { error } = await supabase.from("profiles").update(updates).eq("id", session.user.id);
    if (error) return showToast("Errore nel salvataggio", "error");
    setProfile(p => ({ ...p, ...updates }));
    showToast("Profilo aggiornato ✅", "success");
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", flexDirection:"column", gap:16, background:"#0F0F1A" }}>
      <div style={{ fontSize:56 }}>🧩</div>
      <div style={{ fontFamily:"'Fredoka One', cursive", fontSize:28, color:"#FF6B35" }}>EnigmaDay</div>
    </div>
  );

  const isAdmin = profile?.ruolo === "admin";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0F0F1A; color:#F0F0F0; font-family:'Nunito',sans-serif; min-height:100vh; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-thumb { background:#FF6B35; border-radius:3px; }
        .btn { display:inline-flex; align-items:center; gap:6px; padding:10px 22px; border:none; border-radius:50px; font-family:'Nunito',sans-serif; font-weight:800; font-size:15px; cursor:pointer; transition:all .2s; }
        .btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .btn-primary { background:#FF6B35; color:#fff; }
        .btn-secondary { background:#4ECDC4; color:#000; }
        .btn-accent { background:#FFE66D; color:#000; }
        .btn-purple { background:#A855F7; color:#fff; }
        .btn-ghost { background:transparent; border:2px solid #8888AA; color:#F0F0F0; }
        .btn-ghost:hover { border-color:#FF6B35; color:#FF6B35; }
        .btn-sm { padding:7px 16px; font-size:13px; }
        .card { background:#1A1A2E; border-radius:20px; padding:24px; }
        .input { background:#16213E; border:2px solid transparent; border-radius:12px; padding:12px 16px; color:#F0F0F0; font-family:'Nunito',sans-serif; font-size:15px; width:100%; outline:none; transition:border-color .2s; }
        .input:focus { border-color:#FF6B35; }
        .input::placeholder { color:#8888AA; }
        .badge { display:inline-flex; align-items:center; padding:3px 12px; border-radius:50px; font-size:12px; font-weight:700; }
        .tag { display:inline-block; padding:4px 12px; border-radius:50px; font-size:12px; font-weight:700; cursor:pointer; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        .fade-in { animation:fadeIn .4s ease both; }
      `}</style>

      <Toast toast={toast} />
      <Navbar profile={profile} session={session} onLogout={handleLogout} onNav={setPage} isAdmin={isAdmin} />

      <div style={{ maxWidth: page === "admin" ? 1400 : 900, margin:"0 auto", padding:"28px 24px", minHeight:"calc(100vh - 70px)" }}>
        {page === "home" &&
          <HomePage
            enigma={todayEnigma}
            yesterdayEnigma={yesterdayEnigma}
            session={session}
            profile={profile}
            showToast={showToast}
            onLoginRequest={() => setPage("login")}
            diffConfig={diffConfig}
            catConfig={catConfig}
          />
        }
        {page === "login" && <LoginPage onLogin={handleLogin} onRegister={() => setPage("register")} />}
        {page === "register" && <RegisterPage onRegister={handleRegister} onLogin={() => setPage("login")} />}
        {page === "profile" && session &&
          <ProfilePage profile={profile} session={session} onUpdate={handleUpdateProfile} showToast={showToast} />
        }
        {page === "admin" && isAdmin &&
          <AdminPanel showToast={showToast} onConfigUpdate={loadConfigs} />
        }
      </div>
    </>
  );
}
