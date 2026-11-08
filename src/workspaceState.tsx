import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./data";
export type Followup = {
  id: string;
  name: string;
  date: string;
  time: string;
  language: string;
  note: string;
  sourceCallId?: string;
  status?: string;
  callId?: string;
  executionId?: string;
  scheduledAt?: string;
};
export type Result = {
  id: string;
  answer: string;
  tasks: { leadId: string; title: string; reason: string; owner: string }[];
  scores?: { name: string; score: number | null; evidence: string }[];
  betterLine?: string;
  approved?: boolean;
};
export type Message = {
  author: string;
  text: string;
  time: string;
  mine?: boolean;
  result?: Result;
};
export type WorkspaceData = {
  followups: Followup[];
  messages: Record<string, Message[]>;
  responses: Record<string, string>;
  tasks: {
    id: string;
    leadId: string;
    title: string;
    reason: string;
    owner: string;
    status: string;
  }[];
  conversations: Record<string, Message[]>;
  coaching: Result[];
  practice?: { speaker: string; text: string }[];
};
const initial: WorkspaceData = {
  followups: [],
  messages: {},
  responses: {},
  tasks: [],
  conversations: {},
  coaching: [],
};
type Context = {
  state: WorkspaceData;
  ready: boolean;
  error: string;
  reload: () => Promise<void>;
  save: <K extends "followups" | "messages" | "responses">(
    field: K,
    value: WorkspaceData[K] | ((old: WorkspaceData[K]) => WorkspaceData[K]),
  ) => Promise<void>;
};
const C = createContext<Context | null>(null);
export const post = <T,>(url: string, input: unknown) =>
  api<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, set] = useState(initial),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const current = useRef(state),
    queue = useRef(Promise.resolve());
  async function reload() {
    try {
      const x = await api<WorkspaceData>("/api/state");
      current.current = x;
      set(x);
      setReady(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  async function save<K extends "followups" | "messages" | "responses">(
    field: K,
    value: WorkspaceData[K] | ((old: WorkspaceData[K]) => WorkspaceData[K]),
  ) {
    const work = async () => {
      const next =
        typeof value === "function" ? value(current.current[field]) : value;
      await post("/api/workspace", { field, value: next });
      const x = { ...current.current, [field]: next };
      current.current = x;
      set(x);
      setError("");
    };
    const result = queue.current.then(work);
    queue.current = result.catch((e) => setError(e.message));
    return result;
  }
  return (
    <C.Provider value={{ state, ready, error, reload, save }}>
      {children}
    </C.Provider>
  );
}
export function useWorkspace() {
  const c = useContext(C);
  if (!c) throw Error("Workspace provider missing");
  return c;
}
export function useRemote<K extends "followups" | "messages" | "responses">(
  field: K,
) {
  const c = useWorkspace();
  return [
    c.state[field],
    (v: WorkspaceData[K] | ((old: WorkspaceData[K]) => WorkspaceData[K])) =>
      c.save(field, v),
  ] as const;
}
