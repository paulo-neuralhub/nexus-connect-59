/**
 * Dynamic CORS headers for IP-NEXUS portal edge functions.
 * Only allows *.ip-nexus.app origins + localhost for dev.
 */

const ORIGIN_RE = /^https:\/\/([a-z0-9-]+\.)?ip-nexus\.app$/;
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed =
    ORIGIN_RE.test(origin) || DEV_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-organization-id",
    "Access-Control-Allow-Credentials": "true",
  };
}
