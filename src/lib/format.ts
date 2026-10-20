export function prettyLabel(value: string | null | undefined, fallback = "—") {
  if (!value) return fallback;
  return value.replaceAll("_", " ");
}

export function formatWhen(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 19).replace("T", " ");
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatIp(ip: string | null | undefined) {
  if (!ip) return "Unknown IP";
  if (ip === "::1" || ip === "127.0.0.1" || ip === ":1") return "This computer";
  return ip;
}

export function describeAgent(ua: string | null | undefined) {
  const raw = ua ?? "";
  const browser = /Edg\//.test(raw)
    ? "Edge"
    : /Chrome\//.test(raw)
      ? "Chrome"
      : /Firefox\//.test(raw)
        ? "Firefox"
        : /Safari/.test(raw) && !/Chrome/.test(raw)
          ? "Safari"
          : raw
            ? "Browser"
            : "Unknown browser";
  const os = /Windows NT/.test(raw)
    ? "Windows"
    : /Mac OS X/.test(raw)
      ? "macOS"
      : /Android/.test(raw)
        ? "Android"
        : /iPhone|iPad/.test(raw)
          ? "iOS"
          : /Linux/.test(raw)
            ? "Linux"
            : "device";
  return {
    browser,
    os,
    title: `${browser} on ${os}`,
    mobile: /Android|iPhone|iPad/.test(raw),
  };
}
