/**
 * ============================================================================
 * FILE: features/bookings/components/StatusBanner.tsx
 * ============================================================================
 * PURPOSE:
 *   Renders the success/error message banner shown after a booking
 *   submission attempt. Purely presentational — receives the message text
 *   and type as props from useBookingForm (via BookingForm) and has no
 *   state or logic of its own.
 *
 * IMPORTS:
 *   None beyond React itself (implicit via JSX).
 *
 * EXPORTS:
 *   - default: StatusBanner component
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Styling and conditional coloring
 *   unchanged from the original inline message <div> block — only moved
 *   into its own file and given explicit props.
 * ============================================================================
 */

// Why this is needed: only this component consumes this prop shape, so it
// stays colocated here rather than in the shared types file, per our
// earlier agreement on single-use vs. shared types. 'type' is deliberately
// a union of exactly the two values used ('success' | 'error') rather than
// a plain string, so a typo like 'succes' is caught at compile time.
// What happens if this is removed: TypeScript would accept any string for
// `type`, silently breaking the color logic below if a caller passes a
// typo'd or unexpected value.
interface StatusBannerProps {
  text: string;
  type: 'success' | 'error';
}

export default function StatusBanner({ text, type }: StatusBannerProps) {
  return (
    <div
      style={{
        padding: '10px 15px',
        borderRadius: '4px',
        marginBottom: '15px',
        // Why this is needed: the background/text color is derived directly
        // from the `type` prop so success and error states are visually
        // distinct at a glance, without the caller having to pass colors.
        // What happens if this is removed: every message would render with
        // identical styling, making it hard to tell a successful booking
        // apart from a rejected one without reading the text closely.
        background: type === 'success' ? '#d4edda' : '#f8d7da',
        color: type === 'success' ? '#155724' : '#721c24',
      }}
    >
      {text}
    </div>
  );
}