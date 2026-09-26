import { redis, pushReady, vapidPublicKey, send } from "../lib/server.js";
export default function handler(req, res) {
  send(res, 200, { ok: Boolean(redis && pushReady), db: Boolean(redis), push: pushReady, publicKey: vapidPublicKey });
}
