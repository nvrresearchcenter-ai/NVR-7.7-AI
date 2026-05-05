import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import {
  findUserByEmail, findUserById, createUser, createOrUpdateGoogleUser,
} from "../lib/db.js";
import { signToken, requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Exact redirect URI registered in Google Console
const GOOGLE_REDIRECT_URI = "https://nvrai.chat/auth/google/callback";

// Where to send users after login (production domain)
const APP_BASE = "https://nvrai.chat";

function getOAuthClient() {
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

// ─── Email/password ───────────────────────────────────────────────────────────

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, country } = req.body as {
      email?: string; password?: string; name?: string; country?: string;
    };
    if (!email || !password) { res.status(400).json({ error: "Email and password are required" }); return; }
    if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { res.status(400).json({ error: "Invalid email address" }); return; }

    const existing = findUserByEmail(email);
    if (existing) { res.status(409).json({ error: "An account with this email already exists" }); return; }

    const hashed = await bcrypt.hash(password, 12);
    const user = createUser(email, hashed, name, country);
    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: { id: user.id, email: user.email, plan: user.plan, name: user.name, country: user.country } });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) { res.status(400).json({ error: "Email and password are required" }); return; }

    const user = findUserByEmail(email);
    if (!user || !user.password) { res.status(401).json({ error: "Invalid email or password" }); return; }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email, plan: user.plan, name: user.name, country: user.country } });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = findUserById(req.authUser!.id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, email: user.email, plan: user.plan, name: user.name, country: user.country, createdAt: user.createdAt });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// GET /auth/google/login  — initiates OAuth flow
router.get("/auth/google/login", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(503).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>OAuth not configured</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0d0d0d;color:#e5e5e5;}
      .card{max-width:420px;padding:2rem;border:1px solid #333;border-radius:1rem;text-align:center;}
      h2{color:#06b6d4;margin-top:0;}p{color:#aaa;line-height:1.6;}
      a{display:inline-block;margin-top:1rem;padding:.6rem 1.4rem;background:#06b6d4;color:#000;border-radius:.5rem;text-decoration:none;font-weight:600;}
      </style></head><body>
      <div class="card">
        <h2>Google login not configured</h2>
        <p>GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are not set on this server.</p>
        <a href="/login">Back to Sign in</a>
      </div></body></html>
    `);
    return;
  }

  const client = getOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "profile", "email"],
    prompt: "select_account",
    response_type: "code",
  });

  req.log.info({ redirect_uri: GOOGLE_REDIRECT_URI }, "Google OAuth initiated");
  res.redirect(url);
});

// GET /auth/google/callback  — Google redirects here after user approves
router.get("/auth/google/callback", async (req, res) => {
  const { code, error, error_description } = req.query as {
    code?: string; error?: string; error_description?: string;
  };

  if (error || !code) {
    req.log.warn({ error, error_description }, "Google OAuth denied or cancelled");
    const reason = error === "access_denied" ? "google_cancelled" : (error ?? "google_cancelled");
    res.redirect(`${APP_BASE}/login?error=${encodeURIComponent(reason)}`);
    return;
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      req.log.error("Google did not return id_token — ensure 'openid' is in scope");
      res.redirect(`${APP_BASE}/login?error=google_failed`);
      return;
    }

    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      req.log.error({ payload }, "Google id_token missing email");
      res.redirect(`${APP_BASE}/login?error=no_email`);
      return;
    }

    const user = createOrUpdateGoogleUser(payload.email, payload.name);
    const token = signToken({ userId: user.id, email: user.email });

    req.log.info({ userId: user.id, email: user.email }, "Google OAuth login success");
    res.redirect(`${APP_BASE}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    res.redirect(`${APP_BASE}/login?error=google_failed`);
  }
});

export default router;
