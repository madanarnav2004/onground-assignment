import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateCoachingScores,
  reason,
  parseCoachingFields,
} from "../server/intelligence.mjs";
const practice = [
  {
    speaker: "Associate",
    text: "I understand the price feels high. What budget would feel comfortable for you?",
  },
  { speaker: "Customer", text: "My budget is ten thousand rupees." },
  {
    speaker: "Associate",
    text: "I cannot promise a discount, but I can ask the store team to confirm options.",
  },
];
test("coaching scores retain an actual contiguous associate excerpt", () => {
  const [score] = validateCoachingScores(
    [
      {
        name: "discovery",
        score: 4,
        evidence: "“What budget would feel comfortable for you?”",
      },
    ],
    practice,
  );
  assert.equal(score.score, 4);
  assert.equal(score.evidence, "What budget would feel comfortable for you?");
});
test("fabricated coaching quotations and customer words remain unscored", () => {
  const scores = validateCoachingScores(
    [
      {
        name: "accuracy",
        score: 5,
        evidence: "We guarantee a discount and free delivery.",
      },
      {
        name: "discovery",
        score: 4,
        evidence: "My budget is ten thousand rupees.",
      },
    ],
    practice,
  );
  assert(scores.every((s) => s.score === null));
  assert(scores.every((s) => s.evidence.includes("unscored")));
});
test("out-of-range scores do not become valid merely because evidence matches", () => {
  const [score] = validateCoachingScores(
    [
      {
        name: "empathy",
        score: 8,
        evidence: "I understand the price feels high.",
      },
    ],
    practice,
  );
  assert.equal(score.score, null);
  assert.equal(score.evidence, "I understand the price feels high.");
});
test("feedback without an associate practice turn is rejected before a model request", async () => {
  await assert.rejects(
    reason(
      "coach",
      { mode: "feedback", text: "Review my practice" },
      { practice: [{ speaker: "Customer", text: "Too expensive." }] },
      [],
    ),
    /Complete at least one practice response/,
  );
});
test("customer roleplay uses its dedicated agent and dialogue without sales workspace leakage", async (t) => {
  const originalFetch = globalThis.fetch,
    oldCoach = process.env.BOLNA_COACH_AGENT_ID;
  process.env.BOLNA_COACH_AGENT_ID = "fixture-customer-agent";
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (oldCoach === undefined) delete process.env.BOLNA_COACH_AGENT_ID;
    else process.env.BOLNA_COACH_AGENT_ID = oldCoach;
  });
  let sent;
  globalThis.fetch = async (url, init) => {
    assert.equal(
      url,
      "https://api.bolna.ai/v2/agent/fixture-customer-agent/dispositions/test",
    );
    sent = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        extracted_data: {
          "Practice Customer": {
            customer_reply: {
              subjective:
                "Yes, please ask someone to call me tomorrow at ten in Hindi.",
            },
          },
        },
      }),
    );
  };
  const result = await reason(
    "coach",
    { mode: "roleplay", text: "Would you prefer a callback tomorrow at ten?" },
    {
      practice: [
        { speaker: "Associate", text: "What concerns you?" },
        { speaker: "Customer", text: "The price is high." },
      ],
      followups: [{ note: "PRIVATE SALES WORKSPACE SENTINEL" }],
      tasks: [],
    },
    [{ name: "SAMPLE LEAD SENTINEL" }],
  );
  assert.equal(
    result.answer,
    "Yes, please ask someone to call me tomorrow at ten in Hindi.",
  );
  assert.deepEqual(result.tasks, []);
  assert.equal(
    sent.transcript,
    "user: What concerns you?\nassistant: The price is high.\nuser: Would you prefer a callback tomorrow at ten?\nassistant:",
  );
  assert(!sent.transcript.includes("SENTINEL"));
  assert(!sent.transcript.includes("APPLICATION"));
});
test("managed scalar rubric fields use genuine model prose and source-matched evidence", () => {
  const result = parseCoachingFields(
    {
      workspace_response: {
        subjective:
          "You asked useful discovery questions. Personalise the empathy a little more.",
      },
      assistant_answer: {
        subjective:
          '{"name":"discovery","score":4,"evidence":"What budget would feel comfortable for you?"}',
      },
      score_discovery: {
        subjective: "4",
        status: "completed",
        reasoning_subjective:
          "The associate asked: 'What budget would feel comfortable for you?'.",
      },
      better_line: {
        subjective:
          "What matters most to you, and which options should we ask the store to confirm?",
      },
    },
    practice,
  );
  assert.equal(
    result.answer,
    "You asked useful discovery questions. Personalise the empathy a little more.",
  );
  assert.equal(result.scores[0].score, 4);
  assert.equal(
    result.scores[0].evidence,
    "What budget would feel comfortable for you?",
  );
  assert(!result.answer.startsWith("{"));
});
test("managed scalar score without a matching associate quote stays unscored", () => {
  const result = parseCoachingFields(
    {
      workspace_response: { subjective: "Try asking one clear question." },
      score_empathy: {
        subjective: "5",
        status: "completed",
        reasoning_subjective:
          "The customer said 'My budget is ten thousand rupees.'",
      },
    },
    practice,
  );
  assert.equal(result.scores[0].name, "empathy");
  assert.equal(result.scores[0].score, null);
  assert.equal(result.feedbackTextSource, "model");
});
