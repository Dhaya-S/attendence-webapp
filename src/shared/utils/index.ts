export function cn(...c: (string | undefined | false | null)[]) {
  return c.filter(Boolean).join(" ");
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export * from "./firebase";

