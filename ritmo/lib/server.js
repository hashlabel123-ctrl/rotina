import { Redis } from "@upstash/redis";
import webpush from "web-push";

/* Banco de dados (Upstash Redis). Aceita os dois nomes de variável que a Vercel pode criar. */
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
export const redis = url && token ? new Redis({ url, token }) : null;

/* Notificações (chaves VAPID) */
const PUB = process.env.VAPID_PUBLIC_KEY || "";
const PRIV = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:ritmo@example.com";
export const vapidPublicKey = PUB;
export const pushReady = Boolean(PUB && PRIV);
if (pushReady) webpush.setVapidDetails(SUBJECT.startsWith("mailto:") || SUBJECT.startsWith("https:") ? SUBJECT : "mailto:" + SUBJECT, PUB, PRIV);
export { webpush };

export const devKey = id => `ritmo:dev:${id}`;
export const DEVICES = "ritmo:devices";
export const validId = id => typeof id === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(id);

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 200_000) break; chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

/* Garante que o servidor está configurado antes de continuar */
export function requireSetup(res) {
  if (!redis) { send(res, 503, { error: "db_missing", message: "Banco de dados não conectado. Conecte o Upstash Redis no painel da Vercel." }); return false; }
  if (!pushReady) { send(res, 503, { error: "vapid_missing", message: "Chaves de notificação não configuradas. Abra /api/setup." }); return false; }
  return true;
}

export async function sendPush(sub, payload) {
  return webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60 * 60 * 6, urgency: "high" });
}
