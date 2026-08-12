/**
 * ============================================================================
 * FILE: features/statistics/utils/hourSlots.ts
 * PURPOSE: Utility functions for calculating hour slots, formatting hour labels, and sorting peak slots.
 * IMPORTS: TimeSlot (from ../types)
 * EXPORTS: formatHourLabel, getHourSlotsForBooking, topNSlots
 * ============================================================================
 */

import { TimeSlot } from "../types";

/**
 * Formats a 24-hour integer into an accessible time interval string (e.g., 9 -> "09:00 - 10:00").
 */
export function formatHourLabel(hour: number): string {
  const start = hour.toString().padStart(2, "0");
  const end = ((hour + 1) % 24).toString().padStart(2, "0");
  return `${start}:00 - ${end}:00`;
}

/**
 * Expands multi-hour bookings into discrete hourly time slots so peak occupancy calculations count every active hour.
 */
export function getHourSlotsForBooking(start: Date, end: Date): number[] {
  const slots: number[] = [];
  const cursor = new Date(start);
  cursor.setMinutes(0, 0, 0);

  while (cursor < end) {
    slots.push(cursor.getHours());
    cursor.setHours(cursor.getHours() + 1);
  }
  return slots;
}

/**
 * Orders accumulated time slot counts by highest booking frequency with chronological fallback tie-breaking, returning the top N slots.
 */
export function topNSlots(slotCounts: Map<number, number>, n: number): TimeSlot[] {
  return Array.from(slotCounts.entries())
    .map(([hour, count]) => ({ hour, label: formatHourLabel(hour), count }))
    .sort((a, b) => b.count - a.count || a.hour - b.hour)
    .slice(0, n);
}