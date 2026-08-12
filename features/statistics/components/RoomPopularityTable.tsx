/**
 * ============================================================================
 * FILE: features/statistics/components/RoomPopularityTable.tsx
 * PURPOSE: Presentational table displaying room reservation counts, total hours, percentages, and visual bar tracks.
 * IMPORTS: RoomPopularity (from ../types), styles (from ./RoomPopularityTable.module.css)
 * EXPORTS: RoomPopularityTable
 * ============================================================================
 */

import { RoomPopularity } from "../types";
import styles from "./RoomPopularityTable.module.css";

interface RoomPopularityTableProps {
  data: RoomPopularity[];
}

export function RoomPopularityTable({ data }: RoomPopularityTableProps) {
  if (data.length === 0) {
    return <p>Ingen bookinger registrert ennå.</p>;
  }

  return (
    <table className={styles.table}>
      <caption className={styles.srOnly}>
        Møterom sortert etter popularitet
      </caption>
      <thead>
        <tr>
          <th scope="col">Rom</th>
          <th scope="col">Antall bookinger</th>
          <th scope="col">Totalt timer</th>
          <th scope="col">Andel</th>
          <th scope="col">Fordeling</th>
        </tr>
      </thead>
      <tbody>
        {data.map((room) => (
          <tr key={room.roomId}>
            <th scope="row">{room.roomName}</th>
            <td>{room.bookingCount}</td>
            <td>{room.totalHoursBooked}t</td>
            <td>{room.percentage}%</td>
            <td>
              <div
                className={styles.barTrack}
                role="img"
                aria-label={`${room.roomName} står for ${room.percentage}% av bookingene`}
              >
                <div
                  className={styles.barFill}
                  style={{ width: `${room.percentage}%` }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}