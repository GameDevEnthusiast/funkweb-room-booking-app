/**
 * ============================================================================
 * FILE: features/bookings/hooks/useBookingForm.ts
 * ============================================================================
 * PURPOSE:
 *   Owns all state for the "Reserve Time Slot" form (fields, loading,
 *   success/error message) and the submit handler that POSTs to
 *   /api/bookings. BookingForm.tsx is purely presentational and just binds
 *   its inputs to what this hook returns.
 *
 * IMPORTS:
 *   - useState (react)
 *   - Booking, ApiResponse (features/bookings/types)
 *
 * EXPORTS:
 *   - useBookingForm(roomId: string, onBookingCreated: () => void):
 *     { title, setTitle, userName, setUserName, date, setDate,
 *       startTime, setStartTime, endTime, setEndTime,
 *       loading, message, handleSubmit }
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Field state and handleSubmit logic
 *   unchanged from the original — only relocated into a reusable hook so
 *   BookingForm.tsx could become a thin presentational component.
 * ============================================================================
 */

import { useState } from 'react';
import type { Booking, ApiResponse } from '@/features/bookings/types';

// Why this is needed: this shape is only ever consumed by this hook and its
// one caller (BookingForm), so it stays colocated here rather than in the
// shared types file, per our earlier agreement on single-use vs. shared
// types. It's exported (not just local) so BookingForm.tsx can annotate
// its own `message` destructure if needed.
// What happens if this is removed: the `message` state below would fall
// back to an inferred type, which still works here but loses an explicit,
// documented contract for what a "status message" looks like.
export interface StatusMessage {
  text: string;
  type: 'success' | 'error';
}

export function useBookingForm(roomId: string, onBookingCreated: () => void) {
  const [title, setTitle] = useState('');
  const [userName, setUserName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // Why this is needed: the form collects date/startTime/endTime as
    // separate <input> values (browser date/time pickers don't give you a
    // combined ISO string), so they're combined and converted to ISO here,
    // right before sending — this is the one place that conversion needs
    // to happen.
    // What happens if this is removed: the API would receive raw strings
    // like "14:00" with no date attached, which fails the server's
    // `new Date(startTime)` parsing in bookingValidation.ts.
    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO = new Date(`${date}T${endTime}`).toISOString();

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          title,
          userName,
          startTime: startISO,
          endTime: endISO,
        }),
      });

      const json: ApiResponse<Booking> = await res.json();

      if (json.success) {
        setMessage({ text: 'Room successfully reserved!', type: 'success' });
        // Why this is needed: clearing title/userName after a successful
        // submit prevents an accidental duplicate booking if the user hits
        // "Reserve" again without meaning to re-enter everything. Date and
        // times are deliberately left as-is, since booking a second slot
        // on the same day is a common next action.
        // What happens if this is removed: the form would stay pre-filled
        // with the just-submitted title/name, making it easy to
        // accidentally resubmit the same meeting details.
        setTitle('');
        setUserName('');
        // Why this is needed: this is the hand-off back to app/page.tsx —
        // it triggers useRoomBookings' refetch so the newly created booking
        // shows up in the list immediately, without a manual page reload.
        // What happens if this is removed: the reservation would succeed
        // in the database but not visibly appear in the "Scheduled
        // Reservations" section until the user switched rooms or refreshed.
        onBookingCreated();
      } else {
        setMessage({ text: json.error || 'Failed to reserve room.', type: 'error' });
      }
    } catch {
      // Why this is needed: this catch handles network-level failures
      // (e.g. server unreachable) as distinct from application-level
      // failures (e.g. slot occupied), which are handled in the `else`
      // branch above via json.success === false.
      // What happens if this is removed: a network failure would throw an
      // unhandled promise rejection instead of showing the user a clear
      // "Network connection error" message.
      setMessage({ text: 'Network connection error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return {
    title, setTitle,
    userName, setUserName,
    date, setDate,
    startTime, setStartTime,
    endTime, setEndTime,
    loading,
    message,
    handleSubmit,
  };
}