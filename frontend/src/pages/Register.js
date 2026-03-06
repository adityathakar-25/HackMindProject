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
        const col = n.teal?"0,212,177":"244,63,114";
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

const Register = () => {
  const [formData, setFormData] = useState({ name:"", email:"", password:"", confirmPassword:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");
    setLoading(true); setError("");
    try {
      await register(formData.name, formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:"100%", padding:"10px 14px", borderRadius:8,
    border:"1px solid #252a42", background:"rgba(13,15,26,0.8)",
    color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box",
    fontFamily:"inherit",
  };
  const labelStyle = { fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, display:"block", marginBottom:6 };

  return (
    <div style={{ position:"fixed", inset:0, background:"#0d0f1a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <ParticleField />

      <div style={{ position:"relative", zIndex:1, background:"rgba(19,22,42,0.85)", border:"1px solid #252a42", borderRadius:16, padding:"36px 44px", width:420, boxShadow:"0 32px 80px rgba(0,0,0,0.6)", backdropFilter:"blur(12px)" }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", letterSpacing:"-0.02em", marginBottom:6 }}>
            Skills<span style={{ color:"#f43f72" }}>Mirage</span>
          </div>
          <h2 style={{ fontSize:24, fontWeight:800, color:"#e2e8f0", margin:0, letterSpacing:"-0.02em" }}>Create account</h2>
          <p style={{ color:"#6b7280", fontSize:13, margin:"6px 0 0" }}>Start tracking your AI displacement risk</p>
        </div>

        {error && (
          <div style={{ background:"rgba(244,63,114,0.1)", color:"#f43f72", border:"1px solid rgba(244,63,114,0.3)", padding:"10px 14px", borderRadius:8, fontSize:12, marginBottom:14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="John Doe" required style={inputStyle}
              onFocus={e=>e.target.style.borderColor="#f43f72"} onBlur={e=>e.target.style.borderColor="#252a42"} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required style={inputStyle}
              onFocus={e=>e.target.style.borderColor="#f43f72"} onBlur={e=>e.target.style.borderColor="#252a42"} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={labelStyle}>Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required style={inputStyle}
                onFocus={e=>e.target.style.borderColor="#f43f72"} onBlur={e=>e.target.style.borderColor="#252a42"} />
            </div>
            <div>
              <label style={labelStyle}>Confirm</label>
              <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required style={inputStyle}
                onFocus={e=>e.target.style.borderColor="#f43f72"} onBlur={e=>e.target.style.borderColor="#252a42"} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ marginTop:6, background:"linear-gradient(135deg,#f43f72,#e11d48)", color:"#fff", border:"none", padding:"12px", borderRadius:9, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, boxShadow:"0 0 24px rgba(244,63,114,0.3)", fontFamily:"inherit" }}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <p style={{ textAlign:"center", color:"#6b7280", fontSize:12, marginTop:18, marginBottom:0 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color:"#f43f72", fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
