import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import TrendsTab from "../components/l1/TrendsTab";
import SkillsTab from "../components/l1/SkillsTab";
import VulnerabilityTab from "../components/l1/VulnerabilityTab";
import EarlyWarning from "../components/l1/EarlyWarning";
import EmployerGap from "../components/l1/EmployerGap";
import AdminPanel from "../components/l1/AdminPanel";
import WorkerPage from "./WorkerPage";

// ── Particle background (same as Home.jsx) ────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const mouse = { x: -9999, y: -9999 };
    const onMouse = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMouse);
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const NODES = 160;
    const nodes = Array.from({ length: NODES }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.1, vy: (Math.random() - 0.5) * 1.1,
      r: 2.5 + Math.random() * 3, teal: Math.random() > 0.75,
    }));
    const CONNECT_DIST = 200, MOUSE_DIST = 160;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.sqrt(dx*dx+dy*dy);
        if (d < MOUSE_DIST) { ctx.beginPath(); ctx.strokeStyle=`rgba(0,212,177,${0.55*(1-d/MOUSE_DIST)})`; ctx.lineWidth=1.2; ctx.moveTo(n.x,n.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke(); }
      });
      for (let i=0;i<NODES;i++) for (let j=i+1;j<NODES;j++) {
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<CONNECT_DIST) { const a=0.45*(1-dist/CONNECT_DIST); ctx.beginPath(); ctx.strokeStyle=nodes[i].teal||nodes[j].teal?`rgba(0,212,177,${a})`:`rgba(244,63,114,${a})`; ctx.lineWidth=0.8; ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke(); }
      }
      nodes.forEach(n => {
        const col = n.teal ? "0,212,177" : "244,63,114";
        const g = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*3);
        g.addColorStop(0,`rgba(${col},0.6)`); g.addColorStop(1,`rgba(${col},0)`);
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r*3,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fillStyle=`rgba(${col},0.95)`; ctx.fill();
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<0||n.x>canvas.width) n.vx*=-1;
        if(n.y<0||n.y>canvas.height) n.vy*=-1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); window.removeEventListener("mousemove",onMouse); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

// ── TABS — unchanged from original ───────────────────────────────────────────
const TABS = [
  { id: "trends",   label: "Hiring Trends",      group: "L1" },
  { id: "skills",   label: "Skills Intel",        group: "L1" },
  { id: "vuln",     label: "Vulnerability Index", group: "L1" },
  { id: "warning",  label: "Early Warning",       group: "L1", bonus: true },
  { id: "employer", label: "Employer Gap",        group: "L1", bonus: true },
  { id: "worker",   label: "My Risk & Plan",      group: "L2" },
  { id: "admin",    label: "Scraper",             group: "admin" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("trends");

  return (
    <div style={d.page}>
      {/* Particle canvas sits behind everything */}
      <ParticleField />

      {/* zIndex:1 wrapper so all dashboard content floats above canvas */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={d.container}>

          {/* Header — ORIGINAL UNCHANGED */}
          <div style={d.header}>
            <div>
              <div style={d.titleRow}>
                <h1 style={d.title}>SkillsMirage</h1>
                <span style={d.l1Tag}>Live Intelligence</span>
              </div>
              <p style={d.sub}>
                India's open workforce intelligence system · 20 cities · L1
                signals feed L2 risk scores live
              </p>
            </div>
            <div style={d.userBadge}>
              <div style={d.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
              <div>
                <div style={d.userName}>{user?.name}</div>
                <div style={d.userRole}>Logged in</div>
              </div>
            </div>
          </div>

          {/* Layer labels + tabs — ORIGINAL UNCHANGED */}
          <div style={d.tabSection}>
            <div style={d.layerRow}>
              <div style={d.layerLabel}>
                <span style={d.l1Dot} />
                Layer 1 — Job Market Dashboard
              </div>
              <div style={d.layerLabel}>
                <span style={d.l2Dot} />
                Layer 2
              </div>
            </div>
            <div style={d.tabBar}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  style={{
                    ...d.tab,
                    ...(activeTab === tab.id
                      ? tab.group === "L2" ? d.tabActiveL2 : d.tabActive
                      : {}),
                    ...(tab.bonus ? d.tabBonus : {}),
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.bonus && <span style={d.bonusBadge}>BONUS</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Content — ORIGINAL UNCHANGED */}
          <div style={d.content}>
            {activeTab === "trends"   && <TrendsTab />}
            {activeTab === "skills"   && <SkillsTab />}
            {activeTab === "vuln"     && <VulnerabilityTab />}
            {activeTab === "warning"  && <EarlyWarning />}
            {activeTab === "employer" && <EmployerGap />}
            {activeTab === "worker"   && <WorkerPage />}
            {activeTab === "admin"    && <AdminPanel />}
          </div>

        </div>
      </div>
    </div>
  );
};

// ── Styles — EXACTLY the original, only background made transparent ───────────
const d = {
  page: {
    minHeight: "90vh",
    background: "#0d0f1a",   // dark so particles are visible
    color: "#fff",
    padding: "2rem",
    position: "relative",    // needed so fixed canvas z-index works
  },
  container: { maxWidth: "1300px", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.25rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.25rem",
  },
  title: { margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#fff" },
  l1Tag: {
    background: "#e9456022",
    color: "#e94560",
    border: "1px solid #e9456066",
    borderRadius: "4px",
    fontSize: "0.68rem",
    padding: "0.15rem 0.5rem",
    letterSpacing: "0.06em",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  sub: { color: "#606080", margin: 0, fontSize: "0.82rem" },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "8px",
    padding: "0.6rem 1rem",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#e94560",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.95rem",
    flexShrink: 0,
  },
  userName: { color: "#fff", fontSize: "0.85rem", fontWeight: 600 },
  userRole: { color: "#606080", fontSize: "0.72rem" },
  tabSection: { marginBottom: "1.25rem" },
  layerRow: { display: "flex", gap: "2rem", marginBottom: "0.4rem" },
  layerLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    color: "#606080",
    fontSize: "0.72rem",
    fontWeight: 600,
  },
  l1Dot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "#e94560", display: "inline-block",
  },
  l2Dot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "#4ec9b0", display: "inline-block",
  },
  tabBar: {
    display: "flex",
    gap: "0.2rem",
    background: "#1a1a2e",
    borderRadius: "10px",
    padding: "0.3rem",
    overflowX: "auto",
    flexWrap: "wrap",
  },
  tab: {
    padding: "0.5rem 0.85rem",
    background: "transparent",
    color: "#a0a0b0",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
    transition: "all 0.18s",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  tabActive:   { background: "#e94560", color: "#fff", fontWeight: 700 },
  tabActiveL2: { background: "#4ec9b0", color: "#0a1a14", fontWeight: 700 },
  tabBonus:    { color: "#a0a0b0" },
  bonusBadge: {
    background: "#f0a50033",
    color: "#f0a500",
    border: "1px solid #f0a50044",
    borderRadius: "3px",
    fontSize: "0.58rem",
    padding: "0.05rem 0.3rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  content: {
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "12px",
    padding: "1.5rem",
    minHeight: "400px",
  },
};

export default Dashboard;
