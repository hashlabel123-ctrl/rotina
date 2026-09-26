import { redis, requireSetup, readJson, send, validId, devKey, DEVICES } from "../lib/server.js";
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  if (!requireSetup(res)) return;
  const { deviceId } = await readJson(req);
  if (!validId(deviceId)) return send(res, 400, { error: "device" });
  await redis.del(devKey(deviceId));
  await redis.srem(DEVICES, deviceId);
  send(res, 200, { ok: true });
}
