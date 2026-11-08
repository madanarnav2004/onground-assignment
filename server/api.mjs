import {
  createHmac,
  randomUUID,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { readFileSync } from "node:fs";
import { Store, emptyWorkspace } from "./storage.mjs";
import { CallError, TERMINAL } from "./calling.mjs";
import { normalizeHandoff } from "./handoff.mjs";
import { bolna, reason } from "./intelligence.mjs";
const leads = JSON.parse(
  readFileSync(new URL("../shared/seed-leads.json", import.meta.url)),
);
const store = new Store();
const now = () => new Date().toISOString();
const CLOSED = new Set([...TERMINAL, "ended"]);
const active = (c) => !CLOSED.has(c.status) && c.status !== "scheduled";
const MANUAL_RETRYABLE = new Set([
  "busy",
  "no-answer",
  "failed",
  "canceled",
  "stopped",
]);
function checkFollowupAttempt(followup, calls) {
  if (
    !followup.executionId &&
    !followup.callId &&
    (!followup.status || followup.status === "requested")
  )
    return;
  const latest = calls.find(
    (call) => call.id === followup.callId && call.followupId === followup.id,
  );
  if (
    !latest ||
    !MANUAL_RETRYABLE.has(latest.status) ||
    !MANUAL_RETRYABLE.has(followup.status)
  )
    err(
      "This callback already has a call. Only a busy, unanswered, failed or canceled attempt can be retried manually.",
      409,
    );
}

const callingEnabled = () => {
  if (process.env.CALLING_ENABLED !== "true")
    err("Demo calling is paused by its owner.", 503);
};
const mask = (p) => (p ? "•••• " + p.slice(-4) : null);
const json = (res, status, value) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(value));
};
const idOK = (id) =>
  typeof id === "string" && /^[a-zA-Z0-9_-]{16,80}$/.test(id);
const err = (message, status = 400) => {
  throw new CallError(message, status);
};
const clean = (s, n = 2000) =>
  typeof s === "string" ? s.trim().slice(0, n) : "";
const phone = (p) => {
  p = clean(p, 25).replace(/[\s()-]/g, "");
  if (!/^\+91[6-9]\d{9}$/.test(p))
    err("Enter your own Indian mobile number with +91.");
  return p;
};
const safeCall = ({ recipient, ...c }) => ({
  ...c,
  recipient: mask(recipient),
});
function session(req, res) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) err("Workspace authentication is not configured.", 503);
  const sign = (id) =>
    createHmac("sha256", secret).update(id).digest("base64url");
  const cookie =
    (req.headers.cookie || "").match(/(?:^|;\s*)og_session=([^;]+)/)?.[1] || "";
  const [id, sig] = cookie.split(".");
  if (
    /^[a-f0-9]{32}$/.test(id || "") &&
    sig &&
    sig.length === sign(id).length &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(sign(id)))
  )
    return id;
  const fresh = randomBytes(16).toString("hex");
  res.setHeader(
    "Set-Cookie",
    `og_session=${fresh}.${sign(fresh)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${process.env.VERCEL ? "; Secure" : ""}`,
  );
  return fresh;
}
async function body(req) {
  if (!String(req.headers["content-type"] || "").startsWith("application/json"))
    err("JSON required.", 415);
  let value = req.body;
  if (value === undefined) {
    let raw = "";
    for await (const c of req) {
      raw += c;
      if (raw.length > 18000) err("Request too large.", 413);
    }
    try {
      value = JSON.parse(raw);
    } catch {
      err("Invalid request JSON.");
    }
  } else if (typeof value === "string") {
    if (value.length > 18000) err("Request too large.", 413);
    try {
      value = JSON.parse(value);
    } catch {
      err("Invalid request JSON.");
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    err("A JSON object is required.");
  if (JSON.stringify(value).length > 18000) err("Request too large.", 413);
  return value;
}
async function state(sid) {
  return (await store.read(sid)).value || structuredClone(emptyWorkspace);
}
async function mutate(sid, fn) {
  return store.mutate(sid, emptyWorkspace, fn);
}
async function reserve(id, kind, sid) {
  return store.mutate("budget", { items: [] }, (s) => {
    const reservationId = `${sid}:${kind}:${id}`;
    if (s.items.some((x) => x.id === reservationId))
      err(
        "This request has already been processed. Check its existing result before starting another.",
        409,
      );
    const caps = { phone: 5, web: 5, human: 3, analysis: 70 };
    if (s.items.filter((x) => x.kind === kind).length >= (caps[kind] || 0))
      err(
        "This assignment’s shared demo allowance is used up. You can still explore all saved workflows.",
        429,
      );
    if (
      kind !== "analysis" &&
      s.items.some(
        (x) =>
          x.sid === sid &&
          x.kind === kind &&
          Date.now() - Date.parse(x.at) < 60000,
      )
    )
      err("Please wait a minute before another call.", 429);
    s.items.push({ id: reservationId, kind, sid, at: now() });
  });
}
async function patchCall(sid, id, patch) {
  return mutate(sid, (s) => {
    const c = s.calls.find((c) => c.id === id);
    if (!c) err("Call not found.", 404);
    Object.assign(c, patch);
    return safeCall(c);
  });
}
async function refreshCall(sid, id) {
  const s = await state(sid),
    c = s.calls.find((c) => c.id === id);
  if (!c) err("Call not found.", 404);
  if (c.kind === "human" || !c.executionId || TERMINAL.has(c.status))
    return safeCall(c);
  const x = await bolna("/executions/" + c.executionId);
  if (typeof x.status !== "string") return safeCall(c);
  const patch = {
    status: x.status,
    events: [
      ...c.events,
      ...(x.status !== c.status ? [{ status: x.status, at: now() }] : []),
    ],
  };
  if (TERMINAL.has(x.status)) {
    Object.assign(patch, {
      duration: x.conversation_duration ?? null,
      costCents: x.total_cost ?? null,
      transcript:
        typeof x.transcript === "string" ? x.transcript.slice(0, 18000) : null,
      summary: typeof x.summary === "string" ? x.summary.slice(0, 6000) : null,
      terminationReason: x.termination_reason ?? null,
    });
    patch.handoffDraft = normalizeHandoff(x.extracted_data, { ...c, ...patch });
  }
  const out = await patchCall(sid, id, patch);
  if (c.followupId)
    await mutate(sid, (s) => {
      const f = s.followups.find((f) => f.id === c.followupId);
      if (f && f.callId === id)
        f.status = TERMINAL.has(x.status)
          ? x.status
          : c.scheduledAt && Date.parse(c.scheduledAt) > Date.now()
            ? "scheduled"
            : x.status;
    });
  return out;
}
async function startCall(sid, input) {
  callingEnabled();
  if (!process.env.BOLNA_API_KEY || !process.env.BOLNA_AGENT_ID)
    err("AI calling is not configured.", 503);
  if (!idOK(input.requestId)) err("A request identifier is required.");
  if (input.consent !== true)
    err("Please confirm this is your phone and you agree to the demo call.");
  const recipient = phone(input.phone);
  const s = await state(sid);
  const previous = s.calls.find((c) => c.requestId === input.requestId);
  if (previous) return safeCall(previous);
  if (s.calls.some(active))
    err(
      "A call is still active or uncertain. Resolve it before starting another.",
      409,
    );
  const leadId = leads.some((l) => l.id === input.leadId)
    ? input.leadId
    : "mukunda";
  let f;
  if (input.followupId) {
    f = s.followups.find((f) => f.id === input.followupId);
    if (!f) err("Callback request not found.");
    checkFollowupAttempt(f, s.calls);
  }
  let scheduledAt;
  if (input.scheduledAt) {
    const t = Date.parse(input.scheduledAt);
    if (
      !Number.isFinite(t) ||
      t < Date.now() + 60000 ||
      t > Date.now() + 7 * 86400000
    )
      err("Choose a time at least one minute ahead and within seven days.");
    const hour = new Date(t + 330 * 60000).getUTCHours();
    if (hour < 9 || hour >= 20)
      err("Choose a callback between 9 am and 8 pm IST.");
    scheduledAt = new Date(t).toISOString();
  }
  const id = randomUUID();
  await reserve(input.requestId, "phone", sid);
  const c = {
    id,
    requestId: input.requestId,
    kind: "ai",
    role: f ? "followup" : "recovery",
    leadId,
    recipient,
    createdAt: now(),
    status: "submitting",
    events: [],
    ...(f ? { followupId: f.id } : {}),
    ...(scheduledAt ? { scheduledAt } : {}),
  };
  await mutate(sid, (s) => {
    if (s.calls.some((x) => x.requestId === input.requestId))
      err("Call request already being processed.", 409);
    if (s.calls.some(active))
      err(
        "A call is still active or uncertain. Resolve it before starting another.",
        409,
      );
    if (f) {
      const current = s.followups.find((x) => x.id === f.id);
      if (!current) err("Callback request not found.", 404);
      checkFollowupAttempt(current, s.calls);
      // Claim this exact attempt before dialing. Old call records stay in the
      // ledger, but a delayed result may update only its own latest request.
      current.callId = id;
      current.status = "submitting";
      delete current.executionId;
      delete current.scheduledAt;
    }
    s.calls.push(c);
  });
  try {
    const lead = leads.find((l) => l.id === leadId);
    const result = await bolna("/call", {
      agent_id: f
        ? process.env.BOLNA_FOLLOWUP_AGENT_ID
        : process.env.BOLNA_AGENT_ID,
      recipient_phone_number: recipient,
      ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
      user_data: {
        context: `${lead.name}, ${lead.product}. ${f?.note || lead.reason}. Requested language: ${f?.language || lead.language}. This is an authorized roleplay demo.`,
      },
    });
    if (!idOK(result.execution_id)) throw Error("Missing provider ID");
    const out = await patchCall(sid, id, {
      executionId: result.execution_id,
      status: scheduledAt ? "scheduled" : "queued",
      events: [{ status: scheduledAt ? "scheduled" : "queued", at: now() }],
    });
    if (f)
      await mutate(sid, (s) => {
        const current = s.followups.find((x) => x.id === f.id);
        if (current?.callId === id)
          Object.assign(current, {
            executionId: result.execution_id,
            status: scheduledAt ? "scheduled" : "queued",
            scheduledAt,
          });
      });
    return out;
  } catch (e) {
    const out = await patchCall(sid, id, {
      status: "unknown",
      error:
        e instanceof CallError
          ? e.message
          : "Could not confirm acceptance. Check provider history; do not retry automatically.",
    });
    if (f)
      await mutate(sid, (s) => {
        const current = s.followups.find((x) => x.id === f.id);
        if (current?.callId === id) current.status = "unknown";
      });
    return out;
  }
}
async function vobiz(path, request) {
  const id = process.env.VOBIZ_AUTH_ID,
    token = process.env.VOBIZ_AUTH_TOKEN;
  if (!id || !token) err("Human calling is not configured.", 503);
  const r = await fetch(`https://api.vobiz.ai/api/v1/Account/${id}${path}`, {
    method: request ? "POST" : "GET",
    headers: {
      "X-Auth-ID": id,
      "X-Auth-Token": token,
      "Content-Type": "application/json",
    },
    ...(request ? { body: JSON.stringify(request) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok)
    err(
      `The human calling provider returned ${r.status}. The trial account may require activation.`,
      502,
    );
  return r.json();
}
function xml(res, content) {
  res.writeHead(200, {
    "Content-Type": "application/xml",
    "Cache-Control": "no-store",
  });
  res.end(
    '<?xml version="1.0" encoding="UTF-8"?><Response>' +
      content +
      "</Response>",
  );
}
function escape(s) {
  return String(s).replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
}
async function webhook(req, res, url) {
  if (
    !process.env.VOBIZ_WEBHOOK_SECRET ||
    url.searchParams.get("key") !== process.env.VOBIZ_WEBHOOK_SECRET
  )
    return xml(res, "<Hangup/>");
  let p = new URLSearchParams(url.search);
  if (req.body && typeof req.body === "object") {
    for (const [k, v] of Object.entries(req.body)) p.set(k, String(v));
  } else if (req.method === "POST") {
    let raw = "";
    for await (const c of req) {
      raw += c;
      if (raw.length > 12000) return xml(res, "<Hangup/>");
    }
    for (const [k, v] of new URLSearchParams(raw)) p.set(k, v);
  }
  const match = (p.get("From") || "").match(/(?:sip:)?og([a-f0-9]{32})_/),
    sid = match?.[1] || url.searchParams.get("sid");
  if (!/^[a-f0-9]{32}$/.test(sid || "")) return xml(res, "<Hangup/>");
  if (url.pathname.endsWith("/answer")) {
    const dial = await mutate(sid, (s) => {
      const grant = s.humanGrant;
      if (!grant || grant.consumed || Date.parse(grant.expiresAt) < Date.now())
        return null;
      const c = s.calls.find((x) => x.id === grant.id && x.kind === "human");
      if (!c || CLOSED.has(c.status)) return null;
      grant.consumed = true;
      c.status = "ringing";
      c.providerCallId = p.get("CallUUID") || null;
      return { ...grant };
    });
    if (!dial) return xml(res, "<Hangup/>");
    const action = `${process.env.APP_URL}/api/vobiz/status?key=${process.env.VOBIZ_WEBHOOK_SECRET}&sid=${sid}&id=${dial.id}`;
    return xml(
      res,
      `<Dial callerId="${escape(process.env.VOBIZ_CALLER_ID)}" timeout="25" timeLimit="90" action="${escape(action)}" method="POST" callbackUrl="${escape(action)}" callbackMethod="POST"><Number>${escape(dial.recipient)}</Number></Dial>`,
    );
  }
  const id = url.searchParams.get("id");
  if (idOK(id))
    await mutate(sid, (s) => {
      const c = s.calls.find((x) => x.id === id && x.kind === "human");
      if (!c) return;
      const phase = p.get("DialAction");
      const status = p.get("DialStatus") || p.get("CallStatus");
      let next;
      if (phase === "answer" || phase === "connected") next = "in-progress";
      else if (status === "completed") next = "completed";
      else if (["busy", "no-answer", "failed", "canceled"].includes(status))
        next = status;
      else if (status === "cancel") next = "canceled";
      else if (status === "timeout") next = "no-answer";
      else if (phase === "hangup") next = "ended";
      // Late answer/connected callbacks must not reopen a completed call.
      if (next && !(CLOSED.has(c.status) && next === "in-progress")) {
        if (c.status !== next) c.events.push({ status: next, at: now() });
        c.status = next;
      }
      const duration =
        p.get("DialBLegDuration") || p.get("DialDuration") || p.get("Duration");
      if (
        duration !== null &&
        duration !== "" &&
        Number.isFinite(Number(duration))
      )
        c.duration = Math.max(0, Number(duration));
      if (p.get("DialBLegUUID")) c.providerBLegId = p.get("DialBLegUUID");
      if (p.get("DialHangupCause") || p.get("DialBLegHangupCause"))
        c.terminationReason =
          p.get("DialHangupCause") || p.get("DialBLegHangupCause");
    });
  return xml(res, "");
}
export async function handler(req, res) {
  const url = new URL(req.url, process.env.APP_URL || "http://127.0.0.1:4317");
  try {
    if (
      url.pathname.startsWith("/api/vobiz/answer") ||
      url.pathname === "/api/vobiz/status"
    )
      return await webhook(req, res, url);
    const origin = req.headers.origin;
    const allowed = new Set([
      process.env.APP_URL,
      "http://127.0.0.1:4317",
      "http://localhost:4317",
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ]);
    if (origin && !allowed.has(origin)) err("This origin is not allowed.", 403);
    if (req.method !== "GET" && (!origin || !allowed.has(origin)))
      err("Please use this app to make changes.", 403);
    const sid = session(req, res),
      path = url.pathname;
    const s = await state(sid);
    if (req.method === "GET" && path === "/api/state")
      return json(res, 200, {
        ...s,
        calls: s.calls.map(safeCall),
        humanGrant: undefined,
      });
    if (req.method === "GET" && path === "/api/config")
      return json(res, 200, {
        ready:
          !!process.env.BOLNA_API_KEY && process.env.CALLING_ENABLED === "true",
        missing: [],
        recipient: null,
        attempts: s.calls.filter((c) => c.kind === "ai").length,
        maxAttempts: 3,
        humanReady:
          !!process.env.VOBIZ_APP_ID && process.env.CALLING_ENABLED === "true",
        practiceReady:
          !!process.env.BOLNA_COACH_AGENT_ID &&
          process.env.CALLING_ENABLED === "true",
      });
    if (req.method === "GET" && path === "/api/calls")
      return json(res, 200, s.calls.map(safeCall));
    if (req.method === "GET" && /^\/api\/calls\/[a-f0-9-]{36}$/.test(path))
      return json(res, 200, await refreshCall(sid, path.split("/").pop()));
    const input = req.method === "GET" ? {} : await body(req);
    if (req.method === "POST" && path === "/api/calls")
      return json(res, 200, await startCall(sid, input));
    if (req.method === "POST" && path === "/api/workspace") {
      const field = input.field;
      if (!["followups", "messages", "responses"].includes(field))
        err("Unsupported workspace field.");
      if (input.value === undefined) err("Workspace value is required.");
      if (JSON.stringify(input.value).length > 32000)
        err("Workspace is too large.");
      await mutate(sid, (s) => {
        if (field === "followups") {
          if (!Array.isArray(input.value) || input.value.length > 30)
            err("Invalid callbacks.");
          s.followups = input.value.map((f) => {
            if (
              !f ||
              typeof f !== "object" ||
              !idOK(f.id) ||
              !leads.some((l) => l.name === f.name) ||
              !/^\d{4}-\d{2}-\d{2}$/.test(f.date) ||
              !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)
            )
              err("Invalid callback details.");
            const old = s.followups.find((x) => x.id === f.id);
            return {
              ...f,
              note: clean(f.note),
              status: old?.status || "requested",
              ...(old?.callId || old?.executionId
                ? {
                    executionId: old.executionId,
                    callId: old.callId,
                    scheduledAt: old.scheduledAt,
                  }
                : {}),
            };
          });
        } else if (field === "messages") {
          if (
            !input.value ||
            typeof input.value !== "object" ||
            Array.isArray(input.value)
          )
            err("Invalid messages.");
          s.messages = input.value;
        } else {
          if (
            !input.value ||
            typeof input.value !== "object" ||
            Array.isArray(input.value) ||
            Object.values(input.value).some((v) => typeof v !== "string")
          )
            err("Invalid responses.");
          s.responses = input.value;
        }
      });
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && path === "/api/agent") {
      const role = input.role;
      if (!["avani", "asm", "coach"].includes(role) || !clean(input.text))
        err("Choose an assistant and enter a message.");
      if (!idOK(input.requestId)) err("Request identifier required.");
      if (s.operations[input.requestId])
        return json(res, 200, s.operations[input.requestId]);
      await reserve(input.requestId, "analysis", sid);
      const response = await reason(
        role,
        { text: clean(input.text, 5000), mode: input.mode },
        s,
        leads,
      );
      const result = {
        id: input.requestId,
        ...response,
        createdAt: now(),
        role,
      };
      await mutate(sid, (s) => {
        s.operations[input.requestId] = result;
        s.conversations[role] = [
          ...(s.conversations[role] || []),
          { author: "You", text: clean(input.text), mine: true, time: now() },
          {
            author:
              role === "asm"
                ? "ASM Agent"
                : role === "coach"
                  ? "Pitch Coach"
                  : "AvaniBot",
            text: response.answer,
            time: now(),
            result,
          },
        ].slice(-30);
        if (role === "coach" && input.mode === "roleplay")
          s.practice = [
            ...(s.practice || []),
            { speaker: "Associate", text: clean(input.text) },
            { speaker: "Customer", text: response.answer },
          ].slice(-20);
        if (role === "coach" && input.mode === "feedback")
          s.coaching.push(result);
      });
      return json(res, 200, result);
    }
    if (req.method === "POST" && path === "/api/practice/reset") {
      await mutate(sid, (s) => {
        s.practice = [];
        s.conversations.coach = [];
        s.coaching = [];
      });
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && path === "/api/tasks/approve") {
      if (!idOK(input.resultId)) err("Invalid proposal.");
      const tasks = await mutate(sid, (s) => {
        const result = s.operations[input.resultId];
        if (!result) err("Proposal not found.", 404);
        if (result.approved) return s.tasks;
        for (const t of result.tasks)
          s.tasks.push({
            ...t,
            id: randomUUID(),
            status: "open",
            createdAt: now(),
            source: result.role,
          });
        result.approved = true;
        for (const messages of Object.values(s.conversations))
          for (const message of messages)
            if (message.result?.id === input.resultId)
              message.result.approved = true;
        return s.tasks;
      });
      return json(res, 200, tasks);
    }
    if (req.method === "POST" && path === "/api/tasks/complete") {
      await mutate(sid, (s) => {
        const t = s.tasks.find((t) => t.id === input.id);
        if (!t) err("Task not found.", 404);
        t.status = t.status === "done" ? "open" : "done";
      });
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && path === "/api/web-session") {
      callingEnabled();
      if (!idOK(input.requestId)) err("Request ID required.");
      await reserve(input.requestId, "web", sid);
      const role = input.role === "recovery" ? "recovery" : "coach";
      await mutate(sid, (s) => {
        s.operations[input.requestId] = {
          type: "web-session",
          role,
          status: "submitting",
          at: now(),
        };
      });
      const result = await bolna("/web-call/freeswitch-session", {
        agent_id:
          role === "coach"
            ? process.env.BOLNA_COACH_AGENT_ID
            : process.env.BOLNA_AGENT_ID,
      });
      if (!idOK(result.run_id))
        err(
          "The voice provider did not return a usable practice session.",
          502,
        );
      await mutate(sid, (s) => {
        s.operations[input.requestId] = {
          type: "web-session",
          role,
          status: "minted",
          runId: result.run_id,
          at: now(),
        };
      });
      return json(res, 200, result);
    }
    if (req.method === "POST" && path === "/api/web-result") {
      if (
        !idOK(input.executionId) ||
        !idOK(input.requestId) ||
        s.operations[input.requestId]?.type !== "web-session" ||
        s.operations[input.requestId]?.runId !== input.executionId
      )
        err("Practice session not found.", 404);
      const x = await bolna("/executions/" + input.executionId);
      if (
        x.agent_id &&
        ![
          process.env.BOLNA_COACH_AGENT_ID,
          process.env.BOLNA_AGENT_ID,
        ].includes(x.agent_id)
      )
        err("Session does not belong to this demo.", 403);
      const transcript = typeof x.transcript === "string" ? x.transcript : "";
      if (
        x.status === "completed" &&
        s.operations[input.requestId].role === "coach"
      )
        await mutate(sid, (s) => {
          s.practice = transcript
            .split("\n")
            .filter(Boolean)
            .map((line) => ({
              speaker: line.startsWith("user:") ? "Associate" : "Customer",
              text: line.replace(/^(user|assistant):\s*/, ""),
            }));
        });
      return json(res, 200, {
        status: x.status,
        transcript,
        summary: x.summary,
      });
    }
    if (req.method === "POST" && path === "/api/followups/cancel") {
      const c = s.calls.find((c) => c.id === input.callId && c.scheduledAt);
      if (!c) err("Scheduled callback not found.", 404);
      if (!["scheduled", "queued"].includes(c.status))
        err("Only a queued or scheduled call can be canceled.", 409);
      await bolna("/call/" + c.executionId + "/stop", undefined, "POST");
      await patchCall(sid, c.id, { status: "canceled" });
      await mutate(sid, (s) => {
        const f = s.followups.find((f) => f.id === c.followupId);
        if (f && f.callId === c.id) {
          f.status = "canceled";
        }
      });
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && path === "/api/human/start") {
      callingEnabled();
      if (input.consent !== true)
        err("Confirm this is your phone and you agree to the demo.");
      const recipient = phone(input.phone);
      if (!process.env.VOBIZ_APP_ID)
        err("Human calling is not enabled yet.", 503);
      if (!idOK(input.requestId)) err("Request identifier required.");
      if (s.calls.some((c) => c.kind === "human" && active(c)))
        err(
          "A human call is active or uncertain. Resolve it before another.",
          409,
        );
      await reserve(input.requestId, "human", sid);
      const id = randomUUID();
      await mutate(sid, (s) => {
        if (s.calls.some((c) => c.kind === "human" && active(c)))
          err(
            "A human call is active or uncertain. Resolve it before another.",
            409,
          );
        s.calls.push({
          id,
          requestId: input.requestId,
          kind: "human",
          leadId: leads.some((l) => l.id === input.leadId)
            ? input.leadId
            : "mukunda",
          status: "connecting",
          createdAt: now(),
          recipient,
          events: [],
        });
        s.humanGrant = {
          id,
          recipient,
          expiresAt: new Date(Date.now() + 180000).toISOString(),
          consumed: false,
        };
      });
      try {
        const ts = Math.floor(Date.now() / 1000);
        const x = await vobiz("/JWT/Token/", {
          iss: process.env.VOBIZ_AUTH_ID,
          sub: "og" + sid,
          nbf: ts,
          exp: ts + 180,
          app: process.env.VOBIZ_APP_ID,
          per: { voice: { incoming_allow: false, outgoing_allow: true } },
        });
        if (typeof x.token !== "string")
          err("Human calling token unavailable.", 502);
        return json(res, 200, { id, token: x.token, destination: recipient });
      } catch (error) {
        await mutate(sid, (s) => {
          const c = s.calls.find((c) => c.id === id);
          if (c && !s.humanGrant?.consumed) {
            c.status = "failed";
            c.error = "Could not start the browser calling session.";
            s.humanGrant = null;
          }
        });
        throw error;
      }
    }
    if (req.method === "POST" && path === "/api/human/disposition") {
      await mutate(sid, (s) => {
        const c = s.calls.find((c) => c.id === input.id && c.kind === "human");
        if (!c) err("Call not found.", 404);
        if (input.notes !== undefined) c.notes = clean(input.notes);
        if (input.disposition !== undefined)
          c.disposition = clean(input.disposition, 80);
        if (input.status !== undefined) {
          c.agentReportedStatus = clean(input.status, 40);
          const grant = s.humanGrant;
          if (
            grant?.id === c.id &&
            !grant.consumed &&
            ["failed", "ended", "canceled"].includes(c.agentReportedStatus)
          ) {
            c.status =
              c.agentReportedStatus === "ended"
                ? "canceled"
                : c.agentReportedStatus;
            s.humanGrant = null;
          }
        }
      });
      return json(res, 200, { ok: true });
    }
    return json(res, 404, { error: "Not found." });
  } catch (e) {
    console.error(
      "API request failed",
      url.pathname,
      e.name,
      e.status || 500,
      e instanceof CallError ? e.message : "internal",
    );
    return json(res, e.status || 500, {
      error:
        e instanceof CallError
          ? e.message
          : "The workspace could not save this change. Please try again.",
    });
  }
}
