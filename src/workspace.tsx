import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hash,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Search,
  Send,
  Sparkles,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  leads,
  money,
  terminal,
  callLabels,
  type Lead,
  type Call,
} from "./data";
import { useCalls } from "./useCalls";
import { useRemote, useWorkspace, post } from "./workspaceState";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import verifiedCall from "./verifiedCall.json";
const AgentPanel = lazy(() => import("./AgentPanel"));
type AgentRole = "avani" | "asm" | "coach" | "followup" | "telecaller";

type Page =
  "Dashboard" | "Calls to make" | "Incoming" | "Recent" | "Calendar" | "Pulse";
type Followup = {
  id: string;
  name: string;
  date: string;
  time: string;
  language: string;
  note: string;
  sourceCallId?: string;
};
type Message = { author: string; text: string; time: string; mine?: boolean };
function Avatar({ lead }: { lead: Lead }) {
  return <span className="og-avatar">{lead.initials}</span>;
}
function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null),
    closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],summary,audio[controls]",
          ) || [],
        );
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="og-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={"og-dialog " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="og-dialog-head">
          <div>
            <span className="og-overline">ON-GROUND · CALL CENTRE</span>
            <h2>{title}</h2>
          </div>
          <button
            ref={closeRef}
            className="og-icon"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
const initialMessages: Message[] = [
  {
    author: "Sunita Rao",
    text: "Team, let’s close the loop on yesterday’s walk-ins. A clear next step is more useful than another unanswered call.",
    time: "9:05 am",
  },
  {
    author: "AvaniBot",
    text: "Three leads need a follow-up today. Check their preferred language and last conversation before calling.",
    time: "9:06 am",
  },
  {
    author: "You",
    text: "I’ll start with the customers who asked us to call back.",
    time: "9:08 am",
    mine: true,
  },
];
export function Workspace() {
  const [page, setPage] = useState<Page>("Dashboard"),
    [leadIdx, setLeadIdx] = useState<number | null>(null),
    [expanded, setExpanded] = useState<string | null>(null),
    [queuePage, setQueuePage] = useState(0),
    [query, setQuery] = useState("");
  const period = "This Week";
  const [callOpen, setCallOpen] = useState(false),
    [review, setReview] = useState<Call | null>(null),
    [sampleReview, setSampleReview] = useState<Lead | null>(null),
    [callback, setCallback] = useState<Lead | null>(null),
    [notice, setNotice] = useState(""),
    [channel, setChannel] = useState<string | null>(null);
  const [messages, setMessages] = useRemote("messages"),
    [responses, setResponses] = useRemote("responses"),
    [followups, setFollowups] = useRemote("followups");
  const remote = useWorkspace();
  const [agentLeadId, setAgentLeadId] = useState("mukunda");
  const [agentOpen, setAgentOpen] = useState<AgentRole | null>(null),
    [demoPhone, setDemoPhone] = useState(""),
    [demoConsent, setDemoConsent] = useState(false);
  const [reply, setReply] = useState(""),
    [chat, setChat] = useState(""),
    [callbackDate, setCallbackDate] = useState(""),
    [callbackTime, setCallbackTime] = useState(""),
    [callbackNote, setCallbackNote] = useState(""),
    [callbackLanguage, setCallbackLanguage] = useState("Hindi");
  const [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    [day, setDay] = useState(() => new Date().getDate()),
    [kudos, setKudos] = useState(false);
  const voice = useCalls();
  const selectedLead = leadIdx === null ? null : leads[leadIdx];
  function leadContext(lead: Lead) {
    const draft = voice.calls.find(
      (c) => (c.leadId || "mukunda") === lead.id && c.handoffDraft,
    )?.handoffDraft;
    return draft
      ? `${draft.language || "Customer"} callback requested${draft.date ? " for " + new Date(draft.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}${draft.time ? " at " + draft.time + " IST" : ""}.${draft.budget ? " Budget " + money(draft.budget) + "." : ""} Store confirmation pending.`
      : lead.reason;
  }

  const filtered = leads
    .filter((l) =>
      [l.name, l.product, l.stage]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.intent - a.intent);
  const queue = filtered.slice(queuePage * 3, queuePage * 3 + 3);
  const liveCount = voice.calls.filter((c) => c.status === "completed").length;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  function go(p: Page) {
    setPage(p);
    setChannel(null);
    setQuery("");
    setQueuePage(0);
  }
  function openCallback(l: Lead) {
    const existing = followups.find((f) => f.name === l.name);
    const draft = voice.calls.find(
      (c) => (c.leadId || "mukunda") === l.id && c.handoffDraft,
    )?.handoffDraft;
    setCallback(l);
    setCallbackDate(existing?.date || draft?.date || "");
    setCallbackTime(existing?.time || draft?.time || "");
    setCallbackLanguage(existing?.language || draft?.language || l.language);
    setCallbackNote(
      existing?.note ||
        (draft
          ? [
              draft.concern,
              draft.budget ? `Customer budget: ${money(draft.budget)}.` : "",
              "Store team to confirm availability.",
            ]
              .filter(Boolean)
              .join(" ")
          : ""),
    );
  }
  async function saveFollowup() {
    if (!callback || !callbackDate || !callbackTime) return;
    const existing = followups.find((f) => f.name === callback.name);
    const value = {
      id: existing?.id || crypto.randomUUID(),
      name: callback.name,
      date: callbackDate,
      time: callbackTime,
      language: callbackLanguage,
      note: callbackNote,
      sourceCallId: voice.calls.find(
        (c) => (c.leadId || "mukunda") === callback.id,
      )?.id,
    };
    await setFollowups((rows) =>
      rows.some((f) => f.name === value.name)
        ? rows.map((f) => (f.name === value.name ? { ...value, id: f.id } : f))
        : [...rows, value],
    );
    setCallback(null);
    setNotice("Callback request saved. Store confirmation is pending.");
  }
  async function savePreparedRequest(call: Call) {
    const draft = call.handoffDraft;
    const handoffLead = leads.find((l) => l.id === call.leadId) || leads[0];
    if (!draft?.date || !draft.time || !draft.language) {
      openCallback(handoffLead);
      return;
    }
    const exists = followups.some(
      (f) => f.sourceCallId === call.id || f.name === handoffLead.name,
    );
    if (exists) {
      openCallback(handoffLead);
      return;
    }
    await setFollowups((rows) =>
      rows.some(
        (f) => f.sourceCallId === call.id || f.name === handoffLead.name,
      )
        ? rows
        : [
            ...rows,
            {
              id: crypto.randomUUID(),
              sourceCallId: call.id,
              name: handoffLead.name,
              date: draft.date,
              time: draft.time,
              language: draft.language,
              note: [
                draft.concern,
                draft.budget ? `Customer budget: ${money(draft.budget)}.` : "",
                "Store team to confirm availability.",
              ]
                .filter(Boolean)
                .join(" "),
            },
          ],
    );
    setNotice(
      "Callback request saved from the call. Store confirmation is pending.",
    );
  }
  async function sendMessage() {
    if (!chat.trim() || !channel) return;
    const msg = {
      author: "You",
      text: chat.trim(),
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      }),
      mine: true,
    };
    await setMessages((all) => ({
      ...all,
      [channel]: [...(all[channel] || initialMessages), msg],
    }));
    setChat("");
  }
  async function answer(text: string) {
    if (!channel || !text.trim()) return;
    await setResponses((v) => ({ ...v, [channel]: text.trim() }));
    setReply("");
    setNotice("Your response is saved in this demo workspace.");
  }
  const nav = [
    { page: "Dashboard" as Page, icon: LayoutDashboard },
    { page: "Calls to make" as Page, icon: Phone },
    { page: "Incoming" as Page, icon: PhoneIncoming },
    { page: "Recent" as Page, icon: Clock },
    { page: "Calendar" as Page, icon: CalendarDays },
    { page: "Pulse" as Page, icon: MessageSquare },
  ];
  function chart(title: string, values: number[], color: string, suffix = "") {
    return (
      <section className="og-chart og-card">
        <div className="og-section-title">
          {title}
          <span>LAST 7 DAYS · SAMPLE</span>
        </div>
        <div
          style={{ height: 180, width: "100%" }}
          role="img"
          aria-label={`${title}, seven day sample: ${values.join(", ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={values.map((value, i) => ({
                day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"][i],
                value,
              }))}
              margin={{ top: 20, right: 8, bottom: 0, left: 8 }}
            >
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#6e7975" }}
              />
              <Tooltip
                formatter={(value) => `${value}${suffix}`}
                cursor={{ fill: "#f2f5f3" }}
              />
              <Bar
                dataKey="value"
                fill={color}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    );
  }
  function calendar() {
    const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay(),
      count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const dateKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const items = followups.filter((f) => f.date === dateKey);
    return (
      <div className="og-calendar-wrap">
        <section className="og-card og-calendar">
          <div className="og-calendar-nav">
            <button
              className="og-icon"
              aria-label="Previous month"
              onClick={() => {
                setMonth(
                  new Date(month.getFullYear(), month.getMonth() - 1, 1),
                );
                setDay(1);
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <h2>
              {month.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              className="og-icon"
              aria-label="Next month"
              onClick={() => {
                setMonth(
                  new Date(month.getFullYear(), month.getMonth() + 1, 1),
                );
                setDay(1);
              }}
            >
              <ChevronRight size={18} />
            </button>
            <button
              className="og-secondary"
              onClick={() => {
                const today = new Date();
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setDay(today.getDate());
              }}
            >
              Today
            </button>
          </div>
          <div className="og-calendar-grid">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
              <span className="og-weekday" key={d}>
                {d}
              </span>
            ))}
            {Array.from({ length: first }, (_, i) => (
              <div key={"empty" + i} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const n = i + 1;
              const has =
                followups.some(
                  (f) =>
                    f.date ===
                    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`,
                ) ||
                (month.getMonth() === 10 && [9, 12, 18, 23].includes(n));
              return (
                <button
                  key={n}
                  className={
                    (day === n ? "selected " : "") +
                    (n === 8 &&
                    month.getMonth() === 10 &&
                    month.getFullYear() === 2026
                      ? "today"
                      : "")
                  }
                  aria-label={`Select ${n} ${month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`}
                  onClick={() => setDay(n)}
                >
                  {n}
                  {has && <span className="og-event-dot" />}
                </button>
              );
            })}
          </div>
        </section>
        <section className="og-card og-agenda">
          <span className="og-overline">YOUR DAY</span>
          <h2>
            {day} {month.toLocaleDateString("en-IN", { month: "long" })}
          </h2>
          {items.map((f) => (
            <div className="og-agenda-item" key={f.id}>
              <span>{f.time} IST</span>
              <strong>{f.name} · callback request</strong>
              <p>{f.language} · awaiting confirmation</p>
              {f.note && <p>{f.note}</p>}
            </div>
          ))}
          {month.getMonth() === 10 && [9, 12, 18, 23].includes(day) && (
            <div className="og-agenda-item">
              <span>4:30 pm IST · sample event</span>
              <strong>Team coaching</strong>
              <p>Objection handling with Sunita Rao</p>
            </div>
          )}
          {!items.length && ![9, 12, 18, 23].includes(day) && (
            <p className="og-muted">No events for this date.</p>
          )}
          <p className="og-footnote">
            Your saved callback requests appear here. The store’s calendar is
            not connected.
          </p>
        </section>
      </div>
    );
  }
  return (
    <div className="og-app">
      <aside className="og-sidebar">
        <div className="og-logo">
          <span>OG</span>On-Ground.ai
        </div>
        <div className="og-side-nav">
          {nav.map((n, i) => (
            <div key={n.page}>
              {i === 1 && <div className="og-nav-group">PLAN</div>}
              {i === 4 && <div className="og-nav-space" />}
              <button
                className={page === n.page ? "selected" : ""}
                onClick={() => go(n.page)}
              >
                <n.icon size={16} />
                {n.page}
                {n.page === "Incoming" && <small>5</small>}
              </button>
            </div>
          ))}
        </div>
        <div className="og-side-bottom">
          <span className="og-status-dot" /> On queue
          <div className="og-side-profile">
            <span className="og-avatar">AM</span>
            <div>
              <strong>Arnav Madan</strong>
              <small>Call centre agent</small>
            </div>
          </div>
        </div>
      </aside>
      <nav className="og-mobile-nav" aria-label="Main navigation">
        {nav.map((n) => (
          <button
            className={page === n.page ? "selected" : ""}
            key={n.page}
            onClick={() => go(n.page)}
          >
            <n.icon size={16} />
            <span>{n.page === "Calls to make" ? "Calls" : n.page}</span>
          </button>
        ))}
      </nav>
      <div className="og-workspace">
        <header className="og-topbar">
          <div>
            <Headphones size={15} />
            <strong>On-Ground.ai</strong>
            <span>/</span>
            <span>Call Centre</span>
          </div>
          <div>
            <span className="og-top-store">Koramangala · Retail demo</span>
            <button
              className="og-icon"
              aria-label="View notifications"
              onClick={() =>
                setNotice(
                  `${followups.length} callback requests awaiting confirmation. ${liveCount} live test call completed.`,
                )
              }
            >
              <Bell size={17} />
              <span className="og-notification-dot" />
            </button>
            <span className="og-avatar small">AM</span>
          </div>
        </header>
        <main className="og-main">
          <div
            className={"og-page-banner " + (page === "Pulse" ? "purple" : "")}
          >
            <div>
              <span>
                {page === "Dashboard"
                  ? "Good afternoon"
                  : page === "Pulse"
                    ? "THE TEAM BEHIND EVERY CONVERSATION"
                    : "YOUR DAY, IN FOCUS"}
              </span>
              <h1>
                {page === "Dashboard"
                  ? "Arnav Madan"
                  : page === "Calls to make" ||
                      page === "Incoming" ||
                      page === "Recent"
                    ? "Today’s calling plan"
                    : page === "Pulse"
                      ? "Pulse"
                      : "Calendar"}
              </h1>
              <p>
                {page === "Dashboard"
                  ? "The Sleep Company · Call Centre"
                  : page === "Pulse"
                    ? "The Sleep Company · Koramangala"
                    : page === "Calendar"
                      ? "Store visits, coaching and callback requests"
                      : page === "Calls to make"
                        ? "Start with the people most ready for a useful next step."
                        : page === "Incoming"
                          ? "Return missed calls while the conversation is still fresh."
                          : "Every call leaves context for the next conversation."}
              </p>
            </div>
            <span className="og-badge light">8 NOV · ON QUEUE</span>
          </div>
          {page === "Dashboard" && (
            <>
              {remote.state.tasks.length > 0 && (
                <section className="og-card og-live-tasks">
                  <div className="og-section-title">
                    YOUR NEXT ACTIONS<span>From your reviewed agent plan</span>
                  </div>
                  {remote.state.tasks.map((t) => (
                    <div key={t.id}>
                      <button
                        aria-label={`Mark ${t.title} ${t.status === "done" ? "open" : "done"}`}
                        onClick={() =>
                          void post("/api/tasks/complete", { id: t.id }).then(
                            remote.reload,
                          )
                        }
                      >
                        {t.status === "done" ? (
                          <Check size={16} />
                        ) : (
                          <span className="og-task-circle" />
                        )}
                      </button>
                      <div>
                        <strong
                          style={{
                            textDecoration:
                              t.status === "done" ? "line-through" : "none",
                          }}
                        >
                          {t.title}
                        </strong>
                        <p>
                          {leads.find((l) => l.id === t.leadId)?.name} ·{" "}
                          {t.owner}
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              <section className="og-focus-card">
                <span className="og-focus-icon">
                  <Sparkles size={20} />
                </span>
                <div>
                  <span className="og-overline">YOUR NEXT STEP</span>
                  <h2>
                    {followups.length
                      ? "A callback request needs store confirmation"
                      : liveCount
                        ? "The conversation is done. Close the loop."
                        : "Start with the customers waiting for you."}
                  </h2>
                  <p>
                    {followups.length
                      ? `${followups[0].name} · ${followups[0].date.split("-").reverse().join("/")} · ${followups[0].time} IST · ${followups[0].language}`
                      : liveCount
                        ? "Review what the customer asked for. The next step is prepared from the call."
                        : "Read the context, then choose the next action."}
                  </p>
                </div>
                <button
                  className="og-primary"
                  onClick={() =>
                    followups.length
                      ? openCallback(
                          leads.find((l) => l.name === followups[0].name) ||
                            leads[0],
                        )
                      : voice.latest
                        ? setReview(voice.latest)
                        : go("Calls to make")
                  }
                >
                  {followups.length
                    ? "Review request"
                    : liveCount
                      ? "Review next step"
                      : "Open calling plan"}
                  <ArrowRight size={14} />
                </button>
              </section>
              <div className="og-shift-line">
                <span>Today’s progress</span>
                <strong>3 leads created</strong>
                <span>·</span>
                <strong>2 leads called</strong>
                <span className="og-shift-proof">
                  {liveCount} live test completed
                </span>
              </div>
              <div className="og-dashboard-grid">
                <div>
                  <section className="og-card og-waiting">
                    <div className="og-section-title">
                      WHO’S WAITING
                      <button
                        className="og-text-button"
                        onClick={() => go("Calls to make")}
                      >
                        Open planner <ArrowRight size={13} />
                      </button>
                    </div>
                    {leads
                      .filter((l) => !followups.some((f) => f.name === l.name))
                      .sort((a, b) => b.intent - a.intent)
                      .slice(0, 2)
                      .map((l, i) => (
                        <button
                          className="og-person-row"
                          key={l.id}
                          onClick={() => setLeadIdx(leads.indexOf(l))}
                        >
                          <Avatar lead={l} />
                          <div>
                            <strong>{l.name}</strong>
                            <small>
                              {l.stage} · {l.product}
                            </small>
                          </div>
                          <span
                            className={
                              "og-badge " + (i === 0 ? "red" : "amber")
                            }
                          >
                            {i === 0 ? "Overdue" : "Due today"}
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                  </section>
                </div>
                <div>
                  <section className="og-card og-tasks">
                    <div className="og-section-title">
                      MY TASKS
                      <span className="og-badge amber">
                        {2 + (liveCount && !followups.length ? 1 : 0)}
                      </span>
                    </div>
                    <button onClick={() => go("Incoming")}>
                      <PhoneMissed size={15} />
                      <strong>5 missed calls</strong>
                      <span>return a call</span>
                      <ChevronRight size={14} />
                    </button>
                    <button onClick={() => setLeadIdx(0)}>
                      <Target size={15} />
                      <strong>Review allocated leads</strong>
                      <span>context & scores</span>
                      <ChevronRight size={14} />
                    </button>
                    {liveCount > 0 && !followups.length && (
                      <button onClick={() => setReview(voice.latest!)}>
                        <Check size={15} />
                        <strong>Review completed call</strong>
                        <span>next step ready</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </section>
                </div>
              </div>
              <details className="og-performance">
                <summary>
                  <div>
                    <BarChart3 size={16} />
                    <strong>Performance & earnings</strong>
                  </div>
                  <span>OG 76 · CSAT 94% · ₹5,200 earned</span>
                  <ChevronDown size={16} />
                </summary>
                <div className="og-performance-body">
                  {" "}
                  <div className="og-kpis">
                    {[
                      {
                        label: "OG Score™",
                        value: "76",
                        delta: "↑ 13 points",
                        icon: Target,
                      },
                      {
                        label: "Avg handle time",
                        value: "4m 12s",
                        delta: "↓ 8% this week",
                        icon: Clock,
                      },
                      {
                        label: "CSAT today",
                        value: "94%",
                        delta: "↑ 2 points",
                        icon: Activity,
                      },
                      {
                        label: "In queue",
                        value: "2",
                        delta: "Waiting for you",
                        icon: Users,
                      },
                    ].map((k) => (
                      <div className="og-kpi" key={k.label}>
                        <div>
                          {k.label}
                          <k.icon size={15} />
                        </div>
                        <strong>{k.value}</strong>
                        <small>{k.delta}</small>
                      </div>
                    ))}
                  </div>
                  <div className="og-performance-grid">
                    {" "}
                    <section className="og-progress-card">
                      <div className="og-section-title">
                        MY PROGRESS <span>· {period.toUpperCase()}</span>
                        <span className="og-badge light">On track</span>
                      </div>
                      <div className="og-progress-values">
                        <div>
                          <span className="og-progress-icon">
                            <Users size={18} />
                          </span>
                          <strong>3</strong>
                          <small>Leads created</small>
                        </div>
                        <div>
                          <span className="og-progress-icon">
                            <Phone size={18} />
                          </span>
                          <strong>2</strong>
                          <small>Leads called</small>
                        </div>
                        <div>
                          <span className="og-progress-icon">
                            <Check size={18} />
                          </span>
                          <strong>{liveCount}</strong>
                          <small>Live tests completed</small>
                        </div>
                      </div>
                    </section>
                    <section className="og-card og-earnings">
                      <div className="og-section-title">
                        <span>MY EARNINGS THIS MONTH</span>
                        <Trophy size={16} />
                      </div>
                      <strong>₹5,200</strong>
                      <span>₹800 to the ₹6,000 slab</span>
                      <div className="og-meter">
                        <i style={{ width: "86%" }} />
                      </div>
                      <small>₹1,700 from coached moves · sample</small>
                    </section>
                  </div>
                  <details className="og-trends">
                    <summary>
                      Seven-day trends <ChevronDown size={15} />
                    </summary>{" "}
                    {chart(
                      "CALLS HANDLED",
                      [18, 22, 15, 26, 20, 12, 14],
                      "#61bea0",
                    )}
                    {chart(
                      "CSAT TREND",
                      [88, 90, 85, 92, 89, 91, 94],
                      "#8ba5ec",
                      "%",
                    )}
                  </details>
                </div>
              </details>
            </>
          )}
          {(page === "Calls to make" ||
            page === "Incoming" ||
            page === "Recent") && (
            <>
              <div className="og-plan-tabs">
                {(["Calls to make", "Incoming", "Recent"] as Page[]).map(
                  (p) => (
                    <button
                      className={page === p ? "selected" : ""}
                      key={p}
                      onClick={() => go(p)}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>
              {page === "Calls to make" && (
                <>
                  <div className="og-list-heading">
                    <div>
                      <h2>Planned outgoing calls</h2>
                      <p>
                        Ranked by sample lead intent · review the context before
                        calling
                      </p>
                    </div>
                    <label className="og-search">
                      <Search size={14} />
                      <input
                        aria-label="Search leads"
                        placeholder="Search leads"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setQueuePage(0);
                        }}
                      />
                    </label>
                  </div>
                  <div className="og-card og-lead-table">
                    {queue.map((l) => (
                      <div key={l.id} className="og-lead-table-item">
                        <button
                          className="og-lead-row"
                          aria-expanded={expanded === l.id}
                          onClick={() =>
                            setExpanded(expanded === l.id ? null : l.id)
                          }
                        >
                          <Avatar lead={l} />
                          <div>
                            <strong>{l.name}</strong>
                            <small>
                              {l.stage} · {l.product}
                            </small>
                            <span className="og-row-reason">
                              {leadContext(l)}
                            </span>
                          </div>
                          <span className="og-language">{l.language}</span>
                          <span className="og-score">
                            <Target size={12} />
                            <span>Intent {l.intent}</span>
                          </span>
                          <ChevronDown
                            size={15}
                            className={expanded === l.id ? "rotated" : ""}
                          />
                        </button>
                        {expanded === l.id && (
                          <div className="og-expanded">
                            <p>{l.reason}</p>
                            <div className="og-chips">
                              <span>{l.stage}</span>
                              <span>Last contact: {l.last}</span>
                            </div>
                            <div className="og-actions">
                              <button
                                className="og-secondary"
                                onClick={() => setLeadIdx(leads.indexOf(l))}
                              >
                                View lead
                              </button>
                              <button
                                className="og-primary"
                                onClick={() =>
                                  l.id === "mukunda"
                                    ? voice.latest?.handoffDraft
                                      ? setReview(voice.latest)
                                      : setCallOpen(true)
                                    : openCallback(l)
                                }
                              >
                                <Phone size={13} />
                                {l.id === "mukunda"
                                  ? voice.latest?.handoffDraft
                                    ? "Review next step"
                                    : "AI follow-up demo"
                                  : "Plan callback"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {!queue.length && (
                      <p className="og-empty">No matching leads.</p>
                    )}
                  </div>
                  <div className="og-paging">
                    <button
                      className="og-icon"
                      aria-label="Previous leads page"
                      disabled={queuePage === 0}
                      onClick={() => setQueuePage((p) => p - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      Page {queuePage + 1} of{" "}
                      {Math.max(1, Math.ceil(filtered.length / 3))}
                    </span>
                    <button
                      className="og-icon"
                      aria-label="Next leads page"
                      disabled={(queuePage + 1) * 3 >= filtered.length}
                      onClick={() => setQueuePage((p) => p + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
              {page === "Incoming" && (
                <>
                  <div className="og-list-heading">
                    <div>
                      <h2>Missed calls</h2>
                      <p>
                        Ranked by indicative opportunity value · sample queue
                      </p>
                    </div>
                    <div className="og-missed-total">
                      <strong>5</strong> unanswered{" "}
                      <span>
                        {money(leads.slice(1).reduce((n, l) => n + l.value, 0))}
                      </span>{" "}
                      value at stake
                    </div>
                  </div>
                  <div className="og-card og-lead-table">
                    {leads
                      .slice(1)
                      .sort((a, b) => b.value - a.value)
                      .map((l, i) => (
                        <div className="og-incoming-row" key={l.id}>
                          <span className="og-missed-icon">
                            <PhoneMissed size={16} />
                          </span>
                          <div>
                            <strong>{l.name}</strong>
                            <small>
                              {
                                [
                                  "11:40 am",
                                  "11:15 am",
                                  "10:45 am",
                                  "10:20 am",
                                  "9:40 am",
                                ][i]
                              }{" "}
                              · {l.product} · {l.language}
                            </small>
                          </div>
                          <span className="og-value">
                            {money(l.value)} opportunity
                          </span>
                          <button
                            className="og-secondary"
                            onClick={() => {
                              setAgentLeadId(l.id);
                              setAgentOpen("telecaller");
                            }}
                          >
                            <Phone size={12} />
                            Call back
                          </button>
                        </div>
                      ))}
                  </div>
                </>
              )}
              {page === "Recent" && (
                <>
                  <button
                    className="og-proof-record og-card"
                    onClick={() => setReview(verifiedCall as Call)}
                  >
                    <span className="og-badge green">REAL CALL · VERIFIED</span>
                    <div>
                      <strong>
                        Walk-out recovery · recorded acceptance test
                      </strong>
                      <p>
                        8 Nov · Hindi · 88 seconds · shopper roleplay, phone
                        omitted
                      </p>
                    </div>
                    <ArrowRight size={18} />
                  </button>
                  <div className="og-list-heading">
                    <div>
                      <h2>Recent calls</h2>
                      <p>Review the conversation, then close the loop</p>
                    </div>
                    <span className="og-badge green">
                      {liveCount} live test completed
                    </span>
                  </div>
                  <div className="og-card og-lead-table">
                    {voice.calls.map((c) => (
                      <button
                        className="og-recent-row"
                        key={c.id}
                        onClick={() => setReview(c)}
                      >
                        <span className="og-outgoing-icon">
                          <ArrowUpRight size={17} />
                        </span>
                        <div>
                          <strong>
                            {c.kind === "human"
                              ? "Human callback"
                              : c.role === "followup"
                                ? "AI callback"
                                : "Mukunda · AI recovery demo"}{" "}
                            <span className="og-badge green">Live test</span>
                          </strong>
                          <small>
                            {new Date(c.createdAt).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            · {callLabels[c.status] || c.status}
                          </small>
                        </div>
                        <span>
                          {c.duration == null
                            ? "Pending"
                            : `${Math.floor(c.duration / 60)}m ${c.duration % 60}s`}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    {leads.slice(1, 5).map((l, i) => (
                      <button
                        className="og-recent-row"
                        key={l.id}
                        onClick={() => setSampleReview(l)}
                      >
                        <span
                          className={
                            i % 2 ? "og-missed-icon" : "og-outgoing-icon"
                          }
                        >
                          {i % 2 ? (
                            <ArrowDownLeft size={17} />
                          ) : (
                            <ArrowUpRight size={17} />
                          )}
                        </span>
                        <div>
                          <strong>
                            {l.name}
                            <span className="og-badge neutral">Sample</span>
                          </strong>
                          <small>
                            {i % 2 ? "Incoming" : "Outgoing"} · Today,{" "}
                            {["11:20 am", "10:55 am", "10:30 am", "9:40 am"][i]}
                          </small>
                        </div>
                        <span>
                          {["3m 24s", "2m 16s", "4m 02s", "1m 48s"][i]}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {page === "Calendar" && calendar()}
          {page === "Pulse" &&
            (channel ? (
              <section className="og-card og-channel">
                <div className="og-channel-header">
                  <button
                    className="og-icon"
                    aria-label="Back to Pulse"
                    onClick={() => setChannel(null)}
                  >
                    <ChevronLeft size={19} />
                  </button>
                  <span className="og-channel-symbol">
                    <Hash size={19} />
                  </span>
                  <div>
                    <h2>{channel}</h2>
                    <p>Team conversation · your demo workspace</p>
                  </div>
                  <span className="og-badge purple">4 members</span>
                </div>
                <div className="og-pinned">
                  <span className="og-overline">
                    <Target size={12} /> NEEDS YOUR INPUT · PINNED
                  </span>
                  <h3>
                    {responses[channel]
                      ? "Your response is recorded"
                      : "Confirm the callback handoff"}
                  </h3>
                  <p>
                    {responses[channel] ||
                      "Mukunda requested a Hindi callback tomorrow at 10 am. Store availability still needs confirmation."}
                  </p>
                  {!responses[channel] && (
                    <>
                      <div className="og-actions">
                        <button
                          className="og-secondary"
                          onClick={() =>
                            answer(
                              "I will check with the store team and confirm availability.",
                            )
                          }
                        >
                          I’ll check with the store
                        </button>
                        <button
                          className="og-secondary"
                          onClick={() =>
                            answer(
                              "Please find another callback time with the customer.",
                            )
                          }
                        >
                          Suggest another time
                        </button>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          answer(reply);
                        }}
                      >
                        <input
                          aria-label="Reply to pinned request"
                          placeholder="Or type your response…"
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                        />
                        <button
                          className="og-primary"
                          disabled={!reply.trim()}
                          type="submit"
                        >
                          Send
                        </button>
                      </form>
                    </>
                  )}
                </div>
                <div className="og-thread">
                  <div className="og-thread-date">Today · Call Centre Team</div>
                  {(messages[channel] || initialMessages).map((m, i) => (
                    <div
                      className={"og-chat-row " + (m.mine ? "mine" : "")}
                      key={i}
                    >
                      {!m.mine && (
                        <span className="og-avatar small">
                          {m.author === "AvaniBot" ? (
                            <Sparkles size={13} />
                          ) : (
                            "SR"
                          )}
                        </span>
                      )}
                      <div>
                        <span className="og-chat-author">
                          {m.author} <time>{m.time}</time>
                        </span>
                        <div className="og-chat-bubble">{m.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  className="og-chat-compose"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <input
                    aria-label="Channel message"
                    placeholder={`Message #${channel}…`}
                    value={chat}
                    onChange={(e) => setChat(e.target.value)}
                  />
                  <button
                    className="og-primary"
                    aria-label="Send channel message"
                    disabled={!chat.trim()}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </section>
            ) : (
              <>
                <div className="og-pulse-search">
                  <Sparkles size={16} />
                  <input
                    aria-label="Search Pulse channels"
                    placeholder="Find a channel or agent…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <section className="og-avani-card">
                  <div className="og-avani-icon">
                    <Sparkles size={25} />
                  </div>
                  <div>
                    <h2>
                      AvaniBot <span className="og-badge light">ALWAYS ON</span>
                    </h2>
                    <p>
                      Your daily brief, open loops and team conversations in one
                      place.
                    </p>
                  </div>
                  <button
                    className="og-secondary"
                    onClick={() => setAgentOpen("avani")}
                  >
                    Ask Avani <ArrowRight size={14} />
                  </button>
                </section>
                <section className="og-card og-pulse-list">
                  <div className="og-section-title">
                    ROLE & TASK AGENTS<span>Set up by your manager</span>
                  </div>
                  {[
                    {
                      role: "recovery",
                      name: "Walk-out recovery",
                      desc: "Reconnect with customers who left undecided",
                      icon: ArrowUpRight,
                    },
                    {
                      role: "coach",
                      name: "Pitch coach",
                      desc: "Practise the questions that move a conversation forward",
                      icon: Headphones,
                    },
                    {
                      role: "followup",
                      name: "Follow-up agent",
                      desc: "Keep promised callbacks from slipping through",
                      icon: Clock,
                    },
                    {
                      role: "asm",
                      name: "ASM Agent",
                      desc: "Turn callback promises and open questions into a priority plan",
                      icon: BarChart3,
                    },
                    {
                      role: "telecaller",
                      name: "Tele-caller",
                      desc: "Speak from your browser, then capture the outcome",
                      icon: Phone,
                    },
                  ]
                    .filter((a) =>
                      a.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((a) => (
                      <button
                        className="og-pulse-row"
                        key={a.name}
                        onClick={() =>
                          a.role === "recovery"
                            ? setCallOpen(true)
                            : setAgentOpen(a.role as AgentRole)
                        }
                      >
                        <span className="og-agent-icon">
                          <a.icon size={17} />
                        </span>
                        <div>
                          <strong>{a.name}</strong>
                          <small>{a.desc}</small>
                        </div>
                        <span className="og-badge purple">Open</span>
                        <ChevronRight size={15} />
                      </button>
                    ))}
                </section>
                <button className="og-kudos" onClick={() => setKudos(true)}>
                  <Trophy size={22} />
                  <div>
                    <strong>
                      Kudos <span>3 NEW</span>
                    </strong>
                    <p>
                      “Great work keeping the next step clear.” — Sunita Rao
                    </p>
                  </div>
                  <strong>
                    12 <small>all-time</small>
                  </strong>
                  <ChevronRight size={18} />
                </button>
                <section className="og-card og-pulse-list">
                  <div className="og-section-title">CHANNELS</div>
                  {[
                    "callcentre-team",
                    "all-stores",
                    "avani-coaching",
                    "manage-shipment",
                    "quotation-tickets",
                  ]
                    .filter((c) => c.includes(query.toLowerCase()))
                    .map((c, i) => (
                      <button
                        className="og-pulse-row"
                        key={c}
                        onClick={() => setChannel(c)}
                      >
                        <span className="og-channel-symbol">
                          <Hash size={17} />
                        </span>
                        <div>
                          <strong>{c}</strong>
                          <small>
                            {
                              [
                                "Review callback handoffs before the next shift",
                                "New product briefing this week",
                                "Let’s practise the budget conversation",
                                "Delivery questions for the store team",
                                "Quotes awaiting staff review",
                              ][i]
                            }
                          </small>
                        </div>
                        {i < 2 && <span className="og-unread">{i + 1}</span>}
                        <ChevronRight size={15} />
                      </button>
                    ))}
                </section>
              </>
            ))}
          <footer className="og-footer">
            <span>
              Sample store workspace · Prices and scores are illustrative
            </span>
            <span>
              <i className="og-status-dot" /> Telephone calls use the live
              provider
            </span>
          </footer>
        </main>
      </div>
      {selectedLead && (
        <Dialog title="Leads" onClose={() => setLeadIdx(null)}>
          <div className="og-lead-modal">
            <div className="og-modal-paging">
              <span>
                Your allocated leads · {leadIdx! + 1} of {leads.length}
              </span>
              <div>
                <button
                  className="og-icon"
                  aria-label="Previous lead"
                  disabled={leadIdx === 0}
                  onClick={() => setLeadIdx((i) => i! - 1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  className="og-icon"
                  aria-label="Next lead"
                  disabled={leadIdx === leads.length - 1}
                  onClick={() => setLeadIdx((i) => i! + 1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
            <div className="og-lead-person">
              <Avatar lead={selectedLead} />
              <div>
                <h2>{selectedLead.name}</h2>
                <p>
                  {selectedLead.product} · {money(selectedLead.value)}{" "}
                  indicative
                </p>
              </div>
              <span className="og-badge green">OPEN</span>
            </div>
            <div className="og-next-step">
              <Target size={15} />
              <span>
                {selectedLead.stage} · {selectedLead.language}
              </span>
            </div>
            <p className="og-lead-reason">{leadContext(selectedLead)}</p>
            <details className="og-score-detail">
              <summary>
                Lead scores{" "}
                <span>
                  Fit {selectedLead.fit}% · Intent {selectedLead.intent}
                </span>
                <ChevronDown size={14} />
              </summary>{" "}
              {[
                ["ICP fit", selectedLead.fit],
                ["Lead intent", selectedLead.intent],
              ].map(([label, score]) => (
                <div className="og-fit" key={label}>
                  <div>
                    <strong>{label}</strong>
                    <span>
                      {score}
                      {label === "ICP fit" ? "%" : ""}
                    </span>
                  </div>
                  <div className="og-meter">
                    <i
                      style={{
                        width: score + "%",
                        background: label === "ICP fit" ? "#5bbd99" : "#9b7ae0",
                      }}
                    />
                  </div>
                </div>
              ))}
            </details>
            <details className="og-lead-detail">
              <summary>Buying signals</summary>
              {selectedLead.signals.map((s) => (
                <p key={s}>
                  <Check size={12} />
                  {s}
                </p>
              ))}
            </details>
            <details className="og-lead-detail">
              <summary>How we got here</summary>
              <p>
                Sample store visit and follow-up notes. Last interaction:{" "}
                {selectedLead.last}.
              </p>
            </details>
            <details className="og-lead-detail">
              <summary>About these scores</summary>
              <p>
                Illustrative fixture scores based on product fit and expressed
                interest. These are not predictions produced by a scoring model.
              </p>
            </details>
            {selectedLead.id === "mukunda" && voice.latest?.summary && (
              <details className="og-lead-detail">
                <summary>Last call summary</summary>
                <p>{voice.latest.summary}</p>
              </details>
            )}
            <div className="og-actions">
              <button
                className="og-secondary"
                onClick={() => openCallback(selectedLead)}
              >
                Plan callback
              </button>
              {selectedLead.id === "mukunda" && (
                <button
                  className="og-primary"
                  onClick={() => {
                    setLeadIdx(null);
                    setCallOpen(true);
                  }}
                >
                  <Phone size={14} />
                  AI follow-up demo
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}
      {agentOpen && (
        <Dialog
          title={
            {
              avani: "AvaniBot",
              asm: "ASM Agent",
              coach: "Practise a call",
              followup: "Follow-up agent",
              telecaller: "Call back · human calling",
            }[agentOpen]
          }
          onClose={() => {
            setAgentOpen(null);
            void voice.reload();
          }}
          wide
        >
          <Suspense
            fallback={<div className="og-dialog-body">Opening assistant…</div>}
          >
            <AgentPanel
              role={agentOpen}
              initialLeadId={agentLeadId}
              onRecovery={() => {
                setAgentOpen(null);
                setCallOpen(true);
              }}
            />
          </Suspense>
        </Dialog>
      )}
      {remote.error && (
        <div className="og-save-error" role="alert">
          {remote.error}
          <button onClick={() => void remote.reload()}>Reconnect</button>
        </div>
      )}
      {callOpen && (
        <Dialog
          title="AI follow-up demo"
          onClose={() => setCallOpen(false)}
          wide
        >
          <div className="og-call-console">
            <section>
              <span className="og-badge purple">WALK-OUT RECOVERY</span>
              <h2>Mukunda · sample shopper</h2>
              <p>
                A shopper tried a mattress and left undecided. Ask what held
                them back, then capture a useful next step.
              </p>
              <details className="og-call-guidance">
                <summary>
                  Call guidance <ChevronDown size={14} />
                </summary>
                <div className="og-call-checklist">
                  <span>
                    <Check size={14} /> Hindi / Hinglish first; English if
                    requested
                  </span>
                  <span>
                    <Check size={14} /> 90-second provider limit
                  </span>
                  <span>
                    <Check size={14} /> No price, EMI or availability promises
                  </span>
                </div>
              </details>
              <div className="og-call-target">
                <label style={{ width: "100%" }}>
                  Your demo phone
                  <input
                    aria-label="Your demo phone"
                    className="og-private-phone"
                    type="tel"
                    placeholder="+91 mobile number"
                    value={demoPhone}
                    onChange={(e) => setDemoPhone(e.target.value)}
                  />
                </label>
              </div>
              <label className="og-consent">
                <input
                  type="checkbox"
                  checked={demoConsent}
                  onChange={(e) => setDemoConsent(e.target.checked)}
                />
                This is my number and I agree to a short AI demo call.
              </label>
              <button
                className="og-primary"
                onClick={() =>
                  void voice.start({
                    phone: demoPhone,
                    consent: demoConsent,
                    leadId: "mukunda",
                  })
                }
                disabled={
                  !demoConsent ||
                  !demoPhone.trim() ||
                  !voice.config?.ready ||
                  voice.starting ||
                  (!!voice.latest && !terminal.has(voice.latest.status)) ||
                  voice.latest?.status === "unknown" ||
                  (voice.config?.attempts || 0) >=
                    (voice.config?.maxAttempts || 3)
                }
              >
                <Phone size={15} />
                {voice.starting ? "Requesting call…" : "Call my phone"}
              </button>
              <p className="og-footnote">
                A real 90-second AI call. Trial accounts may require recipient
                verification. The demo has a shared usage limit; no automatic
                redials.
              </p>
              {voice.error && (
                <div role="alert" className="og-warning">
                  {voice.error}
                </div>
              )}
              {!voice.config?.ready && (
                <div className="og-warning">
                  Calling is not enabled. {voice.config?.missing.join(", ")}
                </div>
              )}
            </section>
            <section>
              <div className="og-section-title">
                LATEST CALL · LIVE PROVIDER
              </div>
              {voice.latest ? (
                <>
                  <h2 aria-live="polite">
                    {callLabels[voice.latest.status] || voice.latest.status}
                  </h2>
                  <details
                    className="og-call-status-detail"
                    open={!terminal.has(voice.latest.status)}
                    key={voice.latest.id + terminal.has(voice.latest.status)}
                  >
                    <summary>
                      Call activity <ChevronDown size={14} />
                    </summary>
                    <ol className="og-call-timeline">
                      {voice.latest.events.map((e, i) => (
                        <li key={i}>
                          <span>{callLabels[e.status] || e.status}</span>
                          <time>
                            {new Date(e.at).toLocaleTimeString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              hour: "numeric",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </time>
                        </li>
                      ))}
                    </ol>
                  </details>
                  {voice.latest.summary && (
                    <>
                      <h3>Provider summary</h3>
                      <p>{voice.latest.summary}</p>
                      <button
                        className="og-secondary"
                        onClick={() => {
                          setCallOpen(false);
                          setReview(voice.latest!);
                        }}
                      >
                        Review next step <ArrowRight size={13} />
                      </button>
                    </>
                  )}
                  {voice.latest.error && (
                    <div className="og-warning">{voice.latest.error}</div>
                  )}
                </>
              ) : (
                <p className="og-muted">
                  Your call activity appears here after starting a call.
                </p>
              )}
            </section>
          </div>
        </Dialog>
      )}
      {review && (
        <Dialog title="Call review" onClose={() => setReview(null)} wide>
          <div className="og-call-review">
            <div className="og-review-heading">
              <div>
                <h2>
                  {leads.find((l) => l.id === review.leadId)?.name || "Mukunda"}{" "}
                  ·{" "}
                  {review.kind === "human"
                    ? "Human callback"
                    : "AI follow-up demo"}
                </h2>
                <p>
                  {callLabels[review.status] || review.status} ·{" "}
                  {review.duration ?? "—"} seconds
                </p>
              </div>
              <span className="og-badge green">
                {review.id === verifiedCall.id
                  ? "RECORDED TEST · 8 NOV"
                  : "Live test"}
              </span>
            </div>
            {review.id === verifiedCall.id && (
              <section className="og-proof-audio">
                <strong>Listen to the real call</strong>
                <p>
                  42-second excerpt from the completed 88-second Hindi test.
                  This is the original AI and authorised participant, recorded
                  on 8 November.
                </p>
                <audio
                  controls
                  preload="none"
                  src="/verified-call-excerpt.mp3"
                  aria-label="Original real telephone call excerpt"
                />
              </section>
            )}
            {review.handoffDraft ? (
              <div className="og-next-action-card">
                <div className="og-section-title">
                  <Sparkles size={15} /> NEXT STEP, PREPARED
                </div>
                <h2>Ask the store to call back</h2>
                <div className="og-handoff-facts">
                  <span>
                    <CalendarDays size={14} />
                    {review.handoffDraft.date
                      ? new Date(
                          review.handoffDraft.date + "T00:00:00",
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                        })
                      : "Date needed"}
                  </span>
                  <span>
                    <Clock size={14} />
                    {review.handoffDraft.time || "Time needed"} IST
                  </span>
                  <span>
                    <MessageSquare size={14} />
                    {review.handoffDraft.language || "Language needed"}
                  </span>
                </div>
                <p>
                  {review.handoffDraft.concern}
                  {review.handoffDraft.budget
                    ? ` Customer budget: ${money(review.handoffDraft.budget)}.`
                    : ""}
                </p>
                <div className="og-actions">
                  <button
                    className="og-primary"
                    onClick={() => savePreparedRequest(review)}
                  >
                    {followups.some(
                      (f) =>
                        f.sourceCallId === review.id ||
                        f.name === leads[0].name,
                    )
                      ? "Review saved request"
                      : review.handoffDraft.date &&
                          review.handoffDraft.time &&
                          review.handoffDraft.language
                        ? "Save callback request"
                        : "Complete request"}
                    <ArrowRight size={14} />
                  </button>
                  {!followups.some(
                    (f) =>
                      f.sourceCallId === review.id || f.name === leads[0].name,
                  ) && (
                    <button
                      className="og-secondary"
                      onClick={() =>
                        openCallback(
                          leads.find((l) => l.id === review.leadId) || leads[0],
                        )
                      }
                    >
                      Edit details
                    </button>
                  )}
                  <span className="og-footnote">
                    Suggested from the conversation. Store confirms
                    availability.
                  </span>
                </div>
              </div>
            ) : (
              <div className="og-review-summary">
                <span className="og-overline">NEXT STEP</span>
                <p>
                  {review.summary ||
                    "The provider has not returned a finalized summary."}
                </p>
                <button
                  className="og-primary"
                  onClick={() =>
                    openCallback(
                      leads.find((l) => l.id === review.leadId) || leads[0],
                    )
                  }
                >
                  Plan callback
                </button>
              </div>
            )}
            <details className="og-summary-detail">
              <summary>
                Full call summary
                <ChevronDown size={15} />
              </summary>
              <p>{review.summary || "Summary pending."}</p>
            </details>
            <details className="og-provider-details">
              <summary>Call evidence</summary>
              <dl>
                <dt>Provider reference</dt>
                <dd>{review.executionId || "Pending"}</dd>
                <dt>Reported cost</dt>
                <dd>
                  {review.costCents == null
                    ? "Pending"
                    : `${review.costCents} US cents`}
                </dd>
                <dt>Ended because</dt>
                <dd>{review.terminationReason || "Pending"}</dd>
              </dl>
            </details>
            <details className="og-transcript-detail">
              <summary>
                Conversation transcript <span>Original conversation</span>
                <ChevronDown size={15} />
              </summary>
              <div className="og-transcript">
                {review.transcript ? (
                  review.transcript
                    .split("\n")
                    .filter(Boolean)
                    .map((line, i) => (
                      <div
                        className={line.startsWith("user:") ? "customer" : ""}
                        key={i}
                      >
                        <strong>
                          {line.startsWith("user:") ? "Customer" : "Avani"}
                        </strong>
                        <p>{line.replace(/^(assistant|user):\s*/, "")}</p>
                      </div>
                    ))
                ) : (
                  <p>Transcript pending.</p>
                )}
              </div>
            </details>
          </div>
        </Dialog>
      )}
      {sampleReview && (
        <Dialog
          title="Sample call review"
          onClose={() => setSampleReview(null)}
        >
          <div className="og-dialog-body">
            <Avatar lead={sampleReview} />
            <h2>{sampleReview.name}</h2>
            <p>{sampleReview.reason}</p>
            <div className="og-warning">
              This is sample history. No telephone call, recording or transcript
              is claimed for this row.
            </div>
            <h3>Follow-up checklist</h3>
            <ul>
              <li>Confirm the customer’s question</li>
              <li>Check product and policy details with store staff</li>
              <li>Agree a next action and preferred time</li>
            </ul>
            <button
              className="og-primary"
              onClick={() => openCallback(sampleReview)}
            >
              Plan callback
            </button>
          </div>
        </Dialog>
      )}
      {callback && (
        <Dialog title="Callback request" onClose={() => setCallback(null)}>
          <form
            className="og-dialog-body og-callback-form"
            onSubmit={(e) => {
              e.preventDefault();
              saveFollowup();
            }}
          >
            <h2>{callback.name}</h2>
            <p>Review the request, then pass it to the store.</p>
            {callbackDate && callbackTime && (
              <div className="og-prepared-request">
                <span className="og-overline">
                  {followups.some((f) => f.name === callback.name)
                    ? "SAVED REQUEST · CONFIRMATION PENDING"
                    : "SUGGESTED FROM THE CALL"}
                </span>
                <strong>
                  {new Date(callbackDate + "T00:00:00").toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "long" },
                  )}{" "}
                  · {callbackTime} IST
                </strong>
                <span>{callbackLanguage} · staff callback</span>
                <p>{callbackNote}</p>
              </div>
            )}
            <details
              className="og-edit-fields"
              open={!callbackDate || !callbackTime}
              key={callback.id}
            >
              <summary>
                {callbackDate && callbackTime
                  ? "Edit request details"
                  : "Complete missing details"}
                <ChevronDown size={15} />
              </summary>
              <label>
                Date
                <input
                  type="date"
                  min={new Date().toLocaleDateString("en-CA", {
                    timeZone: "Asia/Kolkata",
                  })}
                  required
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                />
              </label>
              <label>
                Time · IST
                <input
                  type="time"
                  required
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                />
              </label>
              <label>
                Language
                <select
                  value={callbackLanguage}
                  onChange={(e) => setCallbackLanguage(e.target.value)}
                >
                  {[
                    "Hindi",
                    "English",
                    "Kannada",
                    "Tamil",
                    "Telugu",
                    "Other",
                  ].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              <label>
                Context for store staff
                <textarea
                  value={callbackNote}
                  onChange={(e) => setCallbackNote(e.target.value)}
                  placeholder="Customer’s question, budget or anything to check…"
                />
              </label>
            </details>
            {callback.id === "mukunda" &&
              voice.latest?.handoffDraft?.evidence && (
                <details className="og-lead-detail">
                  <summary>What the customer said</summary>
                  {voice.latest.handoffDraft.evidence.map((line, i) => (
                    <p lang="hi" key={i}>
                      {line}
                    </p>
                  ))}
                </details>
              )}
            <p className="og-footnote">
              Saves this callback in your private demo workspace. Use the
              Follow-up agent to schedule an AI call; store confirmation remains
              separate.
            </p>
            <button className="og-primary" type="submit">
              {followups.some((f) => f.name === callback.name)
                ? "Save changes"
                : "Save callback request"}
            </button>
          </form>
        </Dialog>
      )}
      {kudos && (
        <Dialog title="Kudos" onClose={() => setKudos(false)}>
          <div className="og-dialog-body og-kudos-list">
            <Trophy size={32} />
            <h2>Good work deserves a mention.</h2>
            {[
              "Great work keeping the next step clear.",
              "Thank you for returning the missed calls before your shift ended.",
              "Strong progress on asking questions before making a recommendation.",
            ].map((t, i) => (
              <blockquote key={t}>
                “{t}”
                <footer>
                  Sunita Rao · {i === 0 ? "Today" : i + " days ago"} · sample
                </footer>
              </blockquote>
            ))}
          </div>
        </Dialog>
      )}
      {notice && (
        <div role="status" className="og-toast">
          <Check size={15} />
          {notice}
        </div>
      )}
    </div>
  );
}
