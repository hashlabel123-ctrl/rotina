import { redis, requireSetup, readJson, send, validId, devKey, DEVICES } from "../lib/server.js";
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  if (!requireSetup(res)) return;
  const { deviceId, subscription } = await readJson(req);
  if (!validId(deviceId)) return send(res, 400, { error: "device" });
  if (!subscription || typeof subscription.endpoint !== "string" || !subscription.keys) return send(res, 400, { error: "subscription" });
  const doc = (await redis.get(devKey(deviceId))) || { reminders: [], sent: [] };
  doc.sub = { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } };
  doc.updatedAt = Date.now();
  await redis.set(devKey(deviceId), doc);
  await redis.sadd(DEVICES, deviceId);
  send(res, 200, { ok: true });
}
