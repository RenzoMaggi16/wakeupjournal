/**
 * Auth.tsx
 *
 * High-fidelity "Cyber-Modern / Liquid Glass" authentication page.
 * Features:
 * - Animated mesh gradient background with floating orbs
 * - Liquid glassmorphism card
 * - Floating label inputs with inline validation
 * - Password strength meter
 * - One-click toggle between Login/Signup (no page reload)
 * - Google OAuth with styled glass button
 * - Loading spinner states
 * - Fully responsive (Mobile/Desktop)
 */

import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthMode = "signin" | "signup";

// Password strength calculator
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "transparent" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, label: "Muy débil", color: "hsl(0, 70%, 55%)" };
  if (score === 2) return { score: 40, label: "Débil", color: "hsl(25, 90%, 55%)" };
  if (score === 3) return { score: 60, label: "Aceptable", color: "hsl(45, 90%, 50%)" };
  if (score === 4) return { score: 80, label: "Fuerte", color: "hsl(142, 60%, 45%)" };
  return { score: 100, label: "Muy fuerte", color: "hsl(142, 70%, 40%)" };
}

// Email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [animKey, setAnimKey] = useState(0); // for content transition

  const emailValid = email.length === 0 || isValidEmail(email);
  const emailError = emailTouched && email.length > 0 && !emailValid;

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordError = passwordTouched && mode === "signup" && password.length > 0 && password.length < 6;

  const canSubmit = email.length > 0 && password.length > 0 && isValidEmail(email) && (mode === "signin" || password.length >= 6);

  const handleModeSwitch = useCallback((newMode: AuthMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setAnimKey((k) => k + 1);
    setEmailTouched(false);
    setPasswordTouched(false);
  }, [mode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Cuenta creada exitosamente. Revisa tu email para confirmar.");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Sesión iniciada");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error("Error al iniciar sesión con Google: " + error.message);
    }
    setLoading(false);
  };

  const handleSubmit = mode === "signin" ? handleSignIn : handleSignUp;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ position: "relative", overflow: "hidden" }}>
      {/* Animated Background */}
      <div className="auth-background">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      {/* Glass Card */}
      <div
        className="auth-glass-card auth-card-animate w-full max-w-[420px]"
        style={{ position: "relative", zIndex: 1, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div style={{ padding: "36px 32px 32px" }}>
          {/* Logo & Branding */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 16px",
                borderRadius: 16,
                background: "linear-gradient(135deg, hsla(260, 70%, 55%, 0.3), hsla(200, 80%, 50%, 0.2))",
                border: "1px solid hsla(260, 60%, 60%, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 30px -8px hsla(260, 70%, 55%, 0.3)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#authIconGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="authIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(260, 80%, 70%)" />
                    <stop offset="100%" stopColor="hsl(200, 90%, 60%)" />
                  </linearGradient>
                </defs>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "hsl(0, 0%, 97%)",
                marginBottom: "6px",
              }}
            >
              Wakeup Journal
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "hsla(0, 0%, 100%, 0.4)",
                letterSpacing: "0.01em",
              }}
            >
              {mode === "signin" ? "Bienvenido de vuelta" : "Crea tu cuenta para empezar"}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="auth-toggle-container" style={{ marginBottom: "24px" }}>
            <button
              type="button"
              className={`auth-toggle-btn ${mode === "signin" ? "active" : ""}`}
              onClick={() => handleModeSwitch("signin")}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => handleModeSwitch("signup")}
            >
              Registrarse
            </button>
          </div>

          {/* Form Content (animated on switch) */}
          <div key={animKey} className="auth-content-animate">
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="auth-input-group" style={{ marginBottom: "16px" }}>
                <input
                  id="auth-email"
                  type="email"
                  className={`auth-input ${emailError ? "input-error" : emailTouched && email.length > 0 && emailValid ? "input-valid" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder=" "
                  required
                  autoComplete="email"
                />
                <label htmlFor="auth-email" className="auth-floating-label">
                  Email
                </label>
                {emailError && (
                  <div className="auth-validation-msg" style={{ color: "hsl(0, 70%, 60%)" }}>
                    Ingresa un email válido
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="auth-input-group" style={{ marginBottom: mode === "signup" ? "8px" : "24px" }}>
                <input
                  id="auth-password"
                  type="password"
                  className={`auth-input ${passwordError ? "input-error" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder=" "
                  required
                  minLength={mode === "signup" ? 6 : undefined}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
                <label htmlFor="auth-password" className="auth-floating-label">
                  Contraseña
                </label>
                {passwordError && (
                  <div className="auth-validation-msg" style={{ color: "hsl(0, 70%, 60%)" }}>
                    Mínimo 6 caracteres
                  </div>
                )}
              </div>

              {/* Password Strength Meter (signup only) */}
              {mode === "signup" && password.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{
                        width: `${passwordStrength.score}%`,
                        background: passwordStrength.color,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: passwordStrength.color,
                      marginTop: "5px",
                      fontWeight: 500,
                    }}
                  >
                    {passwordStrength.label}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || !canSubmit}
                style={{ marginBottom: "0" }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {loading ? (
                    <span className="auth-spinner" />
                  ) : mode === "signin" ? (
                    "Iniciar Sesión"
                  ) : (
                    "Crear Cuenta"
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">o</span>
              <div className="auth-divider-line" />
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg viewBox="0 0 150 150">
                <path d="M120,76.1c0-3.1-0.3-6.3-0.8-9.3H75.9v17.7h24.8c-1,5.7-4.3,10.7-9.2,13.9l14.8,11.5 C115,101.8,120,90,120,76.1L120,76.1z" fill="#4285F4" />
                <path d="M75.9,120.9c12.4,0,22.8-4.1,30.4-11.1L91.5,98.4c-4.1,2.8-9.4,4.4-15.6,4.4c-12,0-22.1-8.1-25.8-18.9 L34.9,95.6C42.7,111.1,58.5,120.9,75.9,120.9z" fill="#34A853" />
                <path d="M50.1,83.8c-1.9-5.7-1.9-11.9,0-17.6L34.9,54.4c-6.5,13-6.5,28.3,0,41.2L50.1,83.8z" fill="#FBBC05" />
                <path d="M75.9,47.3c6.5-0.1,12.9,2.4,17.6,6.9L106.6,41C98.3,33.2,87.3,29,75.9,29.1c-17.4,0-33.2,9.8-41,25.3 l15.2,11.8C53.8,55.3,63.9,47.3,75.9,47.3z" fill="#EA4335" />
              </svg>
              Continuar con Google
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <p style={{ fontSize: "11px", color: "hsla(0, 0%, 100%, 0.2)", lineHeight: 1.6 }}>
              {mode === "signup"
                ? "Al registrarte, aceptas nuestros términos de servicio"
                : "Tu sesión se mantendrá activa automáticamente"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
