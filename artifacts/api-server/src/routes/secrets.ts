import { Router } from "express";
import { addSecret, getSecretKeys } from "../lib/db.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();

function resolveId(req: import("express").Request): string {
  if (req.authUser) return req.authUser.id;
  return `session:${(req.headers["x-nvr-session"] as string) || "anon"}`;
}

router.post("/secrets/add", optionalAuth, (req, res) => {
  const id = resolveId(req);
  const { key, value } = req.body as { key?: string; value?: string };
  if (!key || !value) { res.status(400).json({ error: "key and value are required" }); return; }
  const sanitized = key.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
  addSecret(id, sanitized, value);
  res.json({ ok: true, key: sanitized, message: "Secret stored securely on server." });
});

router.get("/secrets/keys", optionalAuth, (req, res) => {
  res.json({ keys: getSecretKeys(resolveId(req)) });
});

export default router;
