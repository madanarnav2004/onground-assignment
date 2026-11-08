export type Lead = {
  id: string;
  name: string;
  initials: string;
  product: string;
  value: number;
  fit: number;
  intent: number;
  language: string;
  stage: string;
  reason: string;
  last: string;
  signals: string[];
};
export const leads: Lead[] = [
  {
    id: "mukunda",
    name: "Mukunda R.",
    initials: "MK",
    product: "Ortho mattress",
    value: 24000,
    fit: 87,
    intent: 91,
    language: "Hindi",
    stage: "Walk-out recovery",
    reason: "Tried a mattress in store. Still deciding on comfort and price.",
    last: "Yesterday · 5:40 pm",
    signals: [
      "Compared two mattress models in store",
      "Asked about monthly payments",
      "Wanted to discuss the decision at home",
    ],
  },
  {
    id: "ritu",
    name: "Ritu S.",
    initials: "RS",
    product: "Luxe mattress",
    value: 38000,
    fit: 93,
    intent: 96,
    language: "English",
    stage: "Quote follow-up",
    reason:
      "Asked for a quote after trying the Luxe mattress. Wants delivery details.",
    last: "Today · 11:20 am",
    signals: [
      "Requested a written quote",
      "Shared preferred mattress size",
      "Asked whether delivery is available to her pincode",
    ],
  },
  {
    id: "kavitha",
    name: "Kavitha R.",
    initials: "KR",
    product: "Hybrid mattress",
    value: 29000,
    fit: 81,
    intent: 84,
    language: "Kannada",
    stage: "Store visit",
    reason: "Wants to try the mattress with her family this weekend.",
    last: "Today · 10:05 am",
    signals: [
      "Asked for store timings",
      "Considering a weekend visit",
      "Wants to compare firmness in person",
    ],
  },
  {
    id: "sanjay",
    name: "Sanjay P.",
    initials: "SP",
    product: "Ergonomic chair",
    value: 18000,
    fit: 78,
    intent: 75,
    language: "Hindi",
    stage: "Callback due",
    reason: "Requested a callback after work to discuss the chair options.",
    last: "Yesterday · 6:15 pm",
    signals: [
      "Asked about adjustable lumbar support",
      "Provided a preferred callback window",
      "Comparing two chair options",
    ],
  },
  {
    id: "lakshmi",
    name: "Lakshmi R.",
    initials: "LR",
    product: "Ortho mattress",
    value: 24000,
    fit: 80,
    intent: 73,
    language: "Tamil",
    stage: "Walk-out recovery",
    reason: "Liked the mattress but wants to confirm bed dimensions first.",
    last: "Yesterday · 4:00 pm",
    signals: [
      "Tried the mattress for ten minutes",
      "Asked about standard sizes",
      "Needs to measure the bed at home",
    ],
  },
  {
    id: "faizan",
    name: "Faizan A.",
    initials: "FA",
    product: "Recliner",
    value: 42000,
    fit: 72,
    intent: 67,
    language: "English",
    stage: "Quote follow-up",
    reason:
      "Comparing recliners and checking whether it fits through the doorway.",
    last: "7 Nov · 3:30 pm",
    signals: [
      "Asked for exact dimensions",
      "Requested fabric options",
      "Needs to check access to the room",
    ],
  },
];
export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
export type HandoffDraft = {
  sourceCallId: string;
  date: string;
  time: string;
  language: string;
  budget: number | null;
  concern: string;
  evidence: string[];
  state: "suggested";
};
export type Call = {
  kind?: string;
  role?: string;
  leadId?: string;
  notes?: string;
  disposition?: string;
  id: string;
  status: string;
  createdAt: string;
  executionId?: string;
  duration?: number;
  costCents?: number;
  transcript?: string;
  summary?: string;
  terminationReason?: string;
  handoffDraft?: HandoffDraft | null;
  error?: string;
  events: { status: string; at: string }[];
};
export type Config = {
  ready: boolean;
  missing: string[];
  recipient: string | null;
  attempts: number;
  maxAttempts: number;
};
export const terminal = new Set([
  "completed",
  "no-answer",
  "busy",
  "failed",
  "canceled",
  "stopped",
  "error",
  "balance-low",
  "unknown",
  "ended",
]);
export const callLabels: Record<string, string> = {
  queued: "Waiting to dial",
  initiated: "Dialling",
  ringing: "Phone ringing",
  "in-progress": "Conversation in progress",
  "call-disconnected": "Processing call result",
  completed: "Call completed",
  "no-answer": "No answer",
  unknown: "Acceptance uncertain",
  "balance-low": "Credit needed",
};
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  const d = await r.json();
  if (!r.ok) throw Error(d.error || "Unable to load");
  return d;
}
