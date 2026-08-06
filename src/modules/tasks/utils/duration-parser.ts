// Reusable Working Hour Config constants
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 8;
export const DAYS_PER_WEEK = 5;

export const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR; // 480
export const MINUTES_PER_WEEK = DAYS_PER_WEEK * MINUTES_PER_DAY; // 2400

/**
 * Parses duration strings like "2w 3d 4h 30m" into a total number of minutes.
 * @param str The duration string to parse
 * @returns Number of minutes
 */
export function parseDuration(str: string): number {
  if (!str || !str.trim()) return 0;
  
  let totalMinutes = 0;
  const regex = /(\d+)\s*([wdhm])/g;
  let match;
  
  // Clean string and perform parsing
  const cleanStr = str.toLowerCase().trim();
  let hasMatch = false;

  while ((match = regex.exec(cleanStr)) !== null) {
    hasMatch = true;
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "w":
        totalMinutes += value * MINUTES_PER_WEEK;
        break;
      case "d":
        totalMinutes += value * MINUTES_PER_DAY;
        break;
      case "h":
        totalMinutes += value * MINUTES_PER_HOUR;
        break;
      case "m":
        totalMinutes += value;
        break;
    }
  }

  // If no match was found but it's a number, default to minutes
  if (!hasMatch && /^\d+$/.test(cleanStr)) {
    return parseInt(cleanStr, 10);
  }

  return totalMinutes;
}

/**
 * Formats minutes into standard format "2w 3d 4h 30m".
 * @param minutes Total number of minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";

  let remaining = minutes;
  const parts: string[] = [];

  const weeks = Math.floor(remaining / MINUTES_PER_WEEK);
  if (weeks > 0) {
    parts.push(`${weeks}w`);
    remaining %= MINUTES_PER_WEEK;
  }

  const days = Math.floor(remaining / MINUTES_PER_DAY);
  if (days > 0) {
    parts.push(`${days}d`);
    remaining %= MINUTES_PER_DAY;
  }

  const hours = Math.floor(remaining / MINUTES_PER_HOUR);
  if (hours > 0) {
    parts.push(`${hours}h`);
    remaining %= MINUTES_PER_HOUR;
  }

  if (remaining > 0) {
    parts.push(`${remaining}m`);
  }

  return parts.join(" ");
}

/**
 * Validates duration syntax (only allows numbers followed by w, d, h, m separated by space)
 */
export function validateDurationSyntax(str: string): boolean {
  if (!str || !str.trim()) return false;
  // matches formats like "1w", "2d 4h", "30m", etc.
  const regex = /^(\s*\d+\s*[wdhm]\s*)+$/i;
  return regex.test(str) || /^\d+$/.test(str.trim());
}
