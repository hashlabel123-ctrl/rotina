import { redis, requireSetup, readJson, send, validId, devKey, sendPush } from "../lib/server.js";
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  if (!requireSetup(res)) return;
  const { deviceId } = await readJson(req);
  if (!validId(deviceId)) return send(res, 400, { error: "device" });
  const doc = await redis.get(devKey(deviceId));
  if (!doc || !doc.sub) return send(res, 404, { error: "not_subscribed" });
  try {
    await sendPush(doc.sub, { title: "🌱 Ritmo", body: "Tudo certo! As notificações estão funcionando.", tag: "teste" });
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 502, { error: "push_failed", status: e.statusCode || 0 });
  }
}
