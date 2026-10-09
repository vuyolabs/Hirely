/*
 * Format checks for Indian business identifiers. These catch typos and
 * obviously fake values; they do not prove the entity exists — that is
 * what admin verification is for.
 */

export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

export const INDIAN_STATES = [...new Set(Object.values(GST_STATE_CODES))].sort();

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const CIN_PATTERN =
  /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}(PLC|PTC|OPC|GOI|SGC|FTC|GAP|NPL|ULL|ULT|FLC)[0-9]{6}$/;
const LLPIN_PATTERN = /^[A-Z]{3}-[0-9]{4}$/;
const GSTIN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function normalizeId(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function gstinCheckDigit(first14: string) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = GSTIN_CHARSET.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARSET[(36 - (sum % 36)) % 36];
}

/** Returns an error message, or null when the GSTIN is well-formed. */
export function validateGstin(raw: string): string | null {
  const gstin = normalizeId(raw);
  if (gstin.length !== 15) return "GSTIN must be 15 characters.";
  if (!GSTIN_PATTERN.test(gstin)) return "That doesn't look like a valid GSTIN.";
  if (!GST_STATE_CODES[gstin.slice(0, 2)])
    return "The first two digits aren't a valid GST state code.";
  if (gstinCheckDigit(gstin.slice(0, 14)) !== gstin[14])
    return "GSTIN checksum doesn't match — please re-check for typos.";
  return null;
}

export function panFromGstin(gstin: string) {
  return normalizeId(gstin).slice(2, 12);
}

export function stateFromGstin(gstin: string) {
  return GST_STATE_CODES[normalizeId(gstin).slice(0, 2)] ?? null;
}

export const COMPANY_TYPE_VALUES = [
  "PRIVATE_LIMITED",
  "PUBLIC_LIMITED",
  "OPC",
  "LLP",
  "PARTNERSHIP",
  "PROPRIETORSHIP",
  "GOVERNMENT",
  "NGO",
] as const;

export type CompanyTypeKey = (typeof COMPANY_TYPE_VALUES)[number];

export const COMPANY_TYPES: {
  value: CompanyTypeKey;
  label: string;
  /** Allowed 4th PAN characters for this entity type. */
  panTypes: string[];
  registration: "CIN" | "LLPIN" | null;
}[] = [
  { value: "PRIVATE_LIMITED", label: "Private Limited Company", panTypes: ["C"], registration: "CIN" },
  { value: "PUBLIC_LIMITED", label: "Public Limited Company", panTypes: ["C"], registration: "CIN" },
  { value: "OPC", label: "One Person Company (OPC)", panTypes: ["C"], registration: "CIN" },
  { value: "LLP", label: "Limited Liability Partnership (LLP)", panTypes: ["F"], registration: "LLPIN" },
  { value: "PARTNERSHIP", label: "Partnership Firm", panTypes: ["F"], registration: null },
  { value: "PROPRIETORSHIP", label: "Sole Proprietorship", panTypes: ["P"], registration: null },
  { value: "GOVERNMENT", label: "Government / PSU", panTypes: ["G", "C", "L"], registration: null },
  { value: "NGO", label: "NGO / Trust / Society", panTypes: ["T", "A", "C"], registration: null },
];

export function companyTypeInfo(type: string) {
  return COMPANY_TYPES.find((t) => t.value === type);
}

export function validatePan(raw: string, companyType?: string): string | null {
  const pan = normalizeId(raw);
  if (!PAN_PATTERN.test(pan)) return "PAN must look like AAAAA9999A.";
  const info = companyType ? companyTypeInfo(companyType) : undefined;
  if (info && !info.panTypes.includes(pan[3])) {
    return `This PAN belongs to a different entity type than a ${info.label.toLowerCase()}.`;
  }
  return null;
}

export function validateRegistrationNumber(
  raw: string,
  companyType: string,
): string | null {
  const info = companyTypeInfo(companyType);
  if (!info?.registration) return null;
  const value = normalizeId(raw);
  if (!value) return `${info.registration} is required for this company type.`;
  if (info.registration === "CIN" && !CIN_PATTERN.test(value))
    return "CIN must be 21 characters, e.g. U72200KA2015PTC123456.";
  if (info.registration === "LLPIN" && !LLPIN_PATTERN.test(value))
    return "LLPIN must look like AAA-1234.";
  return null;
}

export function validatePincode(raw: string): string | null {
  return /^[1-9][0-9]{5}$/.test(raw.trim()) ? null : "Enter a valid 6-digit PIN code.";
}

/** Indian mobile number, with or without +91 / leading 0. */
export function normalizeMobile(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isValidMobile(raw: string) {
  return /^[6-9][0-9]{9}$/.test(normalizeMobile(raw));
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "rediffmail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
]);

export function isFreeEmail(email: string) {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  return !!domain && FREE_EMAIL_DOMAINS.has(domain);
}
