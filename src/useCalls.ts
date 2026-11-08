import { useEffect, useState } from "react";
import { api, terminal, type Call, type Config } from "./data";
export function useCalls() {
  const [calls, setCalls] = useState<Call[]>([]),
    [config, setConfig] = useState<Config>(),
    [error, setError] = useState(""),
    [starting, setStarting] = useState(false);
  const latest = calls[0];
  async function load() {
    try {
      const [rows, c] = await Promise.all([
        api<Call[]>("/api/calls"),
        api<Config>("/api/config"),
      ]);
      setCalls(rows.reverse());
      setConfig(c);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!latest || terminal.has(latest.status)) return;
    let active = true;
    const timer = setInterval(async () => {
      try {
        const c = await api<Call>("/api/calls/" + latest.id);
        if (active) {
          setCalls((rows) => rows.map((r) => (r.id === c.id ? c : r)));
          setError("");
        }
      } catch {
        if (active)
          setError(
            "Status update unavailable. The call may still be active; check again before redialling.",
          );
      }
    }, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [latest?.id, latest?.status]);
  async function start(options?: {
    phone: string;
    consent: boolean;
    leadId?: string;
  }) {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      const c = await api<Call>("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: crypto.randomUUID(), ...options }),
      });
      setCalls((rows) => [c, ...rows.filter((r) => r.id !== c.id)]);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  }
  return { calls, config, error, starting, start, latest, reload: load };
}
