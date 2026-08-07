/**
 * ============================================================================
 * FILE: features/bookings/components/BookingListItem.tsx
 * ============================================================================
 * PURPOSE:
 *   Renders a single reservation card (title, booked-by name, formatted
 *   date/time range). The last stop in the render chain: BookingList maps
 *   over bookings and renders one of these per booking.
 *
 * IMPORTS:
 *   - formatDateTimeRange (features/bookings/utils/formatDateTimeRange):
 *     converts raw ISO start/end strings into a human-readable range
 *   - Booking (features/bookings/types): shared type for a single booking
 *
 * EXPORTS:
 *   - default: BookingListItem component
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Markup and styling unchanged from
 *   the original inline <li> block — only moved into its own file, with the
 *   inline formatDateTimeRange function pulled out to a shared util.
 * ============================================================================
 */

import { formatDateTimeRange } from '@/features/bookings/utils/formatDateTimeRange';
import type { Booking } from '@/features/bookings/types';

// Why this is needed: only this component consumes this prop shape, so it
// stays colocated here rather than in the shared types file, per our
// earlier agreement on single-use vs. shared types.
// What happens if this is removed: TypeScript loses type safety on what
// BookingList is required to pass in.
interface BookingListItemProps {
  booking: Booking;
}

export default function BookingListItem({ booking }: BookingListItemProps) {
  return (
    <li
      style={{
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        marginBottom: '10px',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <strong>{booking.title}</strong> — Booked by {booking.userName}
      <br />
      <small style={{ color: '#555' }}>
        {/*
          Why this is needed: booking.startTime/endTime arrive from the API
          as raw ISO date strings (e.g. "2026-08-07T14:00:00.000Z"). Calling
          the shared formatter here — rather than inlining Date parsing
          logic in JSX — keeps this component readable and means the exact
          same formatting rule is used everywhere a booking's time range is
          displayed.
          What happens if this is removed: the card would either show raw,
          hard-to-read ISO strings, or every component that displays a
          booking would need to duplicate the same date-formatting code.
        */}
        {formatDateTimeRange(booking.startTime, booking.endTime)}
      </small>
    </li>
  );
}