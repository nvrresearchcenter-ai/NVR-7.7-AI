import { Router } from "express";
import { getUsageSummary, updateUserPlan, type Plan } from "../lib/db.js";
import { optionalAuth, requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/usage", optionalAuth, (req, res) => {
  if (req.authUser) {
    const summary = getUsageSummary(req.authUser.id, req.authUser.plan);
    res.json(summary);
  } else {
    const sessionId = (req.headers["x-nvr-session"] as string) || "anon";
    const summary = getUsageSummary(`session:${sessionId}`, "free");
    res.json(summary);
  }
});

router.post("/usage/plan", requireAuth, (req, res) => {
  const { plan } = req.body as { plan?: Plan };
  const valid: Plan[] = ["free", "spark", "pro", "agent", "super"];
  if (!plan || !valid.includes(plan)) {
    res.status(400).json({ error: "Invalid plan" }); return;
  }
  updateUserPlan(req.authUser!.id, plan);
  res.json({ ok: true, plan });
});

export default router;
