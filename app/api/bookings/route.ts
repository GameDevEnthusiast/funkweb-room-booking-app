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
import type { ApiResponse } from '@/features/bookings/types';
import type { Booking } from '@prisma/client';

// ----------------------------------------------------------------------------
// GET /api/bookings?roomId=xxx
// Returns all bookings, optionally filtered to a single room.
// ----------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

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

    const cleanInput = validateBookingInput(body);

    const newBooking = await createBookingIfAvailable(cleanInput);

    const response: ApiResponse<Booking> = { success: true, data: newBooking };
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    if (error instanceof ValidationError) {
      const response: ApiResponse<null> = { success: false, error: error.message };
      return NextResponse.json(response, { status: 400 });
    }

    if (error instanceof SlotOccupiedError) {
      const response: ApiResponse<null> = { success: false, error: 'This time slot is already booked.' };
      return NextResponse.json(response, { status: 409 });
    }

    if (error instanceof PoolTimeoutError) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Server busy, connection queue timed out. Please try again.',
      };
      return NextResponse.json(response, { status: 503 });
    }

    // Why this is needed: this is the last point before the client only
    // ever sees a generic "Internal server error." — without logging here,
    // any error that isn't a ValidationError, SlotOccupiedError, or
    // PoolTimeoutError (e.g. a JSON parse failure on request.json(), or a
    // genuinely unclassified crash) disappears with zero trace, exactly as
    // happened before this line was added.
    // What happens if this is removed: unclassified failures go dark again
    // and every 500 looks identical from the terminal's perspective.
    console.error('Unhandled error in POST /api/bookings:', error);

    const response: ApiResponse<null> = { success: false, error: 'Internal server error.' };
    return NextResponse.json(response, { status: 500 });
  }
}