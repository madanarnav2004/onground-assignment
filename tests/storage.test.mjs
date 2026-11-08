import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../server/storage.mjs";
function fixture(t) {
  return mkdtemp(join(tmpdir(), "onground-store-")).then((directory) => {
    t.after(() => rm(directory, { recursive: true, force: true }));
    return new Store({ directory, cloud: false });
  });
}
test("concurrent durable local mutations do not lose call reservations", async (t) => {
  const s = await fixture(t);
  const values = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      s.mutate("budget", { items: [] }, (state) => {
        state.items.push(i);
        return state.items.length;
      }),
    ),
  );
  assert.deepEqual(
    values,
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  assert.equal((await s.read("budget")).value.items.length, 12);
});
test("rejected mutation leaves last committed state intact", async (t) => {
  const s = await fixture(t);
  await s.mutate("one", { calls: [] }, (v) => v.calls.push({ id: "accepted" }));
  await assert.rejects(
    s.mutate("one", {}, (v) => {
      v.calls.push({ id: "should-not-commit" });
      throw Error("Rejected before commit");
    }),
    /Rejected/,
  );
  assert.deepEqual((await s.read("one")).value.calls, [{ id: "accepted" }]);
  await s.mutate("one", {}, (v) => v.calls.push({ id: "later" }));
  assert.equal((await s.read("one")).value.calls.length, 2);
});
test("independent workspaces and caller initial objects stay isolated", async (t) => {
  const s = await fixture(t),
    initial = { notes: [] };
  await s.mutate("alice", initial, (v) => v.notes.push("private"));
  await s.mutate("bob", initial, () => {});
  assert.deepEqual((await s.read("alice")).value.notes, ["private"]);
  assert.deepEqual((await s.read("bob")).value.notes, []);
  assert.deepEqual(initial, { notes: [] });
});
test("storage rejects path traversal before any filesystem access", async (t) => {
  const s = await fixture(t);
  await assert.rejects(s.read("../escape"), /Invalid storage key/);
  await assert.rejects(
    s.mutate("../escape", {}, () => {}),
    /Invalid storage key/,
  );
});

test("large cloud JSON reads preserve a strong ETag for conditional writes", async () => {
  let value = { notes: "Retail context ".repeat(400), approvals: 0 },
    version = 1;
  const blobClient = {
    async get(_pathname, options) {
      // Match Blob CDN behavior: compressed responses weaken the same ETag.
      const prefix =
        options.headers?.["Accept-Encoding"] === "identity" ? "" : "W/";
      return {
        stream: new Response(JSON.stringify(value)).body,
        blob: { etag: `${prefix}"version-${version}"` },
      };
    },
    async put(_pathname, content, options) {
      assert.equal(
        options.ifMatch,
        `"version-${version}"`,
        "conditional write must receive the strong object ETag",
      );
      value = JSON.parse(content);
      version++;
    },
  };
  const store = new Store({ cloud: true, blobClient });
  await store.mutate("large_workspace", {}, (s) => ++s.approvals);
  await store.mutate("large_workspace", {}, (s) => ++s.approvals);
  assert.equal((await store.read("large_workspace")).value.approvals, 2);
});
