import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";

// Color palette
const C = {
  bg: "#0b0e14",
  surface: "#131720",
  card: "#1a1f2a",
  border: "#2a2f3a",
  accent: "#f43f72",
  teal: "#00b8a9",
  amber: "#f7b731",
  text: "#edf2f7",
  textMuted: "#8f9bb3",
};

// ── Animated particle background (unchanged logic, only styling refined) ──
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

    const NODES = 100;
    const nodes = Array.from({ length: NODES }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 1.5 + Math.random() * 2,
      teal: Math.random() > 0.8,
    }));

    const CONNECT_DIST = 140;
    const MOUSE_DIST = 120;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach(n => {
        const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.sqrt(dx*dx+dy*dy);
        if (d < MOUSE_DIST) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,184,169,${0.2*(1-d/MOUSE_DIST)})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      });

      for (let i=0;i<NODES;i++) for (let j=i+1;j<NODES;j++) {
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<CONNECT_DIST) {
          const a = 0.1*(1-dist/CONNECT_DIST);
          ctx.beginPath();
          ctx.strokeStyle = nodes[i].teal||nodes[j].teal
            ? `rgba(0,184,169,${a})` : `rgba(244,63,114,${a})`;
          ctx.lineWidth = 0.4;
          ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y);
          ctx.stroke();
        }
      }

      nodes.forEach(n => {
        const col = n.teal ? "0,184,169" : "244,63,114";
        const g = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*4);
        g.addColorStop(0,`rgba(${col},0.25)`);
        g.addColorStop(1,`rgba(${col},0)`);
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r*4,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${col},0.5)`; ctx.fill();
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<0||n.x>canvas.width) n.vx*=-1;
        if(n.y<0||n.y>canvas.height) n.vy*=-1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",resize);
      window.removeEventListener("mousemove",onMouse);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ end, suffix = "", duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = now => {
        const t = Math.min((now - start) / duration, 1);
        setVal(Math.round(t * end));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val.toLocaleString("en-IN")}{suffix}</span>;
}

// ── Typed text effect ─────────────────────────────────────────────────────────
function TypedText({ phrases }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const phrase = phrases[idx];
    const timeout = deleting
      ? setTimeout(() => {
          setText(t => t.slice(0, -1));
          if (text.length === 1) { setDeleting(false); setIdx(i => (i+1) % phrases.length); }
        }, 40)
      : setTimeout(() => {
          setText(phrase.slice(0, text.length + 1));
          if (text.length === phrase.length) setTimeout(() => setDeleting(true), 1800);
        }, 65);
    return () => clearTimeout(timeout);
  }, [text, deleting, idx, phrases]);
  return (
    <span style={{ color: C.accent }}>
      {text}<span style={{ animation: "blink 1s step-end infinite", opacity: 1 }}>|</span>
    </span>
  );
}

// ── Feature card (now using the new card style) ──────────────────────────────
function FeatureCard({ icon, title, desc, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 28,
        transition: "all 0.2s ease",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? `0 16px 32px rgba(0,0,0,0.5)` : `0 4px 12px rgba(0,0,0,0.3)`,
        animation: `fadeUp 0.6s ${delay}ms both`,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${C.accent}15`,
        border: `1px solid ${C.accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, marginBottom: 18,
      }}>{icon}</div>
      <h3 style={{ color: C.text, fontWeight: 600, margin: "0 0 10px", fontSize: 16 }}>{title}</h3>
      <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const stats = [
    { val: 50, suffix: "Cr+", label: "Indian workers tracked", accent: C.accent },
    { val: 10, suffix: " cities", label: "Tier 1 + Tier 2", accent: C.teal },
    { val: 10, suffix: " roles", label: "Job categories", accent: C.amber },
    { val: 0,  suffix: "₹ cost", label: "All open-source data", accent: "#a78bfa" },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet" />

      <ParticleField />

      {/* Soft gradient orbs (dimmed) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -300, left: -300, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,114,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, right: -200, width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,184,169,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, width: "100%",
        background: scrollY > 20 ? `${C.bg}E6` : "transparent",
        backdropFilter: scrollY > 20 ? "blur(16px)" : "none",
        borderBottom: scrollY > 20 ? `1px solid ${C.border}` : "1px solid transparent",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Skills<span style={{ color: C.accent }}>Mirage</span></span>
            <span style={{ background: `${C.accent}15`, color: C.accent, border: `1px solid ${C.accent}30`, borderRadius: 4, fontSize: 9, padding: "2px 8px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Live Intel</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {user ? (
              <Link to="/dashboard" style={primaryBtn}>Dashboard →</Link>
            ) : (
              <>
                <Link to="/login" style={ghostBtn}>Sign in</Link>
                <Link to="/register" style={primaryBtn}>Get Started →</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "100px 24px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 40, padding: "6px 16px 6px 12px", marginBottom: 40 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>India's first open workforce intelligence</span>
        </div>

        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 20px", color: C.text }}>
          Know your risk<br />before the{" "}
          <TypedText phrases={["layoff hits.", "market shifts.", "AI displaces you.", "tide turns."]} />
        </h1>

        <p style={{ fontSize: "1.2rem", color: C.textMuted, lineHeight: 1.7, maxWidth: 700, margin: "0 auto 40px" }}>
          Live job market signals from Naukri & LinkedIn across 10 Indian cities — turned into your personal AI displacement risk score and a week-by-week reskilling plan.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {user ? (
            <Link to="/dashboard" style={{ ...primaryBtn, fontSize: "1rem", padding: "14px 32px" }}>View Live Dashboard →</Link>
          ) : (
            <>
              <Link to="/register" style={{ ...primaryBtn, fontSize: "1rem", padding: "14px 32px" }}>Get your risk score free →</Link>
              <Link to="/login" style={ghostBtn}>Sign in</Link>
            </>
          )}
        </div>

        {/* City pills */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 48 }}>
          {["Bangalore","Mumbai","Delhi","Hyderabad","Pune","Chennai","Kolkata","Jaipur","Ahmedabad","Noida"].map(c => (
            <span key={c} style={{ background: `${C.border}40`, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 13, color: C.textMuted }}>{c}</span>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "40px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center", minWidth: 150 }}>
              <div style={{ fontSize: "2.8rem", fontWeight: 700, color: s.accent, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                <Counter end={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>What it does</div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0, color: C.text }}>
            From raw job data to<br /><span style={{ color: C.accent }}>your personal action plan</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { icon: "📡", title: "Live Job Scraping", desc: "Scrapes Naukri & LinkedIn daily. No stale CSVs — every signal is fresh.", delay: 0 },
            { icon: "⚡", title: "AI Risk Score 0–100", desc: "Computed from hiring decline, AI tool mentions in JDs, and role replacement ratios.", delay: 100 },
            { icon: "🗺️", title: "Reskilling Roadmap", desc: "Week-by-week plan using free NPTEL, SWAYAM & PMKVY courses matched to live market demand.", delay: 200 },
            { icon: "🤖", title: "Bilingual AI Advisor", desc: "Chatbot in English + Hindi. Context-aware answers powered by live Layer 1 market data.", delay: 300 },
          ].map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* Risk score explainer */}
      <section style={{ padding: "0 24px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: "48px 56px",
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 40,
          boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 12, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>How the score works</div>
            <h3 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 24px", color: C.text }}>Three signals.<br />One honest number.</h3>
            {[
              { label: "Hiring Decline %", pct: 40, color: C.accent },
              { label: "AI Mention Rate in JDs", pct: 35, color: C.amber },
              { label: "Role Replacement Ratio", pct: 25, color: C.teal },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.textMuted }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.pct}%</span>
                </div>
                <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                  <div style={{ width: s.pct+"%", height: "100%", background: s.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Score dial */}
          <div style={{ flexShrink: 0, width: 300, textAlign: "center" }}>
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: 24,
            }}>
              <div style={{ position: "relative", width: 200, height: 110, margin: "0 auto 16px" }}>
                <svg width="200" height="110" viewBox="0 0 200 110">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={C.border} strokeWidth="16" strokeLinecap="round"/>
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#scoreGrad)" strokeWidth="16" strokeLinecap="round" strokeDasharray="226" strokeDashoffset="60"/>
                  <defs><linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.teal}/><stop offset="60%" stopColor={C.amber}/><stop offset="100%" stopColor={C.accent}/></linearGradient></defs>
                </svg>
                <div style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", fontWeight: 700, color: C.accent, fontFamily: "monospace", lineHeight: 1 }}>74</div>
                  <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>/ 100 · HIGH RISK</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {[["SAFE",C.teal],["LOW","#eab308"],["HIGH",C.amber],["CRITICAL",C.accent]].map(([l,c]) => (
                  <span key={l} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: `${c}20`, color: c, border: `1px solid ${c}40`, fontWeight: 600 }}>{l}</span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 16, lineHeight: 1.6 }}>
                BPO voice hiring fell <span style={{ color: C.accent }}>34%</span> in Pune.<br />AI call-handling mentions up <span style={{ color: C.amber }}>40%</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 24px 100px", textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 700, margin: "0 0 16px", color: C.text }}>
          Don't wait for the<br /><span style={{ color: C.accent }}>layoff notice.</span>
        </h2>
        <p style={{ color: C.textMuted, fontSize: "1.1rem", lineHeight: 1.7, margin: "0 0 36px" }}>
          India's 50 crore workers deserve real market intelligence. Free, open, live.
        </p>
        {user ? (
          <Link to="/dashboard" style={{ ...primaryBtn, fontSize: "1.1rem", padding: "14px 40px" }}>Go to Dashboard →</Link>
        ) : (
          <Link to="/register" style={{ ...primaryBtn, fontSize: "1.1rem", padding: "14px 40px" }}>Check your risk score →</Link>
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "28px 24px", background: C.surface }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Skills<span style={{ color: C.accent }}>Mirage</span></span>
          <span style={{ fontSize: 12, color: C.textMuted }}>Built for HACKaMINeD 2026 · devx labs · All data sources are public & free</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: C.textMuted }}>Live · {new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

const primaryBtn = {
  display: "inline-block",
  background: `linear-gradient(135deg, ${C.accent}, #e11d48)`,
  color: "#fff",
  padding: "12px 28px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.95rem",
  boxShadow: `0 4px 16px ${C.accent}60`,
  transition: "all 0.15s",
};

const ghostBtn = {
  display: "inline-block",
  background: "transparent",
  color: C.textMuted,
  padding: "12px 28px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 500,
  fontSize: "0.95rem",
  border: `1px solid ${C.border}`,
  transition: "all 0.15s",
};