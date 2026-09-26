import { redis, requireSetup, readJson, send, validId, devKey } from "../lib/server.js";
const clip = (s, n) => String(s || "").slice(0, n);
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  if (!requireSetup(res)) return;
  const { deviceId, reminders } = await readJson(req);
  if (!validId(deviceId)) return send(res, 400, { error: "device" });
  if (!Array.isArray(reminders)) return send(res, 400, { error: "reminders" });
  const doc = await redis.get(devKey(deviceId));
  if (!doc || !doc.sub) return send(res, 404, { error: "not_subscribed" });
  const now = Date.now();
  const list = reminders
    .filter(r => r && typeof r.at === "number" && r.at > now - 3 * 3600e3 && r.at < now + 15 * 864e5)
    .slice(0, 400)
    .map(r => ({ id: clip(r.id, 140), at: r.at, title: clip(r.title, 120), body: clip(r.body, 300), tag: clip(r.tag, 60) }));
  const ids = new Set(list.map(r => r.id));
  doc.reminders = list;
  doc.sent = (doc.sent || []).filter(id => ids.has(id));
  doc.updatedAt = now;
  await redis.set(devKey(deviceId), doc);
  send(res, 200, { ok: true, count: list.length });
}
