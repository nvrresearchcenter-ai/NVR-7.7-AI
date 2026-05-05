import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Mail, CheckCircle2, AlertCircle, ArrowLeft, Search, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";

// ─── Country list ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina",
  "Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia",
  "Croatia","Cuba","Czech Republic","Denmark","Ecuador","Egypt","Ethiopia",
  "Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Honduras",
  "Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyzstan",
  "Lebanon","Libya","Malaysia","Mexico","Morocco","Myanmar","Nepal",
  "Netherlands","New Zealand","Nigeria","Norway","Oman","Pakistan","Palestine",
  "Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia",
  "South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Tanzania","Thailand","Tunisia","Turkey",
  "Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zimbabwe",
];

// ─── Country dropdown ─────────────────────────────────────────────────────────

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm outline-none transition-all text-left ${
          value
            ? "border-white/15 bg-white/6 text-white"
            : "border-white/10 bg-white/5 text-gray-500"
        } focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10`}
      >
        <span>{value || "Select your country"}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-white text-sm placeholder:text-gray-600 outline-none focus:border-cyan-500/40"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-3">No results</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    value === c
                      ? "bg-cyan-500/15 text-cyan-400"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {c}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orbit hero (right panel) ─────────────────────────────────────────────────

function OrbitGraphic() {
  return (
    <svg viewBox="0 0 480 480" className="w-full max-w-[380px] opacity-90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="240" cy="240" r="220" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.25" />
      <circle cx="240" cy="240" r="175" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 6" opacity="0.35" />
      <ellipse cx="240" cy="240" rx="130" ry="80" stroke="#22d3ee" strokeWidth="0.8" opacity="0.3" transform="rotate(-30 240 240)" />
      <ellipse cx="240" cy="240" rx="130" ry="80" stroke="#22d3ee" strokeWidth="0.8" opacity="0.25" transform="rotate(60 240 240)" />
      <circle cx="240" cy="240" r="72" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
      <circle cx="240" cy="240" r="48" fill="url(#coreGrad)" opacity="0.8" />
      <path d="M255 214l-22 29h16l-11 23l28-35h-16l5-17z" fill="white" opacity="0.95" />
      <circle cx="240" cy="20" r="4" fill="#06b6d4" opacity="0.7" />
      <circle cx="440" cy="200" r="3" fill="#22d3ee" opacity="0.6" />
      <circle cx="340" cy="420" r="4" fill="#06b6d4" opacity="0.5" />
      <circle cx="80" cy="340" r="3" fill="#22d3ee" opacity="0.6" />
      <circle cx="352" cy="157" r="4" fill="#06b6d4" opacity="0.8" />
      <circle cx="128" cy="323" r="3" fill="#22d3ee" opacity="0.6" />
      <defs>
        <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Google OAuth errors ──────────────────────────────────────────────────────

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled. Please try again.",
  google_failed: "Google sign-in encountered an error. Please try email/password or contact support.",
  no_email: "Could not retrieve your email from Google. Please use email/password to sign in.",
  access_denied: "You declined Google sign-in. You can try again or use email/password.",
};

// ─── Input field helper ───────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-600 text-sm outline-none transition-all focus:border-cyan-500/60 focus:bg-white/8 focus:ring-2 focus:ring-cyan-500/10";

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "login" | "signup";

export default function Login() {
  const { login, register, user } = useAuth();
  const [, navigate] = useLocation();

  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Signup fields
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [agreedToTos, setAgreedToTos] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setError(GOOGLE_ERROR_MESSAGES[err] ?? "Sign-in failed. Please try again.");
    const t = params.get("tab");
    if (t === "signup") setTab("signup");
  }, []);

  const clearErrors = () => { setError(null); setSuccess(null); };

  // ── Validation ─────────────────────────────────────────────────────────────

  const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const signupValid =
    fullName.trim().length >= 2 &&
    country !== "" &&
    emailValid(signupEmail) &&
    signupPassword.length >= 6 &&
    signupPassword === confirmPassword &&
    agreedToTos;

  const loginValid = emailValid(loginEmail) && loginPassword.length >= 1;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!emailValid(loginEmail)) { setError("Please enter a valid email address."); return; }
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      setSuccess("Signed in! Redirecting…");
      const params = new URLSearchParams(window.location.search);
      setTimeout(() => navigate(params.get("next") ?? "/chat"), 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!emailValid(signupEmail)) { setError("Please enter a valid email address."); return; }
    if (signupPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (signupPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!agreedToTos) { setError("You must agree to the Terms of Service to continue."); return; }
    setSubmitting(true);
    try {
      await register(signupEmail, signupPassword, fullName.trim(), country);
      setSuccess("Account created! Welcome to NVR 7.7 AI.");
      setTimeout(() => navigate("/chat"), 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Already signed in ──────────────────────────────────────────────────────

  if (user) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center bg-[#080c10]">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center mx-auto mb-3 shadow shadow-cyan-500/30">
            <svg viewBox="0 0 120 120" fill="none" className="w-7 h-7">
              <path d="M72 18L38 62h26L44 102l44-54H62L72 18z" fill="white" />
            </svg>
          </div>
          <h2 className="font-bold text-lg mb-0.5 text-white">
            {user.name ? `Welcome, ${user.name.split(" ")[0]}` : "You're signed in"}
          </h2>
          <p className="text-sm mb-4 text-gray-500">{user.email}</p>
          <button onClick={() => navigate("/chat")} className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all">
            Go to Chat
          </button>
        </div>
      </div>
    );
  }

  const googleSVG = (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div className="min-h-screen pt-14 flex bg-[#080c10]">

      {/* ── Left — form panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 overflow-y-auto relative">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full bg-cyan-500/4 blur-3xl" />
        </div>

        <div className="w-full max-w-[380px] relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-7">
            <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center shadow shadow-cyan-500/30">
              <svg viewBox="0 0 120 120" fill="none" className="w-5 h-5">
                <path d="M72 18L38 62h26L44 102l44-54H62L72 18z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">
              <span className="text-cyan-400">NVR</span> 7.7 AI
            </span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl border border-white/8 bg-white/3 p-1 mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); clearErrors(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Glass card */}
          <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-5 shadow-xl shadow-black/40">

            {/* ── Login tab ─────────────────────────────────────────────── */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => { window.location.href = "/auth/google/login"; }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-gray-200 text-sm font-medium transition-all"
                >
                  {googleSVG}
                  <span className="flex-1 text-left">Continue with Google</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-gray-600">or sign in with email</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Gmail / Email"
                  required
                  autoComplete="email"
                  className={inputCls}
                />

                <div className="relative">
                  <input
                    type={showLoginPw ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowLoginPw(!showLoginPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button type="button" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-green-500/20 bg-green-500/10 text-green-400 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!loginValid || submitting}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 mt-1"
                >
                  {submitting ? "Signing in…" : "Sign in"}
                </button>

                <p className="text-center text-xs text-gray-600 pt-1">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setTab("signup"); clearErrors(); }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    Create account
                  </button>
                </p>
              </form>
            )}

            {/* ── Signup tab ────────────────────────────────────────────── */}
            {tab === "signup" && (
              <form onSubmit={handleSignup} className="flex flex-col gap-3">
                {/* Full name */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                    className={inputCls}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Country</label>
                  <CountrySelect value={country} onChange={setCountry} />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Gmail / Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      required
                      autoComplete="email"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  {signupEmail && !emailValid(signupEmail) && (
                    <p className="text-xs text-red-400 mt-1">Please enter a valid email address.</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showSignupPw ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      autoComplete="new-password"
                      className={`${inputCls} pr-10`}
                    />
                    <button type="button" onClick={() => setShowSignupPw(!showSignupPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showSignupPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupPassword && signupPassword.length < 6 && (
                    <p className="text-xs text-red-400 mt-1">Password must be at least 6 characters.</p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      autoComplete="new-password"
                      className={`${inputCls} pr-10`}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && signupPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                  )}
                </div>

                {/* TOS checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer group mt-0.5">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreedToTos}
                      onChange={(e) => setAgreedToTos(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      agreedToTos ? "bg-cyan-500 border-cyan-500" : "border-white/20 group-hover:border-white/40"
                    }`}>
                      {agreedToTos && (
                        <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-cyan-400 hover:underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-cyan-400 hover:underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-green-500/20 bg-green-500/10 text-green-400 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!signupValid || submitting}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 mt-1"
                >
                  {submitting ? "Creating account…" : "Create account"}
                </button>

                <p className="text-center text-xs text-gray-600 pt-1">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setTab("login"); clearErrors(); }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Also sign up with Google note (signup tab) */}
          {tab === "signup" && (
            <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { window.location.href = "/auth/google/login"; }}
                className="flex-1 flex items-center gap-2.5 text-sm text-gray-300 hover:text-white transition-colors"
              >
                {googleSVG}
                <span>Or sign up with Google</span>
                <ArrowLeft className="w-3.5 h-3.5 ml-auto rotate-180 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right — hero panel (desktop only) ───────────────────────────── */}
      <div className="hidden lg:flex w-[48%] flex-col items-center justify-center relative overflow-hidden bg-[#050810] border-l border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/6 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-cyan-400/4 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-12 select-none">
          <OrbitGraphic />
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <svg viewBox="0 0 120 120" fill="none" className="w-6 h-6">
                  <path d="M72 18L38 62h26L44 102l44-54H62L72 18z" fill="white" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
              <span className="text-cyan-400">NVR</span> 7.7 AI
            </h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-xs">
              Chat, code, design, image generation, and agent workspace.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-7">
            {["Chat", "Code", "Design", "Image Gen", "Agent"].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full text-xs font-medium border border-cyan-500/20 bg-cyan-500/8 text-cyan-400/80">
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
      </div>
    </div>
  );
}
