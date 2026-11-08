const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_BODY_BYTES = 32768;
const encoder = new TextEncoder();
const json = (value, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
async function authorized(request, secret) {
  const provided = (request.headers.get("Authorization") || "").replace(
    /^Bearer /,
    "",
  );
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(secret)),
  ]);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, expectedHash);
  // HMAC verification compares fixed-size digests, independent of token length.
  return crypto.subtle.verify("HMAC", key, signature, actualHash);
}
async function boundedJSON(request) {
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY_BYTES)
    throw { status: 413 };
  if (!request.body) throw { status: 400 };
  const reader = request.body.getReader(),
    chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw { status: 413 };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let position = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, position);
    position += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw { status: 400 };
  }
}
export default {
  async fetch(request, env) {
    if (!env.INFERENCE_SECRET)
      return json({ error: "Inference is not configured." }, 503);
    if (!(await authorized(request, env.INFERENCE_SECRET)))
      return json({ error: "Unauthorized." }, 401);
    if (request.method !== "POST")
      return json({ error: "POST required." }, 405);
    if (
      !String(request.headers.get("Content-Type") || "").startsWith(
        "application/json",
      )
    )
      return json({ error: "JSON required." }, 415);
    let input;
    try {
      input = await boundedJSON(request);
    } catch (e) {
      return json(
        {
          error:
            e.status === 413 ? "Request too large." : "Invalid JSON request.",
        },
        e.status || 400,
      );
    }
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      !Array.isArray(input.messages) ||
      input.messages.length < 1 ||
      input.messages.length > 24 ||
      input.messages.some(
        (m) =>
          !m ||
          !["system", "user", "assistant"].includes(m.role) ||
          typeof m.content !== "string" ||
          !m.content.trim(),
      )
    )
      return json({ error: "Valid text messages are required." }, 400);
    const maxTokens = input.max_tokens ?? 1000;
    if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 1400)
      return json({ error: "max_tokens must be between 1 and 1400." }, 400);
    if (input.response_format && input.response_format.type !== "json_object")
      return json({ error: "Only JSON object output is supported." }, 400);
    try {
      const result = await env.AI.run(MODEL, {
        messages: input.messages.map(({ role, content }) => ({
          role,
          content,
        })),
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        temperature: 0.2,
        stream: false,
      });
      const response =
        typeof result.response === "string"
          ? result.response
          : JSON.stringify(result.response);
      const parsed = JSON.parse(response);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw Error("Invalid model output");
      return json({ ...result, response, model: MODEL });
    } catch {
      // Do not log prompts, customer context, credentials or raw provider errors.
      console.error(
        JSON.stringify({ event: "inference_failed", provider: "workers-ai" }),
      );
      return json({ error: "The model could not complete this request." }, 502);
    }
  },
};
