/**
 * ============================================================================
 * FILE: features/bookings/hooks/useRoomBookings.ts
 * ============================================================================
 * PURPOSE:
 *   Client-side hook that fetches the list of bookings for a given room from
 *   GET /api/bookings?roomId=xxx, and re-fetches automatically whenever the
 *   roomId changes (e.g. user picks a different room in RoomSelector).
 *   Exposes a manual refetch function so BookingForm can refresh the list
 *   right after a successful submission.
 *
 * IMPORTS:
 *   - useState, useEffect, useCallback (react)
 *   - Booking, ApiResponse (features/bookings/types)
 *
 * EXPORTS:
 *   - useRoomBookings(roomId: string): { bookings, refetchBookings }
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Fetch logic and error handling
 *   unchanged from the original fetchBookings function — only relocated
 *   into a reusable hook and wrapped in useEffect/useCallback.
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import type { Booking, ApiResponse } from '@/features/bookings/types';

export function useRoomBookings(roomId: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Why this is needed: useCallback keeps this function reference stable
  // across re-renders (as long as roomId doesn't change), which matters
  // because it's used both inside this hook's own useEffect AND returned
  // out to BookingForm as onBookingCreated. Without a stable reference, it
  // could cause unnecessary re-runs wherever it's used as a dependency.
  // What happens if this is removed: a plain (non-memoized) function would
  // still work functionally, but could trigger extra re-renders or
  // re-subscriptions in components that depend on referential stability.
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings?roomId=${roomId}`);
      const json: ApiResponse<Booking[]> = await res.json();
      if (json.success) {
        setBookings(json.data);
      }
      // Why this is needed: if the API returns success: false here, we
      // deliberately leave the previous bookings list untouched rather than
      // clearing it — a failed refetch shouldn't wipe out a list the user
      // was already looking at.
      // What happens if this is removed: nothing crashes, but a transient
      // fetch failure could silently blank the reservations list.
    } catch (err) {
      console.error('Failed to load bookings', err);
    }
  }, [roomId]);

  // Why this is needed: this effect re-runs fetchBookings automatically
  // whenever roomId changes, so switching rooms in the dropdown always
  // shows that room's bookings without any manual wiring in app/page.tsx.
  // What happens if this is removed: the bookings list would only ever
  // reflect whichever room was selected on initial page load — switching
  // rooms in the dropdown would silently show stale data.
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Why this is needed: exposing fetchBookings under the name
  // refetchBookings gives BookingForm (via app/page.tsx) an explicit way to
  // trigger a fresh fetch right after a successful POST, without this hook
  // needing to know anything about forms or submissions.
  // What happens if this is removed: the reservations list would go stale
  // immediately after creating a new booking, only updating on the next
  // room switch or full page reload.
  return { bookings, refetchBookings: fetchBookings };
}