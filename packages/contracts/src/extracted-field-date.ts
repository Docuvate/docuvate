/** True when value looks like a real calendar date (DE + ISO); rejects label bleed-through. */
export function isPlausibleExtractedDateValue(raw: string): boolean {
  const value = raw.trim();
  if (!value) {
    return false;
  }

  const deFull = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  if (deFull) {
    return isValidCalendarDate(Number(deFull[3]), Number(deFull[2]), Number(deFull[1]));
  }

  const deShort = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/.exec(value);
  if (deShort) {
    const yy = Number(deShort[3]!);
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    return isValidCalendarDate(year, Number(deShort[2]), Number(deShort[1]));
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    return isValidCalendarDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (slash) {
    return isValidCalendarDate(Number(slash[3]), Number(slash[2]), Number(slash[1]));
  }

  return false;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const maxDay = daysInMonth(year, month);
  return day <= maxDay;
}

function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      return 0;
  }
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
