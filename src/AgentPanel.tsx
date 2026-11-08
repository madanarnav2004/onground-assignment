import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Headphones,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Sparkles,
  Target,
} from "lucide-react";
import { api, leads, callLabels } from "./data";
import {
  post,
  useWorkspace,
  type Followup,
  type Result,
  type Message,
} from "./workspaceState";
import "./agents.css";
export type AgentRole = "coach" | "asm" | "avani" | "followup" | "telecaller";
type Props = { role: AgentRole; onRecovery?: () => void };
const titles: Record<
  AgentRole,
  { name: string; eyebrow: string; intro: string }
> = {
  coach: {
    name: "A better conversation starts here.",
    eyebrow: "PITCH COACH",
    intro:
      "Practise a real Indian retail objection. Get feedback on what you actually said.",
  },
  asm: {
    name: "Put the right work first.",
    eyebrow: "ASM AGENT",
    intro:
      "Review this store’s leads and open loops, then decide which tasks the team should take on.",
  },
  avani: {
    name: "What needs your attention?",
    eyebrow: "AVANIBOT",
    intro:
      "Ask about leads, callback requests or the work still waiting in this workspace.",
  },
  followup: {
    name: "Keep the callback promise.",
    eyebrow: "FOLLOW-UP AGENT",
    intro:
      "Turn a reviewed request into an AI call. You choose when it runs and whose phone rings.",
  },
  telecaller: {
    name: "You lead the conversation.",
    eyebrow: "HUMAN TELE-CALLER",
    intro:
      "Speak from this browser to your test phone. Keep the customer context and outcome together.",
  },
};
const statusLabel = (s: string) => callLabels[s] || s.replaceAll("-", " ");
function ErrorLine({ text }: { text: string }) {
  return text ? (
    <div className="ag-error" role="alert">
      {text}
    </div>
  ) : null;
}
function Time({ value }: { value: string }) {
  const d = new Date(value);
  return (
    <time>
      {Number.isNaN(d.getTime())
        ? value
        : d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
    </time>
  );
}
function PhoneFields({
  phone,
  setPhone,
  consent,
  setConsent,
  human = false,
  disabled = false,
}: {
  phone: string;
  setPhone: (s: string) => void;
  consent: boolean;
  setConsent: (s: boolean) => void;
  human?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="ag-phone-fields">
      <label>
        Your test mobile number
        <input
          aria-label="Your test mobile number"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={disabled}
        />
      </label>
      <label className="ag-consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={disabled}
        />
        <span>
          This is my phone, and I agree to{" "}
          {human ? "a browser-to-phone demo call" : "an AI demo call"}. No real
          customer will be contacted.
        </span>
      </label>
      <p className="ag-caption">
        Trial recipients may need provider verification. Calls use the
        assignment’s shared allowance.
      </p>
    </div>
  );
}
function TaskProposal({
  result,
  onApprove,
  busy,
}: {
  result: Result;
  onApprove: (id: string) => void;
  busy: boolean;
}) {
  if (!result.tasks?.length) return null;
  return (
    <section className="ag-proposal">
      <div className="ag-section-head">
        <span>PROPOSED NEXT STEPS</span>
        <small>
          {result.approved ? "Saved to workspace" : "Your review is needed"}
        </small>
      </div>
      {result.tasks.map((t, i) => (
        <div className="ag-proposal-row" key={i}>
          <span className="ag-step-number">{i + 1}</span>
          <div>
            <strong>{t.title}</strong>
            <p>{t.reason}</p>
            <small>
              {leads.find((l) => l.id === t.leadId)?.name} · {t.owner}
            </small>
          </div>
        </div>
      ))}
      <button
        className={result.approved ? "og-secondary" : "og-primary"}
        disabled={busy || result.approved}
        onClick={() => onApprove(result.id)}
      >
        {result.approved ? (
          <>
            <Check size={15} />
            Tasks added
          </>
        ) : (
          <>
            <Check size={15} />
            Approve {result.tasks.length === 1 ? "task" : "tasks"}
          </>
        )}
      </button>
    </section>
  );
}
function Conversation({
  messages,
  onApprove,
  busy,
}: {
  messages: Message[];
  onApprove: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div className="ag-conversation" aria-live="polite">
      {messages.map((m, i) => (
        <article className={"ag-message " + (m.mine ? "mine" : "")} key={i}>
          <div className="ag-message-meta">
            <strong>{m.author}</strong>
            <Time value={m.time} />
          </div>
          <div className="ag-message-text">{m.text}</div>
          {m.result?.tasks?.length ? (
            <TaskProposal result={m.result} onApprove={onApprove} busy={busy} />
          ) : null}
        </article>
      ))}
    </div>
  );
}
function ChatAgent({ role }: { role: "asm" | "avani" }) {
  const { state, reload, ready } = useWorkspace();
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [approved, setApproved] = useState<string[]>([]);
  const messages = (state.conversations[role] || []).map((m) =>
    m.result && approved.includes(m.result.id)
      ? { ...m, result: { ...m.result, approved: true } }
      : m,
  );
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, busy]);
  async function send(question = text) {
    if (busy || !question.trim()) return;
    setBusy(true);
    setError("");
    try {
      await post<Result>("/api/agent", {
        role,
        text: question,
        requestId: crypto.randomUUID(),
      });
      setText("");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function approve(id: string) {
    setBusy(true);
    setError("");
    try {
      await post("/api/tasks/approve", { resultId: id });
      setApproved((a) => [...a, id]);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const prompts =
    role === "asm"
      ? ["Build my priority plan", "Which promises are still open?"]
      : [
          "Who should I call next?",
          "What does Mukunda need?",
          "Which requests need store input?",
        ];
  return (
    <>
      <div className="ag-prompts">
        {prompts.map((p) => (
          <button
            className="og-secondary"
            key={p}
            disabled={busy || !ready}
            onClick={() => void send(p)}
          >
            {p}
            <ArrowRight size={13} />
          </button>
        ))}
      </div>
      {!messages.length ? (
        <div className="ag-empty">
          <Sparkles size={24} />
          <strong>
            {role === "asm"
              ? "From the workspace to a clear plan."
              : "A useful answer, with the context already here."}
          </strong>
          <p>
            {role === "asm"
              ? "The agent reads your leads, actual call results and saved callback requests. You approve every proposed task."
              : "Start with a question above, or ask in your own words."}
          </p>
        </div>
      ) : (
        <Conversation
          messages={messages}
          onApprove={(id) => void approve(id)}
          busy={busy}
        />
      )}
      <div ref={end} />
      {busy && (
        <p className="ag-working" role="status">
          <span /> Reviewing the workspace…
        </p>
      )}
      <ErrorLine text={error} />
      <form
        className="ag-compose"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          aria-label={role === "asm" ? "Ask ASM Agent" : "Ask AvaniBot"}
          placeholder={
            role === "asm"
              ? "Ask about priorities, risks or team tasks…"
              : "Ask AvaniBot…"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!ready}
        />
        <button
          className="og-primary"
          aria-label="Send to assistant"
          disabled={busy || !ready || !text.trim()}
        >
          <Send size={16} />
        </button>
      </form>
      <p className="ag-caption">
        Suggestions use this demo’s workspace. Tasks stay here; no employee or
        customer is messaged.
      </p>
      {state.tasks.length > 0 && (
        <details className="ag-details">
          <summary>
            Workspace tasks{" "}
            <span>
              {state.tasks.filter((t) => t.status !== "done").length} open
            </span>
            <ChevronDown size={14} />
          </summary>
          <div className="ag-task-list">
            {state.tasks.map((t) => (
              <label key={t.id}>
                <input
                  type="checkbox"
                  checked={t.status === "done"}
                  onChange={() =>
                    void post("/api/tasks/complete", { id: t.id })
                      .then(reload)
                      .catch((e) => setError(e.message))
                  }
                />
                <span>
                  <strong>{t.title}</strong>
                  <small>
                    {leads.find((l) => l.id === t.leadId)?.name} · {t.owner}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
function Feedback({ result }: { result: Result }) {
  return (
    <section className="ag-feedback">
      <div className="ag-section-head">
        <span>YOUR PRACTICE REVIEW</span>
        <small>Based on this conversation</small>
      </div>
      <p className="ag-feedback-summary">{result.answer}</p>
      {result.scores?.length ? (
        <div className="ag-score-grid">
          {result.scores.map((s, i) => (
            <article key={i}>
              <div>
                <strong>{s.name.replaceAll("_", " ")}</strong>
                <b>
                  {s.score === null ? "—" : s.score}
                  <small>{s.score === null ? "unobserved" : " / 5"}</small>
                </b>
              </div>
              <p>{s.evidence}</p>
            </article>
          ))}
        </div>
      ) : null}
      {result.betterLine && (
        <blockquote>
          <span>TRY THIS NEXT TIME</span>“{result.betterLine}”
        </blockquote>
      )}
    </section>
  );
}
function Coach() {
  const { state, reload, ready } = useWorkspace();
  const [mode, setMode] = useState<"text" | "voice">("text"),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [voiceState, setVoiceState] = useState("idle"),
    [muted, setMuted] = useState(false),
    [feedback, setFeedback] = useState<Result | null>(null),
    [savedRun, setSavedRun] = useState<{
      requestId: string;
      executionId: string;
    } | null>(null);
  const call = useRef<import("@bolna/web-call").BolnaWebCall | null>(null),
    mounted = useRef(true),
    voiceAttempt = useRef(0),
    end = useRef<HTMLDivElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceActive = ["connecting", "ringing", "active"].includes(voiceState);
  const messages = (state.conversations.coach || []).map((message) =>
    message.result
      ? { ...message, result: { ...message.result, tasks: [] } }
      : message,
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      voiceAttempt.current++;
      if (timer.current) clearTimeout(timer.current);
      void call.current?.stop();
    };
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, busy]);
  async function feedbackForPractice() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await post<Result>("/api/agent", {
        role: "coach",
        mode: "feedback",
        text: "Review my actual associate practice turns. Show evidence, one change and a better next line. Do not score anything I did not demonstrate.",
        requestId: crypto.randomUUID(),
      });
      setFeedback(r);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      await post<Result>("/api/agent", {
        role: "coach",
        mode: "roleplay",
        text,
        requestId: crypto.randomUUID(),
      });
      setText("");
      setFeedback(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function syncVoice(
    run: { requestId: string; executionId: string },
    attempt = 0,
  ) {
    try {
      const r = await post<{ status: string }>("/api/web-result", run);
      if (!mounted.current) return;
      if (r.status === "completed") {
        setVoiceState("review-ready");
        setBusy(false);
        await reload();
        return;
      }
      if (attempt >= 12) {
        setBusy(false);
        setError(
          "The voice conversation has ended. Its transcript is still processing; check again before requesting feedback.",
        );
        return;
      }
      timer.current = setTimeout(() => void syncVoice(run, attempt + 1), 2500);
    } catch (e) {
      if (mounted.current) {
        setBusy(false);
        setError((e as Error).message);
      }
    }
  }
  async function stopVoice() {
    voiceAttempt.current++;
    if (call.current) await call.current.stop();
    else {
      setVoiceState("ended");
      setBusy(false);
    }
  }
  async function startVoice() {
    if (voiceActive || busy) return;
    const attempt = ++voiceAttempt.current;
    call.current = null;
    setMuted(false);
    setError("");
    setFeedback(null);
    setSavedRun(null);
    setBusy(true);
    setVoiceState("connecting");
    try {
      const { BolnaWebCall } = await import("@bolna/web-call");
      if (!mounted.current || voiceAttempt.current !== attempt) return;
      const requestId = crypto.randomUUID();
      const c = new BolnaWebCall({
        getSession: () =>
          post("/api/web-session", { requestId, role: "coach" }),
        debug: false,
      });
      call.current = c;
      c.on("state-change", (v) => {
        if (mounted.current) setVoiceState(v);
      });
      c.on("error", (e) => {
        if (mounted.current)
          setError(
            e.code === "microphone_denied"
              ? "Allow microphone access to practise by voice, or use text practice."
              : e.message,
          );
      });
      c.on("call-end", () => {
        if (!mounted.current) return;
        const executionId = c.getRunId();
        if (executionId) {
          const run = { requestId, executionId };
          setSavedRun(run);
          setBusy(true);
          setVoiceState("processing");
          void syncVoice(run);
        } else {
          setBusy(false);
          setVoiceState("ended");
        }
      });
      await c.start();
      if (mounted.current) setBusy(false);
    } catch (e) {
      if (mounted.current) {
        setError((e as Error).message);
        setBusy(false);
        setVoiceState("ended");
      }
    }
  }
  async function reset() {
    setBusy(true);
    setError("");
    try {
      await post("/api/practice/reset", {});
      setFeedback(null);
      setSavedRun(null);
      setVoiceState("idle");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const lastCoachMessage = messages[messages.length - 1];
  const storedReview = lastCoachMessage?.result;
  const currentReview =
    feedback ||
    (storedReview?.scores?.length || storedReview?.betterLine
      ? storedReview
      : null);
  return (
    <>
      <div className="ag-scenario">
        <span className="ag-scenario-icon">
          <Headphones size={20} />
        </span>
        <div>
          <strong>“I liked it, but the price feels high.”</strong>
          <p>
            You’re the associate. The AI plays a shopper who tried a mattress
            and wants to think it over with family.
          </p>
        </div>
      </div>
      <div className="ag-segment" aria-label="Practice method">
        <button
          className={mode === "text" ? "selected" : ""}
          onClick={() => setMode("text")}
          disabled={voiceActive || busy}
        >
          Text practice
        </button>
        <button
          className={mode === "voice" ? "selected" : ""}
          onClick={() => setMode("voice")}
          disabled={voiceActive || busy}
        >
          <Mic size={14} />
          Voice practice
        </button>
      </div>
      {mode === "text" ? (
        <>
          <Conversation messages={messages} onApprove={() => {}} busy={busy} />
          {!messages.length && (
            <div className="ag-customer">
              <small>PRACTICE CUSTOMER</small>
              <p>
                I liked the mattress, but it feels expensive. Why should I
                choose it?
              </p>
            </div>
          )}
          <form
            className="ag-compose"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              rows={2}
              aria-label="Your response to the customer"
              placeholder="What would you say to the shopper?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!ready}
            />
            <button
              className="og-primary"
              aria-label="Respond to practice customer"
              disabled={busy || !ready || !text.trim()}
            >
              <Send size={16} />
            </button>
          </form>
          <div ref={end} />
        </>
      ) : (
        <div
          className={
            "ag-voice-station " + (voiceState === "active" ? "active" : "")
          }
        >
          <div className="ag-voice-orb">
            <Headphones size={30} />
          </div>
          <strong role="status">
            {(
              {
                idle: "Ready when you are",
                connecting: "Connecting to the practice customer…",
                ringing: "Connecting audio…",
                active: "Your practice customer is listening",
                ended: "Practice ended",
                processing: "Preparing your transcript…",
                "review-ready": "Transcript ready for review",
              } as Record<string, string>
            )[voiceState] || voiceState}
          </strong>
          <p>
            Use Hindi, Hinglish or English. Speak as the associate. A short
            practice is enough.
          </p>
          <div className="ag-actions">
            {voiceActive ? (
              <>
                <button
                  className="og-secondary"
                  onClick={() => {
                    call.current?.setMuted(!muted);
                    setMuted(!muted);
                  }}
                >
                  {muted ? <MicOff size={15} /> : <Mic size={15} />}{" "}
                  {muted ? "Unmute" : "Mute"}
                </button>
                <button
                  className="ag-end-call"
                  onClick={() => void stopVoice()}
                >
                  <PhoneOff size={15} />
                  End practice
                </button>
              </>
            ) : (
              <button
                className="og-primary"
                onClick={() => void startVoice()}
                disabled={busy || !ready}
              >
                <Mic size={15} />
                Start voice practice
              </button>
            )}
          </div>
          <p className="ag-caption">
            Microphone required · 90-second maximum · no phone number needed
          </p>
          {savedRun && voiceState !== "review-ready" && !busy && (
            <button
              className="og-secondary"
              onClick={() => {
                setBusy(true);
                void syncVoice(savedRun);
              }}
            >
              Check transcript
            </button>
          )}
        </div>
      )}
      {busy && !voiceActive && (
        <p className="ag-working" role="status">
          <span />
          {voiceState === "processing"
            ? "Preparing your actual conversation…"
            : "Listening to the context…"}
        </p>
      )}
      <ErrorLine text={error} />
      <div className="ag-actions ag-review-actions">
        <button
          className="og-primary"
          disabled={busy || voiceActive || !state.practice?.length}
          onClick={() => void feedbackForPractice()}
        >
          <Target size={15} />
          Review my practice
        </button>
        <button
          className="og-secondary"
          disabled={busy || voiceActive}
          onClick={() => void reset()}
        >
          Start fresh
        </button>
      </div>
      {currentReview && <Feedback result={currentReview} />}
      <details className="ag-details">
        <summary>
          What a useful conversation sounds like
          <ChevronDown size={14} />
        </summary>
        <p>
          Ask what matters, acknowledge the hesitation and agree a next step.
          Customer budget is not a product quote. Store staff must confirm
          price, stock, payment options and visit availability.
        </p>
      </details>
    </>
  );
}
function Followups({ onRecovery }: { onRecovery?: () => void }) {
  const { state, reload, ready } = useWorkspace();
  const [chosen, setChosen] = useState(""),
    [phone, setPhone] = useState(""),
    [consent, setConsent] = useState(false),
    [date, setDate] = useState(""),
    [time, setTime] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const selected = state.followups.find((f) => f.id === chosen);
  function choose(f: Followup) {
    setChosen(f.id);
    setDate(f.date);
    setTime(f.time);
    setError("");
    setNotice("");
  }
  async function run(scheduled: boolean) {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const lead = leads.find((l) => l.name === selected.name);
      const scheduledAt = scheduled
        ? new Date(`${date}T${time}:00+05:30`).toISOString()
        : undefined;
      const c = await post<{ status: string; error?: string }>("/api/calls", {
        requestId: crypto.randomUUID(),
        phone,
        consent,
        leadId: lead?.id,
        followupId: selected.id,
        scheduledAt,
      });
      setNotice(
        c.status === "unknown"
          ? "The provider’s acceptance is uncertain. Do not try again until the call history is checked."
          : scheduled
            ? "The provider accepted this callback schedule. It can run after this page closes."
            : "The provider accepted the callback. Track it in Recent.",
      );
      if (c.error) setError(c.error);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function cancel(f: Followup) {
    if (!f.callId) return;
    setBusy(true);
    setError("");
    try {
      await post("/api/followups/cancel", { callId: f.callId });
      setNotice("The provider confirmed cancellation.");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!state.followups.length ? (
        <div className="ag-empty">
          <Clock size={26} />
          <strong>Every promise starts with a request.</strong>
          <p>
            Save a callback request from a lead or a completed AI call. Then
            return here to review and schedule it.
          </p>
          {onRecovery && (
            <button className="og-primary" onClick={onRecovery}>
              Try the recovery call
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="ag-followup-list">
          {state.followups.map((f) => (
            <article
              className={"ag-followup " + (chosen === f.id ? "selected" : "")}
              key={f.id}
            >
              <div>
                <strong>{f.name}</strong>
                <span className="ag-status">
                  {statusLabel(f.status || "requested")}
                </span>
              </div>
              <p>
                {new Date(`${f.date}T${f.time}:00+05:30`).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short" },
                )}{" "}
                · {f.time} IST · {f.language}
              </p>
              <details>
                <summary>
                  Customer context
                  <ChevronDown size={12} />
                </summary>
                <p>{f.note || "No additional context saved."}</p>
              </details>
              <div className="ag-actions">
                {!f.executionId ? (
                  <button
                    className="og-secondary"
                    onClick={() => choose(f)}
                    disabled={busy}
                  >
                    Review & schedule
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <span className="ag-caption">
                    {f.status === "scheduled"
                      ? "Scheduled with the calling provider"
                      : "Call request has been submitted"}
                  </span>
                )}
                {f.status === "scheduled" && (
                  <button
                    className="ag-text-button"
                    disabled={busy}
                    onClick={() => void cancel(f)}
                  >
                    Cancel scheduled call
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {selected && !selected.executionId && (
        <section className="ag-schedule">
          <div className="ag-section-head">
            <span>REVIEW BEFORE CALLING</span>
            <small>{selected.name}</small>
          </div>
          <p>
            This AI callback goes to <strong>your test phone</strong>, using the
            saved shopper context.
          </p>
          <PhoneFields
            {...{ phone, setPhone, consent, setConsent }}
            disabled={busy}
          />
          <details className="ag-details" open>
            <summary>
              Scheduled time · IST
              <ChevronDown size={13} />
            </summary>
            <div className="ag-date-time">
              <label>
                Date
                <input
                  type="date"
                  aria-label="Scheduled callback date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  aria-label="Scheduled callback time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
            </div>
            <p className="ag-caption">
              9 am–8 pm IST · at least one minute ahead · within seven days
            </p>
          </details>
          <div className="ag-actions">
            <button
              className="og-primary"
              disabled={
                busy || !ready || !phone.trim() || !consent || !date || !time
              }
              onClick={() => void run(true)}
            >
              <Clock size={15} />
              {busy ? "Submitting…" : "Schedule AI callback"}
            </button>
            <button
              className="og-secondary"
              disabled={busy || !ready || !phone.trim() || !consent}
              onClick={() => void run(false)}
            >
              <Phone size={14} />
              Call now instead
            </button>
          </div>
        </section>
      )}
      {notice && (
        <p className="ag-notice" role="status">
          {notice}
        </p>
      )}
      <ErrorLine text={error} />
      <p className="ag-caption">
        Saving a request does not dial anyone. Scheduling submits one call to
        the provider; there are no automatic retries or store booking promises.
      </p>
    </>
  );
}
type BrowserPhone = Omit<import("vobiz-webrtc-sdk").default, "client"> & {
  client: import("vobiz-webrtc-sdk").Client & {
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    once: (event: string, callback: (...args: unknown[]) => void) => void;
    removeAllListeners: () => void;
  };
};
type HumanRecord = {
  id: string;
  status: string;
  duration?: number;
  recipient?: string;
  disposition?: string;
  notes?: string;
  agentReportedStatus?: string;
};
function Telecaller() {
  const { reload, ready } = useWorkspace();
  const [phone, setPhone] = useState(""),
    [consent, setConsent] = useState(false),
    [leadId, setLeadId] = useState("mukunda"),
    [status, setStatus] = useState("idle"),
    [error, setError] = useState(""),
    [muted, setMuted] = useState(false),
    [notes, setNotes] = useState(""),
    [disposition, setDisposition] = useState("Callback requested"),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [record, setRecord] = useState<HumanRecord | null>(null),
    [humanReady, setHumanReady] = useState<boolean | null>(null);
  const sdk = useRef<BrowserPhone | null>(null),
    callId = useRef(""),
    audio = useRef<HTMLAudioElement>(null),
    mounted = useRef(true),
    callAttempt = useRef(0),
    limit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = ["permission", "connecting", "ringing", "active"].includes(
      status,
    ),
    lead = leads.find((l) => l.id === leadId)!;
  useEffect(() => {
    mounted.current = true;
    void api<{ humanReady: boolean }>("/api/config")
      .then((c) => {
        if (mounted.current) setHumanReady(c.humanReady);
      })
      .catch(() => {});
    return () => {
      mounted.current = false;
      callAttempt.current++;
      if (limit.current) clearTimeout(limit.current);
      try {
        sdk.current?.client.hangup();
        sdk.current?.client.logout();
        sdk.current?.client.removeAllListeners();
      } catch {}
      if (callId.current)
        void post("/api/human/disposition", {
          id: callId.current,
          status: "ended",
        }).catch(() => {});
    };
  }, []);
  useEffect(() => {
    if (!callId.current) return;
    let live = true;
    const refresh = async () => {
      try {
        const r = await api<HumanRecord>("/api/calls/" + callId.current);
        if (live) {
          setRecord(r);
          if (
            ["completed", "no-answer", "busy", "failed", "canceled"].includes(
              r.status,
            ) &&
            active
          )
            setStatus("ended");
        }
      } catch {}
    };
    void refresh();
    const interval = setInterval(() => void refresh(), 3500);
    return () => {
      live = false;
      clearInterval(interval);
    };
  }, [status]);
  function attachAudio() {
    const client = sdk.current?.client;
    if (!client || !audio.current) return;
    let stream = client.remoteView?.srcObject as MediaStream | undefined;
    if (!stream) {
      try {
        const receivers = client.getPeerConnection().pc?.getReceivers() || [];
        const track = receivers.find(
          (r: RTCRtpReceiver) => r.track?.kind === "audio",
        )?.track;
        if (track) stream = new MediaStream([track]);
      } catch {}
    }
    if (stream) {
      audio.current.srcObject = stream;
      void audio.current.play().catch(() => {
        if (mounted.current)
          setError(
            "Audio is ready. Use “Play call audio” below if your browser paused playback.",
          );
      });
    }
  }
  function end() {
    callAttempt.current++;
    try {
      sdk.current?.client.hangup();
      sdk.current?.client.logout();
    } catch {}
    setStatus("ended");
    if (limit.current) clearTimeout(limit.current);
    if (callId.current)
      void post("/api/human/disposition", {
        id: callId.current,
        status: "ended",
      })
        .then(reload)
        .catch((e) => setError(e.message));
  }
  async function start() {
    if (active) return;
    const attempt = ++callAttempt.current;
    setMuted(false);
    setError("");
    setSaved(false);
    setRecord(null);
    setStatus("permission");
    let id = "";
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw Error("Microphone calling needs a secure browser connection.");
      const permission = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      permission.getTracks().forEach((t) => t.stop());
      if (!mounted.current || callAttempt.current !== attempt) return;
      setStatus("connecting");
      const [{ default: Vobiz }, r] = await Promise.all([
        import("vobiz-webrtc-sdk"),
        post<{ id: string; token: string; destination: string }>(
          "/api/human/start",
          { requestId: crypto.randomUUID(), phone, consent, leadId },
        ),
      ]);
      id = r.id;
      callId.current = id;
      if (!mounted.current || callAttempt.current !== attempt) {
        void post("/api/human/disposition", { id, status: "failed" }).catch(
          () => {},
        );
        return;
      }
      const v = new Vobiz({
        debug: "OFF",
        permOnClick: true,
        enableTracking: false,
        closeProtection: false,
        maxAverageBitrate: 48000,
      }) as BrowserPhone;
      sdk.current = v;
      v.client.removeAllListeners();
      v.client.on("onCallRemoteRinging", () => {
        if (mounted.current) setStatus("ringing");
      });
      v.client.on("onCallAnswered", () => {
        if (!mounted.current) return;
        setStatus("active");
        attachAudio();
        setTimeout(attachAudio, 800);
        limit.current = setTimeout(end, 90000);
      });
      v.client.on("onMediaConnected", attachAudio);
      v.client.on("onCallTerminated", () => {
        if (!mounted.current) return;
        setStatus("ended");
        if (limit.current) clearTimeout(limit.current);
        void post("/api/human/disposition", { id: r.id, status: "ended" })
          .then(reload)
          .catch(() => {});
      });
      v.client.on("onCallFailed", () => {
        if (!mounted.current) return;
        setStatus("failed");
        setError(
          "The browser call did not connect. Check the provider result below before trying again.",
        );
        void post("/api/human/disposition", { id: r.id, status: "failed" })
          .then(reload)
          .catch(() => {});
      });
      v.client.on("onPermissionDenied", () => {
        if (mounted.current) {
          setStatus("failed");
          setError("Allow the microphone for this site, then try again.");
        }
      });
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () =>
            reject(
              Error(
                "The browser could not register with the calling provider. No automatic retry was made.",
              ),
            ),
          22000,
        );
        v.client.once("onLogin", () => {
          clearTimeout(timeout);
          if (!mounted.current || callAttempt.current !== attempt) {
            v.client.logout();
            reject(Error("Call cancelled before connecting."));
            return;
          }
          try {
            const accepted = v.client.call(r.destination, {});
            if (!accepted)
              reject(Error("The provider did not accept the browser call."));
            else resolve();
          } catch (e) {
            reject(e);
          }
        });
        v.client.once("onLoginFailed", () => {
          clearTimeout(timeout);
          reject(
            Error(
              "The calling provider could not register this browser. The trial account may need activation.",
            ),
          );
        });
        v.client.loginWithAccessTokenGenerator({
          getAccessToken: async () => r.token,
        });
      });
    } catch (e) {
      try {
        sdk.current?.client.hangup();
        sdk.current?.client.logout();
      } catch {}
      if (id)
        void post("/api/human/disposition", { id, status: "failed" }).catch(
          () => {},
        );
      if (mounted.current && callAttempt.current === attempt) {
        setError((e as Error).message);
        setStatus("failed");
      }
    }
  }
  async function save() {
    if (!callId.current || saving) return;
    setSaving(true);
    setError("");
    try {
      await post("/api/human/disposition", {
        id: callId.current,
        notes,
        disposition,
        status,
      });
      setSaved(true);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="ag-human-layout">
        <div className="ag-human-context">
          <label>
            Sample shopper
            <select
              aria-label="Tele-caller sample shopper"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              disabled={active}
            >
              {leads.map((l) => (
                <option value={l.id} key={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <div className="ag-context-card">
            <span className="ag-overline">BEFORE YOU CALL</span>
            <h3>{lead.product}</h3>
            <p>{lead.reason}</p>
            <span className="og-badge purple">{lead.language} preferred</span>
            <details>
              <summary>
                Conversation cues
                <ChevronDown size={13} />
              </summary>
              {lead.signals.map((s) => (
                <p key={s}>{s}</p>
              ))}
            </details>
          </div>
        </div>
        <div className="ag-human-dial">
          <PhoneFields
            {...{ phone, setPhone, consent, setConsent }}
            human
            disabled={active}
          />
          <div
            className={"ag-call-state " + (status === "active" ? "active" : "")}
          >
            <span />
            <strong role="status">
              {(
                {
                  idle: "Ready to connect",
                  permission: "Allow the microphone to continue",
                  connecting: "Connecting your browser…",
                  ringing: "Your test phone is ringing",
                  active: "Call connected",
                  ended: "Browser call ended",
                  failed: "Call could not connect",
                } as Record<string, string>
              )[status] || status}
            </strong>
          </div>
          <div className="ag-actions">
            {active ? (
              <>
                <button
                  className="og-secondary"
                  disabled={status !== "active"}
                  onClick={() => {
                    if (muted) sdk.current?.client.unmute();
                    else sdk.current?.client.mute();
                    setMuted(!muted);
                  }}
                >
                  {muted ? <MicOff size={15} /> : <Mic size={15} />}{" "}
                  {muted ? "Unmute" : "Mute"}
                </button>
                <button className="ag-end-call" onClick={end}>
                  <PhoneOff size={15} />
                  End call
                </button>
              </>
            ) : (
              <button
                className="og-primary"
                disabled={
                  !ready || humanReady === false || !phone.trim() || !consent
                }
                onClick={() => void start()}
              >
                <Phone size={15} />
                Call my test phone
              </button>
            )}
          </div>
          <p className="ag-caption">
            You speak from this browser. Answer your phone to hear the other
            side. Use headphones to avoid feedback. Maximum 90 seconds.
          </p>
          {humanReady === false && (
            <p className="ag-notice">
              The human calling connection is still being configured. Your notes
              and the AI calling demo remain available.
            </p>
          )}
          <audio ref={audio} autoPlay playsInline />
          <button
            className="ag-text-button"
            hidden={status !== "active"}
            onClick={() => {
              attachAudio();
              void audio.current?.play().catch(() => {});
            }}
          >
            Play call audio
          </button>
        </div>
      </div>
      <ErrorLine text={error} />
      {record && (
        <div className="ag-provider-proof">
          <span>PROVIDER RESULT</span>
          <strong>{statusLabel(record.status)}</strong>
          {typeof record.duration === "number" && (
            <small>{record.duration}s reported</small>
          )}
          <p>
            {["connecting", "ringing"].includes(record.status)
              ? "The provider has not finalised this call yet. Your browser’s state and its final record can arrive at different times."
              : "This status comes from the saved calling record."}
          </p>
        </div>
      )}
      {callId.current && (
        <section className="ag-outcome">
          <div className="ag-section-head">
            <span>LOG THE OUTCOME</span>
            <small>Reported by you</small>
          </div>
          <label>
            Outcome
            <select
              aria-label="Human call outcome"
              value={disposition}
              onChange={(e) => {
                setDisposition(e.target.value);
                setSaved(false);
              }}
            >
              {[
                "Callback requested",
                "Store visit requested",
                "Needs store input",
                "Not interested",
                "No conversation",
                "Other",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <textarea
              rows={3}
              aria-label="Human call notes"
              placeholder="What did the customer say, and what should happen next?"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          <button
            className="og-primary"
            disabled={saving || saved}
            onClick={() => void save()}
          >
            <Check size={15} />
            {saved ? "Outcome saved" : saving ? "Saving…" : "Save outcome"}
          </button>
          <p className="ag-caption">
            This note records your judgement. It does not create a confirmed
            store booking.
          </p>
        </section>
      )}
    </>
  );
}
export default function AgentPanel({ role, onRecovery }: Props) {
  const meta = titles[role];
  const { error, ready } = useWorkspace();
  return (
    <div className="ag-panel">
      <header className="ag-intro">
        <span className="ag-overline">{meta.eyebrow}</span>
        <h2>{meta.name}</h2>
        <p>{meta.intro}</p>
      </header>
      {!ready && (
        <p className="ag-working" role="status">
          <span /> Opening your workspace…
        </p>
      )}
      <ErrorLine text={error} />
      {role === "asm" || role === "avani" ? (
        <ChatAgent role={role} />
      ) : role === "coach" ? (
        <Coach />
      ) : role === "followup" ? (
        <Followups onRecovery={onRecovery} />
      ) : (
        <Telecaller />
      )}
      {["asm", "avani", "coach"].includes(role) && (
        <p className="ag-model-note">
          <Sparkles size={12} />
          Live AI assistance · grounded in this workspace · review before acting
        </p>
      )}
    </div>
  );
}
