import { useState, useEffect, useCallback } from "react";

/* ————— Box United Team Dashboard —————
   Shared team board in the Chief of Staff cockpit design:
   navy rail · light page · white cards · Archivo/Inter.
   Data lives in shared storage — everyone with this artifact sees & edits the same board. */

const PEOPLE = [
  { key: "mk", name: "Mary Kate", role: "Executive Director", initials: "MK" },
  { key: "alexandra", name: "Alexandra Foster", role: "Chief Operating Officer", initials: "AF" },
  { key: "claire", name: "Claire Trinkle", role: "Development Director", initials: "CT" },
];

const ROCK_STATUS = {
  on_track: { label: "On track", next: "off_track", cls: "done" },
  off_track: { label: "Off track", next: "done", cls: "work" },
  done: { label: "Done", next: "on_track", cls: "blue" },
};
const GOAL_STATUS = {
  plan: { label: "Planned", next: "work", cls: "plan" },
  work: { label: "In progress", next: "done", cls: "work" },
  done: { label: "Done", next: "plan", cls: "done" },
};

const K_ROCKS = "bu-rocks";
const K_FOUNDATIONS = "bu-foundations";
const K_DECISIONS = "bu-decisions";
const K_TOPICS = "bu-topics";
const K_MONDAY = "bu-monday";

const MONDAY_PROMPT = `You have monday.com tools. Find the CURRENT open work for each of these three people at Box United: Mary Kate (Executive Director), Alexandra Foster (COO), Claire Trinkle (Development Director).
For each person count across all active boards: (1) open items assigned to them (not done), (2) how many of those are due within the next 7 days, (3) how many are past their due date.
If you cannot attribute items to a person, count 0s for them rather than guessing.
Respond with ONLY this JSON, no markdown, no commentary:
{"mk":{"open":0,"dueSoon":0,"overdue":0},"alexandra":{"open":0,"dueSoon":0,"overdue":0},"claire":{"open":0,"dueSoon":0,"overdue":0}}`;

const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const curYear = new Date().getFullYear();
const curQ = Math.floor(new Date().getMonth() / 3) + 1;
const niceDate = (d) => {
  if (!d) return "—";
  const x = new Date(d + "T00:00");
  return x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

async function loadKey(key, fallback) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}

const NAV = [
  { id: "foundations", label: "Goals & Values", icon: "M9 11l3 3 8-8M3 12a9 9 0 109-9" },
  { id: "rocks", label: "Quarterly Rocks", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { id: "decisions", label: "Decisions log", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { id: "topics", label: "Meeting topics", icon: "M8 2v3M16 2v3M3 9h18M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2" },
];

export default function TeamDashboard() {
  const [rocks, setRocks] = useState({});
  const [foundations, setFoundations] = useState({ goals: [], values: [] });
  const [decisions, setDecisions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [monday, setMonday] = useState(null); // { stats: {mk:{open,dueSoon,overdue},...}, syncedAt }
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [year, setYear] = useState(curYear);
  const [quarter, setQuarter] = useState(curQ);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [active, setActive] = useState("foundations");
  const [addingFor, setAddingFor] = useState(null);
  const [editingRock, setEditingRock] = useState(null);
  const [showDecisionForm, setShowDecisionForm] = useState(false);

  const qKey = `${year}-Q${quarter}`;
  const qRocks = rocks[qKey] || [];

  useEffect(() => {
    (async () => {
      const [r, f, d, t, m] = await Promise.all([
        loadKey(K_ROCKS, {}),
        loadKey(K_FOUNDATIONS, { goals: [], values: [] }),
        loadKey(K_DECISIONS, []),
        loadKey(K_TOPICS, []),
        loadKey(K_MONDAY, null),
      ]);
      setRocks(r || {});
      setFoundations(f || { goals: [], values: [] });
      setDecisions(d || []);
      setTopics(t || []);
      setMonday(m || null);
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (key, value) => {
    setSaveState("saving");
    try {
      const res = await window.storage.set(key, JSON.stringify(value), true);
      setSaveState(res ? "saved" : "error");
      setTimeout(() => setSaveState("idle"), 1400);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }, []);

  const updateRocks = (fn) => setRocks((p) => { const n = fn(structuredClone(p)); save(K_ROCKS, n); return n; });
  const updateFoundations = (fn) => setFoundations((p) => { const n = fn(structuredClone(p)); save(K_FOUNDATIONS, n); return n; });
  const updateDecisions = (fn) => setDecisions((p) => { const n = fn(structuredClone(p)); save(K_DECISIONS, n); return n; });
  const updateTopics = (fn) => setTopics((p) => { const n = fn(structuredClone(p)); save(K_TOPICS, n); return n; });

  const syncMonday = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncError("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: MONDAY_PROMPT }],
          mcp_servers: [{ type: "url", url: "https://mcp.monday.com/mcp", name: "monday" }],
        }),
      });
      const data = await response.json();
      const texts = (data.content || []).filter((b) => b.type === "text").map((b) => b.text);
      const raw = texts.join("\n").replace(/```json|```/g, "").trim();
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No stats in response");
      const stats = JSON.parse(raw.slice(start, end + 1));
      if (!stats.mk || !stats.alexandra || !stats.claire) throw new Error("Incomplete stats");
      const next = { stats, syncedAt: new Date().toISOString() };
      setMonday(next);
      save(K_MONDAY, next);
    } catch (e) {
      console.error(e);
      setSyncError("Sync didn't come back clean — try again in a moment.");
    }
    setSyncing(false);
  };

  const syncedAgo = () => {
    if (!monday?.syncedAt) return null;
    const mins = Math.floor((Date.now() - new Date(monday.syncedAt).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const go = (id) => {
    setActive(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const doneCount = qRocks.filter((r) => r.status === "done").length;
  const yearGoals = foundations.goals.filter((g) => !g.year || g.year === year);

  if (!loaded) {
    return (
      <div className="app"><Style />
        <div style={{ padding: 40, color: "#647389", fontFamily: "Inter, sans-serif" }}>Loading the board…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Style />

      <aside className="rail">
        <div className="wordmark">BOX UNITED<small>TEAM DASHBOARD</small></div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={`navitem ${active === n.id ? "active" : ""}`} onClick={() => go(n.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon} /></svg>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="rail-foot">
          <div>Q{quarter} {year}: <b>{qRocks.length ? `${doneCount}/${qRocks.length} rocks done` : "no rocks yet"}</b></div>
          <div className={`save-dot ${saveState === "saved" || saveState === "idle" ? "on" : ""}`}>
            <i /> <span>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed — retry" : "All changes saved"}</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <p className="eyebrow">Box United</p>
            <h1 className="title">Team dashboard</h1>
            <div className="sub">Goals, rocks, decisions, and the running meeting list — one place, shared by all three of us.</div>
          </div>
        </div>

        {/* ——— goals & values ——— */}
        <div id="sec-foundations" className="anchor" />
        <div className="grid2 top-align">
          <div className="card fade">
            <div className="sec-head">
              <div className="left"><h2>Annual goals · {year}</h2><p className="hint" style={{ margin: 0 }}>What we committed to this year. Click a status to change it.</p></div>
            </div>
            <div className="rowlist">
              {yearGoals.map((g) => (
                <div key={g.id} className="prow">
                  <div className="body"><div className="ptitle">{g.title}</div></div>
                  <button className={`pill ${GOAL_STATUS[g.status]?.cls || "plan"}`}
                    onClick={() => updateFoundations((f) => { const x = f.goals.find((z) => z.id === g.id); if (x) x.status = GOAL_STATUS[x.status]?.next || "work"; return f; })}>
                    {GOAL_STATUS[g.status]?.label || "Planned"}
                  </button>
                  <button className="xbtn" title="Remove" onClick={() => updateFoundations((f) => { f.goals = f.goals.filter((z) => z.id !== g.id); return f; })}>✕</button>
                </div>
              ))}
              {yearGoals.length === 0 && <div className="empty-state">No annual goals for {year} yet — add the big ones below.</div>}
            </div>
            <InlineAdd placeholder={`New goal for ${year}…`} onAdd={(v) => updateFoundations((f) => { f.goals.push({ id: uid(), title: v, status: "work", year }); return f; })} />
          </div>

          <div className="card fade">
            <div className="sec-head">
              <div className="left"><h2>Our values</h2><p className="hint" style={{ margin: 0 }}>The things we don't compromise on.</p></div>
            </div>
            <div className="values">
              {foundations.values.map((v) => (
                <span key={v.id} className="value">{v.text}
                  <button aria-label={`Remove ${v.text}`} onClick={() => updateFoundations((f) => { f.values = f.values.filter((z) => z.id !== v.id); return f; })}>✕</button>
                </span>
              ))}
              {foundations.values.length === 0 && <div className="empty-state">No values written down yet.</div>}
            </div>
            <InlineAdd placeholder="Add a value…" onAdd={(v) => updateFoundations((f) => { f.values.push({ id: uid(), text: v }); return f; })} />
          </div>
        </div>

        {/* ——— quarter hero ——— */}
        <div id="sec-rocks" className="anchor" />
        <div className="card onecard fade">
          <div className="hello">Q{quarter} {year}</div>
          <div className="onelabel">The quarter at a glance</div>
          <div className="onebig">
            {qRocks.length === 0
              ? `No rocks set for Q${quarter} yet — add each person's 1–3 big things below.`
              : `${doneCount} of ${qRocks.length} rocks done.`}
          </div>
          <div className="onesrc herochips">
            {PEOPLE.map((p) => {
              const mine = qRocks.filter((r) => r.owner === p.key);
              return (
                <span key={p.key} className="hero-chip">
                  <b>{p.initials}</b>
                  {mine.length === 0 ? <i className="dot empty" /> : mine.map((r) => <i key={r.id} className={`dot ${r.status}`} />)}
                </span>
              );
            })}
          </div>
        </div>

        {/* ——— rocks ——— */}
        <div className="card fade">
          <div className="sec-head">
            <div className="left"><h2>Quarterly rocks</h2><p className="hint" style={{ margin: 0 }}>Each person's 1–3 big things for the quarter. Click a status pill to update it.</p></div>
            <div className="month-pick">
              <button className="btn sm" onClick={syncMonday} disabled={syncing}>{syncing ? "Syncing Monday…" : "Sync Monday"}</button>
              <button className="yearbtn" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">‹</button>
              <span className="yearlbl">{year}</span>
              <button className="yearbtn" onClick={() => setYear((y) => y + 1)} aria-label="Next year">›</button>
              <div className="seg">
                {[1, 2, 3, 4].map((q) => (
                  <button key={q} className={q === quarter ? "on" : ""} onClick={() => setQuarter(q)}>Q{q}</button>
                ))}
              </div>
            </div>
          </div>

          {(monday || syncError) && (
            <div className="syncline">
              {syncError ? <span className="syncerr">{syncError}</span> : <>Live from Monday.com · synced {syncedAgo()} · detail lives in Monday, this is the pulse</>}
            </div>
          )}

          <div className="rockcols">
            {PEOPLE.map((p) => {
              const mine = qRocks.filter((r) => r.owner === p.key);
              const ms = monday?.stats?.[p.key];
              return (
                <div key={p.key} className="rockcol">
                  <div className="leaderbar">
                    <div className="avatar">{p.initials}</div>
                    <div><div className="nm">{p.name}</div><div className="rl">{p.role}</div></div>
                  </div>
                  {ms && (
                    <div className="mstats">
                      <span className="mstat"><b>{ms.open ?? 0}</b> open</span>
                      <span className="mstat"><b>{ms.dueSoon ?? 0}</b> due this week</span>
                      <span className={`mstat ${ms.overdue > 0 ? "bad" : ""}`}><b>{ms.overdue ?? 0}</b> overdue</span>
                    </div>
                  )}

                  {mine.length === 0 && addingFor !== p.key && <div className="empty-state">No rocks this quarter yet.</div>}

                  {mine.map((r) => (
                    <div key={r.id} className={`prow rockrow ${r.status === "done" ? "isdone" : ""}`}>
                      {editingRock === r.id ? (
                        <RockForm initial={r} onCancel={() => setEditingRock(null)}
                          onSave={(vals) => {
                            updateRocks((all) => { const x = (all[qKey] || []).find((z) => z.id === r.id); if (x) { x.title = vals.title; x.detail = vals.detail; x.link = vals.link; } return all; });
                            setEditingRock(null);
                          }} />
                      ) : (
                        <>
                          <div className="body">
                            <div className="ptitle">{r.title}</div>
                            {r.detail && <div className="pdetail">{r.detail}</div>}
                            {r.link && <a className="mlink" href={r.link} target="_blank" rel="noopener noreferrer">Open in Monday →</a>}
                            <div className="rowactions">
                              <button className="btn ghost sm" onClick={() => setEditingRock(r.id)}>Edit</button>
                              <button className="btn danger sm" onClick={() => { if (window.confirm(`Remove "${r.title}"?`)) updateRocks((all) => { all[qKey] = (all[qKey] || []).filter((z) => z.id !== r.id); return all; }); }}>Remove</button>
                            </div>
                          </div>
                          <button className={`pill ${ROCK_STATUS[r.status].cls}`} title="Click to change status"
                            onClick={() => updateRocks((all) => { const x = (all[qKey] || []).find((z) => z.id === r.id); if (x) x.status = ROCK_STATUS[x.status].next; return all; })}>
                            {ROCK_STATUS[r.status].label}
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {addingFor === p.key ? (
                    <RockForm onCancel={() => setAddingFor(null)}
                      onSave={(vals) => {
                        updateRocks((all) => {
                          const list = (all[qKey] = all[qKey] || []);
                          if (list.filter((z) => z.owner === p.key).length >= 3) return all;
                          list.push({ id: uid(), owner: p.key, title: vals.title, detail: vals.detail, link: vals.link, status: "on_track" });
                          return all;
                        });
                        setAddingFor(null);
                      }} />
                  ) : (
                    mine.length < 3 && <button className="addrock" onClick={() => setAddingFor(p.key)}>+ Add a rock ({mine.length}/3)</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ——— decisions ——— */}
        <div id="sec-decisions" className="anchor" />
        <div className="card fade">
          <div className="sec-head">
            <div className="left"><h2>Decisions log</h2><p className="hint" style={{ margin: 0 }}>What we decided, when, and who called it — so nothing gets re-litigated.</p></div>
            <button className="btn primary" onClick={() => setShowDecisionForm((s) => !s)}>{showDecisionForm ? "Close" : "+ Log a decision"}</button>
          </div>

          {showDecisionForm && (
            <DecisionForm onSave={(d) => { updateDecisions((all) => { all.unshift({ id: uid(), ...d }); return all; }); setShowDecisionForm(false); }} />
          )}

          <div className="feed">
            {decisions.length === 0 && <div className="empty-state">No decisions logged yet. The next time the team settles something, write it down here.</div>}
            {decisions.map((d) => {
              const who = PEOPLE.find((p) => p.key === d.by);
              return (
                <div key={d.id} className="note">
                  <div className="meta">{niceDate(d.date)}{who ? ` · decided by ${who.name.split(" ")[0]}` : ""}</div>
                  <div className="ntitle">{d.title}</div>
                  {d.context && <div className="txtbody">{d.context}</div>}
                  <button className="btn danger sm" style={{ marginTop: 4 }} onClick={() => { if (window.confirm("Remove this decision?")) updateDecisions((all) => all.filter((z) => z.id !== d.id)); }}>Delete</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ——— meeting topics ——— */}
        <div id="sec-topics" className="anchor" />
        <div className="card fade">
          <div className="sec-head">
            <div className="left"><h2>Team meeting topics</h2><p className="hint" style={{ margin: 0 }}>A running list — add a topic anytime, check it off once it's covered.</p></div>
            {topics.some((t) => t.done) && (
              <button className="btn sm" onClick={() => { if (window.confirm("Clear all checked-off topics?")) updateTopics((all) => all.filter((t) => !t.done)); }}>Clear covered</button>
            )}
          </div>
          <div className="rowlist">
            {topics.length === 0 && <div className="empty-state">Nothing queued for the next meeting yet.</div>}
            {topics.map((t) => (
              <div key={t.id} className={`prow ${t.done ? "isdone" : ""}`}>
                <input type="checkbox" className="check" checked={t.done}
                  onChange={(e) => updateTopics((all) => { const x = all.find((z) => z.id === t.id); if (x) x.done = e.target.checked; return all; })} />
                <div className="body">
                  <div className="ptitle">{t.text}</div>
                  {t.by && <div className="pdetail">added by {PEOPLE.find((p) => p.key === t.by)?.name.split(" ")[0] || t.by}</div>}
                </div>
                <button className="xbtn" title="Remove" onClick={() => updateTopics((all) => all.filter((z) => z.id !== t.id))}>✕</button>
              </div>
            ))}
          </div>
          <TopicAdd onAdd={(text, by) => updateTopics((all) => { all.push({ id: uid(), text, by, done: false }); return all; })} />
        </div>

        <div className="foot">Shared board — everyone on the team sees the same data. Rocks are the 1–3 big things each person commits to per quarter.</div>
      </main>
    </div>
  );
}

function RockForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [detail, setDetail] = useState(initial?.detail || "");
  const [link, setLink] = useState(initial?.link || "");
  const cleanLink = () => {
    const l = link.trim();
    if (!l) return "";
    return /^https?:\/\//i.test(l) ? l : `https://${l}`;
  };
  const submit = () => onSave({ title: title.trim(), detail: detail.trim(), link: cleanLink() });
  return (
    <div className="rockform">
      <input autoFocus className="txt" placeholder="The rock — one big thing this quarter" value={title} onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) submit(); }} />
      <input className="txt" placeholder="Detail (optional) — what done looks like" value={detail} onChange={(e) => setDetail(e.target.value)} />
      <input className="txt" placeholder="Monday.com link (optional) — the board where this rock's tasks live" value={link} onChange={(e) => setLink(e.target.value)} />
      <div className="formrow">
        <button className="btn primary sm" disabled={!title.trim()} onClick={submit}>{initial ? "Save changes" : "Add rock"}</button>
        <button className="btn sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function TopicAdd({ onAdd }) {
  const [v, setV] = useState("");
  const [by, setBy] = useState("mk");
  const commit = () => { const t = v.trim(); if (!t) return; onAdd(t, by); setV(""); };
  return (
    <div className="inline-add">
      <input className="txt" placeholder="Add a topic for the next team meeting…" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commit()} />
      <select className="txt sel" value={by} onChange={(e) => setBy(e.target.value)} aria-label="Who's adding this">
        {PEOPLE.map((p) => <option key={p.key} value={p.key}>{p.name.split(" ")[0]}</option>)}
      </select>
      <button className="btn" onClick={commit}>Add</button>
    </div>
  );
}

function InlineAdd({ placeholder, onAdd }) {
  const [v, setV] = useState("");
  const commit = () => { const t = v.trim(); if (!t) return; onAdd(t); setV(""); };
  return (
    <div className="inline-add">
      <input className="txt" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commit()} />
      <button className="btn" onClick={commit}>Add</button>
    </div>
  );
}

function DecisionForm({ onSave }) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [by, setBy] = useState("mk");
  const [date, setDate] = useState(todayISO());
  return (
    <div className="decform">
      <input autoFocus className="txt" placeholder="What was decided" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="txt" placeholder="Context — why, and anything future-us should know (optional)" value={context} onChange={(e) => setContext(e.target.value)} />
      <div className="formrow">
        <select className="txt sel" value={by} onChange={(e) => setBy(e.target.value)}>
          {PEOPLE.map((p) => <option key={p.key} value={p.key}>{p.name.split(" ")[0]}</option>)}
        </select>
        <input type="date" className="txt sel" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn primary" disabled={!title.trim()} onClick={() => onSave({ title: title.trim(), context: context.trim(), by, date })}>Log decision</button>
      </div>
    </div>
  );
}

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

      :root{
        --navy:#0B1E39; --navy-2:#102950; --ink:#16243B; --muted:#647389; --muted-2:#8a98ac;
        --brand:#2563EB; --brand-bright:#3B82F6; --page:#EEF2F7; --cardbg:#FFFFFF;
        --line:#E3E9F2; --line-soft:#EEF2F7;
        --done-fg:#15803D; --done-bg:#DCFCE7;
        --work-fg:#B45309; --work-bg:#FEF3C7;
        --plan-fg:#475569; --plan-bg:#EEF2F7;
        --blue-fg:#1D4ED8; --blue-bg:#DBEAFE;
        --danger:#DC2626;
        --shadow:0 1px 2px rgba(16,41,80,.06), 0 8px 24px rgba(16,41,80,.06);
        --radius:14px;
      }
      .app *{box-sizing:border-box}
      .app{
        display:grid;grid-template-columns:248px 1fr;min-height:100vh;
        font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--page);color:var(--ink);
        line-height:1.45;-webkit-font-smoothing:antialiased;
      }

      .rail{background:var(--navy);color:#fff;padding:22px 16px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
      .wordmark{font-family:'Archivo',sans-serif;font-weight:900;letter-spacing:.14em;font-size:17px;color:var(--brand-bright);line-height:1.1;padding:4px 10px 18px}
      .wordmark small{display:block;font-size:9.5px;letter-spacing:.32em;color:#7e93b4;font-weight:700;margin-top:5px}
      .rail nav{display:flex;flex-direction:column;gap:2px;margin-top:6px}
      .navitem{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:10px;color:#b9c6dc;font-weight:600;font-size:14px;cursor:pointer;border:none;background:none;text-align:left;width:100%;position:relative;transition:background .15s,color .15s;font-family:inherit}
      .navitem svg{width:17px;height:17px;flex:0 0 auto;opacity:.9}
      .navitem:hover{background:rgba(255,255,255,.05);color:#e7eefb}
      .navitem.active{background:var(--navy-2);color:#fff}
      .navitem.active::before{content:"";position:absolute;left:-16px;top:8px;bottom:8px;width:4px;background:var(--brand-bright);border-radius:0 4px 4px 0}
      .rail-foot{margin-top:auto;padding:12px 10px 2px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:#7e93b4;line-height:1.5}
      .rail-foot b{color:#aebdd6;font-weight:600}
      .save-dot{display:inline-flex;align-items:center;gap:6px;margin-top:8px;color:#7e93b4;font-size:11px}
      .save-dot i{width:7px;height:7px;border-radius:50%;background:#3f5170;transition:background .2s;display:inline-block}
      .save-dot.on i{background:#36d399}

      main.main{padding:28px 34px 60px;max-width:1080px}
      .topbar{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}
      .eyebrow{font-family:'Archivo',sans-serif;font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--brand);margin:0 0 6px}
      h1.title{font-family:'Archivo',sans-serif;font-weight:800;font-size:27px;letter-spacing:-.01em;margin:0;color:var(--navy)}
      .sub{color:var(--muted);font-size:13.5px;margin-top:5px}
      .anchor{scroll-margin-top:16px}

      .btn{font-family:'Inter';font-weight:600;font-size:13px;border:1px solid var(--line);background:#fff;color:var(--ink);padding:9px 14px;border-radius:10px;cursor:pointer;transition:.15s;white-space:nowrap}
      .btn:hover{border-color:#c7d3e6;background:#fbfcfe}
      .btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
      .btn.primary:hover{background:#1d57d6}
      .btn.primary:disabled{opacity:.55;cursor:not-allowed}
      .btn.ghost{background:none;border:none;color:var(--brand);padding:6px 4px}
      .btn.ghost:hover{text-decoration:underline}
      .btn.sm{padding:6px 10px;font-size:12px;border-radius:8px}
      .btn.danger{color:var(--danger);border:none;background:none;padding:6px}
      .btn.danger:hover{text-decoration:underline}
      .xbtn{border:none;background:none;color:var(--danger);cursor:pointer;font-size:12px;padding:6px}
      .xbtn:hover{opacity:.75}

      .card{background:var(--cardbg);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px;margin-bottom:20px}
      .card h2{font-family:'Archivo';font-weight:700;font-size:16px;color:var(--navy);margin:0 0 3px}
      .card .hint{color:var(--muted);font-size:12.5px;margin:0 0 16px}
      .sec-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;flex-wrap:wrap}
      .sec-head .left h2{margin-bottom:2px}

      .rowlist{display:flex;flex-direction:column;gap:9px}
      .prow{display:flex;align-items:flex-start;gap:13px;padding:13px 14px;border:1px solid var(--line);border-radius:11px;background:#fff}
      .prow:hover{border-color:#d4deee}
      .prow .body{flex:1;min-width:0}
      .prow .ptitle{font-weight:600;font-size:14px;color:var(--ink)}
      .prow .pdetail{font-size:12.5px;color:var(--muted);margin-top:3px}
      .prow.isdone .ptitle{color:var(--muted);text-decoration:line-through;text-decoration-color:#bcc8db}
      .rowactions{display:flex;gap:8px;margin-top:6px}

      .pill{font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;letter-spacing:.02em;white-space:nowrap;border:1px solid transparent;display:inline-block;cursor:pointer;font-family:'Inter'}
      .pill.done{color:var(--done-fg);background:var(--done-bg)}
      .pill.work{color:var(--work-fg);background:var(--work-bg)}
      .pill.plan{color:var(--plan-fg);background:var(--plan-bg)}
      .pill.blue{color:var(--blue-fg);background:var(--blue-bg)}

      .check{appearance:none;-webkit-appearance:none;width:19px;height:19px;border:2px solid #c4d0e3;border-radius:6px;cursor:pointer;flex:0 0 auto;margin-top:1px;position:relative;transition:.12s;background:#fff}
      .check:checked{background:var(--brand);border-color:var(--brand)}
      .check:checked::after{content:"";position:absolute;left:5px;top:1px;width:5px;height:10px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}

      .txt{width:100%;font-family:'Inter';font-size:13.5px;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:#fff;resize:vertical}
      .txt:focus{outline:none;border-color:var(--brand-bright);box-shadow:0 0 0 3px rgba(59,130,246,.13)}
      textarea.txt{min-height:78px;line-height:1.55}
      .sel{width:auto}
      .inline-add{display:flex;gap:9px;margin-top:12px}
      .inline-add .txt{flex:1}
      .formrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .rockform{border:1px solid var(--brand-bright);border-radius:11px;padding:11px;display:flex;flex-direction:column;gap:8px;background:#fbfdff;flex:1}
      .decform{display:flex;flex-direction:column;gap:8px;border:1px solid var(--brand-bright);border-radius:11px;padding:12px;background:#fbfdff;margin-bottom:14px}

      .feed{display:flex;flex-direction:column;gap:10px;margin-top:6px}
      .note{border:1px solid var(--line);border-left:3px solid var(--brand-bright);border-radius:10px;padding:11px 13px;background:#fbfcff}
      .note .meta{font-size:11px;color:var(--muted-2);font-weight:600;margin-bottom:4px;letter-spacing:.02em}
      .note .ntitle{font-weight:600;font-size:13.5px;color:var(--ink)}
      .note .txtbody{font-size:13px;color:var(--muted);margin-top:3px;white-space:pre-wrap}
      .empty-state{color:var(--muted-2);font-size:13px;font-style:italic;padding:6px 2px}

      .seg{display:inline-flex;background:var(--line-soft);border:1px solid var(--line);border-radius:10px;padding:3px;gap:3px}
      .seg button{border:none;background:none;font-family:'Inter';font-weight:600;font-size:12.5px;color:var(--muted);padding:6px 13px;border-radius:7px;cursor:pointer}
      .seg button.on{background:#fff;color:var(--navy);box-shadow:0 1px 2px rgba(16,41,80,.08)}
      .month-pick{display:flex;align-items:center;gap:8px}
      .yearbtn{border:1px solid var(--line);background:#fff;border-radius:8px;width:26px;height:26px;cursor:pointer;color:var(--ink);font-size:14px;line-height:1}
      .yearbtn:hover{border-color:#c7d3e6}
      .yearlbl{font-family:'Archivo';font-weight:800;font-size:14px;color:var(--navy)}

      .leaderbar{display:flex;align-items:center;gap:11px;margin-bottom:12px}
      .avatar{width:38px;height:38px;border-radius:10px;background:var(--navy);color:#fff;display:grid;place-items:center;font-family:'Archivo';font-weight:800;font-size:14px}
      .leaderbar .nm{font-family:'Archivo';font-weight:700;font-size:15px;color:var(--navy)}
      .leaderbar .rl{font-size:12px;color:var(--muted)}

      .rockcols{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
      @media(max-width:960px){.rockcols{grid-template-columns:1fr}}
      .rockcol{display:flex;flex-direction:column;gap:9px}
      .rockrow{align-items:flex-start}
      .syncline{font-size:11.5px;color:var(--muted-2);margin:-6px 0 12px}
      .syncerr{color:var(--danger);font-weight:600}
      .mstats{display:flex;gap:6px;flex-wrap:wrap;margin:-2px 0 4px}
      .mstat{background:#fff;border:1px solid var(--line);border-radius:8px;padding:5px 9px;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
      .mstat b{font-family:'Archivo';font-weight:800;font-size:13px;color:var(--navy);margin-right:4px;letter-spacing:0}
      .mstat.bad{border-color:#fecaca;background:#fef2f2}
      .mstat.bad b{color:var(--danger)}
      .mlink{display:inline-block;font-size:12px;font-weight:600;color:var(--brand);text-decoration:none;margin-top:4px}
      .mlink:hover{text-decoration:underline}
      .addrock{width:100%;border:1.5px dashed #c4d0e3;background:none;border-radius:11px;padding:10px;color:var(--muted);font-weight:600;font-size:12.5px;cursor:pointer;font-family:'Inter'}
      .addrock:hover{border-color:var(--brand-bright);color:var(--brand)}

      .onecard{background:linear-gradient(135deg,#0B1E39 0%,#1a3a6b 100%);color:#fff;border:none}
      .onecard .hello{font-family:'Archivo';font-weight:800;font-size:14px;color:#9fc0ff;letter-spacing:.01em}
      .onecard .onelabel{font-size:11px;color:#9db4d8;margin-top:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:700}
      .onecard .onebig{font-family:'Archivo';font-weight:800;font-size:23px;line-height:1.3;margin-top:7px;color:#fff;letter-spacing:-.01em}
      .onecard .onesrc{font-size:12px;color:#8aa3cc;margin-top:11px}
      .herochips{display:flex;gap:10px;flex-wrap:wrap}
      .hero-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:5px 11px}
      .hero-chip b{font-family:'Archivo';font-weight:800;font-size:11px;color:#cfe0ff}
      .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
      .dot.on_track{background:#36d399}
      .dot.off_track{background:#fbbf24}
      .dot.done{background:#93c5fd}
      .dot.empty{background:rgba(255,255,255,.25)}

      .values{display:flex;flex-wrap:wrap;gap:8px}
      .value{display:inline-flex;align-items:center;gap:7px;background:#f2f6fc;border:1px solid #dbe5f3;color:var(--navy);font-weight:600;font-size:13px;padding:7px 12px;border-radius:999px}
      .value button{border:none;background:none;color:var(--muted-2);cursor:pointer;font-size:11px;padding:0}
      .value button:hover{color:var(--danger)}

      .grid2{display:grid;grid-template-columns:1.35fr 1fr;gap:16px}
      .grid2.top-align{align-items:start}
      @media(max-width:960px){.grid2{grid-template-columns:1fr}}

      .fade{animation:fade .22s ease}
      @keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      @media (prefers-reduced-motion: reduce){.fade{animation:none}}

      .foot{color:var(--muted-2);font-size:11.5px;margin-top:6px}

      @media(max-width:880px){
        .app{grid-template-columns:1fr}
        .rail{position:static;height:auto;flex-direction:row;align-items:center;gap:6px;padding:12px 14px;overflow-x:auto}
        .wordmark{padding:0 10px 0 0;white-space:nowrap}
        .rail nav{flex-direction:row;margin-top:0}
        .navitem{white-space:nowrap;padding:8px 10px}
        .navitem.active::before{display:none}
        .rail-foot{display:none}
        main.main{padding:20px 16px 48px}
      }
    `}</style>
  );
}
