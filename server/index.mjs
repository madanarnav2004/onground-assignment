import http from "node:http";
import { createServer } from "vite";
import { CallingService, CallError } from "./calling.mjs";

const port = Number(process.env.PORT || 4317);
const host = `127.0.0.1:${port}`;
const calling = new CallingService();
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "spa",
});
const json = (res, status, value) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
};
http
  .createServer(async (req, res) => {
    // Local milestone only. Hosted calling needs authentication before exposure.
    if (req.headers.host !== host && req.headers.host !== `localhost:${port}`)
      return json(res, 403, { error: "Host is not allowed." });
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, `http://${host}`).pathname,
      );
    } catch {
      return json(res, 400, { error: "Invalid path." });
    }
    if (/^\/(?:\.private|data|server|\.env[^/]*)(?:\/|$)/.test(pathname))
      return json(res, 404, { error: "Not found." });
    if (!req.url.startsWith("/api/")) return vite.middlewares(req, res);
    try {
      if (
        req.headers.origin &&
        ![`http://${host}`, `http://localhost:${port}`].includes(
          req.headers.origin,
        )
      )
        throw new CallError("Origin is not allowed.", 403);
      if (req.method === "GET" && req.url === "/api/config")
        return json(res, 200, calling.configuration());
      if (req.method === "GET" && req.url === "/api/calls")
        return json(res, 200, calling.list());
      if (req.method === "POST" && req.url === "/api/calls") {
        if (req.headers["content-type"] !== "application/json")
          throw new CallError("JSON required.", 415);
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 2000)
            throw new CallError("Request too large.", 413);
        }
        let input;
        try {
          input = JSON.parse(body);
        } catch {
          throw new CallError("Invalid JSON.");
        }
        const result = await calling.start(input.requestId);
        const { key, ...safe } = result;
        return json(res, 200, safe);
      }
      const match = req.url.match(/^\/api\/calls\/([a-f0-9-]{36})$/i);
      if (req.method === "GET" && match) {
        const { key, ...safe } = await calling.refresh(match[1]);
        return json(res, 200, safe);
      }
      json(res, 404, { error: "Not found." });
    } catch (error) {
      json(res, error.status || 500, {
        error:
          error instanceof CallError
            ? error.message
            : "Unexpected server error.",
      });
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Calling proof: http://${host}`),
  );
