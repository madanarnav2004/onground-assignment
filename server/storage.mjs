import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { randomUUID } from "node:crypto";
// CAS makes reservations durable before external effects, across Vercel instances.
export class Store {
  constructor({
    directory = "data/workspaces",
    cloud = !!process.env.BLOB_READ_WRITE_TOKEN,
    blobClient = { get, put },
  } = {}) {
    this.directory = directory;
    this.cloud = cloud;
    this.blobClient = blobClient;
    this.queue = Promise.resolve();
  }
  async read(key) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) throw Error("Invalid storage key");
    if (this.cloud) {
      const r = await this.blobClient.get(`workspaces/${key}.json`, {
        access: "private",
        useCache: false,
        // Compressed GETs acquire a weak W/ ETag which Blob's conditional
        // write API does not accept. Read identity bytes and the strong ETag.
        headers: { "Accept-Encoding": "identity" },
      });
      return r
        ? { value: await new Response(r.stream).json(), etag: r.blob.etag }
        : { value: null };
    }
    try {
      return {
        value: JSON.parse(
          await readFile(`${this.directory}/${key}.json`, "utf8"),
        ),
      };
    } catch (e) {
      if (e.code === "ENOENT") return { value: null };
      throw e;
    }
  }
  async mutate(key, initial, fn) {
    const work = async () => {
      for (let i = 0; i < 6; i++) {
        const { value, etag } = await this.read(key);
        const next = value ?? structuredClone(initial);
        const result = fn(next);
        try {
          if (this.cloud) {
            await this.blobClient.put(
              `workspaces/${key}.json`,
              JSON.stringify(next),
              {
                access: "private",
                addRandomSuffix: false,
                contentType: "application/json",
                ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
              },
            );
          } else {
            await mkdir(this.directory, { recursive: true, mode: 0o700 });
            const path = `${this.directory}/${key}.json`,
              temp = path + "." + randomUUID();
            await writeFile(temp, JSON.stringify(next), { mode: 0o600 });
            await rename(temp, path);
          }
          return result;
        } catch (e) {
          if (!/precondition|already exists/i.test(e.message)) throw e;
        }
      }
      throw Object.assign(Error("Workspace is busy. Please try again."), {
        status: 409,
      });
    };
    if (this.cloud) return work();
    const result = this.queue.then(work);
    this.queue = result.catch(() => {});
    return result;
  }
}
export const emptyWorkspace = {
  calls: [],
  followups: [],
  messages: {},
  responses: {},
  tasks: [],
  conversations: {},
  coaching: [],
  operations: {},
};
