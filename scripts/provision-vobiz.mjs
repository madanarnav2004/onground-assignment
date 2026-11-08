import fs from "node:fs";
import crypto from "node:crypto";
const origin = process.env.APP_URL || "https://onground-arnav.vercel.app";
const id = process.env.VOBIZ_AUTH_ID,
  secret = process.env.VOBIZ_AUTH_TOKEN,
  key = process.env.VOBIZ_WEBHOOK_SECRET;
if (!id || !secret || !key)
  throw Error("Private Vobiz settings are incomplete.");
const base = `https://api.vobiz.ai/api/v1/Account/${id}`;
const headers = {
  "Content-Type": "application/json",
  "X-Auth-ID": id,
  "X-Auth-Token": secret,
};
async function api(path, body) {
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const t = await r.text();
  let x;
  try {
    x = JSON.parse(t);
  } catch {}
  if (!r.ok) {
    fs.writeFileSync(
      ".private/vobiz-provision-error.json",
      JSON.stringify({ path, status: r.status, response: x || t }),
      { mode: 0o600 },
    );
    throw Error(
      `Vobiz ${path} returned HTTP ${r.status}; private diagnostic saved.`,
    );
  }
  return x;
}
const inventory = await api("/numbers");
const number = inventory.items?.find(
  (n) => n.status === "active" && n.voice_enabled && !n.is_blocked,
);
if (!number) throw Error("No active voice number in current Vobiz account.");
const name = "OnGround Arnav Assignment Telecaller";
const apps = await api("/Application/");
let app = apps.objects?.find((a) => a.app_name === name);
if (!app) {
  const result = await api("/Application/", {
    app_name: name,
    answer_url: `${origin}/api/vobiz/answer?key=${encodeURIComponent(key)}`,
    answer_method: "POST",
    hangup_url: `${origin}/api/vobiz/status?key=${encodeURIComponent(key)}`,
    hangup_method: "POST",
  });
  app = { app_id: result.app_id };
  if (!app.app_id) throw Error("Vobiz did not return an application ID.");
}
const appInfo = await api(`/Application/${app.app_id}/`);
fs.writeFileSync(
  ".private/vobiz-assignment-app.json",
  JSON.stringify(appInfo),
  { mode: 0o600 },
);
function upsertEnv(key, value) {
  const path = ".env.local";
  let text = fs.readFileSync(path, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  text = re.test(text)
    ? text.replace(re, `${key}=${value}`)
    : `${text.replace(/\n?$/, "\n")}${key}=${value}\n`;
  fs.writeFileSync(path, text, { mode: 0o600 });
}
upsertEnv("VOBIZ_APP_ID", app.app_id);
upsertEnv("VOBIZ_CALLER_ID", number.e164);
upsertEnv("APP_URL", origin);
fs.copyFileSync(".env.local", ".private/env.backup");
fs.chmodSync(".private/env.backup", 0o600);
const ts = Math.floor(Date.now() / 1000),
  sub = "onground-check-" + crypto.randomBytes(4).toString("hex");
const result = await api("/JWT/Token/", {
  iss: id,
  sub,
  nbf: ts,
  exp: ts + 180,
  app: app.app_id,
  per: { voice: { incoming_allow: false, outgoing_allow: true } },
});
if (typeof result.token !== "string")
  throw Error("JWT mint returned no token.");
const claims = JSON.parse(
  Buffer.from(result.token.split(".")[1], "base64url").toString(),
);
const token = result.token,
  user = `${sub}_${id}`,
  domain = "registrar.vobiz.ai",
  host = `${crypto.randomBytes(6).toString("hex")}.invalid`;
const check = await new Promise((resolve) => {
  const ws = new WebSocket(`wss://${domain}:5063`, "sip");
  const timer = setTimeout(() => {
    ws.close();
    resolve({ registered: false, reason: "Registration timed out" });
  }, 12000);
  ws.onopen = () =>
    ws.send(
      [
        `REGISTER sip:${domain} SIP/2.0`,
        `Via: SIP/2.0/WSS ${host};branch=z9hG4bK${crypto.randomBytes(6).toString("hex")}`,
        "Max-Forwards: 69",
        `To: <sip:${user}@${domain}>`,
        `From: <sip:${user}@${domain}>;tag=${crypto.randomBytes(6).toString("hex")}`,
        `Call-ID: ${crypto.randomUUID()}`,
        `CSeq: 1 REGISTER`,
        `X-Vobiz-Jwt: ${token}`,
        `Contact: <sip:${user}@${host};transport=ws>;expires=120`,
        "Expires: 120",
        "User-Agent: onground-assignment-registration-check",
        "Content-Length: 0",
        "",
        "",
      ].join("\r\n"),
    );
  ws.onmessage = (e) => {
    const first = String(e.data).split("\r\n")[0];
    const status = Number(first.split(" ")[1]);
    if (status >= 200) {
      clearTimeout(timer);
      ws.close();
      resolve({ registered: status === 200, status });
    }
  };
  ws.onerror = () => {
    clearTimeout(timer);
    ws.close();
    resolve({ registered: false, reason: "WebSocket connection failed" });
  };
});
const proof = {
  checkedAt: new Date().toISOString(),
  provider: "Vobiz",
  application: "Dedicated assignment application",
  usesExistingTrialNumber: !!inventory.is_trial,
  newNumberPurchased: false,
  JWTMinted: true,
  JWTExpirySeconds: claims.exp - claims.nbf,
  permissions: claims.per,
  registration: check,
  noPhoneCallMade: true,
};
fs.writeFileSync(
  "docs/verification/vobiz-registration.json",
  JSON.stringify(proof, null, 2) + "\n",
);
console.log(JSON.stringify(proof));
