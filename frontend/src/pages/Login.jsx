import { useMemo } from "react";
import "./Login.css";

function makeStars(count, sizeRange, opacityRange) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    baseOpacity: opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]),
    twinkleDuration: 2.5 + Math.random() * 4,
    twinkleDelay: Math.random() * 6,
  }));
}

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  // three parallax layers: far (small/dim/slow) -> near (larger/bright/fast)
  const farStars = useMemo(() => makeStars(70, [1, 1.6], [0.15, 0.45]), []);
  const midStars = useMemo(() => makeStars(45, [1.4, 2.2], [0.35, 0.7]), []);
  const nearStars = useMemo(() => makeStars(25, [1.8, 3], [0.6, 1]), []);

  const renderLayer = (stars, cls) => (
    <div className={`lp-star-layer ${cls}`}>
      {[0, 1].map((copy) => (
        <div className="lp-star-block" key={copy} style={{ top: `${copy * 100}%` }}>
          {stars.map((s) => (
            <span
              key={s.id}
              className="lp-star"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: s.baseOpacity,
                animationDuration: `${s.twinkleDuration}s`,
                animationDelay: `${s.twinkleDelay}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="lp-root">
      {renderLayer(farStars, "lp-layer-far")}
      {renderLayer(midStars, "lp-layer-mid")}
      {renderLayer(nearStars, "lp-layer-near")}
      <div className="lp-shooting lp-shoot-1" />
      <div className="lp-shooting lp-shoot-2" />
      <div className="lp-grid" />

      <div className="lp-card">
        <span className="lp-eyebrow">Welcome back</span>
        <h1 className="lp-title">Sign in to continue</h1>
        <p className="lp-sub">Use your Google account to get started in seconds.</p>

        <button onClick={handleLogin} className="lp-btn">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16 4 9.1 8.5 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.5 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9 39.4 15.9 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C40.4 36.6 44 30.9 44 24c0-1.3-.1-2.3-.4-3.5z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="lp-terms">By continuing, you agree to our Terms &amp; Privacy Policy.</p>
       
      </div>
    </div>
  );
}

export default Login;