"use client";

import { FormEvent, useEffect, useState } from "react";

type Admin = { id: string; email: string };
type Agent = { agentId: string; name: string; description: string; queue: string; status?: string };
type Task = { taskId: string; agentId: string; type: string; status: string; attempts: number; createdAt: string; error?: string };
type Pool = { gameId: string; difficulty: string; available: number; minimum: number; target: number; status: string };
type Stats = { gameId: string; starts: number; completions: number; correct: number; incorrect: number; accuracy: number; completionRate: number };
type ContentRow = { contentId: string; gameId: string; difficulty: string; status: string; updatedAt?: string };
type ContentDetail = { content: ContentRow & Record<string, unknown>; versions: { version: number; changeReason: string; createdAt: string }[] };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? "Request failed");
  return body.data as T;
}

export function AdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getJson<{ authenticated: boolean; admin: Admin | null }>("/api/admin/auth/me")
      .then((data) => setAdmin(data.authenticated ? data.admin : null))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading command center...</div>;
  if (!admin) return <LoginPanel onLogin={setAdmin} initialError={error} />;
  return <CommandCenter admin={admin} onLogout={() => setAdmin(null)} />;
}

function LoginPanel({ onLogin, initialError }: { onLogin: (admin: Admin) => void; initialError: string }) {
  const [email, setEmail] = useState("admin@learnzzy.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(body?.error?.message ?? "Unable to sign in.");
    onLogin(body.data as Admin);
  }

  return (
    <main className="admin-shell admin-auth-shell">
      <div className="admin-auth-card">
        <div className="admin-eyebrow">LEARNZZY / OPERATIONS</div>
        <h1>Welcome back.</h1>
        <p>Sign in to inspect agents, content pools, and learning signals.</p>
        <form onSubmit={submit} className="admin-form">
          <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required /></label>
          <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required /></label>
          {error && <div className="admin-error">{error}</div>}
          <button disabled={busy} type="submit">{busy ? "Checking..." : "Enter command center"}</button>
        </form>
      </div>
    </main>
  );
}

function CommandCenter({ admin, onLogout }: { admin: Admin; onLogout: () => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [health, setHealth] = useState<Record<string, string | number>>({});
  const [providers, setProviders] = useState<{ provider: string; enabled: boolean; status: string; latencyMs: number | null; errorCount24h: number }[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [command, setCommand] = useState("Refill the addition easy-content pool");
  const [history, setHistory] = useState<Task[]>([]);
  const [contentRows, setContentRows] = useState<ContentRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [academic, setAcademic] = useState<{ plans: { planId: string; learnerId: string; concept: string; stage: string; source: string; reason: string }[]; voiceAssets: { cacheKey: string; characterId: string; event: string; locale: string; status: string }[]; signals: number; failedRecommendations: number } | null>(null);

  async function refresh() {
    const [a, t, p, analytics, h, edu, hist, content, acad] = await Promise.all([
      getJson<Agent[]>("/api/admin/agents"),
      getJson<Task[]>("/api/admin/tasks?limit=8"),
      getJson<Pool[]>("/api/admin/pools"),
      getJson<{ stats: Stats[] }>("/api/admin/analytics"),
      getJson<Record<string, string | number>>("/api/admin/system-health"),
      getJson<{ providers: { provider: string; enabled: boolean; status: string; latencyMs: number | null; errorCount24h: number }[] }>("/api/admin/education/health").catch(() => ({ providers: [] })),
      getJson<Task[]>("/api/admin/commands").catch(() => []),
      getJson<ContentRow[]>("/api/admin/content?limit=20").catch(() => []),
      getJson<{ plans: { planId: string; learnerId: string; concept: string; stage: string; source: string; reason: string }[]; voiceAssets: { cacheKey: string; characterId: string; event: string; locale: string; status: string }[]; signals: number; failedRecommendations: number }>("/api/admin/academic/plans").catch(() => null),
    ]);
    setAgents(a); setTasks(t); setPools(p); setStats(analytics.stats); setHealth(h); setProviders(edu.providers);
    setHistory(hist); setContentRows(content); setAcademic(acad);
  }

  useEffect(() => { refresh().catch((err) => setMessage(err.message)); }, []);

  async function generate() {
    setBusy(true); setMessage("");
    const res = await fetch("/api/admin/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gameId: "addition", difficulty: "easy", quantity: 10 }) });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? `Generation queued: ${body.data.task.taskId}` : body?.error?.message ?? "Unable to queue generation");
    if (res.ok) refresh().catch(() => undefined);
  }

  async function sendCommand() {
    if (!command.trim()) return;
    setBusy(true); setMessage("");
    const res = await fetch("/api/admin/commands", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ command: command.trim() }) });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    // Natural language becomes a structured, authorized task — never raw DB
    // access (BR-162/163). History below records the resulting task.
    setMessage(res.ok ? `Queued ${body.data.intent.agentId} · ${body.data.intent.type} (${body.data.task.taskId})` : body?.error?.message ?? "Unable to queue command");
    if (res.ok) refresh().catch(() => undefined);
  }

  async function review(contentId: string, action: "approve" | "reject" | "disable") {
    setMessage("");
    const res = await fetch(`/api/admin/content/${contentId}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(action === "reject" ? { reason: "Rejected by administrator" } : {}) });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? `${action} ok: ${contentId}` : body?.error?.message ?? `Unable to ${action}`);
    if (res.ok) {
      refresh().catch(() => undefined);
      inspect(contentId);
    }
  }

  async function inspect(contentId: string) {
    if (!contentId) return;
    setSelectedId(contentId);
    try {
      const d = await getJson<ContentDetail>(`/api/admin/content/${contentId}`);
      setDetail(d);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load versions");
    }
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    onLogout();
  }

  const healthyPools = pools.filter((p) => p.status === "healthy").length;
  const totalPools = pools.length;
  const runningTasks = tasks.filter((t) => t.status === "running" || t.status === "queued").length;

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div><div className="admin-eyebrow">LEARNZZY / OPERATIONS</div><h1>Command center</h1></div>
        <div className="admin-account"><span>{admin.email}</span><button onClick={logout} className="admin-quiet-button">Sign out</button></div>
      </header>
      <section className="admin-hero">
        <div><p className="admin-eyebrow">AGENTIC WORKFORCE</p><h2>Keep the learning world healthy.</h2><p>Deterministic games stay fast. Agents enrich the validated pool in the background.</p></div>
        <button onClick={generate} disabled={busy} className="admin-primary">{busy ? "Queueing..." : "Generate content"}</button>
      </section>
      {message && <div className="admin-notice">{message}</div>}
      <section className="admin-panel" aria-label="Agent command input" style={{ maxWidth: 1180, margin: "0 auto 16px" }}>
        <div className="admin-panel-heading"><div><span>COMMAND → STRUCTURED TASK</span><h3>What should Learnzzy do?</h3></div><i /></div>
        <div className="admin-form" style={{ marginTop: 0 }}>
          <label>Natural language (validated, authorized, audited)<input value={command} onChange={(e) => setCommand(e.target.value)} maxLength={500} placeholder="Refill the addition easy-content pool" /></label>
          <button disabled={busy} type="button" onClick={sendCommand}>{busy ? "Queueing..." : "Run command"}</button>
        </div>
      </section>
      <section className="admin-metrics" aria-label="System summary">
        <Metric label="Pool health" value={`${healthyPools}/${totalPools || 0}`} detail="healthy queues" />
        <Metric label="Background work" value={String(runningTasks)} detail="queued or running" />
        <Metric label="Agents online" value={String(agents.filter((a) => a.status !== "unavailable").length)} detail="least privilege" />
        <Metric label="Mongo" value={String(health.mongo ?? "checking")} detail={`${health.latencyMs ?? "-"} ms response`} />
      </section>
      <section className="admin-grid">
        <Panel title="Agent fleet" kicker="7 WORKERS">
          <div className="agent-list">{agents.map((agent) => <div className="agent-row" key={agent.agentId}><span className={`agent-dot ${agent.status === "unavailable" ? "offline" : ""}`} /><div><strong>{agent.name}</strong><small>{agent.description}</small></div><code>{agent.queue}</code></div>)}</div>
        </Panel>
        <Panel title="Content pools" kicker="ACTIVE ONLY">
          <div className="pool-list">{pools.map((pool) => <div className="pool-row" key={`${pool.gameId}-${pool.difficulty}`}><div><strong>{pool.gameId}</strong><small>{pool.difficulty}</small></div><span className={pool.status === "healthy" ? "pool-good" : "pool-low"}>{pool.available}/{pool.target}</span></div>)}</div>
        </Panel>
        <Panel title="Learning signals" kicker="LAST 30 DAYS">
          {stats.length === 0 ? <p className="admin-empty">No gameplay events yet.</p> : <div className="stats-list">{stats.map((stat) => <div className="stat-row" key={stat.gameId}><strong>{stat.gameId}</strong><span>{Math.round(stat.accuracy * 100)}% accuracy</span><small>{stat.correct + stat.incorrect} answers</small></div>)}</div>}
        </Panel>
        <Panel title="Recent tasks" kicker="AUDITABLE">
          {tasks.length === 0 ? <p className="admin-empty">No agent tasks yet.</p> : <div className="task-list">{tasks.map((task) => <div className="task-row" key={task.taskId}><div><strong>{task.type}</strong><small>{task.agentId} · attempt {task.attempts}</small></div><span className={`task-${task.status}`}>{task.status}</span></div>)}</div>}
        </Panel>
        <Panel title="Education providers" kicker="TUTOR · OER · NCERT">
          {providers.length === 0 ? <p className="admin-empty">Provider status unavailable.</p> : <div className="agent-list">{providers.map((pr) => <div className="agent-row" key={pr.provider}><span className={`agent-dot ${pr.enabled && pr.status === "healthy" ? "" : "offline"}`} /><div><strong>{pr.provider}</strong><small>{pr.enabled ? pr.status : "disabled"} · {pr.latencyMs ?? "-"} ms · {pr.errorCount24h} errors/24h</small></div><code>{pr.enabled ? "on" : "off"}</code></div>)}</div>}
        </Panel>
        <Panel title="Academic engine" kicker="PLANS · VOICE · SIGNALS">
          {!academic ? <p className="admin-empty">Academic data unavailable.</p> : (
            <div className="task-list">
              <div className="task-row"><div><strong>{academic.plans.length} plans</strong><small>{academic.signals} learning signals · {academic.failedRecommendations} failures</small></div><span>{academic.voiceAssets.length} voice</span></div>
              {academic.plans.slice(0, 5).map((pl) => (
                <div className="task-row" key={pl.planId}><div><strong>{pl.concept}</strong><small>{pl.learnerId} · {pl.stage} · {pl.source}</small></div><small>{pl.reason.slice(0, 40)}</small></div>
              ))}
              {academic.voiceAssets.slice(0, 3).map((v) => (
                <div className="task-row" key={v.cacheKey}><div><strong>{v.characterId} · {v.event}</strong><small>{v.locale} · {v.status}</small></div></div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Command history" kicker="STRUCTURED · AUDITED">
          {history.length === 0 ? <p className="admin-empty">No admin commands yet. Run one above.</p> : <div className="task-list">{history.slice(0, 8).map((task) => <div className="task-row" key={task.taskId}><div><strong>{task.type}</strong><small>{task.agentId} · {task.taskId}</small></div><span className={`task-${task.status}`}>{task.status}</span></div>)}</div>}
        </Panel>
        <Panel title="Content review" kicker="APPROVE · REJECT · DISABLE">
          {contentRows.length === 0 ? <p className="admin-empty">No content rows. Seed the pool or check Mongo.</p> : (
            <div className="task-list">
              {contentRows.slice(0, 10).map((row) => (
                <div className="task-row" key={row.contentId}>
                  <div><strong>{row.contentId}</strong><small>{row.gameId} · {row.difficulty} · {row.status}</small></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="admin-quiet-button" onClick={() => inspect(row.contentId)}>Versions</button>
                    <button type="button" className="admin-quiet-button" onClick={() => review(row.contentId, "approve")}>Approve</button>
                    <button type="button" className="admin-quiet-button" onClick={() => review(row.contentId, "disable")}>Disable</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {detail && (
            <div style={{ marginTop: 12 }}>
              <strong style={{ fontSize: 12 }}>{selectedId} versions</strong>
              {detail.versions.length === 0 ? <p className="admin-empty">No versions recorded.</p> : (
                <div className="task-list">{detail.versions.map((v) => <div className="task-row" key={`${v.version}-${v.createdAt}`}><div><strong>v{v.version}</strong><small>{v.changeReason}</small></div><small>{v.createdAt}</small></div>)}</div>
              )}
            </div>
          )}
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="admin-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Panel({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) { return <section className="admin-panel"><div className="admin-panel-heading"><div><span>{kicker}</span><h3>{title}</h3></div><i /></div>{children}</section>; }
