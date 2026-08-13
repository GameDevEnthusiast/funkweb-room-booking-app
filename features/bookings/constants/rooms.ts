/**
 * ============================================================================
 * FILE: features/bookings/constants/rooms.ts
 * ============================================================================
 * PURPOSE:
 *   Single source of truth for the static list of bookable rooms shown in
 *   RoomSelector.tsx. This is a hardcoded list (not fetched from the
 *   database) matching the room IDs seeded by prisma/seed.ts — the two
 *   MUST stay in sync since roomId is a foreign key in the Booking model.
 *
 * IMPORTS:
 *   None.
 *
 * EXPORTS:
 *   - ROOMS: array of { id, name, floor, capacity } objects
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Content unchanged from the original
 *   ROOMS array — only relocated into its own file so both RoomSelector.tsx
 *   and (if ever needed) other components can import the same list without
 *   duplicating it.
 *
 *   Updated by Claude (Anthropic, Sonnet) on 2026-08-12 — replaced the
 *   3 placeholder rooms with the real office room list (10 rooms, Floor 5).
 *   `floor` and `capacity` were added here as display-only metadata; they
 *   are duplicated from prisma/seed.ts (capacity) or frontend-only for now
 *   (floor — not currently a column on the Prisma Room model). See the
 *   note in prisma/seed.ts if `floor` needs to become a real DB field
 *   later (e.g. once a second floor is added).
 *
 *   Updated again by Claude (Anthropic, Sonnet) on 2026-08-12 — capacity
 *   is now baked directly into `name` (e.g. "Møterom 1 (Capacity: 12)")
 *   so it shows up in the RoomSelector dropdown with zero changes to
 *   RoomSelector.tsx, which already renders `r.name` as-is. This mirrors
 *   what the office's existing Google Calendar room-booking setup already
 *   shows — capacity is the one spec anyone actually needs at a glance.
 *   The numeric `capacity` field is left in place unchanged in case future
 *   code needs the raw number rather than the formatted string.
 * ============================================================================
 */

// Why this is needed: this list is intentionally hardcoded on the frontend
// rather than fetched via an API call, because this is a small, fixed set
// of physical meeting rooms that essentially never changes — avoiding an
// unnecessary network round-trip just to populate a dropdown. The `id`
// values here MUST exactly match the `id` values in prisma/seed.ts, since
// roomId is used as a foreign key on every Booking record. `name` values do
// NOT need to match anything else exactly — they're display-only text.
// What happens if this is removed: RoomSelector.tsx would have no rooms to
// render, and BookingForm would have no valid roomId to submit — or, if
// this list drifted out of sync with prisma/seed.ts (e.g. an id typo),
// submissions would fail the foreign key constraint on Booking.roomId.
export const ROOMS = [
  { id: 'hans-kontor', name: 'Hans Kontor (Capacity: 3)', floor: 5, capacity: 3 },
  { id: 'moterom-1', name: 'Møterom 1 (Capacity: 12)', floor: 5, capacity: 12 },
  { id: 'moterom-2', name: 'Møterom 2 (Capacity: 4)', floor: 5, capacity: 4 },
  { id: 'moterom-3', name: 'Møterom 3 (Capacity: 4)', floor: 5, capacity: 4 },
  { id: 'moterom-4', name: 'Møterom 4 (Capacity: 3)', floor: 5, capacity: 3 },
  { id: 'moterom-5', name: 'Møterom 5 (Capacity: 3)', floor: 5, capacity: 3 },
  { id: 'moterom-6', name: 'Møterom 6 (Capacity: 3)', floor: 5, capacity: 3 },
  { id: 'moterom-7', name: 'Møterom 7 (Capacity: 4)', floor: 5, capacity: 4 },
  { id: 'moterom-8', name: 'Møterom 8 (Capacity: 10)', floor: 5, capacity: 10 },
  { id: 'moterom-laila', name: 'Møterom - Laila (Capacity: 3)', floor: 5, capacity: 3 },
];