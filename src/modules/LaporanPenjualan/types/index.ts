// Wire types of `v1/wall-report` (digitalapproval/Modules/WallReport). Field names follow the API.

/**
 * How far an achievement is from its target, decided by the server: `below` up to 80%, `near`
 * above 80%, `achieved` from 100%. A `string` too, because the backend may add levels.
 */
export type AchievementLevel = 'below' | 'near' | 'achieved' | (string & {});

/** `period` is `YYYY-MM`; `label` is the server's name for it, such as "October 2026". */
export type ReportPeriod = { period: string; label: string };

export type ReportPeriods = {
  /** The period the server shows when none is chosen. */
  default: string;
  periods: ReportPeriod[];
};

export type Achievement = {
  value: number;
  percentage: number;
  level: AchievementLevel;
};

export type WeeklyAchievement = {
  /** "W-1", "W-2", … */
  week: string;
  value: number;
  /** Share of the monthly target reached in this week. */
  percentage: number;
  dates: string[];
};

export type GroupSummary = {
  group: string;
  achievement: Achievement;
  target: {
    monthly_amount: number;
    daily_amount: number;
    /** Achievement minus target: negative while the target is not reached. */
    balance: number;
    /** Working days left in the month. */
    day_left: number;
    /** What each remaining day must add (negative) or is ahead by (positive). */
    balance_daily: number;
  };
  weekly: WeeklyAchievement[];
};

export type ReportSummary = ReportPeriod & {
  total: {
    achievement: number;
    target: number;
    balance: number;
    percentage: number;
    level: AchievementLevel;
  };
  groups: GroupSummary[];
  branches: { branch: string; achievement: number }[];
};

export type DailyAmount = { date: string; amount: number };

export type BranchAchievement = {
  branch: string;
  achievement: Achievement;
  target: { monthly_amount: number; daily_amount: number; balance: number };
  daily: DailyAmount[];
};

export type GroupDetail = ReportPeriod &
  GroupSummary & {
    /** Days with sales, oldest first. */
    dates: string[];
    daily_totals: DailyAmount[];
    branches: BranchAchievement[];
  };
