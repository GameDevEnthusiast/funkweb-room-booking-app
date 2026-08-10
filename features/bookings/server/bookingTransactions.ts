/**
 * ============================================================================
 * FILE: features/bookings/server/bookingTransactions.ts
 * ============================================================================
 * PURPOSE:
 *   The core anti-double-booking logic. Wraps the "check for an overlapping
 *   booking, then insert" sequence in a single Prisma $transaction so the
 *   check-and-insert is atomic — this is the file to open during your exam
 *   defense when asked "how do you prevent two people booking the same
 *   room/time?"
 *
 * IMPORTS:
 *   - Prisma (from @prisma/client): used to type-check for P2024 errors
 *   - prisma (lib/prisma): shared Prisma client singleton
 *   - Booking, NewBookingInput (features/bookings/types)
 *
 * EXPORTS:
 *   - createBookingIfAvailable(input: NewBookingInput): Promise<Booking>
 *   - SlotOccupiedError (class): thrown when the requested time overlaps
 *     an existing booking
 *   - PoolTimeoutError (class): thrown when SQLite's connection queue times
 *     out (Prisma error code P2024)
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/api/bookings/route.ts by
 *   Claude (Anthropic, Sonnet) on 2026-08-07. Transaction logic (overlap
 *   check via findFirst, then create) and the P2024 detection are
 *   unchanged from the original POST handler — only relocated here and
 *   given named error classes instead of string-matching on error.message.
 * ============================================================================
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Booking } from '@prisma/client';
import type { NewBookingInput } from '@/features/bookings/types';

// Why this is needed: a dedicated error class lets route.ts distinguish
// "slot occupied" from every other kind of failure using `instanceof`,
// instead of the original approach of comparing error.message to a magic
// string ('SLOT_OCCUPIED'). This is safer — a typo in a string comparison
// fails silently, a missing class import fails loudly at compile time.
// What happens if this is removed: route.ts would have no reliable way to
// tell a booking conflict apart from a genuine server error, and every
// failure would return the same generic 500 response.
export class SlotOccupiedError extends Error {
  constructor() {
    super('SLOT_OCCUPIED');
    this.name = 'SlotOccupiedError';
  }
}

// Why this is needed: same reasoning as above, but for SQLite's connection
// queue timeout (Prisma error code P2024). SQLite allows only one writer
// at a time; under load, a request can wait in the queue and time out.
// What happens if this is removed: a busy-database moment would be
// reported to the user identically to an unrelated crash.
export class PoolTimeoutError extends Error {
  constructor() {
    super('POOL_TIMEOUT');
    this.name = 'PoolTimeoutError';
  }
}

export async function createBookingIfAvailable(input: NewBookingInput): Promise<Booking> {
  const { roomId, title, userName, startTime, endTime } = input;

  try {
    // Why this is needed: wrapping the overlap check (findFirst) and the
    // insert (create) inside prisma.$transaction makes them ATOMIC — no
    // other request can slip a conflicting booking in between "we checked,
    // it's free" and "we saved it." This is THE mechanism that prevents
    // double-booking race conditions, and the single most important block
    // in the whole app to be able to explain in your exam defense.
    // What happens if this is removed: two requests for the same
    // room/time arriving close together could BOTH pass the "is it free?"
    // check before either one finishes inserting — resulting in two
    // bookings for the same slot, which is exactly the bug this app exists
    // to prevent.
    const newBooking = await prisma.$transaction(async (tx) => {
      // Why this is needed: this query looks for ANY existing booking in
      // the same room whose time range overlaps the requested range. The
      // condition `startTime < requestedEnd AND endTime > requestedStart`
      // is the standard interval-overlap test — it catches partial
      // overlaps, not just exact duplicate times.
      // What happens if this is removed: a new booking could be created
      // even when it overlaps an existing one, silently double-booking
      // the room.
      const existingConflict = await tx.booking.findFirst({
        where: {
          roomId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (existingConflict) {
        throw new SlotOccupiedError();
      }

      return tx.booking.create({
        data: { roomId, title, userName, startTime, endTime },
      });
    });

    return newBooking;

  } catch (error) {
    // Why this is needed: SlotOccupiedError must be re-thrown as-is (not
    // swallowed or converted) so route.ts can catch it specifically and
    // return a 409 Conflict — re-throwing preserves that error identity
    // across the function boundary.
    // What happens if this is removed: route.ts would only ever see a
    // generic error and couldn't distinguish "slot taken" from "database
    // crashed," so it would return the wrong HTTP status code.
    if (error instanceof SlotOccupiedError) {
      throw error;
    }

    // Why this is needed: this checks for Prisma's specific P2024 error
    // code (connection pool / queue timeout) across the different shapes
    // that error can arrive in, and converts it into our own
    // PoolTimeoutError so route.ts can return a 503 (retry-able) instead
    // of a 500 (fatal).
    // What happens if this is removed: a transient "SQLite was busy"
    // moment would look identical to a genuine unhandled crash, and the
    // client wouldn't know it's safe to just retry the request.
    const isPoolTimeout =
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2024') ||
      (error as any)?.errorCode === 'P2024' ||
      (error as any)?.code === 'P2024';

    if (isPoolTimeout) {
      throw new PoolTimeoutError();
    }

    // Why this is needed: any other, unanticipated error is re-thrown
    // unchanged so route.ts's final catch-all branch handles it as a
    // generic 500 — this function never silently hides an unknown error.
    // What happens if this is removed: an unexpected error type could be
    // swallowed here, causing route.ts to never respond to the client at
    // all instead of returning a 500.
    throw error;
  }
}