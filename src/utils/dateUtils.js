const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Parse a backend timestamp string safely into a Date instance.
 * Strings with an explicit timezone (Z or +/-HH:MM) are parsed directly;
 * bare MySQL TIMESTAMP strings (e.g. "2026-11-25 04:42:00" from UTC servers)
 * are treated as UTC so they convert accurately to IST.
 */
export const parseTimestamp = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    const hasExplicitTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
    const normalized = raw.includes(' ') && !raw.includes('T')
        ? raw.replace(' ', 'T')
        : raw;

    const iso = hasExplicitTz ? normalized : `${normalized}Z`;
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Format a backend timestamp as a date string in IST (e.g. "Nov 25, 2026").
 */
export const formatISTDate = (value, options = { month: 'short', day: '2-digit', year: 'numeric' }, fallback = 'N/A') => {
    const date = parseTimestamp(value);
    if (!date) return fallback;
    return new Intl.DateTimeFormat('en-US', {
        ...options,
        timeZone: IST_TIMEZONE,
    }).format(date);
};

/**
 * Format a backend timestamp as a 12-hour time string in IST (e.g. "10:12 AM").
 */
export const formatISTTime = (value, fallback = '') => {
    const date = parseTimestamp(value);
    if (!date) return fallback;
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: IST_TIMEZONE,
    }).format(date);
};
