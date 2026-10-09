// Fixed locale + timezone so server and client render identical strings (avoids hydration mismatches).
const LOCALE = "en-US";
const TIME_ZONE = "UTC";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
  timeZoneName: "short",
});

export function formatDate(value: Date | string | number) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string | number) {
  return dateTimeFormatter.format(new Date(value));
}
