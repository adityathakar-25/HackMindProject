import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef } from "react";

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
      r: 2.5 + Math.random() * 3, teal: Math.random() > 0.75, // keeping 'teal' var name, but using blue
    }));
    const CONNECT_DIST = 200, MOUSE_DIST = 160;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.sqrt(dx*dx+dy*dy);
        if (d < MOUSE_DIST) { ctx.beginPath(); ctx.strokeStyle=`rgba(59,130,246,${0.55*(1-d/MOUSE_DIST)})`; ctx.lineWidth=1.2; ctx.moveTo(n.x,n.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke(); }
      });
      for (let i=0;i<NODES;i++) for (let j=i+1;j<NODES;j++) {
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<CONNECT_DIST) { const a=0.45*(1-dist/CONNECT_DIST); ctx.beginPath(); ctx.strokeStyle=nodes[i].teal||nodes[j].teal?`rgba(59,130,246,${a})`:`rgba(249,115,22,${a})`; ctx.lineWidth=0.8; ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke(); }
      }
      nodes.forEach(n => {
        // Blue (59,130,246) or Orange (249,115,22)
        const col = n.teal?"59,130,246":"249,115,22";
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

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:"100%", padding:"10px 14px", borderRadius:8,
    border:"1px solid #2A3144", background:"rgba(11,14,19,0.8)",
    color:"#E5E7EB", fontSize:13, outline:"none", boxSizing:"border-box",
    fontFamily:"inherit", transition: "border-color 0.2s"
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#0B0E13", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <ParticleField />

      <div style={{ position:"relative", zIndex:1, background:"rgba(20,24,33,0.85)", border:"1px solid #2A3144", borderRadius:16, padding:"40px 44px", width:400, boxShadow:"0 32px 80px rgba(0,0,0,0.6)", backdropFilter:"blur(12px)" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:13, fontWeight:800, color:"#E5E7EB", letterSpacing:"-0.02em", marginBottom:6 }}>
            Skills<span style={{ color:"#F97316" }}>Mirage</span>
          </div>
          <h2 style={{ fontSize:24, fontWeight:800, color:"#E5E7EB", margin:0, letterSpacing:"-0.02em" }}>Welcome back</h2>
          <p style={{ color:"#9CA3AF", fontSize:13, margin:"6px 0 0" }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ background:"rgba(239,68,68,0.1)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.3)", padding:"10px 14px", borderRadius:8, fontSize:12, marginBottom:16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:11, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, display:"block", marginBottom:6 }}>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required style={inputStyle}
              onFocus={e=>e.target.style.borderColor="#F97316"} onBlur={e=>e.target.style.borderColor="#2A3144"} />
          </div>
          <div>
            <label style={{ fontSize:11, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, display:"block", marginBottom:6 }}>Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required style={inputStyle}
              onFocus={e=>e.target.style.borderColor="#F97316"} onBlur={e=>e.target.style.borderColor="#2A3144"} />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop:4, background:"linear-gradient(135deg, #F97316, #C2410C)", color:"#fff", border:"none", padding:"12px", borderRadius:9, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, boxShadow:"0 0 24px rgba(249,115,22,0.3)", fontFamily:"inherit" }}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <p style={{ textAlign:"center", color:"#9CA3AF", fontSize:12, marginTop:20, marginBottom:0 }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color:"#F97316", fontWeight:600 }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;