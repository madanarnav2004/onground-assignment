const languages = new Set([
  "Hindi",
  "English",
  "Kannada",
  "Tamil",
  "Telugu",
  "Other",
]);
// A model proposes fields; validation never turns a request into a booking.
export function normalizeHandoff(extractions, call) {
  const fields = extractions?.["Retail Handoff"];
  if (!fields || call.status !== "completed") return null;
  const answer = (name) => {
    const value = fields[name];
    return value?.status === "completed" && typeof value.subjective === "string"
      ? value.subjective.trim()
      : "";
  };
  if (answer("callback_requested").toLowerCase() !== "yes") return null;
  const date = answer("callback_date");
  const time = answer("callback_time");
  const language = answer("language");
  const budget = answer("budget_inr");
  const parsedDate = new Date(date + "T00:00:00Z");
  const dateValid =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date;
  const callDay = new Date(new Date(call.createdAt).getTime() + 330 * 60000)
    .toISOString()
    .slice(0, 10);
  // Use original customer lines. Model-produced "quotes" can be paraphrases.
  const evidence = (call.transcript || "")
    .split("\n")
    .filter((line) => line.startsWith("user:"))
    .map((line) => line.replace(/^user:\s*/, ""))
    .filter(Boolean);
  if (!evidence.length) return null;
  return {
    sourceCallId: call.id,
    date: dateValid && date >= callDay ? date : "",
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "",
    language: languages.has(language) ? language : "",
    budget:
      /^\d{1,8}$/.test(budget) && Number(budget) > 0 ? Number(budget) : null,
    concern: answer("concern").slice(0, 180),
    evidence,
    state: "suggested",
  };
}
