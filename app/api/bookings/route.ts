/**
 * ============================================================================
 * FILE: app/api/bookings/route.ts
 * ============================================================================
 * PURPOSE:
 *   Next.js App Router API route for the Bookings feature. Handles the HTTP
 *   layer only (parse request -> call feature logic -> format response).
 *   All Prisma/database logic lives in features/bookings/server/*.
 *
 * IMPORTS:
 *   - NextResponse (next/server): builds HTTP responses
 *   - getBookings (features/bookings/server/bookingQueries)
 *   - validateBookingInput, ValidationError (features/bookings/server/bookingValidation)
 *   - createBookingIfAvailable, SlotOccupiedError, PoolTimeoutError
 *     (features/bookings/server/bookingTransactions)
 *   - ApiResponse, Booking (features/bookings/types)
 *
 * EXPORTS:
 *   - GET(request: Request)
 *   - POST(request: Request)
 *
 * AI ASSISTANCE:
 *   Refactored with Claude (Anthropic, Sonnet) on 2026-08-07. Original
 *   monolithic version (HTTP + validation + Prisma transaction all in one
 *   file) authored by [Your Name]; this pass extracted validation and the
 *   transaction/conflict-check logic into features/bookings/server/ so this
 *   route file only does HTTP request/response handling.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { getBookings } from '@/features/bookings/server/bookingQueries';
import { validateBookingInput, ValidationError } from '@/features/bookings/server/bookingValidation';
import {
  createBookingIfAvailable,
  SlotOccupiedError,
  PoolTimeoutError,
} from '@/features/bookings/server/bookingTransactions';
import type { ApiResponse, Booking } from '@/features/bookings/types';

// ----------------------------------------------------------------------------
// GET /api/bookings?roomId=xxx
// Returns all bookings, optionally filtered to a single room.
// ----------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    // Why this is needed: the route stays ignorant of Prisma syntax — it
    // just asks "give me bookings for this room" and gets an array back.
    // What happens if this is removed: the Prisma query (findMany, orderBy,
    // etc.) would have to live inline in this file again, mixing HTTP
    // concerns with data-access concerns — exactly what we refactored away.
    const bookings = await getBookings(roomId);

    const response: ApiResponse<Booking[]> = { success: true, data: bookings };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    const response: ApiResponse<null> = { success: false, error: 'Failed to fetch bookings.' };
    return NextResponse.json(response, { status: 500 });
  }
}

// ----------------------------------------------------------------------------
// POST /api/bookings
// Validates input, then creates a booking if the slot is free.
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Why this is needed: validation is isolated so the same rules (required
    // fields, valid dates, start < end, trimmed lengths) can be reasoned
    // about — and defended in your exam — as a single, testable unit.
    // What happens if this is removed: malformed input (bad dates, missing
    // fields) would reach the database layer directly, risking a crash or
    // bad data instead of a clean 400 response.
    const cleanInput = validateBookingInput(body);

    // Why this is needed: this is the core anti-double-booking guarantee.
    // createBookingIfAvailable wraps the "check for overlap" + "insert" in
    // one Prisma $transaction, so two near-simultaneous requests for the
    // same room/time can't both succeed — a classic race condition.
    // What happens if this is removed: two people could book the same room
    // for the same slot if their requests arrive close enough together,
    // because the conflict check and the insert would no longer be atomic.
    const newBooking = await createBookingIfAvailable(cleanInput);

    const response: ApiResponse<Booking> = { success: true, data: newBooking };
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    // Why this is needed: distinguishing error types lets us return the
    // correct HTTP status and a message the client can actually act on,
    // instead of a generic failure for every possible problem.
    // What happens if this is removed: a booking conflict, a validation
    // mistake, and a genuine server crash would all look identical (500) to
    // the person using the form.

    if (error instanceof ValidationError) {
      const response: ApiResponse<null> = { success: false, error: error.message };
      return NextResponse.json(response, { status: 400 });
    }

    if (error instanceof SlotOccupiedError) {
      const response: ApiResponse<null> = { success: false, error: 'This time slot is already booked.' };
      return NextResponse.json(response, { status: 409 });
    }

    if (error instanceof PoolTimeoutError) {
      // Why this is needed: SQLite (via Prisma) serializes writes. Under
      // load, a request can sit in the connection queue and hit Prisma's
      // P2024 error. Surfacing this as 503 tells the client "retry me" —
      // this is not a bug, it's SQLite's single-writer nature showing up.
      // What happens if this is removed: a busy-database moment would be
      // indistinguishable from a real crash (500) to the end user.
      const response: ApiResponse<null> = {
        success: false,
        error: 'Server busy, connection queue timed out. Please try again.',
      };
      return NextResponse.json(response, { status: 503 });
    }

    const response: ApiResponse<null> = { success: false, error: 'Internal server error.' };
    return NextResponse.json(response, { status: 500 });
  }
}