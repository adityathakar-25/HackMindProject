import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";

// ── Animated particle canvas background ──────────────────────────────────────
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
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.1,
      vy: (Math.random() - 0.5) * 1.1,
      r: 2.5 + Math.random() * 3,
      teal: Math.random() > 0.75,
    }));

    const CONNECT_DIST = 200;
    const MOUSE_DIST   = 160;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < MOUSE_DIST) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,212,177,${0.55 * (1 - d/MOUSE_DIST)})`;
          ctx.lineWidth = 1.2;
          ctx.moveTo(n.x, n.y); ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      });
      for (let i = 0; i < NODES; i++) {
        for (let j = i + 1; j < NODES; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < CONNECT_DIST) {
            const alpha = 0.45 * (1 - dist/CONNECT_DIST);
            ctx.beginPath();
            ctx.strokeStyle = nodes[i].teal || nodes[j].teal
              ? `rgba(0,212,177,${alpha})` : `rgba(244,63,114,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        const col = n.teal ? "0,212,177" : "244,63,114";
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
        g.addColorStop(0, `rgba(${col},0.6)`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${col},0.95)`; ctx.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
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
    <span style={{ color: "#f43f72" }}>
      {text}<span style={{ animation: "blink 1s step-end infinite", opacity: 1 }}>|</span>
    </span>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(244,63,114,0.06)" : "rgba(19,22,42,0.9)",
        border: `1px solid ${hov ? "rgba(244,63,114,0.4)" : "rgba(37,42,66,0.8)"}`,
        borderRadius: 16, padding: "28px 24px",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? "0 20px 60px rgba(244,63,114,0.12)" : "none",
        animation: `fadeUp 0.6s ${delay}ms both`,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: hov ? "rgba(244,63,114,0.2)" : "rgba(244,63,114,0.1)",
        border: "1px solid rgba(244,63,114,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, marginBottom: 16, transition: "all 0.3s",
      }}>{icon}</div>
      <h3 style={{ color: "#e2e8f0", fontWeight: 700, margin: "0 0 8px", fontSize: "0.95rem", letterSpacing: "-0.01em" }}>{title}</h3>
      <p style={{ color: "#6b7280", fontSize: "0.85rem", lineHeight: 1.65, margin: 0 }}>{desc}</p>
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

  return (
    <div style={{ background: "#0d0f1a", color: "#e2e8f0", fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif" }}>
      {/* REMOVED overflowX: "hidden" – fixes clipping issue */}
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet" />

      <ParticleField />

      {/* ── Gradient orbs — desktop bright ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -300, left: -300, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,114,0.22) 0%, transparent 65%)", transform: `translate(${scrollY*0.05}px, ${scrollY*0.03}px)` }} />
        <div style={{ position: "absolute", bottom: -200, right: -200, width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,177,0.18) 0%, transparent 65%)", transform: `translate(${-scrollY*0.04}px, ${-scrollY*0.02}px)` }} />
        <div style={{ position: "absolute", top: "35%", left: "40%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 65%)", transform: `translateY(${scrollY*0.02}px)` }} />
        <div style={{ position: "absolute", top: "65%", right: "8%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,165,0,0.11) 0%, transparent 65%)" }} />
      </div>

      {/* ── Nav – now centered and responsive ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, width: "100%",
        background: scrollY > 20 ? "rgba(13,15,26,0.92)" : "transparent",
        backdropFilter: scrollY > 20 ? "blur(20px)" : "none",
        borderBottom: scrollY > 20 ? "1px solid rgba(37,42,66,0.6)" : "1px solid transparent",
        transition: "all 0.3s",
      }}>
        {/* Inner container – centers content and prevents edge-clinging */}
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",        // consistent side padding
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.03em" }}>Skills<span style={{ color: "#f43f72" }}>Mirage</span></span>
            <span style={{ background: "rgba(244,63,114,0.15)", color: "#f43f72", border: "1px solid rgba(244,63,114,0.35)", borderRadius: 4, fontSize: 9, padding: "2px 8px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Live Intel</span>
          </div>

          {/* Right side – wraps, truncates long names, and stays within bounds */}
          <div style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            maxWidth: "50%",          // prevents pushing left side too far
          }}>
            {user ? (
              <>
                {/* Example of how to show user name + logout – adapt to your actual state */}
                {/* <span style={{ color: "#9ca3af", fontSize: "0.9rem", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span> */}
                <Link to="/dashboard" style={primaryBtn}>
                  Dashboard →
                </Link>
                {/* <button style={ghostBtn}>Logout</button> */}
              </>
            ) : (
              <>
                <Link to="/login" style={ghostBtn}>
                  Sign in
                </Link>
                <Link to="/register" style={primaryBtn}>
                  Get Started →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "120px 24px 100px", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(244,63,114,0.1)", border: "1px solid rgba(244,63,114,0.3)", borderRadius: 20, padding: "7px 18px", marginBottom: 40, animation: "fadeUp 0.5s both" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f43f72", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 13, color: "#f43f72", fontWeight: 600 }}>India's first open workforce intelligence system</span>
        </div>

        <h1 style={{ fontSize: "5.2rem", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.045em", margin: "0 0 12px", animation: "fadeUp 0.6s 100ms both" }}>
          Know your risk<br />before the{" "}
          <TypedText phrases={["layoff hits.", "market shifts.", "AI displaces you.", "tide turns."]} />
        </h1>

        <p style={{ fontSize: "1.3rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 700, margin: "28px auto 52px", animation: "fadeUp 0.6s 200ms both" }}>
          Live job market signals from Naukri & LinkedIn across 10 Indian cities — turned into your personal AI displacement risk score and a week-by-week reskilling plan.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.6s 300ms both" }}>
          {user ? (
            <Link to="/dashboard" style={primaryBtn}>View Live Dashboard →</Link>
          ) : (
            <>
              <Link to="/register" style={primaryBtn}>Get your risk score free →</Link>
              <Link to="/login" style={ghostBtn}>Sign in</Link>
            </>
          )}
        </div>

        {/* Social proof strip */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 40, animation: "fadeUp 0.6s 400ms both" }}>
          {["Bangalore","Mumbai","Delhi","Hyderabad","Pune","Chennai","Kolkata","Jaipur","Ahmedabad","Noida"].map(c => (
            <span key={c} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#6b7280" }}>{c}</span>
          ))}
        </div>
      </section>

      {/* ── Stats band – now with flex-wrap for smaller screens ── */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(37,42,66,0.6)", borderBottom: "1px solid rgba(37,42,66,0.6)", background: "rgba(19,22,42,0.7)", backdropFilter: "blur(10px)", padding: "44px 0" }}>
        <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { val: 50, suffix: "Cr+", label: "Indian workers tracked" },
            { val: 10,  suffix: " cities", label: "Tier 1 + Tier 2" },
            { val: 10,  suffix: " roles", label: "Job categories" },
            { val: 0,   suffix: "₹ cost", label: "All open-source data" },
          ].map((s, i) => (
            <div key={i} style={{ flex: "1 1 auto", textAlign: "center", padding: "8px 20px", borderRight: i < 3 ? "1px solid rgba(37,42,66,0.6)" : "none", minWidth: 150 }}>
              <div style={{ fontSize: "2.6rem", fontWeight: 800, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>
                <Counter end={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 24px", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: "#f43f72", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 14 }}>What it does</div>
          <h2 style={{ fontSize: "2.8rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
            From raw job data to<br /><span style={{ color: "#f43f72" }}>your personal action plan</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {[
            { icon: "📡", title: "Live Job Scraping", desc: "Scrapes Naukri & LinkedIn daily. No stale CSVs — every signal is fresh.", delay: 0 },
            { icon: "⚡", title: "AI Risk Score 0–100", desc: "Computed from hiring decline, AI tool mentions in JDs, and role replacement ratios.", delay: 100 },
            { icon: "🗺️", title: "Reskilling Roadmap", desc: "Week-by-week plan using free NPTEL, SWAYAM & PMKVY courses matched to live market demand.", delay: 200 },
            { icon: "🤖", title: "Bilingual AI Advisor", desc: "Chatbot in English + Hindi. Context-aware answers powered by live Layer 1 market data.", delay: 300 },
          ].map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── Risk score explainer ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 24px 100px", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          background: "rgba(19,22,42,0.85)", border: "1px solid rgba(37,42,66,0.8)",
          borderRadius: 24, padding: "64px 80px",
          backdropFilter: "blur(12px)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 60,
          flexWrap: "wrap", // ensures stacking on narrow screens
        }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontSize: 12, color: "#f43f72", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 14 }}>How the score works</div>
            <h3 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0 0 28px", letterSpacing: "-0.02em" }}>Three signals.<br />One honest number.</h3>
            {[
              { label: "Hiring Decline %", pct: 40, color: "#f43f72" },
              { label: "AI Mention Rate in JDs", pct: 35, color: "#f0a500" },
              { label: "Role Replacement Ratio", pct: 25, color: "#00d4b1" },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.pct}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(37,42,66,0.8)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: s.pct+"%", height: "100%", background: `linear-gradient(90deg, ${s.color}, ${s.color}88)`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Score dial mockup */}
          <div style={{ flexShrink: 0, width: "350px", textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", width: 260, height: 145 }}>
              <svg width="260" height="145" viewBox="0 0 260 145" style={{ position: "absolute", top: 0, left: 0 }}>
                <path d="M 15 130 A 115 115 0 0 1 245 130" fill="none" stroke="rgba(37,42,66,0.8)" strokeWidth="18" strokeLinecap="round"/>
                <path d="M 15 130 A 115 115 0 0 1 245 130" fill="none" stroke="url(#scoreGrad2)" strokeWidth="18" strokeLinecap="round" strokeDasharray="361" strokeDashoffset="90"/>
                <defs><linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00d4b1"/><stop offset="60%" stopColor="#f0a500"/><stop offset="100%" stopColor="#f43f72"/></linearGradient></defs>
              </svg>
              <div style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center" }}>
                <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#f43f72", fontFamily: "monospace", lineHeight: 1 }}>74</div>
                <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>/ 100 · HIGH RISK</div>
              </div>
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {[["SAFE","#00d4b1"],["LOW","#eab308"],["HIGH","#f0a500"],["CRITICAL","#f43f72"]].map(([l,c]) => (
                <span key={l} style={{ fontSize: 9, padding: "3px 10px", borderRadius: 4, background: c+"18", color: c, border: `1px solid ${c}44`, fontWeight: 700 }}>{l}</span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 16, lineHeight: 1.6 }}>
              BPO voice hiring fell <span style={{ color: "#f43f72" }}>34%</span> in Pune.<br />AI call-handling mentions up <span style={{ color: "#f0a500" }}>40%</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 24px 120px", textAlign: "center", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "3.2rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
            Don't wait for the<br /><span style={{ color: "#f43f72" }}>layoff notice.</span>
          </h2>
          <p style={{ color: "#6b7280", fontSize: "1.15rem", lineHeight: 1.7, margin: "0 0 44px" }}>
            India's 50 crore workers deserve real market intelligence. Free, open, live.
          </p>
          {user ? (
            <Link to="/dashboard" style={{ ...primaryBtn, fontSize: "1.1rem", padding: "16px 44px" }}>Go to Dashboard →</Link>
          ) : (
            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              <Link to="/register" style={{ ...primaryBtn, fontSize: "1.1rem", padding: "16px 44px" }}>Check your risk score →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(37,42,66,0.6)", padding: "28px 24px", width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Skills<span style={{ color: "#f43f72" }}>Mirage</span></span>
          <span style={{ fontSize: 13, color: "#FFFFFF" }}>Built for HACKaMINeD 2026 · devx labs · All data sources are public & free</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4b1", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Live · {new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

const primaryBtn = {
  display: "inline-block",
  background: "linear-gradient(135deg, #f43f72, #e11d48)",
  color: "#fff", padding: "12px 28px", borderRadius: 10,
  textDecoration: "none", fontWeight: 700, fontSize: "0.9rem",
  boxShadow: "0 0 30px rgba(244,63,114,0.35)",
  transition: "all 0.2s", letterSpacing: "-0.01em",
};

const ghostBtn = {
  display: "flex",
  background: "transparent",
  color: "#9ca3af", padding: "12px 28px", borderRadius: 10,
  textDecoration: "none", fontWeight: 600, fontSize: "0.9rem",
  border: "1px solid rgba(37,42,66,0.8)", transition: "all 0.2s",
};
// Optional hover effect for ghost button
ghostBtn[":hover"] = {
  background: "rgba(255,255,255,0.02)",
  borderColor: "rgba(244,63,114,0.5)",
  color: "#e2e8f0",
};