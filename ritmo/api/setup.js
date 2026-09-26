import webpush from "web-push";
import crypto from "node:crypto";
import { redis, pushReady } from "../lib/server.js";

/* Página de configuração: gera as chaves só enquanto elas ainda não existem. */
export default function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "seu-app.vercel.app";
  const origin = `https://${host}`;
  const ok = (b) => b ? '<b style="color:#2F5D50">✓ pronto</b>' : '<b style="color:#9C3D2E">✗ falta</b>';
  let body = `<h1>🌱 Configuração do Ritmo</h1>
  <ul><li>Banco de dados (Upstash Redis): ${ok(!!redis)}</li><li>Chaves de notificação: ${ok(pushReady)}</li><li>Senha do agendador (CRON_SECRET): ${ok(!!process.env.CRON_SECRET)}</li></ul>`;
  if (!pushReady || !process.env.CRON_SECRET) {
    const k = webpush.generateVAPIDKeys();
    const secret = crypto.randomBytes(18).toString("base64url");
    body += `<h2>Copie estas variáveis</h2>
    <p>Na Vercel: <i>Settings → Environment Variables</i>. Crie uma variável para cada linha abaixo (nome à esquerda, valor à direita) e depois faça um <i>Redeploy</i>.</p>
    <table>
      ${!pushReady ? `<tr><td>VAPID_PUBLIC_KEY</td><td><code>${k.publicKey}</code></td></tr>
      <tr><td>VAPID_PRIVATE_KEY</td><td><code>${k.privateKey}</code></td></tr>
      <tr><td>VAPID_SUBJECT</td><td><code>mailto:seu-email@exemplo.com</code> <small>(troque pelo seu e-mail)</small></td></tr>` : ""}
      ${!process.env.CRON_SECRET ? `<tr><td>CRON_SECRET</td><td><code>${secret}</code></td></tr>` : ""}
    </table>
    <p><small>Estes valores mudam a cada vez que você abre esta página. Copie todos de uma vez só. Depois de configurados, eles deixam de aparecer aqui.</small></p>`;
  }
  if (pushReady && process.env.CRON_SECRET) {
    body += `<h2>Endereço para o cron-job.org</h2><p>Use esta URL, com execução a cada 5 minutos, trocando SUA_SENHA pelo valor de CRON_SECRET:</p>
    <p><code>${origin}/api/tick?key=SUA_SENHA</code></p>`;
  }
  body += `<p><a href="/">← Abrir o Ritmo</a></p>`;
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Configuração do Ritmo</title>
  <style>body{font:16px/1.5 system-ui,sans-serif;background:#EFE6D6;color:#102A24;max-width:720px;margin:0 auto;padding:24px}table{width:100%;border-collapse:collapse;margin:12px 0}td{border:1px solid #D8CBB4;padding:10px;vertical-align:top;background:#F8F3EA}td:first-child{font-weight:700;white-space:nowrap}code{word-break:break-all;font-size:14px}a{color:#2F5D50;font-weight:700}</style>${body}</html>`);
}
