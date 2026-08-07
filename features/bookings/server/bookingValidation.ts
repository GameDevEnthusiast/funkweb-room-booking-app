/**
 * ============================================================================
 * FILE: features/bookings/server/bookingValidation.ts
 * ============================================================================
 * PURPOSE:
 *   Validates and sanitizes raw booking input from POST /api/bookings before
 *   it ever reaches the database transaction layer. Centralizing this here
 *   means the same rules apply every time, and route.ts stays free of
 *   field-by-field checking logic.
 *
 * IMPORTS:
 *   - NewBookingInput (features/bookings/types): the shape this function
 *     produces once validation passes
 *
 * EXPORTS:
 *   - validateBookingInput(body: unknown): NewBookingInput
 *   - ValidationError (class): thrown when input fails any check, carries
 *     a human-readable message for the 400 response
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/api/bookings/route.ts by
 *   Claude (Anthropic, Sonnet) on 2026-08-07. Validation rules (required
 *   fields, date parsing, start < end, string trimming/length limits)
 *   unchanged from the original POST handler — only relocated into a
 *   dedicated, reusable validation function.
 * ============================================================================
 */

import type { NewBookingInput } from '@/features/bookings/types';

// Why this is needed: a dedicated error class lets route.ts catch
// validation failures specifically (via `instanceof ValidationError`) and
// return a 400 with the exact message describing what was wrong, instead
// of a generic failure.
// What happens if this is removed: route.ts would have no reliable way to
// tell "the user typed something wrong" (400) apart from "the server
// broke" (500), and the client would never learn WHAT was wrong with
// their submission.
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateBookingInput(body: any): NewBookingInput {
  const { roomId, title, userName, startTime, endTime } = body ?? {};

  // Why this is needed: this single check catches missing/empty values for
  // every required field at once, before any further processing wastes
  // effort on incomplete data. Falsy-check (rather than checking each field
  // individually with separate messages) keeps this concise while still
  // catching undefined, null, and empty string.
  // What happens if this is removed: a request missing, say, `userName`
  // would proceed to date parsing and the database transaction, likely
  // crashing later with a much less helpful error — or worse, saving a
  // booking with missing data.
  if (!roomId || !title || !userName || !startTime || !endTime) {
    throw new ValidationError('Missing required fields.');
  }

  const requestedStart = new Date(startTime);
  const requestedEnd = new Date(endTime);

  // Why this is needed: `new Date(...)` does not throw on an invalid input
  // — it silently produces a Date object whose getTime() is NaN. This check
  // is the only thing standing between a malformed date string and that
  // NaN quietly propagating into the database.
  // What happens if this is removed: an invalid date string (e.g. a typo'd
  // ISO string) would pass through as an "Invalid Date," likely causing a
  // confusing Prisma error deep in the transaction layer instead of a
  // clear 400 response here.
  if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
    throw new ValidationError('Invalid date format.');
  }

  // Why this is needed: a booking where the end time is not strictly after
  // the start time is nonsensical (zero or negative duration) and would
  // also break the overlap-detection logic in bookingTransactions.ts,
  // which assumes startTime < endTime for every booking.
  // What happens if this is removed: a booking could be created with, say,
  // start and end at the exact same instant, or end before start —
  // corrupting the data and confusing the conflict-check query.
  if (requestedStart >= requestedEnd) {
    throw new ValidationError('End time must be strictly after start time.');
  }

  // Why this is needed: trimming removes accidental leading/trailing
  // whitespace, and slicing caps length so a very long paste can't bloat
  // the database or break the card layout in BookingListItem. This is
  // basic input sanitization, applied before the value ever reaches
  // Prisma.
  // What happens if this is removed: a user could submit a meeting title
  // thousands of characters long, or one that's just whitespace, and it
  // would be stored and rendered as-is.
  const cleanTitle = String(title).trim().slice(0, 100);
  const cleanUserName = String(userName).trim().slice(0, 50);

  return {
    roomId,
    title: cleanTitle,
    userName: cleanUserName,
    startTime: requestedStart,
    endTime: requestedEnd,
  };
}