import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { join } from "node:path";

export const TERMINAL = new Set([
  "completed",
  "no-answer",
  "busy",
  "failed",
  "canceled",
  "stopped",
  "error",
  "balance-low",
]);
const PHONE = /^\+[1-9]\d{7,14}$/;
export class CallError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Persist BEFORE sending. A dropped response is an uncertain call, never a retry.
export class CallingService {
  constructor({ env = process.env, fetcher = fetch, directory = "data" } = {}) {
    this.env = env;
    this.fetcher = fetcher;
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.path = join(directory, "calls.json");
    this.calls = existsSync(this.path)
      ? JSON.parse(readFileSync(this.path, "utf8"))
      : [];
    for (const call of this.calls)
      if (call.status === "submitting") call.status = "unknown";
    this.save();
  }
  save() {
    writeFileSync(this.path + ".tmp", JSON.stringify(this.calls), {
      mode: 0o600,
    });
    renameSync(this.path + ".tmp", this.path);
  }
  configuration() {
    const missing = [
      "BOLNA_API_KEY",
      "BOLNA_AGENT_ID",
      "TEST_PHONE_NUMBER",
    ].filter((k) => !this.env[k]?.trim());
    if (this.env.TEST_PHONE_NUMBER && !PHONE.test(this.env.TEST_PHONE_NUMBER))
      missing.push("valid TEST_PHONE_NUMBER");
    return {
      ready: missing.length === 0 && this.env.CALLING_ENABLED === "true",
      missing,
      enabled: this.env.CALLING_ENABLED === "true",
      recipient: this.env.TEST_PHONE_NUMBER
        ? "•••• " + this.env.TEST_PHONE_NUMBER.slice(-4)
        : null,
      attempts: this.calls.length,
      maxAttempts: this.limit(),
    };
  }
  limit() {
    const n = Number(this.env.MAX_TEST_CALLS || 3);
    return Number.isInteger(n) && n > 0 ? Math.min(n, 10) : 3;
  }
  list() {
    return this.calls.map(({ key, ...rest }) => rest);
  }
  async request(path, options = {}) {
    const response = await this.fetcher("https://api.bolna.ai" + path, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.env.BOLNA_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    // Never forward provider error bodies: they can contain phone numbers or secrets.
    if (!response.ok)
      throw new CallError(
        `Calling provider returned HTTP ${response.status}. Check the provider dashboard before another attempt.`,
        502,
      );
    return response.json();
  }
  async start(key) {
    if (typeof key !== "string" || !/^[\w-]{16,80}$/.test(key))
      throw new CallError("A valid request identifier is required.");
    const previous = this.calls.find((c) => c.key === key);
    if (previous) return previous;
    if (!this.configuration().ready)
      throw new CallError("Calling is not configured and enabled yet.", 503);
    if (this.calls.some((c) => !TERMINAL.has(c.status)))
      throw new CallError(
        "An earlier call is active or uncertain. Resolve it before calling again.",
        409,
      );
    if (this.calls.length >= this.limit())
      throw new CallError(
        "Test call limit reached. Review actual provider costs before increasing it.",
        409,
      );
    const call = {
      id: randomUUID(),
      key,
      status: "submitting",
      createdAt: new Date().toISOString(),
      events: [],
    };
    this.calls.push(call);
    this.save();
    try {
      const payload = {
        agent_id: this.env.BOLNA_AGENT_ID,
        recipient_phone_number: this.env.TEST_PHONE_NUMBER,
      };
      if (this.env.BOLNA_FROM_NUMBER)
        payload.from_phone_number = this.env.BOLNA_FROM_NUMBER;
      const result = await this.request("/call", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (
        typeof result.execution_id !== "string" ||
        !/^[a-f0-9-]{36}$/i.test(result.execution_id)
      )
        throw new Error("Missing execution ID");
      call.executionId = result.execution_id;
      call.status = "queued";
      call.events.push({ status: "queued", at: new Date().toISOString() });
    } catch {
      call.status = "unknown";
      call.error =
        "Could not confirm whether the provider accepted this call. Check Bolna call history; do not retry.";
    }
    this.save();
    return call;
  }
  async refresh(id) {
    const call = this.calls.find((c) => c.id === id);
    if (!call) throw new CallError("Call not found.", 404);
    if (!call.executionId || TERMINAL.has(call.status)) return call;
    const result = await this.request(
      "/executions/" + encodeURIComponent(call.executionId),
    );
    if (typeof result.status !== "string")
      throw new CallError(
        "The provider has not returned a call status yet.",
        502,
      );
    if (result.status !== call.status)
      call.events.push({ status: result.status, at: new Date().toISOString() });
    call.status = result.status;
    if (TERMINAL.has(call.status)) {
      call.duration = result.conversation_duration ?? null;
      call.costCents = result.total_cost ?? null;
      call.transcript =
        typeof result.transcript === "string" ? result.transcript : null;
      call.summary = typeof result.summary === "string" ? result.summary : null;
      call.terminationReason = result.termination_reason ?? null;
    }
    this.save();
    return call;
  }
}
