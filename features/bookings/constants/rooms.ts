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
 *   - ROOMS: array of { id, name } objects
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Content unchanged from the original
 *   ROOMS array — only relocated into its own file so both RoomSelector.tsx
 *   and (if ever needed) other components can import the same list without
 *   duplicating it.
 * ============================================================================
 */

// Why this is needed: this list is intentionally hardcoded on the frontend
// rather than fetched via an API call, because this is a small, fixed set
// of physical meeting rooms that essentially never changes — avoiding an
// unnecessary network round-trip just to populate a dropdown. The `id`
// values here MUST exactly match the `id` values in prisma/seed.ts, since
// roomId is used as a foreign key on every Booking record.
// What happens if this is removed: RoomSelector.tsx would have no rooms to
// render, and BookingForm would have no valid roomId to submit — or, if
// this list drifted out of sync with prisma/seed.ts (e.g. an id typo),
// submissions would fail the foreign key constraint on Booking.roomId.
export const ROOMS = [
  { id: 'room-a', name: 'Meeting Room A (Main)' },
  { id: 'room-b', name: 'Meeting Room B (Focus)' },
  { id: 'room-c', name: 'Conference Hall' },
];