/**
 * ============================================================================
 * FILE: features/bookings/components/BookingList.tsx
 * ============================================================================
 * PURPOSE:
 *   Renders the "Scheduled Reservations" section. Handles the empty-state
 *   message and maps the bookings array to individual BookingListItem rows.
 *   Contains no fetch logic itself — bookings are passed in as a prop from
 *   app/page.tsx (sourced from the useRoomBookings hook).
 *
 * IMPORTS:
 *   - BookingListItem (features/bookings/components/BookingListItem)
 *   - Booking (features/bookings/types): shared type for a single booking
 *
 * EXPORTS:
 *   - default: BookingList component
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Rendering logic unchanged from the
 *   original inline <ul>/<li> block — only moved into its own file and
 *   split further into BookingListItem for per-row rendering.
 * ============================================================================
 */

import BookingListItem from '@/features/bookings/components/BookingListItem';
import type { Booking } from '@/features/bookings/types';

// Why this is needed: only this component consumes this prop shape, so it
// stays colocated here rather than in the shared types file — Booking[]
// itself is the shared type, this wrapper interface is not.
// What happens if this is removed: TypeScript loses type safety on what
// app/page.tsx is required to pass in.
interface BookingListProps {
  bookings: Booking[];
}

export default function BookingList({ bookings }: BookingListProps) {
  // Why this is needed: an empty room (or a room with no bookings yet)
  // should give the user clear feedback instead of silently rendering
  // nothing, which could look like the page failed to load.
  // What happens if this is removed: users would see a blank section with
  // no indication of whether that's correct or a bug.
  if (bookings.length === 0) {
    return <p>No reservations scheduled for this room.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {bookings.map((b) => (
        // Why this is needed: key={b.id} lets React track each row across
        // re-renders (e.g. after a new booking is added) without
        // re-mounting every existing row.
        // What happens if this is removed: React would warn in the console
        // and could misapply state/DOM updates to the wrong row after the
        // list changes.
        <BookingListItem key={b.id} booking={b} />
      ))}
    </ul>
  );
}