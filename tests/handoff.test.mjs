import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeHandoff } from "../server/handoff.mjs";
const call = {
  id: "test-call",
  status: "completed",
  createdAt: "2026-11-08T09:34:54Z",
  transcript:
    "assistant: Could we call tomorrow?\nuser: सुबह दस बजे हिंदी चलती है ma’am\n",
};
function fields(overrides = {}) {
  return {
    "Retail Handoff": Object.fromEntries(
      Object.entries({
        callback_requested: "yes",
        callback_date: "2026-11-09",
        callback_time: "10:00",
        language: "Hindi",
        budget_inr: "10000",
        concern: "Price concern",
        evidence: "a made-up quote",
        ...overrides,
      }).map(([k, v]) => [k, { status: "completed", subjective: v }]),
    ),
  };
}
test("model draft preserves exact customer evidence and remains suggested", () => {
  const d = normalizeHandoff(fields(), call);
  assert.equal(d.date, "2026-11-09");
  assert.equal(d.budget, 10000);
  assert.equal(d.state, "suggested");
  assert.deepEqual(d.evidence, ["सुबह दस बजे हिंदी चलती है ma’am"]);
});
test("no callback draft without affirmative customer request or a completed call", () => {
  assert.equal(
    normalizeHandoff(fields({ callback_requested: "no" }), call),
    null,
  );
  assert.equal(
    normalizeHandoff(fields(), { ...call, status: "no-answer" }),
    null,
  );
});
test("invalid and unprovided fields stay empty instead of becoming default appointments", () => {
  const d = normalizeHandoff(
    fields({
      callback_date: "2026-02-31",
      callback_time: "25:00",
      language: "French",
      budget_inr: "not stated",
    }),
    call,
  );
  assert.equal(d.date, "");
  assert.equal(d.time, "");
  assert.equal(d.language, "");
  assert.equal(d.budget, null);
});
test("historical requested dates and assistant-only transcripts do not create false evidence", () => {
  assert.equal(
    normalizeHandoff(fields({ callback_date: "2026-11-07" }), call).date,
    "",
  );
  assert.equal(
    normalizeHandoff(fields(), {
      ...call,
      transcript: "assistant: Call tomorrow at 10?",
    }),
    null,
  );
});
