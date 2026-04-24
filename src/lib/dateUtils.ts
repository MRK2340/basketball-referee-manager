import { isValid, parseISO } from 'date-fns';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_24H_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const TIME_12H_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

export const parseLocalDate = (value?: string | null): Date | null => {
  if (!value) return null;

  const dateOnly = value.match(DATE_ONLY_RE);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;

  const fallback = new Date(`${value}T00:00:00`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const parseTimeParts = (value?: string | null) => {
  if (!value) return null;

  const trimmed = value.trim();
  const twelveHour = trimmed.match(TIME_12H_RE);
  if (twelveHour) {
    const [, rawHours, rawMinutes, period] = twelveHour;
    let hours = Number(rawHours) % 12;
    if (period.toUpperCase() === 'PM') hours += 12;
    const minutes = Number(rawMinutes);
    return { hours, minutes, seconds: 0 };
  }

  const twentyFourHour = trimmed.match(TIME_24H_RE);
  if (!twentyFourHour) return null;

  const [, rawHours, rawMinutes, rawSeconds] = twentyFourHour;
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  const seconds = Number(rawSeconds || 0);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, seconds };
};

export const parseGameDateTime = (date?: string | null, time?: string | null): Date | null => {
  const parsedDate = parseLocalDate(date);
  if (!parsedDate) return null;

  const timeParts = parseTimeParts(time);
  if (!timeParts) return parsedDate;

  const result = new Date(parsedDate);
  result.setHours(timeParts.hours, timeParts.minutes, timeParts.seconds, 0);
  return result;
};

export const timeToMinutes = (value?: string | null): number | null => {
  const timeParts = parseTimeParts(value);
  if (!timeParts) return null;
  return timeParts.hours * 60 + timeParts.minutes;
};
