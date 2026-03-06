import { useState, useEffect } from "react";
import axios from "axios";
import {
  AreaChart, Area,
  ComposedChart, Bar, Line, Cell,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ============================================================================
// Color palette – clean, muted, professional (Stripe / Bloomberg inspired)
// ============================================================================
const C = {
  bg: "#0b0e14",
  surface: "#131720",
  card: "#1a1f2a",
  border: "#2a2f3a",
  accent: "#f43f72",
  teal: "#00b8a9",
  amber: "#f7b731",
  violet: "#a78bfa",
  text: "#edf2f7",
  textMuted: "#8f9bb3",
  grid: "#252a35",
};

const PIE_COLORS = ["#f43f72","#00b8a9","#f7b731","#a78bfa","#38bdf8","#34d399","#fb923c","#e879f9","#facc15","#94a3b8"];
const CITIES  = ["Bangalore","Mumbai","Delhi","Hyderabad","Pune","Chennai","Kolkata","Jaipur","Ahmedabad","Noida","Indore","Nagpur"];
const ROLES   = ["Data Entry","BPO","Data Analyst","Software Engineer","Customer Support","Content Writer","HR Executive","Accountant","Sales Executive","Digital Marketing"];
const WINDOWS = [7,30,90,365];

const fmt        = n => n >= 1000 ? (n/1000).toFixed(1) + "k" : String(n);
const sign       = n => (n > 0 ? "+" : "") + n + "%";
const trendColor = n => n > 0 ? C.teal : n < 0 ? C.accent : C.textMuted;

// ============================================================================
// Static skill suggestions by role (can be extended)
// ============================================================================
const SKILLS_BY_ROLE = {
  "software engineer": ["Python", "Machine Learning", "Prompt Engineering"],
  "data analyst": ["SQL", "Python", "Data Visualization", "Excel"],
  "data entry": ["Typing Speed", "Excel", "Data Management", "Attention to Detail"],
  "bpo": ["Communication", "CRM Tools", "Problem Solving", "Adaptability"],
  "customer support": ["Communication", "Empathy", "CRM", "Conflict Resolution"],
  "content writer": ["SEO", "Copywriting", "Content Strategy", "Editing"],
  "hr executive": ["Recruiting", "HRMS", "Employee Relations", "Communication"],
  "accountant": ["Tally", "GST", "Excel", "Financial Reporting"],
  "sales executive": ["Sales Techniques", "CRM", "Negotiation", "Communication"],
  "digital marketing": ["SEO", "Social Media", "Google Analytics", "Content Marketing"],
};

// Default skills for unknown roles
const DEFAULT_SKILLS = ["Critical Thinking", "Adaptability", "AI Literacy", "Communication"];

// ============================================================================
// Helper: derive role / city data + insights (unchanged logic)
// ============================================================================
function deriveAll(series) {
  const roleMap={}, cityMap={};
  for (const [label, pts] of Object.entries(series||{})) {
    const [city,role] = label.split(" — ").map(s=>s?.trim()||"");
    if (!city||!role) continue;
    const total = pts.reduce((a,p)=>a+p.count,0);
    const aiAvg = pts.length?pts.reduce((a,p)=>a+(p.ai_rate||0),0)/pts.length:0;
    const mid=Math.floor(pts.length/2);
    const prev=pts.slice(0,mid).reduce((a,p)=>a+p.count,0);
    const curr=pts.slice(mid).reduce((a,p)=>a+p.count,0);
    const change=prev>0?((curr-prev)/prev)*100:0;
    if(!roleMap[role]) roleMap[role]={postings:0,aiSum:0,aiCount:0,prevSum:0,currSum:0};
    roleMap[role].postings+=total; roleMap[role].aiSum+=aiAvg*(pts.length||1);
    roleMap[role].aiCount+=pts.length||1; roleMap[role].prevSum+=prev; roleMap[role].currSum+=curr;
    if(!cityMap[city]) cityMap[city]={postings:0,prevSum:0,currSum:0};
    cityMap[city].postings+=total; cityMap[city].prevSum+=prev; cityMap[city].currSum+=curr;
  }

  const roleComp = Object.entries(roleMap).map(([role,r])=>({
    role: role.length>14?role.slice(0,13)+"…":role, fullRole:role,
    postings: Math.round(r.postings),
    aiRate: parseFloat((r.aiCount?r.aiSum/r.aiCount:0).toFixed(3)),
    change: parseFloat((r.prevSum>0?((r.currSum-r.prevSum)/r.prevSum)*100:0).toFixed(1)),
  }));

  const cityData = Object.entries(cityMap).map(([city,c])=>({
    city, postings:Math.round(c.postings),
    change:parseFloat((c.prevSum>0?((c.currSum-c.prevSum)/c.prevSum)*100:0).toFixed(1)),
  })).sort((a,b)=>b.postings-a.postings);

  // ── Compute key insights ──────────────────────────────────────────────────
  const insights = [];

  const growingRoles = roleComp.filter(r=>r.change>0).sort((a,b)=>b.change-a.change);
  if (growingRoles.length>0) {
    const top=growingRoles[0];
    insights.push({text:`${top.fullRole} demand grew ${top.change.toFixed(0)}% this period — the fastest rising role in the market.` });
  } else {
    const mostStable = roleComp.reduce((a,b)=>Math.abs(a.change)<Math.abs(b.change)?a:b,roleComp[0]||{});
    if (mostStable) insights.push({ color:C.teal, icon:"⚖️", text:`${mostStable.fullRole} shows the most stable demand with only ${Math.abs(mostStable.change).toFixed(0)}% change this period.` });
  }

  const growingCities = cityData.filter(c=>c.change>0).sort((a,b)=>b.change-a.change);
  if (growingCities.length>0) {
    const top=growingCities[0];
    insights.push({text:`${top.city} is the fastest growing market — postings up ${top.change.toFixed(0)}% with ${fmt(top.postings)} active listings.` });
  } else {
    const leastDecline = cityData.sort((a,b)=>b.change-a.change)[0];
    if (leastDecline) insights.push({ color:C.amber, icon:"🏙️", text:`${leastDecline.city} leads with ${fmt(leastDecline.postings)} postings despite a softening market.` });
  }

  const highAI = [...roleComp].sort((a,b)=>b.aiRate-a.aiRate)[0];
  const lowAI  = [...roleComp].sort((a,b)=>a.aiRate-b.aiRate)[0];
  if (highAI && lowAI && highAI.fullRole!==lowAI.fullRole) {
    insights.push({ text:`${highAI.fullRole} has the highest AI exposure (${(highAI.aiRate*100).toFixed(0)}% of JDs) vs ${lowAI.fullRole} at ${(lowAI.aiRate*100).toFixed(0)}% — watch for displacement risk.` });
  }

  return { roleComp, cityData, insights };
}

// ============================================================================
// Sub‑components – clean, reusable cards and tooltips
// ============================================================================
function MetricCard({ label, value, sub, accent, change }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "20px 16px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    }}>
      <div style={{ color: C.textMuted, fontSize: 12, fontWeight: 600, letterSpacing: "0.03em", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ color: C.text, fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2 }}>{value}</span>
        {change !== undefined && (
          <span style={{
            color: trendColor(change),
            fontSize: 14,
            fontWeight: 600,
            background: change > 0 ? "rgba(0,184,169,0.1)" : change < 0 ? "rgba(244,63,114,0.1)" : "transparent",
            padding: "2px 8px",
            borderRadius: 20,
          }}>
            {change > 0 ? "▲" : change < 0 ? "▼" : "•"} {Math.abs(change)}%
          </span>
        )}
      </div>
      {sub && <div style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

// FIXED: Removed ResponsiveContainer wrapper so inner divs can handle layout
function ChartCard({ title, description, children, height = 180 }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "18px 16px 12px 16px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ marginBottom: 12, flexShrink: 0 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>{title}</h3>
        {description && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted }}>{description}</p>}
      </div>
      <div style={{ flex: 1, minHeight: height, position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

// New compact risk insight card
function RiskInsightCard({ role, city, change, aiRate, roleName }) {
  // Determine risk level
  let riskLevel = "Low";
  let riskColor = C.teal;
  if (change < -15 || aiRate > 0.6) { // Fixed: aiRate was compared to 60 but provided as decimal
    riskLevel = "High";
    riskColor = C.accent;
  } else if (change < -5 || aiRate > 0.3) { // Fixed: decimal comparison
    riskLevel = "Medium";
    riskColor = C.amber;
  }

  // Get suggested skills
  const roleKey = roleName?.toLowerCase() || "";
  const skills = SKILLS_BY_ROLE[roleKey] || DEFAULT_SKILLS;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${riskColor}`,
      borderRadius: 12,
      padding: "16px 20px",
      marginBottom: 16,
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    }}>
      <div style={{ flex: 2, minWidth: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>AI Career Risk Insight</span>
          <span style={{
            background: `${riskColor}20`,
            color: riskColor,
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 10px",
            borderRadius: 20,
            border: `1px solid ${riskColor}40`,
          }}>
            {riskLevel} Risk
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
          {roleName || "Selected role"} in {city || "selected city"} shows{" "}
          <span style={{ color: change < 0 ? C.accent : C.teal }}>{change > 0 ? "+" : ""}{change}%</span> change in postings
          and <span style={{ color: C.amber }}>{(aiRate * 100).toFixed(0)}%</span> of jobs mention AI tools.
        </p>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginBottom: 6 }}>Suggested skills to learn:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {skills.map(skill => (
            <span key={skill} style={{
              background: `${C.violet}20`,
              color: C.violet,
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 20,
              border: `1px solid ${C.violet}40`,
            }}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
      color: C.text,
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    }}>
      <div style={{ color: C.textMuted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === "number" && p.value < 1 ? (p.value * 100).toFixed(1) + "%" : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const DonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null;
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

// ============================================================================
// Main Component
// ============================================================================
export default function TrendsTab() {
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [win, setWin] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ window: win });
    if (city) p.append("city", city);
    if (role) p.append("role", role);
    axios.get(`/api/l1/trends?${p}`)
      .then(r => { if (r.data?.data) setData(r.data.data); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [city, role, win]);

  if (!data) {
    return (
      <div style={{
        background: C.bg,
        minHeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
      }}>
        <div style={{
          color: C.accent,
          fontFamily: "monospace",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: C.card,
          padding: "20px 32px",
          borderRadius: 40,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 18,
            height: 18,
            border: `2px solid ${C.border}`,
            borderTopColor: C.accent,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          {loading ? "Loading signals …" : "No data — Start Scraper in Admin"}
        </div>
      </div>
    );
  }

  const { roleComp, cityData, insights } = deriveAll(data.series);

  // Aggregate time series for area charts
  const dateMap = {};
  for (const pts of Object.values(data.series || {})) {
    for (const p of pts) {
      if (!dateMap[p.date]) dateMap[p.date] = { date: p.date, count: 0, ai_rate: 0, n: 0 };
      dateMap[p.date].count += p.count;
      dateMap[p.date].ai_rate += p.ai_rate || 0;
      dateMap[p.date].n += 1;
    }
  }
  const timeSeries = Object.values(dateMap)
    .map(x => ({ date: x.date, count: x.count, ai_pct: parseFloat((x.n ? (x.ai_rate / x.n) * 100 : 0).toFixed(1)) }))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const avgAiRate = timeSeries.length ? (timeSeries.reduce((a, b) => a + (b.ai_pct || 0), 0) / timeSeries.length).toFixed(1) : "0";

  // Donut data (top 8 roles)
  const totalPost = roleComp.reduce((a, r) => a + r.postings, 0);
  const donutData = [...roleComp].sort((a, b) => b.postings - a.postings).slice(0, 8).map(r => ({ name: r.role, value: r.postings }));

  // City composed chart
  const cityComposed = cityData.slice(0, 8).map(c => ({
    city: c.city.slice(0, 3),
    fullCity: c.city,
    postings: c.postings,
    change: c.change,
  }));

  // ===== Compute data for the risk insight =====
  let targetRole = role;
  let targetCity = city;
  let targetRoleData = null;
  if (!targetRole && roleComp.length > 0) {
    const topRole = roleComp.reduce((a, b) => a.postings > b.postings ? a : b, roleComp[0]);
    targetRole = topRole.fullRole;
    targetRoleData = topRole;
  } else {
    targetRoleData = roleComp.find(r => r.fullRole === targetRole);
  }
  if (!targetCity && cityData.length > 0) {
    targetCity = cityData[0].city; 
  }
  
  let roleChange = 0, roleAiRate = 0;
  if (targetRole && targetCity) {
    const key = `${targetCity} — ${targetRole}`;
    const pts = data.series?.[key];
    if (pts && pts.length) {
      const mid = Math.floor(pts.length / 2);
      const prev = pts.slice(0, mid).reduce((a, p) => a + p.count, 0);
      const curr = pts.slice(mid).reduce((a, p) => a + p.count, 0);
      roleChange = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      roleAiRate = pts.reduce((a, p) => a + (p.ai_rate || 0), 0) / pts.length;
    } else {
      if (targetRoleData) {
        roleChange = targetRoleData.change;
        roleAiRate = targetRoleData.aiRate;
      }
    }
  } else {
    roleChange = data.pct_change || 0;
    roleAiRate = avgAiRate / 100;
  }

  return (
    <div style={{
      background: C.bg,
      color: C.text,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: 24,
      maxWidth: 1200,
      margin: "0 auto",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ===== Filter Bar ===== */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 24,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "16px 20px",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.text }}>Hiring Trends</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textMuted }}>
            Real‑time job postings from Naukri & LinkedIn
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            style={{
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">All Cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6 }}>
            {WINDOWS.map(w => (
              <button
                key={w}
                onClick={() => setWin(w)}
                style={{
                  background: win === w ? C.accent : "transparent",
                  color: win === w ? "#fff" : C.textMuted,
                  border: `1px solid ${win === w ? C.accent : C.border}`,
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.1s",
                }}
              >
                {w === 365 ? "1Y" : `${w}D`}
              </button>
            ))}
          </div>
          {loading && (
            <span style={{ color: C.accent, fontSize: 12, fontFamily: "monospace" }}>
              ● syncing
            </span>
          )}
        </div>
      </div>

      {/* ===== Key Metrics (4 cards) ===== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 16,
      }}>
        <MetricCard
          label="Current Postings"
          value={fmt(data.current_total)}
          sub={`Last ${win} days`}
          change={data.pct_change}
        />
        <MetricCard
          label="Previous Period"
          value={fmt(data.previous_total)}
          sub={`Prior ${win} days`}
        />
        <MetricCard
          label="Period Change"
          value={sign(data.pct_change)}
          sub={data.pct_change > 0 ? "▲ Rising" : data.pct_change < 0 ? "▼ Falling" : "Stable"}
          change={data.pct_change}
        />
        <MetricCard
          label="Avg AI Mention Rate"
          value={`${avgAiRate}%`}
          sub="of JDs mention AI tools"
        />
      </div>

      {/* ===== AI Career Risk Insight Card ===== */}
      <RiskInsightCard
        role={role}
        city={city}
        change={Math.round(roleChange * 10) / 10}
        aiRate={roleAiRate}
        roleName={targetRole}
      />

      {/* ===== Charts Grid ===== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 16,
      }}>
        <ChartCard title="Posting Volume" description="Total job postings over time" height={180}>
          {/* FIXED: Added inner ResponsiveContainer */}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: C.textMuted }} width={35} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="count" stroke={C.accent} fill="url(#gP)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="AI Mention Rate" description="% of JDs referencing AI/automation" height={180}>
          {/* FIXED: Added inner ResponsiveContainer */}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.amber} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: C.textMuted }} width={35} tickFormatter={v => v + "%"} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="ai_pct" stroke={C.amber} fill="url(#gA)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 16,
      }}>
        {/* Role Share Card */}
        <ChartCard title="Role Share" description="Demand distribution (top 8 roles)" height={180}>
          <div style={{ display: "flex", alignItems: "center", height: "100%", gap: 12 }}>
            <div style={{ width: "45%", height: "100%" }}>
              {/* FIXED: Inner ResponsiveContainer scoped to exactly 45% width */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    label={DonutLabel}
                  >
                    {donutData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${fmt(v)} · ${((v / totalPost) * 100).toFixed(1)}%`, "Postings"]}
                    contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{
              width: "55%",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 180,
              overflowY: "auto",
              paddingRight: 4,
              justifyContent: "center"
            }}>
              {donutData.map((d, i) => (
                <div
                  key={i}
                  title={d.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 6px",
                    borderRadius: 6,
                    transition: "background 0.1s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = `${C.border}40`}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: PIE_COLORS[i % PIE_COLORS.length],
                    flexShrink: 0,
                  }} />
                  <span style={{
                    color: C.textMuted,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                  }}>
                    {d.name}
                  </span>
                  <span style={{
                    color: C.text,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 500,
                    marginLeft: 8,
                    flexShrink: 0,
                  }}>
                    {fmt(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="City Performance" description="Volume + trend (teal = growing, red = declining)" height={180}>
          {/* FIXED: Inner ResponsiveContainer */}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cityComposed} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="city" tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: C.textMuted }} width={35} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: C.textMuted }} width={35} tickFormatter={v => v + "%"} />
              <Tooltip content={<TT />} />
              <Bar yAxisId="left" dataKey="postings" name="Postings" radius={[4,4,0,0]}>
                {cityComposed.map((e, i) => (
                  <Cell key={i} fill={e.change >= 0 ? C.teal : C.accent} fillOpacity={0.8} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="change" name="Change %" stroke={C.amber} strokeWidth={2} dot={{ r: 3, fill: C.amber }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ===== Insights Card ===== */}
      {insights.length > 0 && (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderLeft: `4px solid ${C.violet}`,
          borderRadius: 12,
          padding: "20px 24px",
          marginTop: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Key insights</span>
            <span style={{ fontSize: 12, color: C.textMuted, marginLeft: "auto", fontFamily: "monospace" }}>
              {city || "all cities"} · {role || "all roles"} · last {win}d
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 16, lineHeight: 1.4 }}>{ins.icon || "•"}</span>
                <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Footer Timestamp ===== */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 24,
        paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
      }}>
        <span style={{ width: 6, height: 6, background: C.teal, borderRadius: "50%", display: "inline-block" }} />
        <span style={{ color: C.textMuted, fontSize: 11 }}>
          Data: Naukri scrape + PLFS microdata · Refreshed live · {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
        </span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        div::-webkit-scrollbar { width: 4px; }
        div::-webkit-scrollbar-track { background: ${C.surface}; border-radius: 4px; }
        div::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>
    </div>
  );
}