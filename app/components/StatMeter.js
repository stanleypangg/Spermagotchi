'use client';

import styles from '../page.module.css';

export default function StatMeter({ label, icon, value, color }) {
  return (
    <div className={styles.statMeter}>
      <div className={styles.statMeterHeader}>
        <span>
          <span className={styles.statIcon}>{icon}</span>
          {label}
        </span>
        <span className={styles.statValue}>{value}</span>
      </div>
      <div className={styles.meterTrack}>
        <div
          className={styles.meterFill}
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

