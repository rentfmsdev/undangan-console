import { createConnection } from "node:net";

export const supportedDomainTlds = ["com", "id", "co", "space"] as const;
export type SupportedDomainTld = (typeof supportedDomainTlds)[number];
export type DomainAvailabilityStatus = "available" | "taken" | "unknown";

export type DomainAvailabilityResult = {
  domain: string;
  tld: SupportedDomainTld;
  status: DomainAvailabilityStatus;
  checkedAt: string;
  source: "rdap" | "whois";
  message: string;
};

type RdapBootstrap = {
  services?: Array<[string[], string[]]>;
};

const domainLabelPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeDomainLabel(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").split(".")[0]?.replace(/[^a-z0-9-]/g, "") ?? "";
}

export function isValidDomainLabel(value: string) {
  return domainLabelPattern.test(value);
}

export function parseSupportedDomain(domain: string): { domain: string; label: string; tld: SupportedDomainTld } | null {
  const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const match = normalized.match(/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.(com|id|co|space)$/);
  if (!match) return null;
  return { domain: normalized, label: match[1], tld: match[2] as SupportedDomainTld };
}

async function getRdapBaseUrl(tld: SupportedDomainTld) {
  const response = await fetch("https://data.iana.org/rdap/dns.json", {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("Registry RDAP IANA tidak dapat diakses.");
  const registry = (await response.json()) as RdapBootstrap;
  const service = registry.services?.find(([tlds]) => tlds.includes(tld));
  const baseUrl = service?.[1]?.find((url) => url.startsWith("https://"));
  if (!baseUrl) throw new Error(`Registry RDAP .${tld} belum tersedia.`);
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

async function checkWithRdap(domain: string, tld: SupportedDomainTld): Promise<DomainAvailabilityResult> {
  const checkedAt = new Date().toISOString();
  try {
    const baseUrl = await getRdapBaseUrl(tld);
    const response = await fetch(`${baseUrl}domain/${encodeURIComponent(domain)}`, {
      cache: "no-store",
      headers: { Accept: "application/rdap+json, application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404) return { domain, tld, status: "available", checkedAt, source: "rdap", message: "Tersedia saat diperiksa" };
    if (response.ok) return { domain, tld, status: "taken", checkedAt, source: "rdap", message: "Sudah terdaftar" };
    return { domain, tld, status: "unknown", checkedAt, source: "rdap", message: `Belum dapat diverifikasi (RDAP ${response.status})` };
  } catch {
    return { domain, tld, status: "unknown", checkedAt, source: "rdap", message: "Layanan pengecekan sedang tidak tersedia" };
  }
}

function queryWhoisCo(domain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: "whois.registry.co", port: 43 });
    let response = "";
    const finishWithError = (error: Error) => {
      socket.destroy();
      reject(error);
    };
    socket.setTimeout(8_000);
    socket.on("connect", () => socket.write(`${domain}\r\n`));
    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
      if (response.length > 128_000) finishWithError(new Error("Respons WHOIS terlalu besar."));
    });
    socket.on("end", () => resolve(response));
    socket.on("timeout", () => finishWithError(new Error("WHOIS timeout.")));
    socket.on("error", reject);
  });
}

async function checkCoDomain(domain: string): Promise<DomainAvailabilityResult> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await queryWhoisCo(domain);
    if (/DOMAIN NOT FOUND|queried object does not exist|No match for/i.test(response)) {
      return { domain, tld: "co", status: "available", checkedAt, source: "whois", message: "Tersedia saat diperiksa" };
    }
    if (/Domain Name:/i.test(response)) return { domain, tld: "co", status: "taken", checkedAt, source: "whois", message: "Sudah terdaftar" };
    return { domain, tld: "co", status: "unknown", checkedAt, source: "whois", message: "Respons registry belum dapat dipastikan" };
  } catch {
    return { domain, tld: "co", status: "unknown", checkedAt, source: "whois", message: "Layanan pengecekan sedang tidak tersedia" };
  }
}

export async function checkDomainAvailability(domain: string): Promise<DomainAvailabilityResult> {
  const parsed = parseSupportedDomain(domain);
  if (!parsed) throw new Error("Domain harus menggunakan ekstensi .com, .id, .co, atau .space.");
  return parsed.tld === "co" ? checkCoDomain(parsed.domain) : checkWithRdap(parsed.domain, parsed.tld);
}

export async function checkDomainCandidates(label: string) {
  const normalized = normalizeDomainLabel(label);
  if (!isValidDomainLabel(normalized)) throw new Error("Nama domain belum valid.");
  return Promise.all(supportedDomainTlds.map((tld) => checkDomainAvailability(`${normalized}.${tld}`)));
}
