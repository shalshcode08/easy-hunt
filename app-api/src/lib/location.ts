/**
 * Parses a raw location string extracted from job scraper into structured fields.
 * Handles formats like:
 *   "Bengaluru, Karnataka, India"
 *   "Mumbai (Remote)"
 *   "Bengaluru | Work From Home"
 *   "Hyderabad, Telangana"
 *   "Remote"
 */

type WorkMode = "remote" | "hybrid" | "onsite";

const REMOTE_KEYWORDS = ["remote", "work from home", "wfh", "anywhere"];
const HYBRID_KEYWORDS = ["hybrid", "flexible"];

// Well-known Indian cities — used to normalise common misspellings/variants
const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  bengalore: "Bengaluru",
  bombay: "Mumbai",
  mumbai: "Mumbai",
  delhi: "Delhi",
  "new delhi": "Delhi",
  noida: "Noida",
  gurugram: "Gurugram",
  gurgaon: "Gurugram",
  hyderabad: "Hyderabad",
  pune: "Pune",
  chennai: "Chennai",
  madras: "Chennai",
  kolkata: "Kolkata",
  calcutta: "Kolkata",
  ahmedabad: "Ahmedabad",
  jaipur: "Jaipur",
  kochi: "Kochi",
  cochin: "Kochi",
  indore: "Indore",
  chandigarh: "Chandigarh",
  coimbatore: "Coimbatore",
};

export function parseLocation(raw: string | null | undefined): {
  city: string | null;
  workMode: WorkMode | null;
  isRemote: boolean;
} {
  if (!raw) return { city: null, workMode: null, isRemote: false };

  const lower = raw.toLowerCase();

  // Detect work mode from keywords
  const isRemote = REMOTE_KEYWORDS.some((k) => lower.includes(k));
  const isHybrid = HYBRID_KEYWORDS.some((k) => lower.includes(k));

  let workMode: WorkMode | null = isRemote ? "remote" : isHybrid ? "hybrid" : null;

  // Extract city: take the first segment before comma, pipe, dash, or parenthesis
  const firstPart = raw
    .split(/[,|/(]/)[0]!
    .trim()
    .replace(/\s+(remote|hybrid|work from home|wfh).*$/i, "")
    .trim();

  const cityKey = firstPart.toLowerCase();
  const city = CITY_ALIASES[cityKey] ?? (firstPart.length > 1 ? firstPart : null);

  // If location is purely remote keywords, no meaningful city
  const purelyRemote = REMOTE_KEYWORDS.some((k) => cityKey === k);
  if (purelyRemote) return { city: null, workMode: "remote", isRemote: true };

  // If we didn't detect hybrid/remote from keywords, assume onsite when city is found
  if (!workMode && city) workMode = "onsite";

  return { city, workMode, isRemote };
}
