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

export function validateBookingInput(
  // [ORIGINAL CODE]: body: any
  // [WHY IT WAS WRONG]: `any` disables TypeScript's type checking entirely for this parameter, so nothing caught it when the function assumed properties existed with the right types — this is exactly the class of bug ESLint's no-explicit-any rule exists to catch, and it defeats the purpose of using TypeScript at the one place it matters most: the boundary where untrusted network input enters the system.
  // [HOW THIS IS BETTER]: `unknown` is TypeScript's type-safe counterpart to `any` — it accepts the same wide range of values, but the compiler now forces every property access or cast to be explicit and deliberate (see the destructuring line and the two `as` casts below), instead of silently trusting the shape of whatever the client sent.
  // [WHAT HAPPENS IF REMOVED]: reverting to `any` here silently re-opens the door to shipping a `roomId` that's actually a number, an object, or `undefined` all the way into the Prisma call with no compiler warning — bugs that show up as confusing runtime crashes far from their root cause, instead of being caught at compile time.
  // [BEST PRACTICE]: treat every function that receives raw request bodies, `JSON.parse` output, or third-party API responses as untrusted input — type it `unknown` and validate/narrow before use, never `any`.
  body: unknown
): NewBookingInput {
  // [ORIGINAL CODE]: const { roomId, title, userName, startTime, endTime } = body ?? {};
  // [WHY IT WAS WRONG]: destructuring directly off a value typed `any` compiled without complaint even though nothing guaranteed `body` was an object with those five properties — now that `body` is `unknown`, TypeScript correctly refuses to destructure it without first asserting a shape.
  // [HOW THIS IS BETTER]: the `as Record<string, unknown>` cast is a single, visible, intentional assertion — "I know this should be an object with string keys" — rather than an invisible blanket trust applied to the whole function via `any`. Each destructured value is still individually `unknown` afterward, so later code still has to prove what it is before using it.
  // [WHAT HAPPENS IF REMOVED]: without the cast, this line won't compile at all once `body` is `unknown` — TypeScript rejects destructuring properties off a value it can't guarantee is an object.
  // [BEST PRACTICE]: keep type assertions (`as X`) as narrow and close to the point of use as possible, rather than casting once at the top of a function and letting that trust silently propagate through everything below it.
  const { roomId, title, userName, startTime, endTime } =
    (body ?? {}) as Record<string, unknown>;

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

  // [ORIGINAL CODE]: const requestedStart = new Date(startTime); / const requestedEnd = new Date(endTime);
  // [WHY IT WAS WRONG]: `startTime`/`endTime` are `unknown` now, and the `Date` constructor's type signature doesn't accept `unknown` — it needs a concrete `string | number | Date`, so this wouldn't compile without a cast.
  // [HOW THIS IS BETTER]: `as string` is a narrow assertion scoped to exactly the one call that needs a concrete type, right where it's used — the value is still validated two lines below via `isNaN(...)`, so the cast doesn't weaken the existing runtime safety net, it just satisfies the compiler.
  // [WHAT HAPPENS IF REMOVED]: without the cast, `npx tsc --noEmit` and `npm run build` fail outright with a type error on both lines — this isn't cosmetic, the code won't compile once `body` is `unknown`.
  // [BEST PRACTICE]: for a project whose input-validation surface grows beyond a single function like this, prefer a runtime schema validator (e.g. Zod) over manual `as` casts — a cast asserts a type without checking it, while a schema validator checks and narrows in one step.
  const requestedStart = new Date(startTime as string);
  const requestedEnd = new Date(endTime as string);

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
    // [ORIGINAL CODE]: roomId,
    // [WHY IT WAS WRONG]: `roomId` is still `unknown` at this point — the earlier falsy-check proves it's truthy, not what type it is — and `NewBookingInput.roomId` requires a concrete type, so TypeScript rejects assigning `unknown` to a typed field.
    // [HOW THIS IS BETTER]: `as string` asserts the concrete type at the return boundary, where it's finally required — the last and most contained place to make that assertion, after every validation check above has already run.
    // [WHAT HAPPENS IF REMOVED]: the object literal fails to satisfy the `NewBookingInput` return type and `npx tsc --noEmit` fails on this line.
    // [BEST PRACTICE]: verify the assumed type actually matches the field's real definition before casting — check `NewBookingInput.roomId`'s interface; if it's typed `number`, this should be `roomId as number` instead, since a cast doesn't convert a value, it only tells the compiler to stop checking it.
    roomId: roomId as string,
    title: cleanTitle,
    userName: cleanUserName,
    startTime: requestedStart,
    endTime: requestedEnd,
  };
}