export type DemoRole = "admin" | "merchant";
export type AuditEvent = { id: string; action: string; entity: string; actor: string; time: string; severity: "info" | "success" | "warning" };

const read = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export const mockAuth = {
  signIn(role: DemoRole, email: string) {
    const session = { role, email: email || `${role}@pinak.demo`, issuedAt: new Date().toISOString() };
    write("pinak-auth-session", session);
    return session;
  },
  current() { return read<{ role: DemoRole; email: string; issuedAt: string } | null>("pinak-auth-session", null); },
  signOut() { localStorage.removeItem("pinak-auth-session"); },
  can(role: DemoRole | null, permission: "merchant:write" | "merchant:import" | "audit:read" | "permissions:write") {
    if (role === "admin") return true;
    return permission === "merchant:write" && role === "merchant";
  },
};

export const mockDataService = {
  saveMerchant(draft: Record<string, unknown>) {
    const records = read<Record<string, unknown>[]>("pinak-merchants-local", []);
    const next = [...records, { ...draft, id: `merchant-${Date.now()}`, source: "frontend-demo", createdAt: new Date().toISOString() }];
    write("pinak-merchants-local", next);
    return next[next.length - 1];
  },
  saveImportSummary(summary: Record<string, unknown>) { write("pinak-last-import", { ...summary, savedAt: new Date().toISOString() }); },
  audit(event: Omit<AuditEvent, "id" | "time">) {
    const existing = read<AuditEvent[]>("pinak-audit-log", []);
    write("pinak-audit-log", [{ ...event, id: `audit-${Date.now()}`, time: new Date().toISOString() }, ...existing].slice(0, 100));
  },
  audits() { return read<AuditEvent[]>("pinak-audit-log", [
    { id: "seed-1", action: "Permission preset reviewed", entity: "Access control", actor: "Riya Shah", time: "8 min ago", severity: "info" },
    { id: "seed-2", action: "Merchant profile approved", entity: "The Curry Leaf", actor: "Riya Shah", time: "24 min ago", severity: "success" },
    { id: "seed-3", action: "CSV validation completed", entity: "24 merchant rows", actor: "PINAK system", time: "1 hr ago", severity: "warning" },
  ]); },
};
