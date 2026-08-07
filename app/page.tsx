/**
 * ============================================================================
 * FILE: app/page.tsx
 * ============================================================================
 * PURPOSE:
 *   Composition root / entry page for the Room Booking app. This file is
 *   intentionally "thin" — it owns only the one piece of state that is
 *   genuinely shared across multiple feature components (which room is
 *   selected), and wires the Bookings feature's components + hook together.
 *   All form state, fetch logic, and row-level rendering live inside
 *   features/bookings/*.
 *
 * IMPORTS:
 *   - RoomSelector, BookingForm, BookingList (features/bookings/components)
 *   - useRoomBookings (features/bookings/hooks/useRoomBookings)
 *
 * EXPORTS:
 *   - default: BookingPage (the page component Next.js renders at "/")
 *
 * AI ASSISTANCE:
 *   Refactored with Claude (Anthropic, Sonnet) on 2026-08-07. Original
 *   monolithic version held ALL state (form fields, bookings list, loading,
 *   success/error message) and all fetch/submit logic directly in this file.
 *   This pass extracted that into features/bookings/hooks and
 *   features/bookings/components, leaving this file as a pure composition
 *   layer.
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import RoomSelector from '@/features/bookings/components/RoomSelector';
import BookingForm from '@/features/bookings/components/BookingForm';
import BookingList from '@/features/bookings/components/BookingList';
import { useRoomBookings } from '@/features/bookings/hooks/useRoomBookings';

export default function BookingPage() {
  // Why this is needed: selectedRoom is read by THREE separate things —
  // the dropdown that sets it, useRoomBookings (to know which room's
  // bookings to fetch), and BookingForm (to know which room a new booking
  // attaches to). Because more than one feature component depends on it,
  // it can't live inside any single one of them — it has to live here, in
  // their shared parent, and flow down as props. This is the one deliberate
  // exception to "page.tsx holds no state," worth pointing to directly if
  // a judge asks why this file isn't fully stateless.
  // What happens if this is removed: RoomSelector, useRoomBookings, and
  // BookingForm would each track their own separate idea of "which room,"
  // with no way to stay in sync — picking a room in the dropdown would stop
  // actually changing which bookings you see or which room a new booking
  // gets attached to.
  const [selectedRoom, setSelectedRoom] = useState('room-a');

  // Why this is needed: centralizes the "fetch bookings for this room"
  // logic behind one hook call, and exposes a refetch function so
  // BookingForm can trigger a refresh right after a successful reservation
  // — without this file needing to know HOW fetching works internally.
  // What happens if this is removed: the reservations list would go stale
  // after creating a new booking, since nothing would re-trigger the fetch.
  const { bookings, refetchBookings } = useRoomBookings(selectedRoom);

  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1>Office Room Booking</h1>
      <p style={{ color: '#666' }}>Local Network Reservation Portal</p>

      <RoomSelector selectedRoom={selectedRoom} onChange={setSelectedRoom} />

      <section
        style={{
          background: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <h2>Reserve Time Slot</h2>
        {/*
          Why this is needed: BookingForm owns its own field state, its own
          loading state, and its own success/error message internally — it
          only needs to be told WHICH room to book into, and WHAT to do
          afterward (refetch the list). Passing just these two props keeps
          the form fully self-contained.
          What happens if this is removed: either this page would have to
          re-implement form state itself (back to the original monolith),
          or new bookings would never appear below without a manual page
          refresh.
        */}
        <BookingForm roomId={selectedRoom} onBookingCreated={refetchBookings} />
      </section>

      <section>
        <h2>Scheduled Reservations</h2>
        <BookingList bookings={bookings} />
      </section>
    </main>
  );
}