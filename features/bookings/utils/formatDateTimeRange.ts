/**
 * ============================================================================
 * FILE: features/bookings/utils/formatDateTimeRange.ts
 * ============================================================================
 * PURPOSE:
 *   Converts a raw ISO start/end datetime pair into a human-readable string
 *   (e.g. "Fri, Aug 7 | 2:00 PM – 3:00 PM") for display in
 *   BookingListItem.tsx. Pure function, no state, no side effects — kept
 *   separate from any component so the same formatting logic can be reused
 *   anywhere a booking's time range needs to be shown.
 *
 * IMPORTS:
 *   None — uses only the built-in JavaScript Date API.
 *
 * EXPORTS:
 *   - formatDateTimeRange(startStr: string, endStr: string): string
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Formatting logic (toLocaleDateString
 *   / toLocaleTimeString options) unchanged from the original inline
 *   function — only relocated into a standalone, reusable utility.
 * ============================================================================
 */

export function formatDateTimeRange(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);

  // Why this is needed: toLocaleDateString/toLocaleTimeString automatically
  // format according to the browser's local timezone and locale settings,
  // so a booking stored in UTC displays correctly for whoever is viewing
  // it — without this app needing its own timezone-conversion logic.
  // What happens if this is removed: the UI would either show raw ISO
  // strings (e.g. "2026-08-07T14:00:00.000Z"), or someone would need to
  // hand-roll timezone math, which is exactly the kind of bug-prone code
  // the built-in Intl/Date APIs exist to avoid.
  const dateFormatted = start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const startTimeFormatted = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeFormatted = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `${dateFormatted} | ${startTimeFormatted} – ${endTimeFormatted}`;
}