import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import chatRouter from "./chat.js";
import usageRouter from "./usage.js";
import agentRouter from "./agent.js";
import agentFilesRouter from "./agentFiles.js";
import secretsRouter from "./secrets.js";
import toolsRouter from "./tools.js";
import cloudflareRouter from "./cloudflare.js";
import githubRouter from "./github.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(chatRouter);
router.use(usageRouter);
router.use(agentRouter);
router.use(agentFilesRouter);
router.use(secretsRouter);
router.use(toolsRouter);
router.use(cloudflareRouter);
router.use(githubRouter);

export default router;
