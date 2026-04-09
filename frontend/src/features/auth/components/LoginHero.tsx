const CHIPS = [
  { color: "#34d399", label: "99.9% Uptime" },
  { color: "#818cf8", label: "SOC 2 Type II" },
  { color: "#22d3ee", label: "GDPR Ready" }
];

const AVATARS = [
  { initials: "MT", from: "#6366f1", to: "#818cf8" },
  { initials: "SL", from: "#10b981", to: "#2dd4bf" },
  { initials: "AP", from: "#f59e0b", to: "#fcd34d" },
  { initials: "NV", from: "#f43f5e", to: "#fb7185" }
];

export const LoginHero = () => (
  <aside className="premium-login-side premium-login-side--left">
    <div className="premium-login-logo-row">
      <div className="premium-login-logo-icon">◈</div>
      <span className="premium-login-logo-text">
        Fleet<span>Ops</span>
      </span>
    </div>

    <div className="premium-login-hero-copy">
      <div className="premium-login-pill">
        <span className="premium-login-pill-dot" /> Analytics Platform
      </div>
      <h1 className="premium-login-hero-title">
        Il tuo business<br />
        <span>in tempo reale.</span>
      </h1>
      <p className="premium-login-hero-subtitle">
        Dashboard intelligenti, metriche precise e insight azionabili. Tutto in un'unica piattaforma.
      </p>

      <div className="premium-login-chip-list">
        {CHIPS.map((chip) => (
          <div key={chip.label} className="premium-login-chip">
            <span style={{ background: chip.color }} />
            {chip.label}
          </div>
        ))}
      </div>
    </div>

    <div className="premium-login-social-proof">
      <div className="premium-login-avatar-stack">
        {AVATARS.map((avatar, index) => (
          <div
            key={avatar.initials}
            className="premium-login-avatar"
            style={{
              background: `linear-gradient(135deg,${avatar.from},${avatar.to})`,
              marginLeft: index === 0 ? 0 : -8,
              zIndex: AVATARS.length - index
            }}
          >
            {avatar.initials}
          </div>
        ))}
      </div>
      <div>
        <div className="premium-login-stars">★★★★★</div>
        <p>
          <strong>+2.400 team</strong> già a bordo
        </p>
      </div>
    </div>
  </aside>
);
