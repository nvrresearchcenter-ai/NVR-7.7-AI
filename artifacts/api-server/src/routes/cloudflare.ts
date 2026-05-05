import { Router } from "express";
import { config, getCloudflareToken } from "../lib/config.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();

const CF_BASE = "https://api.cloudflare.com/client/v4";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CfResult<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  result: T;
}

interface CfZone {
  id: string;
  name: string;
  status: string;
  plan: { name: string };
  name_servers: string[];
  original_name_servers: string[];
}

interface CfDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  comment?: string;
  created_on: string;
  modified_on: string;
}

interface CfSslSettings {
  id: string;
  value: string;
  editable: boolean;
}

// ─── Cloudflare fetch helper ──────────────────────────────────────────────────

async function cfFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<CfResult<T>> {
  const token = getCloudflareToken();
  if (!token) throw new Error("CLOUDFLARE_NOT_CONFIGURED");

  const res = await fetch(`${CF_BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  const data = await res.json() as CfResult<T>;
  if (!data.success) {
    const msg = data.errors?.[0]?.message ?? "Cloudflare API error";
    throw new Error(msg);
  }
  return data;
}

// ─── Health / config check ────────────────────────────────────────────────────

router.get("/cloudflare/health", optionalAuth, async (_req, res) => {
  if (!config.cloudflareConfigured) {
    res.json({
      ok: false,
      cloudflare_configured: false,
      message: "CLOUDFLARE_API_TOKEN is not set — add it to Replit Secrets",
      dns_automation: false,
    });
    return;
  }

  try {
    // Use zones list as connectivity probe — works with any valid token scope
    const data = await cfFetch<CfZone[]>("/zones?per_page=5");
    res.json({
      ok: true,
      cloudflare_configured: true,
      token_active: true,
      zones_accessible: data.result.length,
      dns_automation: true,
      message: data.result.length > 0
        ? `Cloudflare connected — ${data.result.length} zone(s) accessible`
        : "Cloudflare API token is active. No zones found — add your domain at dash.cloudflare.com first.",
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      cloudflare_configured: true,
      token_detected: true,
      dns_automation: false,
      message: err instanceof Error ? err.message : "Cloudflare API connection failed",
    });
  }
});

// ─── List all zones ───────────────────────────────────────────────────────────

router.get("/cloudflare/zones", optionalAuth, async (_req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured", cloudflare_configured: false });
    return;
  }
  try {
    const data = await cfFetch<CfZone[]>("/zones?per_page=50");
    res.json({
      ok: true,
      zones: data.result.map((z) => ({
        id: z.id,
        name: z.name,
        status: z.status,
        plan: z.plan?.name ?? "unknown",
        name_servers: z.name_servers ?? [],
      })),
      count: data.result.length,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to list zones" });
  }
});

// ─── Get zone by domain name ──────────────────────────────────────────────────

router.get("/cloudflare/zones/:domain", optionalAuth, async (req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured" });
    return;
  }
  const domain = String(req.params.domain);
  try {
    const data = await cfFetch<CfZone[]>(`/zones?name=${encodeURIComponent(domain)}`);
    const zone = data.result[0];
    if (!zone) {
      res.status(404).json({ error: `No zone found for domain: ${domain}` });
      return;
    }
    res.json({
      ok: true,
      zone: {
        id: zone.id,
        name: zone.name,
        status: zone.status,
        plan: zone.plan?.name ?? "unknown",
        name_servers: zone.name_servers ?? [],
        original_name_servers: zone.original_name_servers ?? [],
      },
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Zone lookup failed" });
  }
});

// ─── List DNS records ─────────────────────────────────────────────────────────

router.get("/cloudflare/zones/:zoneId/dns", optionalAuth, async (req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured" });
    return;
  }
  const zoneId = String(req.params.zoneId);
  try {
    const data = await cfFetch<CfDnsRecord[]>(
      `/zones/${zoneId}/dns_records?per_page=100`
    );
    res.json({
      ok: true,
      records: data.result.map((r) => ({
        id: r.id,
        type: r.type,
        name: r.name,
        content: r.content,
        ttl: r.ttl,
        proxied: r.proxied,
        comment: r.comment ?? null,
        modified_on: r.modified_on,
      })),
      count: data.result.length,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to list DNS records" });
  }
});

// ─── Create DNS record (requires confirmation) ────────────────────────────────

router.post("/cloudflare/zones/:zoneId/dns", optionalAuth, async (req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured" });
    return;
  }

  const zoneId = String(req.params.zoneId);
  const { type, name, content, ttl = 1, proxied = false, comment = "", confirmed = false } =
    req.body as {
      type: string; name: string; content: string;
      ttl?: number; proxied?: boolean; comment?: string; confirmed?: boolean;
    };

  if (!type || !name || !content) {
    res.status(400).json({ error: "type, name, and content are required" });
    return;
  }

  if (!confirmed) {
    res.json({
      requiresConfirmation: true,
      action: "create_dns_record",
      preview: { type, name, content, ttl, proxied, comment },
      message: `This will create a new ${type} DNS record: ${name} → ${content}. Send again with confirmed: true to proceed.`,
      risk: "medium",
    });
    return;
  }

  try {
    const data = await cfFetch<CfDnsRecord>(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({ type, name, content, ttl, proxied, comment }),
    });
    res.json({
      ok: true,
      record: {
        id: data.result.id,
        type: data.result.type,
        name: data.result.name,
        content: data.result.content,
        proxied: data.result.proxied,
      },
      message: `DNS record created: ${type} ${name} → ${content}`,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to create DNS record" });
  }
});

// ─── Update DNS record (requires confirmation) ────────────────────────────────

router.put("/cloudflare/zones/:zoneId/dns/:recordId", optionalAuth, async (req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured" });
    return;
  }

  const zoneId   = String(req.params.zoneId);
  const recordId = String(req.params.recordId);
  const { type, name, content, ttl = 1, proxied = false, comment = "", confirmed = false } =
    req.body as {
      type: string; name: string; content: string;
      ttl?: number; proxied?: boolean; comment?: string; confirmed?: boolean;
    };

  if (!type || !name || !content) {
    res.status(400).json({ error: "type, name, and content are required" });
    return;
  }

  if (!confirmed) {
    res.json({
      requiresConfirmation: true,
      action: "update_dns_record",
      recordId,
      preview: { type, name, content, ttl, proxied, comment },
      message: `This will update DNS record ${recordId}: ${type} ${name} → ${content}. Send again with confirmed: true to proceed.`,
      risk: "medium",
    });
    return;
  }

  try {
    const data = await cfFetch<CfDnsRecord>(`/zones/${zoneId}/dns_records/${recordId}`, {
      method: "PUT",
      body: JSON.stringify({ type, name, content, ttl, proxied, comment }),
    });
    res.json({
      ok: true,
      record: {
        id: data.result.id,
        type: data.result.type,
        name: data.result.name,
        content: data.result.content,
        proxied: data.result.proxied,
      },
      message: `DNS record updated: ${type} ${name} → ${content}`,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to update DNS record" });
  }
});

// ─── Delete DNS record (always requires confirmation) ─────────────────────────

router.delete("/cloudflare/zones/:zoneId/dns/:recordId", optionalAuth, async (req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured" });
    return;
  }

  const zoneId   = String(req.params.zoneId);
  const recordId = String(req.params.recordId);
  const { confirmed = false } = req.body as { confirmed?: boolean };

  if (!confirmed) {
    res.json({
      requiresConfirmation: true,
      action: "delete_dns_record",
      recordId,
      message: `This will permanently delete DNS record ${recordId}. This cannot be undone. Send with confirmed: true to proceed.`,
      risk: "high",
      warning: "Deleting a DNS record can break live domains immediately.",
    });
    return;
  }

  try {
    await cfFetch<{ id: string }>(`/zones/${zoneId}/dns_records/${recordId}`, {
      method: "DELETE",
    });
    res.json({
      ok: true,
      deleted: recordId,
      message: `DNS record ${recordId} deleted successfully`,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to delete DNS record" });
  }
});

// ─── Check SSL status ─────────────────────────────────────────────────────────

router.get("/cloudflare/zones/:zoneId/ssl", optionalAuth, async (req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured" });
    return;
  }
  const zoneId = String(req.params.zoneId);
  try {
    const data = await cfFetch<CfSslSettings>(
      `/zones/${zoneId}/settings/ssl`
    );
    res.json({
      ok: true,
      ssl_mode: data.result.value,
      editable: data.result.editable,
      description: {
        "off":      "SSL disabled — HTTP only",
        "flexible": "Flexible SSL — encrypted to visitor, HTTP to origin",
        "full":     "Full SSL — encrypted end-to-end, allows self-signed cert at origin",
        "strict":   "Full (Strict) SSL — encrypted end-to-end, valid cert required at origin",
      }[data.result.value] ?? "Unknown SSL mode",
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "SSL check failed" });
  }
});

// ─── Agent action: verify live domain ────────────────────────────────────────

router.post("/cloudflare/domain/verify", optionalAuth, async (req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured" });
    return;
  }
  const { domain } = req.body as { domain: string };
  if (!domain) { res.status(400).json({ error: "domain is required" }); return; }

  try {
    const data = await cfFetch<CfZone[]>(`/zones?name=${encodeURIComponent(domain)}`);
    const zone = data.result[0];
    if (!zone) {
      res.json({
        ok: false,
        domain,
        found: false,
        message: `Domain ${domain} is not found in your Cloudflare account`,
      });
      return;
    }

    const sslData = await cfFetch<CfSslSettings>(`/zones/${zone.id}/settings/ssl`);

    res.json({
      ok: true,
      domain,
      found: true,
      zone_id: zone.id,
      zone_status: zone.status,
      plan: zone.plan?.name,
      ssl_mode: sslData.result.value,
      name_servers: zone.name_servers ?? [],
      active: zone.status === "active",
      message: zone.status === "active"
        ? `Domain ${domain} is active on Cloudflare with ${sslData.result.value.toUpperCase()} SSL`
        : `Domain ${domain} found but status is: ${zone.status}`,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Domain verification failed" });
  }
});

// ─── Agent action: set DNS (convenience wrapper with confirmation gate) ────────

router.post("/cloudflare/domain/set-dns", optionalAuth, async (req, res) => {
  if (!config.cloudflareConfigured) {
    res.status(503).json({ error: "Cloudflare not configured" });
    return;
  }
  const { domain, type, name, content, proxied = true, confirmed = false } =
    req.body as {
      domain: string; type: string; name: string;
      content: string; proxied?: boolean; confirmed?: boolean;
    };

  if (!domain || !type || !name || !content) {
    res.status(400).json({ error: "domain, type, name, and content are required" });
    return;
  }

  if (!confirmed) {
    res.json({
      requiresConfirmation: true,
      action: "set_dns",
      preview: { domain, type, name, content, proxied },
      message: `This will create/update a ${type} record for ${name} in domain ${domain} pointing to ${content}. Send with confirmed: true to apply.`,
      risk: "medium",
    });
    return;
  }

  try {
    const zonesData = await cfFetch<CfZone[]>(`/zones?name=${encodeURIComponent(domain)}`);
    const zone = zonesData.result[0];
    if (!zone) {
      res.status(404).json({ error: `Domain ${domain} not found in your Cloudflare account` });
      return;
    }

    const existingData = await cfFetch<CfDnsRecord[]>(
      `/zones/${zone.id}/dns_records?type=${type}&name=${encodeURIComponent(name)}`
    );
    const existing = existingData.result[0];

    if (existing) {
      const updated = await cfFetch<CfDnsRecord>(`/zones/${zone.id}/dns_records/${existing.id}`, {
        method: "PUT",
        body: JSON.stringify({ type, name, content, ttl: 1, proxied }),
      });
      res.json({
        ok: true, action: "updated", record_id: updated.result.id,
        message: `Updated existing ${type} record for ${name} → ${content}`,
      });
    } else {
      const created = await cfFetch<CfDnsRecord>(`/zones/${zone.id}/dns_records`, {
        method: "POST",
        body: JSON.stringify({ type, name, content, ttl: 1, proxied }),
      });
      res.json({
        ok: true, action: "created", record_id: created.result.id,
        message: `Created new ${type} record for ${name} → ${content}`,
      });
    }
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Set DNS failed" });
  }
});

export default router;
