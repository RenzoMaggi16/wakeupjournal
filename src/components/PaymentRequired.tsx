/**
 * PaymentRequired.tsx
 *
 * Shown when the user's account is suspended due to non-payment (user_banned error).
 * Matches the Auth.tsx Cyber-Modern / Liquid Glass aesthetic.
 */

const PAYMENT_LINK = "https://wa.me/message/XXXXXXXXXXXXXXX"; // TODO: reemplazar con el link real de pago

export const PaymentRequired = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ position: "relative", overflow: "hidden" }}>
      {/* Animated Background – same orbs as Auth */}
      <div className="auth-background">
        <div className="auth-orb auth-orb-1" style={{ background: "radial-gradient(circle, hsla(0,70%,55%,0.25) 0%, transparent 70%)" }} />
        <div className="auth-orb auth-orb-2" style={{ background: "radial-gradient(circle, hsla(25,90%,55%,0.18) 0%, transparent 70%)" }} />
        <div className="auth-orb auth-orb-3" />
      </div>

      {/* Glass Card */}
      <div
        className="auth-glass-card auth-card-animate w-full max-w-[440px]"
        style={{ position: "relative", zIndex: 1, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div style={{ padding: "40px 36px 36px" }}>

          {/* Icon */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 20px",
                borderRadius: 18,
                background: "linear-gradient(135deg, hsla(0,70%,55%,0.25), hsla(25,90%,50%,0.18))",
                border: "1px solid hsla(0,60%,60%,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px -10px hsla(0,70%,55%,0.35)",
              }}
            >
              {/* Lock icon */}
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="url(#payIconGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="payIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(0,80%,70%)" />
                    <stop offset="100%" stopColor="hsl(25,90%,60%)" />
                  </linearGradient>
                </defs>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            {/* Logo */}
            <h1 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: "hsl(0,0%,97%)", marginBottom: "8px" }}>
              Wakeup Journal
            </h1>
            <div
              style={{
                display: "inline-block",
                padding: "3px 12px",
                borderRadius: 20,
                background: "hsla(0,70%,55%,0.15)",
                border: "1px solid hsla(0,60%,60%,0.25)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "hsl(0,70%,70%)",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              Acceso Suspendido
            </div>
          </div>

          {/* Message */}
          <div
            style={{
              background: "hsla(0,0%,100%,0.04)",
              border: "1px solid hsla(0,0%,100%,0.08)",
              borderRadius: 12,
              padding: "20px",
              marginBottom: "28px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "15px", color: "hsl(0,0%,90%)", lineHeight: 1.6, marginBottom: "12px", fontWeight: 500 }}>
              Tu suscripción ha vencido o el pago no fue procesado.
            </p>
            <p style={{ fontSize: "13px", color: "hsla(0,0%,100%,0.45)", lineHeight: 1.6, margin: 0 }}>
              Para recuperar el acceso completo a tu diario de trading, renueva tu suscripción a continuación.
            </p>
          </div>

          {/* Features reminder */}
          <div style={{ marginBottom: "28px" }}>
            {[
              "Registro ilimitado de operaciones",
              "Análisis con IA y Mentor IA",
              "Reportes avanzados y ROI",
              "Sincronización con brokers",
            ].map((feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 0",
                  borderBottom: "1px solid hsla(0,0%,100%,0.05)",
                  fontSize: "13px",
                  color: "hsla(0,0%,100%,0.55)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(142,60%,50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feature}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <a
            href={PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="auth-submit-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              textDecoration: "none",
              marginBottom: "16px",
              background: "linear-gradient(135deg, hsl(260,70%,55%), hsl(200,80%,50%))",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            Renovar Suscripción
          </a>

          {/* Secondary: contact support */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "hsla(0,0%,100%,0.3)", marginBottom: "8px" }}>
              ¿Ya realizaste el pago y tu acceso sigue bloqueado?
            </p>
            <a
              href="mailto:soporte@wakeupjournal.com"
              style={{
                fontSize: "12px",
                color: "hsl(260,70%,70%)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Contactar soporte →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
