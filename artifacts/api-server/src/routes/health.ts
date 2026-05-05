import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { config } from "../lib/config.js";

const router: IRouter = Router();

// Existing liveness probe (unchanged)
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Extended health — shows config status, never reveals key values
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    openai_configured:       config.openaiConfigured,
    xapi_configured:         config.xapiConfigured,
    cloudflare_configured:   config.cloudflareConfigured,
    ai_chat_enabled:         config.aiChatEnabled,
    external_tools_enabled:  config.externalToolsEnabled,
    cloudflare_enabled:      config.cloudflareEnabled,
    xapi_tools: [
      { name: "web_search",    enabled: config.xapiConfigured, description: "Live web search results" },
      { name: "live_data",     enabled: config.xapiConfigured, description: "Real-time data feeds" },
      { name: "image_service", enabled: config.xapiConfigured, description: "External image generation/processing" },
      { name: "sms_email",     enabled: config.xapiConfigured, description: "SMS / email delivery" },
      { name: "payment",       enabled: config.xapiConfigured, description: "Payment integrations" },
      { name: "analytics",     enabled: config.xapiConfigured, description: "Analytics and event tracking" },
      { name: "agent_connectors", enabled: config.xapiConfigured, description: "Agent tool connectors" },
    ],
    cloudflare_tools: [
      { name: "dns_list",      enabled: config.cloudflareEnabled, description: "List DNS records" },
      { name: "dns_create",    enabled: config.cloudflareEnabled, description: "Create DNS record (confirmation required)" },
      { name: "dns_update",    enabled: config.cloudflareEnabled, description: "Update DNS record (confirmation required)" },
      { name: "dns_delete",    enabled: config.cloudflareEnabled, description: "Delete DNS record (always requires confirmation)" },
      { name: "ssl_check",     enabled: config.cloudflareEnabled, description: "Check SSL status" },
      { name: "domain_verify", enabled: config.cloudflareEnabled, description: "Verify live domain" },
      { name: "set_dns",       enabled: config.cloudflareEnabled, description: "Set DNS record with upsert (confirmation required)" },
    ],
    github_configured: config.githubConfigured,
    github_enabled:    config.githubEnabled,
    github_tools: [
      { name: "repo_list",    enabled: config.githubEnabled, description: "List repositories" },
      { name: "repo_create",  enabled: config.githubEnabled, description: "Create repository (confirmation required)" },
      { name: "repo_connect", enabled: config.githubEnabled, description: "Connect existing repository" },
      { name: "repo_status",  enabled: config.githubEnabled, description: "Get repository status and branches" },
      { name: "repo_commits", enabled: config.githubEnabled, description: "Get recent commits" },
      { name: "file_commit",  enabled: config.githubEnabled, description: "Commit a file (confirmation required)" },
      { name: "push_files",   enabled: config.githubEnabled, description: "Push multiple files via tree API (confirmation required)" },
    ],
  });
});

export default router;
