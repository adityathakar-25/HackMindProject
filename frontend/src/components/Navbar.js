import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Color palette (matching TrendsTab)
const C = {
  bg: "#0b0e14",
  surface: "#131720",
  border: "#2a2f3a",
  accent: "#f43f72",
  text: "#edf2f7",
  textMuted: "#8f9bb3",
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      width: "100%",
      background: C.bg,
      borderBottom: `1px solid ${C.border}`,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Brand */}
        <Link to="/" style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
        }}>
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "-0.02em",
          }}>
            Skills<span style={{ color: C.accent }}>Mirage</span>
          </span>
          <span style={{
            background: "rgba(244,63,114,0.1)",
            color: C.accent,
            border: `1px solid ${C.accent}30`,
            borderRadius: 4,
            fontSize: 10,
            padding: "2px 8px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>
            Live Intel
          </span>
        </Link>

        {/* Right side */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>
          {user ? (
            <>
              <span style={{
                color: C.textMuted,
                fontSize: 14,
              }}>
                Hi, <span style={{ color: C.text, fontWeight: 500 }}>{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  color: C.textMuted,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = C.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.textMuted;
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  color: C.textMuted,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "6px 12px",
                  borderRadius: 8,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                style={{
                  background: `linear-gradient(135deg, ${C.accent}, #e11d48)`,
                  color: "#fff",
                  padding: "8px 18px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: `0 4px 12px ${C.accent}40`,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;