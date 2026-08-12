/**
 * ============================================================================
 * FILE: features/statistics/components/EmployeeStatsCard.tsx
 * PURPOSE: Presentational component displaying individual employee booking habits, including room preferences and top active hours.
 * IMPORTS: EmployeeStat (from ../types), styles (from ./EmployeeStatsCard.module.css)
 * EXPORTS: EmployeeStatsCardList
 * ============================================================================
 */

import { EmployeeStat } from "../types";
import styles from "./EmployeeStatsCard.module.css";

interface EmployeeStatsCardListProps {
  data: EmployeeStat[];
}

export function EmployeeStatsCardList({ data }: EmployeeStatsCardListProps) {
  if (data.length === 0) {
    return <p>Ingen bookinger registrert ennå.</p>;
  }

  return (
    <ul className={styles.cardList}>
      {data.map((emp) => (
        <li key={emp.userName} className={styles.card}>
          <h3>{emp.userName}</h3>
          
          <dl className={styles.statGrid}>
            <div>
              <dt>Antall bookinger</dt>
              <dd>{emp.totalBookings}</dd>
            </div>
            <div>
              <dt>Foretrukket rom</dt>
              <dd>
                {emp.favoriteRoom
                  ? `${emp.favoriteRoom.roomName} (${emp.favoriteRoom.count} ${
                      emp.favoriteRoom.count === 1 ? "booking" : "bookinger"
                    })`
                  : "—"}
              </dd>
            </div>
          </dl>

          <h4>Topp 3 foretrukne tidspunkt</h4>
          {emp.topTimeSlots.length > 0 ? (
            <ol className={styles.slotList}>
              {emp.topTimeSlots.map((slot) => (
                <li key={slot.hour}>
                  <span className={styles.slotLabel}>{slot.label}</span>
                  <span className={styles.slotCount}>
                    {slot.count} {slot.count === 1 ? "booking" : "bookinger"}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p>Ingen data.</p>
          )}
        </li>
      ))}
    </ul>
  );
}