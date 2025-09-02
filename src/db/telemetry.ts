import { pgTable, uuid, text, timestamp, varchar, date } from "drizzle-orm/pg-core";

export const accountMetricInterest = pgTable("account_metric_interest", {
  accountId: uuid("account_id").notNull(),
  metricKey: varchar("metric_key", { length: 64 }).notNull(),
  firstRequestedAt: timestamp("first_requested_at", { withTimezone: true }).defaultNow(),
  lastRequestedAt: timestamp("last_requested_at", { withTimezone: true }).defaultNow(),
  status: varchar("status", { length: 16 }).default("active"), // active | suppressed
  source: varchar("source", { length: 16 }).default("user_request"),
});

export const factAbsence = pgTable("fact_absence", {
  provider: varchar("provider", { length: 32 }).notNull(),      // "facebook"
  level: varchar("level", { length: 16 }).notNull(),            // "campaign" | "adset" | "ad"
  levelId: text("level_id").notNull(),
  date: date("date").notNull(),                                 // YYYY-MM-DD
  metricKey: varchar("metric_key", { length: 64 }).notNull(),
  absentExpiresAt: timestamp("absent_expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});