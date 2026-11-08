import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

test("hosted API isolates workspaces and reserves every paid operation exactly once", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "onground-api-")),
    oldCwd = process.cwd(),
    originalFetch = globalThis.fetch;
  const originalEnv = Object.fromEntries(
    [
      "BLOB_READ_WRITE_TOKEN",
      "APP_SESSION_SECRET",
      "APP_URL",
      "CALLING_ENABLED",
      "BOLNA_API_KEY",
      "BOLNA_AGENT_ID",
      "VOBIZ_AUTH_ID",
      "VOBIZ_AUTH_TOKEN",
      "VOBIZ_APP_ID",
      "VOBIZ_CALLER_ID",
      "VOBIZ_WEBHOOK_SECRET",
    ].map((k) => [k, process.env[k]]),
  );
  process.chdir(directory);
  Object.assign(process.env, {
    BLOB_READ_WRITE_TOKEN: "",
    APP_SESSION_SECRET: "fixture-session-secret-long-enough",
    APP_URL: "http://127.0.0.1:4317",
    CALLING_ENABLED: "true",
    BOLNA_API_KEY: "fixture-key",
    BOLNA_AGENT_ID: randomUUID(),
    VOBIZ_AUTH_ID: "fixture-account",
    VOBIZ_AUTH_TOKEN: "fixture-secret",
    VOBIZ_APP_ID: "fixture-app",
    VOBIZ_CALLER_ID: "+919999999998",
    VOBIZ_WEBHOOK_SECRET: "fixture-webhook-secret",
  });
  let providerCalls = 0,
    minted = 0,
    executionLookups = 0;
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith("https://api.vobiz.ai")) {
      assert(String(url).endsWith("/JWT/Token/"));
      return new Response(JSON.stringify({ token: "fixture.jwt.token" }));
    }
    if (String(url).startsWith("https://api.bolna.ai")) {
      if (String(url).endsWith("/call")) {
        providerCalls++;
        const files = await readdir("data/workspaces");
        const states = await Promise.all(
          files.map((f) =>
            readFile(join("data/workspaces", f), "utf8").then(JSON.parse),
          ),
        );
        assert(
          states.some((s) => s.calls?.some((c) => c.status === "submitting")),
          "call must be durable before provider request",
        );
        assert(
          states.some((s) => s.items?.some((r) => r.kind === "phone")),
          "budget must be durable before provider request",
        );
        return new Response(
          JSON.stringify({ execution_id: randomUUID(), status: "queued" }),
        );
      }
      if (String(url).endsWith("/web-call/freeswitch-session")) {
        minted++;
        return new Response(
          JSON.stringify({
            run_id: randomUUID(),
            agent_id: "fixture-agent",
            sip_username: "fixture",
            sip_password: "fixture",
            expires_in: 120,
          }),
        );
      }
      if (String(url).includes("/executions/")) {
        executionLookups++;
        return new Response(JSON.stringify({ status: "completed" }));
      }
      throw Error("Unexpected provider operation");
    }
    return originalFetch(url, init);
  };
  const { handler } = await import("../server/api.mjs");
  const server = http.createServer(handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    globalThis.fetch = originalFetch;
    process.chdir(oldCwd);
    for (const [k, v] of Object.entries(originalEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    await rm(directory, { recursive: true, force: true });
  });
  const request = async (
    path,
    { cookie, body, method, origin = "http://127.0.0.1:4317", raw } = {},
  ) => {
    const r = await originalFetch(base + path, {
      method:
        method || (body !== undefined || raw !== undefined ? "POST" : "GET"),
      headers: {
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body !== undefined || raw !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(body !== undefined || raw !== undefined
        ? { body: raw ?? JSON.stringify(body) }
        : {}),
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  };
  const a = (await request("/api/state")).cookie,
    b = (await request("/api/state")).cookie;
  await t.test("private messages do not cross browser sessions", async () => {
    assert.equal(
      (
        await request("/api/workspace", {
          cookie: a,
          body: {
            field: "messages",
            value: {
              sales: [
                {
                  author: "You",
                  text: "Session A private note",
                  time: "now",
                  mine: true,
                },
              ],
            },
          },
        })
      ).status,
      200,
    );
    assert.equal(
      (await request("/api/state", { cookie: a })).data.messages.sales[0].text,
      "Session A private note",
    );
    assert.deepEqual(
      (await request("/api/state", { cookie: b })).data.messages,
      {},
    );
  });
  await t.test(
    "invalid object bodies and foreign origins do not reserve or dial",
    async () => {
      for (const raw of ["null", "[]", "{"])
        assert.equal(
          (await request("/api/calls", { cookie: a, raw })).status,
          400,
        );
      assert.equal(
        (
          await request("/api/calls", {
            cookie: a,
            body: {
              requestId: randomUUID(),
              consent: false,
              phone: "+919999999999",
            },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request("/api/calls", {
            cookie: a,
            body: {},
            origin: "https://unrelated.example",
          })
        ).status,
        403,
      );
      assert.equal(providerCalls, 0);
    },
  );
  await t.test(
    "parallel copies of one phone request cannot place two calls",
    async () => {
      const input = {
        requestId: randomUUID(),
        consent: true,
        phone: "+919999999999",
      };
      const replies = await Promise.all([
        request("/api/calls", { cookie: a, body: input }),
        request("/api/calls", { cookie: a, body: input }),
      ]);
      assert(replies.some((r) => r.status === 200));
      assert.equal(providerCalls, 1);
      const third = await request("/api/calls", { cookie: a, body: input });
      assert.equal(third.status, 200);
      assert.equal(providerCalls, 1);
      const rows = (await request("/api/calls", { cookie: a })).data;
      assert.equal(rows.length, 1);
      assert.equal(rows[0].recipient, "•••• 9999");
      assert.equal(rows[0].status, "queued");
    },
  );
  await t.test(
    "a consumed mint request is never minted again, including parallel requests",
    async () => {
      const id = randomUUID(),
        input = { requestId: id, role: "coach" };
      const replies = await Promise.all([
        request("/api/web-session", { cookie: b, body: input }),
        request("/api/web-session", { cookie: b, body: input }),
      ]);
      assert.deepEqual(replies.map((r) => r.status).sort(), [200, 409]);
      assert.equal(minted, 1);
      assert.equal(
        (await request("/api/web-session", { cookie: b, body: input })).status,
        409,
      );
      assert.equal(minted, 1);
    },
  );
  await t.test(
    "another browser can use the same request text without inheriting the first reservation",
    async () => {
      const c = (await request("/api/state")).cookie;
      const id = randomUUID();
      assert.equal(
        (
          await request("/api/web-session", {
            cookie: c,
            body: { requestId: id, role: "coach" },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request("/api/web-session", {
            cookie: a,
            body: { requestId: id, role: "coach" },
          })
        ).status,
        200,
      );
      assert.equal(minted, 3);
    },
  );
  await t.test(
    "a practice result must match its exact server-bound run ID",
    async () => {
      const data = (await request("/api/state", { cookie: b })).data;
      const op = Object.entries(data.operations).find(
        ([, op]) => op.type === "web-session",
      );
      assert(op);
      const r = await request("/api/web-result", {
        cookie: b,
        body: { requestId: op[0], executionId: randomUUID() },
      });
      assert.equal(r.status, 404);
      assert.equal(executionLookups, 0);
    },
  );
  await t.test(
    "one human call grant cannot be consumed twice and provider events retain truthful status",
    async () => {
      const h = (await request("/api/state")).cookie;
      const start = await request("/api/human/start", {
        cookie: h,
        body: {
          requestId: randomUUID(),
          phone: "+919999999999",
          consent: true,
        },
      });
      assert.equal(start.status, 200);
      const sid = h.split("=")[1].split(".")[0],
        id = start.data.id;
      const form = new URLSearchParams({
        From: `sip:og${sid}_fixture-account@registrar.vobiz.ai`,
        CallUUID: "fixture-call-uuid",
      });
      const answer = () =>
        originalFetch(base + "/api/vobiz/answer?key=fixture-webhook-secret", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form,
        }).then((r) => r.text());
      const xmls = await Promise.all([answer(), answer()]);
      assert.equal(xmls.filter((x) => x.includes("<Dial ")).length, 1);
      assert(xmls.find((x) => x.includes("<Dial ")).includes("callbackUrl="));
      const event = (body) =>
        originalFetch(
          base +
            `/api/vobiz/status?key=fixture-webhook-secret&sid=${sid}&id=${id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(body),
          },
        );
      await event({ DialAction: "connected" });
      assert.equal(
        (await request("/api/calls", { cookie: h })).data[0].status,
        "in-progress",
      );
      await request("/api/human/disposition", {
        cookie: h,
        body: {
          id,
          notes: "Customer asked for a staff callback",
          disposition: "Callback requested",
        },
      });
      await request("/api/human/disposition", {
        cookie: h,
        body: { id, status: "ended" },
      });
      assert.equal(
        (await request("/api/calls", { cookie: h })).data[0].status,
        "in-progress",
        "browser events cannot fabricate provider completion",
      );
      await event({ DialAction: "hangup", DialBLegDuration: "18" });
      await event({ DialStatus: "completed" });
      await event({ DialAction: "connected" });
      const call = (await request("/api/calls", { cookie: h })).data[0];
      assert.equal(call.status, "completed");
      assert.equal(call.duration, 18);
      assert.equal(call.notes, "Customer asked for a staff callback");
      assert.equal(call.disposition, "Callback requested");
    },
  );
  await t.test(
    "browser failure before human grant consumption invalidates the pending dial",
    async () => {
      const h = (await request("/api/state")).cookie,
        start = await request("/api/human/start", {
          cookie: h,
          body: {
            requestId: randomUUID(),
            phone: "+919999999999",
            consent: true,
          },
        });
      assert.equal(start.status, 200);
      await request("/api/human/disposition", {
        cookie: h,
        body: { id: start.data.id, status: "failed" },
      });
      assert.equal(
        (await request("/api/calls", { cookie: h })).data[0].status,
        "failed",
      );
      const sid = h.split("=")[1].split(".")[0];
      const xml = await originalFetch(
        base + "/api/vobiz/answer?key=fixture-webhook-secret",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            From: `sip:og${sid}_fixture-account@registrar.vobiz.ai`,
          }),
        },
      ).then((r) => r.text());
      assert(!xml.includes("<Dial "));
    },
  );
});
