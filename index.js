import { useState, useEffect } from "react";

// ─── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://cyhbihfubljuffxqulix.supabase.co";
const SUPABASE_KEY = "sb_publishable_VFCj3gGBnVyWcomqdtMn0w_6I4mtNId";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const get = (path) => sb(path, { method: "GET" });
const post = (path, body) => sb(path, { method: "POST", body: JSON.stringify(body) });
const patch = (path, body) => sb(path, { method: "PATCH", body: JSON.stringify(body), prefer: "return=representation" });
const del = (path) => sb(path, { method: "DELETE", prefer: "return=minimal" });

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0a0f", card: "#13131a", border: "#1e1e2e",
  accent: "#6EE7F7", accentDim: "#6EE7F722",
  green: "#4ade80", red: "#f87171", muted: "#4a4a6a",
  text: "#e2e8f0", textDim: "#7c7ca0",
};
const px = (v) => `${v}px`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  root: { direction: "rtl", fontFamily: "'Vazirmatn','Tahoma',sans-serif", background: C.bg, minHeight: "100vh", maxWidth: px(420), margin: "0 auto", color: C.text, paddingBottom: px(80) },
  header: { padding: "20px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { fontSize: px(20), fontWeight: 800, color: C.accent },
  logoSub: { fontSize: px(11), color: C.textDim, marginTop: px(2) },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: px(420), background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100 },
  navBtn: (a) => ({ flex: 1, padding: "12px 0", background: "none", border: "none", color: a ? C.accent : C.muted, fontSize: px(11), fontFamily: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: px(3) }),
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: px(16), padding: px(16), marginBottom: px(12) },
  btn: (color = C.accent, outline = false) => ({ background: outline ? "transparent" : color, color: outline ? color : "#000", border: `1.5px solid ${color}`, borderRadius: px(12), padding: "10px 16px", fontSize: px(14), fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }),
  input: { background: "#0d0d16", border: `1px solid ${C.border}`, borderRadius: px(10), padding: "10px 14px", color: C.text, fontSize: px(14), fontFamily: "inherit", width: "100%", boxSizing: "border-box", outline: "none", direction: "rtl" },
  badge: (color) => ({ background: color + "22", color, borderRadius: px(8), padding: "3px 10px", fontSize: px(12), fontWeight: 600 }),
  pill: { display: "inline-flex", alignItems: "center", gap: px(4), background: C.accentDim, color: C.accent, borderRadius: px(20), padding: "4px 12px", fontSize: px(12) },
  tag: (color) => ({ background: color + "22", color, borderRadius: px(20), padding: "4px 12px", fontSize: px(12), fontWeight: 600 }),
};

// ─── Name picker modal ────────────────────────────────────────────────────────
function NameModal({ onSave }) {
  const [name, setName] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, direction: "rtl" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: px(20), padding: px(28), width: "80%", maxWidth: px(320), textAlign: "center" }}>
        <div style={{ fontSize: px(40), marginBottom: px(12) }}>✨</div>
        <div style={{ fontSize: px(18), fontWeight: 800, marginBottom: px(6) }}>Funfinity</div>
        <div style={{ color: C.textDim, fontSize: px(13), marginBottom: px(20) }}>اسمت چیه؟</div>
        <input
          style={{ ...S.input, marginBottom: px(12), textAlign: "center" }}
          placeholder="مثلاً: نیما"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
          autoFocus
        />
        <button style={{ ...S.btn(C.accent), width: "100%" }} onClick={() => name.trim() && onSave(name.trim())}>
          بریم! 🚀
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [userName, setUserName] = useState(() => localStorage.getItem("funfinity_name") || "");
  const [tab, setTab] = useState("home");
  const [events, setEvents] = useState([]);
  const [activeEventId, setActiveEventId] = useState(null);
  const [votes, setVotes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "" });
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const saveName = (n) => { localStorage.setItem("funfinity_name", n); setUserName(n); };

  // ── Load data ──
  const loadAll = async () => {
    try {
      setLoading(true);
      const [evs, vs, locs] = await Promise.all([
        get("events?select=*&order=created_at.desc"),
        get("votes?select=*"),
        get("locations?select=*&order=likes.desc"),
      ]);
      setEvents(evs);
      setVotes(vs);
      setLocations(locs);
    } catch (e) {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Auto-refresh every 10s ──
  useEffect(() => {
    const t = setInterval(loadAll, 10000);
    return () => clearInterval(t);
  }, []);

  // ── Create event ──
  const createEvent = async () => {
    if (!newEvent.title.trim()) return;
    try {
      await post("events", { title: newEvent.title, date: newEvent.date || "امشب", time: newEvent.time || "؟", created_by: userName });
      setNewEvent({ title: "", date: "", time: "" });
      setShowForm(false);
      await loadAll();
    } catch { setError("خطا در ساخت رویداد"); }
  };

  // ── Vote ──
  const vote = async (eventId, choice) => {
    try {
      const existing = votes.find(v => v.event_id === eventId && v.user_name === userName);
      if (existing) {
        if (existing.choice === choice) return;
        await patch(`votes?id=eq.${existing.id}`, { choice });
      } else {
        await post("votes", { event_id: eventId, user_name: userName, choice });
      }
      await loadAll();
    } catch { setError("خطا در ثبت رای"); }
  };

  // ── Add location ──
  const addLocation = async (eventId) => {
    if (!newLocation.trim()) return;
    try {
      await post("locations", { event_id: eventId, name: newLocation.trim(), suggested_by: userName });
      setNewLocation("");
      await loadAll();
    } catch { setError("خطا در افزودن مکان"); }
  };

  // ── Like location ──
  const likeLocation = async (loc) => {
    try {
      await patch(`locations?id=eq.${loc.id}`, { likes: loc.likes + 1 });
      await loadAll();
    } catch { setError("خطا"); }
  };

  const activeEvent = events.find(e => e.id === activeEventId);
  const eventVotes = (eventId) => votes.filter(v => v.event_id === eventId);
  const eventLocs = (eventId) => locations.filter(l => l.event_id === eventId).sort((a, b) => b.likes - a.likes);
  const myVote = (eventId) => votes.find(v => v.event_id === eventId && v.user_name === userName);

  if (!userName) return <NameModal onSave={saveName} />;

  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.logo}>✨ Funfinity</div>
          <div style={S.logoSub}>هماهنگی با دوستا</div>
        </div>
        <div style={S.pill}>👤 {userName}</div>
      </div>

      {error && (
        <div style={{ background: C.red + "22", color: C.red, padding: "10px 16px", fontSize: px(13), textAlign: "center" }}>
          {error} <span style={{ cursor: "pointer" }} onClick={() => setError("")}>✕</span>
        </div>
      )}

      <div style={{ padding: px(16) }}>

        {/* ── HOME ── */}
        {tab === "home" && (
          <div>
            {/* CTA */}
            <div style={{ ...S.card, background: "linear-gradient(135deg,#13131a,#0e0e1f)", border: `1.5px solid ${C.accent}44`, textAlign: "center", padding: "28px 20px", marginBottom: px(20), position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "100px", height: "100px", background: C.accent + "11", borderRadius: "50%" }} />
              <div style={{ fontSize: px(44), marginBottom: px(8) }}>✨</div>
              <div style={{ fontSize: px(20), fontWeight: 800, marginBottom: px(4) }}>Funfinity</div>
              <div style={{ color: C.textDim, fontSize: px(13), marginBottom: px(18) }}>امشب میریم بیرون؟</div>
              <button style={{ ...S.btn(C.accent), fontSize: px(15), padding: "12px 28px", borderRadius: px(14) }} onClick={() => setShowForm(true)}>
                + رویداد جدید
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <div style={{ ...S.card, marginBottom: px(16) }}>
                <div style={{ fontWeight: 700, marginBottom: px(12), color: C.accent }}>📅 رویداد جدید</div>
                <div style={{ display: "flex", flexDirection: "column", gap: px(10) }}>
                  <input style={S.input} placeholder="اسم رویداد (مثلاً: فوتبال شب جمعه)" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                  <div style={{ display: "flex", gap: px(8) }}>
                    <input style={{ ...S.input, flex: 1 }} placeholder="تاریخ" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
                    <input style={{ ...S.input, flex: 1 }} placeholder="ساعت" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: px(8) }}>
                    <button style={{ ...S.btn(C.accent), flex: 1 }} onClick={createEvent}>بساز ✓</button>
                    <button style={{ ...S.btn(C.muted, true), flex: 1 }} onClick={() => setShowForm(false)}>لغو</button>
                  </div>
                </div>
              </div>
            )}

            {/* Event list */}
            {loading ? (
              <div style={{ textAlign: "center", color: C.textDim, padding: px(30) }}>در حال بارگذاری...</div>
            ) : events.length === 0 && !showForm ? (
              <div style={{ textAlign: "center", color: C.textDim, marginTop: px(20), fontSize: px(13) }}>هنوز رویدادی نیست — یکی بساز! ☝️</div>
            ) : (
              <>
                <div style={{ color: C.textDim, fontSize: px(12), marginBottom: px(8), fontWeight: 600 }}>رویدادهای فعال</div>
                {events.map((ev) => {
                  const vs = eventVotes(ev.id);
                  const yes = vs.filter(v => v.choice === "هستم");
                  const no = vs.filter(v => v.choice === "نیستم");
                  return (
                    <div key={ev.id} style={{ ...S.card, cursor: "pointer", border: activeEventId === ev.id ? `1.5px solid ${C.accent}88` : `1px solid ${C.border}` }}
                      onClick={() => { setActiveEventId(ev.id); setTab("event"); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: px(4) }}>{ev.title}</div>
                          <div style={{ color: C.textDim, fontSize: px(12) }}>📅 {ev.date} &nbsp;|&nbsp; 🕐 {ev.time}</div>
                          <div style={{ fontSize: px(11), color: C.textDim, marginTop: px(4) }}>ساخته توسط: {ev.created_by}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: px(4), alignItems: "flex-end" }}>
                          <span style={S.badge(C.green)}>✅ {yes.length}</span>
                          <span style={S.badge(C.red)}>❌ {no.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── EVENT DETAIL ── */}
        {tab === "event" && (
          <div>
            {!activeEvent ? (
              <div style={{ textAlign: "center", color: C.textDim, marginTop: px(40) }}>
                <div style={{ fontSize: px(40), marginBottom: px(12) }}>📭</div>
                <div>رویدادی انتخاب نشده</div>
                <button style={{ ...S.btn(C.accent), marginTop: px(16) }} onClick={() => setTab("home")}>برو خانه</button>
              </div>
            ) : (
              <>
                {/* Event header */}
                <div style={{ ...S.card, marginBottom: px(12) }}>
                  <div style={{ fontSize: px(18), fontWeight: 800, marginBottom: px(4) }}>{activeEvent.title}</div>
                  <div style={{ color: C.textDim, fontSize: px(13) }}>📅 {activeEvent.date} &nbsp;|&nbsp; 🕐 {activeEvent.time}</div>
                  <div style={{ fontSize: px(11), color: C.textDim, marginTop: px(4) }}>ساخته توسط: {activeEvent.created_by}</div>
                </div>

                {/* Vote buttons */}
                <div style={{ ...S.card, marginBottom: px(12) }}>
                  <div style={{ fontWeight: 700, marginBottom: px(12) }}>📊 کی هست؟</div>
                  <div style={{ display: "flex", gap: px(10), marginBottom: px(16) }}>
                    <button
                      style={{ ...S.btn(C.green, myVote(activeEvent.id)?.choice !== "هستم"), flex: 1 }}
                      onClick={() => vote(activeEvent.id, "هستم")}
                    >✅ هستم</button>
                    <button
                      style={{ ...S.btn(C.red, myVote(activeEvent.id)?.choice !== "نیستم"), flex: 1 }}
                      onClick={() => vote(activeEvent.id, "نیستم")}
                    >❌ نیستم</button>
                  </div>

                  {/* هستن */}
                  <div style={{ background: C.green + "11", border: `1px solid ${C.green}33`, borderRadius: px(12), padding: px(12), marginBottom: px(8) }}>
                    <div style={{ fontSize: px(12), color: C.green, fontWeight: 700, marginBottom: px(8) }}>
                      ✅ هستن ({eventVotes(activeEvent.id).filter(v => v.choice === "هستم").length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: px(6) }}>
                      {eventVotes(activeEvent.id).filter(v => v.choice === "هستم").length === 0
                        ? <span style={{ fontSize: px(12), color: C.muted }}>هنوز کسی نزده</span>
                        : eventVotes(activeEvent.id).filter(v => v.choice === "هستم").map(v => (
                          <span key={v.id} style={S.tag(C.green)}>👤 {v.user_name}</span>
                        ))}
                    </div>
                  </div>

                  {/* نیستن */}
                  <div style={{ background: C.red + "11", border: `1px solid ${C.red}33`, borderRadius: px(12), padding: px(12) }}>
                    <div style={{ fontSize: px(12), color: C.red, fontWeight: 700, marginBottom: px(8) }}>
                      ❌ نیستن ({eventVotes(activeEvent.id).filter(v => v.choice === "نیستم").length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: px(6) }}>
                      {eventVotes(activeEvent.id).filter(v => v.choice === "نیستم").length === 0
                        ? <span style={{ fontSize: px(12), color: C.muted }}>هنوز کسی نزده</span>
                        : eventVotes(activeEvent.id).filter(v => v.choice === "نیستم").map(v => (
                          <span key={v.id} style={S.tag(C.red)}>👤 {v.user_name}</span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: px(12) }}>📍 پیشنهاد مکان</div>
                  {eventLocs(activeEvent.id).length === 0
                    ? <div style={{ color: C.muted, fontSize: px(13), marginBottom: px(12) }}>هنوز مکانی پیشنهاد نشده</div>
                    : eventLocs(activeEvent.id).map((loc) => (
                      <div key={loc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                        <div>
                          <div style={{ fontSize: px(14), fontWeight: 600 }}>{loc.name}</div>
                          <div style={{ fontSize: px(11), color: C.textDim, marginTop: px(2) }}>پیشنهاد: {loc.suggested_by}</div>
                        </div>
                        <button
                          style={{ background: C.accentDim, border: "none", borderRadius: px(8), padding: "4px 12px", color: C.accent, cursor: "pointer", fontFamily: "inherit", fontSize: px(13), fontWeight: 600 }}
                          onClick={() => likeLocation(loc)}
                        >👍 {loc.likes}</button>
                      </div>
                    ))}
                  <div style={{ display: "flex", gap: px(8), marginTop: px(12) }}>
                    <input
                      style={{ ...S.input, flex: 1 }}
                      placeholder="پیشنهاد مکان..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addLocation(activeEvent.id)}
                    />
                    <button style={S.btn(C.accent)} onClick={() => addLocation(activeEvent.id)}>+</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: px(14), fontSize: px(16) }}>🕓 تاریخچه رویدادها</div>
            {events.length === 0
              ? <div style={{ textAlign: "center", color: C.textDim, fontSize: px(13) }}>هنوز رویدادی نیست</div>
              : events.map((ev) => {
                const vs = eventVotes(ev.id);
                const locs = eventLocs(ev.id);
                return (
                  <div key={ev.id} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: px(4) }}>{ev.title}</div>
                        <div style={{ color: C.textDim, fontSize: px(12), marginBottom: px(8) }}>📅 {ev.date} &nbsp;|&nbsp; 🕐 {ev.time}</div>
                        {locs[0] && <div style={S.pill}>📍 {locs[0].name}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: px(4) }}>
                        <span style={S.badge(C.green)}>✅ {vs.filter(v => v.choice === "هستم").length}</span>
                        <span style={S.badge(C.red)}>❌ {vs.filter(v => v.choice === "نیستم").length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={S.nav}>
        {[{ id: "home", icon: "🏠", label: "خانه" }, { id: "event", icon: "📋", label: "رویداد" }, { id: "history", icon: "🕓", label: "تاریخچه" }].map((n) => (
          <button key={n.id} style={S.navBtn(tab === n.id)} onClick={() => setTab(n.id)}>
            <span style={{ fontSize: px(20) }}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
