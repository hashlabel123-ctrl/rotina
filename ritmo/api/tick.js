import { redis, requireSetup, send, devKey, DEVICES, sendPush } from "../lib/server.js";

/* Chamado a cada poucos minutos (cron-job.org). Envia os lembretes que já venceram. */
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] || "";
  const key = (req.query && req.query.key) || new URL(req.url, "http://x").searchParams.get("key");
  if (!secret || (key !== secret && auth !== `Bearer ${secret}`)) return send(res, 401, { error: "unauthorized" });
  if (!requireSetup(res)) return;

  const now = Date.now();
  const ids = (await redis.smembers(DEVICES)) || [];
  let sent = 0, removed = 0, failed = 0;
  for (const id of ids) {
    const doc = await redis.get(devKey(id));
    if (!doc || !doc.sub) { await redis.srem(DEVICES, id); continue; }
    const done = new Set(doc.sent || []);
    // Venceu, ainda não foi enviado e não é velho demais (evita avalanche depois de uma pausa).
    const due = (doc.reminders || []).filter(r => r.at <= now && r.at > now - 3 * 3600e3 && !done.has(r.id)).sort((a, b) => a.at - b.at);
    let gone = false;
    for (const r of due.slice(0, 6)) {
      try {
        await sendPush(doc.sub, { title: r.title, body: r.body, tag: r.tag || r.id });
        done.add(r.id); sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { gone = true; break; }
        failed++;
      }
    }
    if (gone) { await redis.del(devKey(id)); await redis.srem(DEVICES, id); removed++; continue; }
    if (due.length) {
      doc.reminders = (doc.reminders || []).filter(r => r.at > now - 24 * 3600e3);
      const keep = new Set(doc.reminders.map(r => r.id));
      doc.sent = [...done].filter(x => keep.has(x));
      await redis.set(devKey(id), doc);
    }
  }
  send(res, 200, { ok: true, devices: ids.length, sent, failed, removed, at: new Date(now).toISOString() });
}
