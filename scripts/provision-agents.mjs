import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const roles = [
  {
    role: "recovery",
    config: "bolna-agent.json",
    key: "BOLNA_AGENT_ID",
    extraction: "handoff-extraction.json",
  },
  {
    role: "coach",
    config: "coach-agent.json",
    key: "BOLNA_COACH_AGENT_ID",
    extraction: "practice-extraction.json",
  },
  {
    role: "followup",
    config: "followup-agent.json",
    key: "BOLNA_FOLLOWUP_AGENT_ID",
    extraction: "handoff-extraction.json",
  },
  {
    role: "analyst",
    config: "analyst-agent.json",
    key: "BOLNA_ANALYST_AGENT_ID",
    extraction: "intelligence-extraction.json",
  },
];
const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const agentId = (value) => value?.agent_id || value?.id;
const agentName = (value) =>
  value?.agent_name || value?.agent_config?.agent_name;
const parseEnv = (text) =>
  Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_][A-Z_0-9]*=/.test(line))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1)];
      }),
  );

// Keep credentials and unrelated settings intact, and save each ID immediately.
function saveSetting(envFile, privateDirectory, key, value) {
  if (typeof value !== "string" || !/^[a-f0-9-]{36}$/i.test(value))
    throw Error("The provider did not return a valid agent ID.");
  const lock = envFile + ".lock";
  const descriptor = fs.openSync(lock, "wx", 0o600);
  try {
    const original = fs.existsSync(envFile)
      ? fs.readFileSync(envFile, "utf8")
      : "";
    const lines = original
      .split(/\r?\n/)
      .filter((line) => !line.startsWith(key + "="));
    while (lines.at(-1) === "") lines.pop();
    const text = [...lines, `${key}=${value}`, ""].join("\n");
    const temporary = envFile + "." + randomUUID();
    fs.writeFileSync(temporary, text, { mode: 0o600 });
    fs.renameSync(temporary, envFile);
    fs.chmodSync(envFile, 0o600);
    fs.mkdirSync(privateDirectory, { recursive: true, mode: 0o700 });
    const backup = path.join(privateDirectory, "env.backup"),
      backupTemporary = backup + "." + randomUUID();
    fs.writeFileSync(backupTemporary, text, { mode: 0o600 });
    fs.renameSync(backupTemporary, backup);
    fs.chmodSync(backup, 0o600);
  } finally {
    fs.closeSync(descriptor);
    fs.unlinkSync(lock);
  }
}
function array(response, keys) {
  if (Array.isArray(response)) return response;
  for (const key of keys)
    if (Array.isArray(response?.[key])) return response[key];
  throw Error("The provider returned an unexpected list response.");
}
export function createRequest({
  apiKey = process.env.BOLNA_API_KEY,
  fetcher = fetch,
} = {}) {
  if (!apiKey)
    throw Error("Set BOLNA_API_KEY in the private local settings first.");
  return async (endpoint, body) => {
    const response = await fetcher("https://api.bolna.ai" + endpoint, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30000),
      redirect: "error",
    });
    // Never log raw provider errors; they may contain account details.
    if (!response.ok)
      throw Error(
        `Agent setup returned HTTP ${response.status} for ${endpoint.split("?")[0]}. Check the provider before rerunning; no automatic retry was made.`,
      );
    return response.json();
  };
}
export async function provisionAgents({
  request,
  root = projectRoot,
  envFile = path.join(root, ".env.local"),
  privateDirectory = path.join(root, ".private"),
  logger = console.log,
} = {}) {
  request ||= createRequest();
  const existing = array(await request("/agent/all"), [
    "agents",
    "data",
    "items",
  ]);
  const saved = fs.existsSync(envFile)
    ? parseEnv(fs.readFileSync(envFile, "utf8"))
    : {};
  const ids = {};
  for (const definition of roles) {
    const config = readJSON(path.join(root, "config", definition.config));
    const name = config.agent_config.agent_name;
    // Reuse only this assignment's named agents, never mutate an unrelated agent.
    const named = existing.filter((value) => agentName(value) === name);
    const matched =
      named.find((value) => agentId(value) === saved[definition.key]) ||
      named[0];
    if (
      named.length > 1 &&
      !named.some((value) => agentId(value) === saved[definition.key])
    )
      throw Error(
        `Several ${definition.role} agents share the assignment name. Set the intended agent ID in private settings before rerunning.`,
      );
    const created = matched || (await request("/v2/agent", config));
    ids[definition.role] = agentId(created);
    saveSetting(
      envFile,
      privateDirectory,
      definition.key,
      ids[definition.role],
    );
    if (!matched) existing.push({ ...created, agent_name: name });
    logger(
      `${matched ? "Reused" : "Created"} ${definition.role} agent; private ID saved.`,
    );
  }
  for (const definition of roles.filter((value) => value.extraction)) {
    const id = ids[definition.role],
      specification = readJSON(
        path.join(root, "config", definition.extraction),
      );
    const endpoint = `/agent/${id}/extraction-categories`;
    const categories = array(await request(endpoint), ["categories"]);
    let category = categories.find(
      (value) => value.name === specification.category,
    );
    if (!category)
      category = await request(endpoint, {
        name: specification.category,
        model: specification.model,
        managed_by: "bolna",
        min_duration_s: specification.min_duration_s ?? 10,
        skip_voicemail:
          specification.skip_voicemail ?? definition.role !== "analyst",
      });
    const categoryId = category.id || category.category_id;
    if (!categoryId)
      throw Error(
        `The ${definition.role} extraction category is missing its ID.`,
      );
    const response = await request(
      `/dispositions/?agent_id=${encodeURIComponent(id)}`,
    );
    const fields = Array.isArray(response)
      ? response
      : response.agent_dispositions || response.dispositions || [];
    const allFields = [
      ...(category.dispositions || []),
      ...fields.filter(
        (field) =>
          field.category_id === categoryId ||
          field.category === specification.category,
      ),
    ];
    const names = new Set(allFields.map((field) => field.name));
    const missing = Object.entries(specification.questions).filter(
      ([name]) => !names.has(name),
    );
    if (missing.length)
      await request("/dispositions/bulk", {
        agent_id: id,
        dispositions: missing.map(([name, question]) => ({
          name,
          question,
          category_id: categoryId,
          is_subjective: true,
          subjective_type: "text",
        })),
      });
    logger(
      `${definition.role} extractions ready; ${missing.length} missing fields added.`,
    );
  }
  logger(
    "Assignment agent setup complete. No calls were placed; existing prompts and fields were preserved.",
  );
  return ids;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  provisionAgents().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
