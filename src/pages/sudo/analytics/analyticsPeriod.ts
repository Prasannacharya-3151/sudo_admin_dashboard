// ==========================================
// ANALYTICS PERIOD HELPERS
// All calendar dates are treated as UTC.
// ==========================================

export type PeriodPreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "all"
  | "date"
  | "range";

export interface AnalyticsQuery {
  from?: string;
  to?: string;
  date?: string;
}

export interface AnalyticsPeriod {
  query: AnalyticsQuery;
  label: string;
}

export const periodOptions: Array<{
  value: PeriodPreset;
  label: string;
}> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "all", label: "All time" },
  { value: "date", label: "Specific date" },
  { value: "range", label: "Date range" },
];

const toIsoDate = (date: Date): string => {
  const year = date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getTodayIso = (): string => {
  return toIsoDate(new Date());
};

export const addDaysIso = (
  isoDate: string,
  days: number,
): string => {
  const date = new Date(
    `${isoDate}T00:00:00Z`,
  );

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  date.setUTCDate(
    date.getUTCDate() + days,
  );

  return toIsoDate(date);
};

export const formatPeriodDate = (
  isoDate: string,
): string => {
  const date = new Date(
    `${isoDate}T00:00:00Z`,
  );

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );
};

export const buildAnalyticsPeriod = (
  preset: PeriodPreset,
  options: {
    date?: string;
    from?: string;
    to?: string;
  } = {},
): AnalyticsPeriod => {
  const today = getTodayIso();

  switch (preset) {
    case "today":
      return {
        query: { date: "today" },
        label: "Today",
      };

    case "yesterday": {
      const yesterday = addDaysIso(
        today,
        -1,
      );

      return {
        query: { date: yesterday },
        label: `Yesterday · ${formatPeriodDate(
          yesterday,
        )}`,
      };
    }

    case "last7":
      return {
        query: {
          from: addDaysIso(today, -6),
          to: addDaysIso(today, 1),
        },
        label: "Last 7 days",
      };

    case "last30":
      return {
        query: {
          from: addDaysIso(today, -29),
          to: addDaysIso(today, 1),
        },
        label: "Last 30 days",
      };

    case "all":
      return {
        query: {},
        label: "All time",
      };

    case "date": {
      const date =
        options.date || today;

      return {
        query: { date },
        label: formatPeriodDate(date),
      };
    }

    case "range": {
      const from =
        options.from ||
        addDaysIso(today, -6);

      const to = options.to || today;

      return {
        query: {
          from,
          to: addDaysIso(to, 1),
        },
        label: `${formatPeriodDate(
          from,
        )} – ${formatPeriodDate(to)}`,
      };
    }
  }
};
