import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { provisionAgents } from "../scripts/provision-agents.mjs";
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "onground-provision-"));
  fs.cpSync(new URL("../config", import.meta.url), path.join(root, "config"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, ".env.local"),
    "BOLNA_API_KEY=fixture-private\nUNRELATED_SETTING=preserve-me\n",
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function provider() {
  const agents = [],
    categories = new Map();
  let writes = 0,
    fields = 0;
  const request = async (endpoint, body) => {
    if (endpoint === "/agent/all") return structuredClone(agents);
    if (endpoint === "/v2/agent" && body) {
      writes++;
      const agent = {
        agent_id: randomUUID(),
        agent_name: body.agent_config.agent_name,
      };
      agents.push(agent);
      categories.set(agent.agent_id, []);
      return agent;
    }
    const match = endpoint.match(
      /^\/agent\/([a-f0-9-]+)\/extraction-categories$/,
    );
    if (match) {
      if (body) {
        writes++;
        const category = { ...body, id: randomUUID(), dispositions: [] };
        categories.get(match[1]).push(category);
        return structuredClone(category);
      }
      return { categories: structuredClone(categories.get(match[1])) };
    }
    if (endpoint.startsWith("/dispositions/?agent_id=")) {
      const id = decodeURIComponent(endpoint.split("=")[1]);
      return {
        agent_dispositions: structuredClone(
          categories.get(id).flatMap((c) => c.dispositions),
        ),
        global_dispositions: [],
      };
    }
    if (endpoint === "/dispositions/bulk") {
      writes++;
      fields += body.dispositions.length;
      for (const field of body.dispositions) {
        categories
          .get(body.agent_id)
          .find((c) => c.id === field.category_id)
          .dispositions.push({ ...field, id: randomUUID() });
      }
      return { message: "created" };
    }
    throw Error("Unexpected endpoint " + endpoint);
  };
  return {
    request,
    agents,
    categories,
    get writes() {
      return writes;
    },
    get fields() {
      return fields;
    },
  };
}
test("fresh provisioning creates all four configured agents and all extraction fields; rerun adds nothing", async (t) => {
  const root = fixture(t),
    p = provider(),
    logs = [];
  const ids = await provisionAgents({
    root,
    request: p.request,
    logger: (line) => logs.push(line),
  });
  assert.deepEqual(Object.keys(ids), [
    "recovery",
    "coach",
    "followup",
    "analyst",
  ]);
  assert.equal(p.agents.length, 4);
  assert.equal(p.fields, 23);
  const coachCategories = p.categories.get(ids.coach);
  assert.equal(coachCategories.length, 1);
  assert.equal(coachCategories[0].name, "Practice Customer");
  assert.deepEqual(
    coachCategories[0].dispositions.map((field) => field.name),
    ["customer_reply"],
  );
  assert(
    !p.categories
      .get(ids.analyst)
      .some((category) => category.name === "Practice Customer"),
  );
  const writes = p.writes;
  const repeated = await provisionAgents({
    root,
    request: p.request,
    logger: () => {},
  });
  assert.deepEqual(repeated, ids);
  assert.equal(p.writes, writes);
  const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
  assert(env.includes("UNRELATED_SETTING=preserve-me"));
  assert.equal(
    env,
    fs.readFileSync(path.join(root, ".private/env.backup"), "utf8"),
  );
  assert.equal((env.match(/^BOLNA_AGENT_ID=/gm) || []).length, 1);
  assert(!logs.some((line) => line.includes("fixture-private")));
});
test("IDs are saved after every creation so partial setup resumes without duplicate agents", async (t) => {
  const root = fixture(t),
    p = provider();
  let creates = 0;
  await assert.rejects(
    provisionAgents({
      root,
      logger: () => {},
      request: async (endpoint, body) => {
        if (endpoint === "/v2/agent" && ++creates === 3)
          throw Error("Provider unavailable");
        return p.request(endpoint, body);
      },
    }),
    /Provider unavailable/,
  );
  const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
  assert(env.includes("BOLNA_AGENT_ID="));
  assert(env.includes("BOLNA_COACH_AGENT_ID="));
  assert(!env.includes("BOLNA_FOLLOWUP_AGENT_ID="));
  await provisionAgents({ root, request: p.request, logger: () => {} });
  assert.equal(p.agents.length, 4);
  assert.equal(p.fields, 23);
});
